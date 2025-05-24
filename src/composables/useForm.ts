/**
 * Form Composable - Advanced form handling with validation and submission
 * 
 * Provides reactive form state management with built-in validation,
 * error handling, dirty tracking, and submission logic.
 */

import { ref, reactive, computed, watch, nextTick } from 'vue';
import { useNotificationStore } from '../stores/notifications';
import type { MaybeRef } from '@vueuse/core';

interface ValidationRule {
  validator: (value: any, formData?: any) => boolean | string | Promise<boolean | string>;
  message?: string;
  trigger?: 'blur' | 'change' | 'submit';
}

interface FieldConfig {
  initialValue?: any;
  rules?: ValidationRule[];
  transform?: (value: any) => any;
  required?: boolean;
  disabled?: boolean;
}

interface FormConfig {
  initialValues?: Record<string, any>;
  fields?: Record<string, FieldConfig>;
  validateOnChange?: boolean;
  validateOnBlur?: boolean;
  resetOnSubmit?: boolean;
  showNotifications?: boolean;
  onSubmit?: (data: any) => Promise<any> | any;
  onSuccess?: (data: any, result: any) => void;
  onError?: (error: any) => void;
}

interface FieldState {
  value: any;
  error: string | null;
  touched: boolean;
  dirty: boolean;
  validating: boolean;
  disabled: boolean;
}

interface FormState {
  submitting: boolean;
  submitted: boolean;
  valid: boolean;
  dirty: boolean;
  touched: boolean;
  errors: Record<string, string>;
}

export function useForm(config: FormConfig = {}) {
  const {
    initialValues = {},
    fields = {},
    validateOnChange = true,
    validateOnBlur = true,
    resetOnSubmit = false,
    showNotifications = true,
    onSubmit,
    onSuccess,
    onError
  } = config;

  const notificationStore = useNotificationStore();

  // Form data
  const formData = reactive<Record<string, any>>({ ...initialValues });
  
  // Field states
  const fieldStates = reactive<Record<string, FieldState>>({});
  
  // Form state
  const formState = reactive<FormState>({
    submitting: false,
    submitted: false,
    valid: true,
    dirty: false,
    touched: false,
    errors: {}
  });

  // Initialize field states
  function initializeFields() {
    Object.keys(fields).forEach(fieldName => {
      const fieldConfig = fields[fieldName];
      
      fieldStates[fieldName] = {
        value: formData[fieldName] ?? fieldConfig.initialValue,
        error: null,
        touched: false,
        dirty: false,
        validating: false,
        disabled: fieldConfig.disabled || false
      };

      // Set initial value
      if (formData[fieldName] === undefined && fieldConfig.initialValue !== undefined) {
        formData[fieldName] = fieldConfig.initialValue;
      }
    });
  }

  // Initialize
  initializeFields();

  // Computed properties
  const isValid = computed(() => {
    return Object.values(fieldStates).every(field => !field.error);
  });

  const isDirty = computed(() => {
    return Object.values(fieldStates).some(field => field.dirty);
  });

  const isTouched = computed(() => {
    return Object.values(fieldStates).some(field => field.touched);
  });

  const hasErrors = computed(() => {
    return Object.values(fieldStates).some(field => field.error);
  });

  const validatingFields = computed(() => {
    return Object.keys(fieldStates).filter(key => fieldStates[key].validating);
  });

  const isValidating = computed(() => validatingFields.value.length > 0);

  const canSubmit = computed(() => {
    return isValid.value && !formState.submitting && !isValidating.value;
  });

  // Built-in validators
  const validators = {
    required: (message = 'This field is required') => ({
      validator: (value: any) => {
        if (Array.isArray(value)) return value.length > 0;
        if (typeof value === 'string') return value.trim().length > 0;
        return value !== null && value !== undefined && value !== '';
      },
      message,
      trigger: 'blur' as const
    }),

    email: (message = 'Please enter a valid email address') => ({
      validator: (value: string) => {
        if (!value) return true; // Let required handle empty values
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(value);
      },
      message,
      trigger: 'blur' as const
    }),

    minLength: (min: number, message?: string) => ({
      validator: (value: string) => {
        if (!value) return true;
        return value.length >= min;
      },
      message: message || `Must be at least ${min} characters`,
      trigger: 'blur' as const
    }),

    maxLength: (max: number, message?: string) => ({
      validator: (value: string) => {
        if (!value) return true;
        return value.length <= max;
      },
      message: message || `Must be no more than ${max} characters`,
      trigger: 'blur' as const
    }),

    pattern: (regex: RegExp, message = 'Invalid format') => ({
      validator: (value: string) => {
        if (!value) return true;
        return regex.test(value);
      },
      message,
      trigger: 'blur' as const
    }),

    min: (minValue: number, message?: string) => ({
      validator: (value: number) => {
        if (value === null || value === undefined) return true;
        return value >= minValue;
      },
      message: message || `Must be at least ${minValue}`,
      trigger: 'blur' as const
    }),

    max: (maxValue: number, message?: string) => ({
      validator: (value: number) => {
        if (value === null || value === undefined) return true;
        return value <= maxValue;
      },
      message: message || `Must be no more than ${maxValue}`,
      trigger: 'blur' as const
    }),

    confirmed: (confirmField: string, message = 'Fields do not match') => ({
      validator: (value: any, formData: any) => {
        return value === formData[confirmField];
      },
      message,
      trigger: 'blur' as const
    })
  };

  // Validate single field
  async function validateField(fieldName: string, trigger: 'blur' | 'change' | 'submit' = 'submit') {
    const fieldConfig = fields[fieldName];
    const fieldState = fieldStates[fieldName];
    
    if (!fieldConfig || !fieldState) return true;

    fieldState.validating = true;
    fieldState.error = null;

    try {
      const rules = fieldConfig.rules || [];
      const value = formData[fieldName];

      // Add required rule if field is marked as required
      const allRules = [...rules];
      if (fieldConfig.required && !rules.some(rule => rule.validator.toString().includes('required'))) {
        allRules.unshift(validators.required());
      }

      for (const rule of allRules) {
        // Skip if trigger doesn't match
        if (rule.trigger && rule.trigger !== trigger) continue;

        const result = await rule.validator(value, formData);
        
        if (result !== true) {
          fieldState.error = typeof result === 'string' ? result : rule.message || 'Validation failed';
          return false;
        }
      }

      return true;
    } catch (error) {
      fieldState.error = 'Validation error occurred';
      return false;
    } finally {
      fieldState.validating = false;
    }
  }

  // Validate all fields
  async function validateForm(trigger: 'blur' | 'change' | 'submit' = 'submit') {
    const validationPromises = Object.keys(fieldStates).map(fieldName => 
      validateField(fieldName, trigger)
    );

    const results = await Promise.all(validationPromises);
    return results.every(result => result);
  }

  // Set field value
  function setFieldValue(fieldName: string, value: any) {
    const fieldConfig = fields[fieldName];
    const fieldState = fieldStates[fieldName];

    if (!fieldState) return;

    // Transform value if transformer is provided
    const transformedValue = fieldConfig?.transform ? fieldConfig.transform(value) : value;
    
    formData[fieldName] = transformedValue;
    fieldState.value = transformedValue;
    fieldState.dirty = true;

    // Validate on change if enabled
    if (validateOnChange && fieldState.touched) {
      nextTick(() => validateField(fieldName, 'change'));
    }
  }

  // Set field error
  function setFieldError(fieldName: string, error: string | null) {
    const fieldState = fieldStates[fieldName];
    if (fieldState) {
      fieldState.error = error;
    }
  }

  // Set multiple field errors
  function setErrors(errors: Record<string, string>) {
    Object.entries(errors).forEach(([fieldName, error]) => {
      setFieldError(fieldName, error);
    });
  }

  // Touch field
  function touchField(fieldName: string) {
    const fieldState = fieldStates[fieldName];
    if (fieldState && !fieldState.touched) {
      fieldState.touched = true;

      // Validate on blur if enabled
      if (validateOnBlur) {
        nextTick(() => validateField(fieldName, 'blur'));
      }
    }
  }

  // Get field props for v-model binding
  function getFieldProps(fieldName: string) {
    const fieldState = fieldStates[fieldName];
    
    return {
      modelValue: formData[fieldName],
      'onUpdate:modelValue': (value: any) => setFieldValue(fieldName, value),
      onBlur: () => touchField(fieldName),
      error: fieldState?.error,
      disabled: fieldState?.disabled,
      class: {
        'field-error': fieldState?.error,
        'field-dirty': fieldState?.dirty,
        'field-touched': fieldState?.touched
      }
    };
  }

  // Submit form
  async function submit() {
    if (formState.submitting) return;

    formState.submitting = true;
    formState.submitted = true;

    // Touch all fields
    Object.keys(fieldStates).forEach(touchField);

    try {
      // Validate form
      const isValid = await validateForm('submit');
      
      if (!isValid) {
        if (showNotifications) {
          notificationStore.validationError('Please fix the form errors before submitting.');
        }
        return;
      }

      // Call submit handler
      let result;
      if (onSubmit) {
        result = await onSubmit(formData);
      }

      // Success callback
      if (onSuccess) {
        onSuccess(formData, result);
      }

      // Success notification
      if (showNotifications) {
        notificationStore.apiSuccess('Form submitted successfully');
      }

      // Reset if configured
      if (resetOnSubmit) {
        reset();
      }

      return result;
    } catch (error: any) {
      // Handle validation errors from server
      if (error.response?.data?.errors) {
        setErrors(error.response.data.errors);
      }

      // Error callback
      if (onError) {
        onError(error);
      }

      // Error notification
      if (showNotifications) {
        notificationStore.apiError(error, 'Form submission');
      }

      throw error;
    } finally {
      formState.submitting = false;
    }
  }

  // Reset form
  function reset() {
    Object.keys(formData).forEach(key => {
      formData[key] = initialValues[key] ?? fields[key]?.initialValue;
    });

    Object.keys(fieldStates).forEach(fieldName => {
      const fieldState = fieldStates[fieldName];
      fieldState.error = null;
      fieldState.touched = false;
      fieldState.dirty = false;
      fieldState.validating = false;
      fieldState.value = formData[fieldName];
    });

    formState.submitting = false;
    formState.submitted = false;
  }

  // Clear errors
  function clearErrors() {
    Object.values(fieldStates).forEach(fieldState => {
      fieldState.error = null;
    });
  }

  // Watch for form changes
  watch(
    () => formData,
    () => {
      formState.dirty = isDirty.value;
      formState.touched = isTouched.value;
      formState.valid = isValid.value;
    },
    { deep: true }
  );

  return {
    // Data
    formData,
    fieldStates,
    formState,

    // Computed
    isValid,
    isDirty,
    isTouched,
    hasErrors,
    isValidating,
    canSubmit,

    // Methods
    setFieldValue,
    setFieldError,
    setErrors,
    touchField,
    validateField,
    validateForm,
    getFieldProps,
    submit,
    reset,
    clearErrors,

    // Validators
    validators
  };
}

// Specialized form composables
export function useLoginForm() {
  return useForm({
    fields: {
      email: {
        rules: [validators.required(), validators.email()],
        required: true
      },
      password: {
        rules: [validators.required(), validators.minLength(6)],
        required: true
      }
    },
    validateOnBlur: true,
    showNotifications: true
  });
}

export function useRegistrationForm() {
  return useForm({
    fields: {
      name: {
        rules: [validators.required(), validators.minLength(2)],
        required: true
      },
      email: {
        rules: [validators.required(), validators.email()],
        required: true
      },
      password: {
        rules: [validators.required(), validators.minLength(8)],
        required: true
      },
      passwordConfirmation: {
        rules: [validators.required(), validators.confirmed('password')],
        required: true
      }
    },
    validateOnBlur: true,
    showNotifications: true
  });
}
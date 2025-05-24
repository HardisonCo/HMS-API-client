/**
 * HMS API Error Handling Utilities
 * 
 * This module provides utilities for handling API errors in a consistent way.
 */

import { AxiosError } from 'axios';
import { ApiResponse } from './hms-api-client';

/**
 * Enhanced API Error class with additional error handling functionality
 */
export class ApiError extends Error {
  readonly status: number;
  readonly data: any;
  readonly errors?: Record<string, string[]>;
  readonly isApiError: boolean = true;
  readonly originalError: AxiosError;

  /**
   * Create a new ApiError instance from an AxiosError
   * @param error - The original Axios error
   */
  constructor(error: AxiosError<ApiResponse>) {
    // Set the message and name
    const message = error.response?.data?.message || error.message || 'Unknown API error';
    super(message);
    this.name = 'ApiError';
    
    // Store the original error
    this.originalError = error;
    
    // Set additional properties
    this.status = error.response?.status || 0;
    this.data = error.response?.data?.data;
    
    // Extract validation errors if they exist
    if (error.response?.status === 422 && error.response?.data?.data?.errors) {
      this.errors = error.response.data.data.errors;
    }
  }

  /**
   * Check if this is a validation error (HTTP 422)
   */
  isValidationError(): boolean {
    return this.status === 422 && !!this.errors;
  }

  /**
   * Check if this is an authentication error (HTTP 401)
   */
  isAuthError(): boolean {
    return this.status === 401;
  }

  /**
   * Check if this is a forbidden error (HTTP 403)
   */
  isForbiddenError(): boolean {
    return this.status === 403;
  }

  /**
   * Check if this is a not found error (HTTP 404)
   */
  isNotFoundError(): boolean {
    return this.status === 404;
  }

  /**
   * Check if this is a server error (HTTP 500+)
   */
  isServerError(): boolean {
    return this.status >= 500;
  }

  /**
   * Get all validation errors
   */
  getValidationErrors(): Record<string, string[]> {
    return this.errors || {};
  }

  /**
   * Get the first validation error for a specific field
   * @param field - The field name
   */
  getFieldError(field: string): string | undefined {
    if (!this.errors || !this.errors[field] || !this.errors[field].length) {
      return undefined;
    }
    return this.errors[field][0];
  }

  /**
   * Get simplified validation errors as a Record of field to first error message
   */
  getSimplifiedValidationErrors(): Record<string, string> {
    if (!this.errors) {
      return {};
    }

    return Object.entries(this.errors).reduce((result, [field, messages]) => {
      if (messages && messages.length > 0) {
        result[field] = messages[0];
      }
      return result;
    }, {} as Record<string, string>);
  }
}

/**
 * Process an error and convert it to an ApiError if possible
 * @param error - The error to process
 */
export function processApiError(error: any): ApiError {
  // If already an ApiError, return it
  if (error && error.isApiError) {
    return error;
  }
  
  // If it's an AxiosError, convert it to an ApiError
  if (error && error.isAxiosError) {
    return new ApiError(error);
  }
  
  // For other errors, create a generic ApiError
  const genericError = new Error(error?.message || 'Unknown error') as AxiosError<ApiResponse>;
  return new ApiError(genericError);
}

/**
 * Async error handler that wraps an API call and processes errors consistently
 * @param apiCall - The API call function to execute
 * @param errorHandler - Optional custom error handler
 */
export async function handleApiCall<T>(
  apiCall: () => Promise<T>,
  errorHandler?: (error: ApiError) => void
): Promise<T> {
  try {
    return await apiCall();
  } catch (error) {
    const apiError = processApiError(error);
    
    if (errorHandler) {
      errorHandler(apiError);
    }
    
    throw apiError;
  }
}

/**
 * Create a form validation object from an ApiError for use with form libraries
 * @param error - The API error
 */
export function createFormErrors(error: any): Record<string, string> {
  const apiError = processApiError(error);
  
  if (apiError.isValidationError()) {
    return apiError.getSimplifiedValidationErrors();
  }
  
  return {};
}

/**
 * Extract error messages from an API error in a user-friendly format
 * @param error - The API error
 */
export function getErrorMessage(error: any): string {
  const apiError = processApiError(error);
  
  // Authentication errors
  if (apiError.isAuthError()) {
    return 'Your session has expired. Please log in again.';
  }
  
  // Forbidden errors
  if (apiError.isForbiddenError()) {
    return 'You do not have permission to perform this action.';
  }
  
  // Not found errors
  if (apiError.isNotFoundError()) {
    return 'The requested resource was not found.';
  }
  
  // Server errors
  if (apiError.isServerError()) {
    return 'A server error occurred. Please try again later.';
  }
  
  // Validation errors
  if (apiError.isValidationError()) {
    const errors = apiError.getValidationErrors();
    const errorMessages = Object.entries(errors)
      .map(([field, messages]) => `${field}: ${messages.join(', ')}`)
      .join('\n');
    
    return `Validation errors:\n${errorMessages}`;
  }
  
  // Default case
  return apiError.message;
}

/**
 * Usage example:
 * 
 * try {
 *   const result = await handleApiCall(
 *     () => hmsApiClient.items.getItem(123)
 *   );
 *   console.log('Item:', result.data.data);
 * } catch (error) {
 *   // ApiError with additional helper methods
 *   if (error.isValidationError()) {
 *     // Handle validation errors
 *     const fieldErrors = error.getSimplifiedValidationErrors();
 *     console.error('Validation errors:', fieldErrors);
 *   } else if (error.isAuthError()) {
 *     // Handle authentication errors
 *     console.error('Authentication error. Please log in again.');
 *   } else {
 *     // Handle other errors
 *     console.error('Error:', error.message);
 *   }
 * }
 */
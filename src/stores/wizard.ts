/**
 * Wizard Store using Pinia
 * 
 * Manages the Five-Step Wizard state including progress tracking, step validation,
 * data persistence, and advanced features like version control and collaboration.
 */

import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { wizardApiClient, wizardSteps } from '../api/wizard-api-client';
import { processApiError, getErrorMessage } from '../api/error-handling';
import type { 
  DealData, 
  ProgramData, 
  ProtocolData,
  WizardStep,
  StepResultData,
  DealSnapshotData,
  FeasibilityRating,
  PayoutStatus,
  SolutionOptionData,
  StakeholderData,
  ApiResponseData
} from '../api/wizard-api-client';

export interface WizardState {
  currentDeal: DealData | null;
  currentStep: number;
  steps: WizardStepState[];
  loading: boolean;
  error: string | null;
  progress: number;
  snapshots: DealSnapshotData[];
  collaborators: CollaboratorData[];
  isProcessing: boolean;
  processingMessage: string;
  validationErrors: Record<string, string[]>;
  autoSaveEnabled: boolean;
  lastAutoSave: Date | null;
}

interface WizardStepState {
  id: string;
  name: string;
  completed: boolean;
  valid: boolean;
  data: any;
  errors: string[];
  lastModified: Date | null;
}

interface CollaboratorData {
  id: number;
  name: string;
  email: string;
  avatar?: string;
  role: 'owner' | 'editor' | 'viewer';
  isOnline: boolean;
  lastSeen: Date;
  currentStep?: number;
}

interface Step1Data {
  problem: string;
  category: string;
  sub_category: string;
  metadata: Record<string, any>;
}

interface Step2Data {
  solution_options: SolutionOptionData[];
  selected_solution: number;
  metadata: Record<string, any>;
}

interface Step3Data {
  stakeholders: StakeholderData[];
  program_name: string;
  program_description: string;
  team_members: any[];
  metadata: Record<string, any>;
}

interface Step4Data {
  execution_plan: {
    agents: string[];
    tools: string[];
    milestones: string[];
  };
  timeline: string;
  resources: string;
  metadata: Record<string, any>;
}

interface Step5Data {
  outcome: {
    verified: boolean;
    metrics: Record<string, any>;
  };
  payout_status: PayoutStatus;
  lessons_learned: string;
  metadata: Record<string, any>;
}

const WIZARD_STEPS = [
  { id: 'define_problem', name: 'Define Problem' },
  { id: 'codify_solution', name: 'Codify Solution' },
  { id: 'setup_program', name: 'Setup Program' },
  { id: 'execute_program', name: 'Execute Program' },
  { id: 'verify_outcome', name: 'Verify Outcome' }
];

export const useWizardStore = defineStore('wizard', () => {
  // State
  const currentDeal = ref<DealData | null>(null);
  const currentStep = ref(0);
  const loading = ref(false);
  const error = ref<string | null>(null);
  const progress = ref(0);
  const snapshots = ref<DealSnapshotData[]>([]);
  const collaborators = ref<CollaboratorData[]>([]);
  const isProcessing = ref(false);
  const processingMessage = ref('');
  const validationErrors = ref<Record<string, string[]>>({});
  const autoSaveEnabled = ref(true);
  const lastAutoSave = ref<Date | null>(null);

  // Initialize steps
  const steps = ref<WizardStepState[]>(
    WIZARD_STEPS.map(step => ({
      id: step.id,
      name: step.name,
      completed: false,
      valid: false,
      data: {},
      errors: [],
      lastModified: null
    }))
  );

  // Step data refs
  const step1Data = ref<Step1Data>({
    problem: '',
    category: '',
    sub_category: '',
    metadata: {}
  });

  const step2Data = ref<Step2Data>({
    solution_options: [],
    selected_solution: 0,
    metadata: {}
  });

  const step3Data = ref<Step3Data>({
    stakeholders: [],
    program_name: '',
    program_description: '',
    team_members: [],
    metadata: {}
  });

  const step4Data = ref<Step4Data>({
    execution_plan: {
      agents: [],
      tools: [],
      milestones: []
    },
    timeline: '',
    resources: '',
    metadata: {}
  });

  const step5Data = ref<Step5Data>({
    outcome: {
      verified: true,
      metrics: {}
    },
    payout_status: PayoutStatus.PENDING,
    lessons_learned: '',
    metadata: {}
  });

  // Getters
  const currentStepData = computed(() => {
    switch (currentStep.value) {
      case 0: return step1Data.value;
      case 1: return step2Data.value;
      case 2: return step3Data.value;
      case 3: return step4Data.value;
      case 4: return step5Data.value;
      default: return {};
    }
  });

  const currentStepState = computed(() => {
    return steps.value[currentStep.value];
  });

  const isCurrentStepValid = computed(() => {
    return currentStepState.value?.valid || false;
  });

  const canNavigateToStep = computed(() => (stepIndex: number) => {
    if (stepIndex === 0) return true;
    if (stepIndex <= currentStep.value) return true;
    return steps.value[stepIndex - 1]?.completed || false;
  });

  const completedStepsCount = computed(() => {
    return steps.value.filter(step => step.completed).length;
  });

  const overallProgress = computed(() => {
    return (completedStepsCount.value / steps.value.length) * 100;
  });

  const isWizardComplete = computed(() => {
    return completedStepsCount.value === steps.value.length;
  });

  const hasUnsavedChanges = computed(() => {
    return steps.value.some(step => 
      step.lastModified && (!lastAutoSave.value || step.lastModified > lastAutoSave.value)
    );
  });

  const activeCollaborators = computed(() => {
    return collaborators.value.filter(c => c.isOnline);
  });

  const stepValidators = {
    0: (data: Step1Data) => {
      const errors: string[] = [];
      if (!data.problem?.trim()) errors.push('Problem description is required');
      if (!data.category) errors.push('Category is required');
      return errors;
    },
    1: (data: Step2Data) => {
      const errors: string[] = [];
      if (!data.solution_options?.length) errors.push('At least one solution option is required');
      return errors;
    },
    2: (data: Step3Data) => {
      const errors: string[] = [];
      if (!data.program_name?.trim()) errors.push('Program name is required');
      if (!data.program_description?.trim()) errors.push('Program description is required');
      if (!data.stakeholders?.length) errors.push('At least one stakeholder is required');
      data.stakeholders?.forEach((stakeholder, index) => {
        if (!stakeholder.name?.trim()) errors.push(`Stakeholder ${index + 1} name is required`);
        if (!stakeholder.role?.trim()) errors.push(`Stakeholder ${index + 1} role is required`);
      });
      return errors;
    },
    3: (data: Step4Data) => {
      const errors: string[] = [];
      if (!data.timeline?.trim()) errors.push('Timeline is required');
      if (!data.resources?.trim()) errors.push('Resources are required');
      if (!data.execution_plan?.agents?.length && !data.execution_plan?.tools?.length) {
        errors.push('Execution plan must include agents or tools');
      }
      return errors;
    },
    4: (data: Step5Data) => {
      const errors: string[] = [];
      if (!data.lessons_learned?.trim()) errors.push('Lessons learned is required');
      if (!Object.keys(data.outcome?.metrics || {}).length) {
        errors.push('At least one success metric is required');
      }
      return errors;
    }
  };

  // Actions
  function validateCurrentStep() {
    const stepIndex = currentStep.value;
    const validator = stepValidators[stepIndex as keyof typeof stepValidators];
    
    if (validator) {
      const errors = validator(currentStepData.value as any);
      steps.value[stepIndex].errors = errors;
      steps.value[stepIndex].valid = errors.length === 0;
      return errors.length === 0;
    }
    
    return true;
  }

  function validateAllSteps() {
    const allErrors: Record<string, string[]> = {};
    let allValid = true;

    [step1Data.value, step2Data.value, step3Data.value, step4Data.value, step5Data.value].forEach((data, index) => {
      const validator = stepValidators[index as keyof typeof stepValidators];
      if (validator) {
        const errors = validator(data as any);
        steps.value[index].errors = errors;
        steps.value[index].valid = errors.length === 0;
        
        if (errors.length > 0) {
          allErrors[`step_${index + 1}`] = errors;
          allValid = false;
        }
      }
    });

    validationErrors.value = allErrors;
    return allValid;
  }

  async function startWizard(initialData: Step1Data) {
    loading.value = true;
    error.value = null;
    isProcessing.value = true;
    processingMessage.value = 'Starting wizard...';

    try {
      const response = await wizardApiClient.startWizard(initialData);

      if (response.data.success) {
        const result = response.data.data;
        
        if (result.is_async && result.job_id) {
          // Handle async processing
          processingMessage.value = 'Processing your request...';
          
          await new Promise((resolve) => {
            const checkJob = async () => {
              try {
                const jobStatus = await wizardApiClient.getJobStatus(result.job_id);
                if (jobStatus.data.success) {
                  const status = jobStatus.data.data;
                  progress.value = status.progress;
                  
                  if (status.status === 'completed') {
                    const dealResponse = await wizardApiClient.getDeal(result.deal.id);
                    if (dealResponse.data.success) {
                      currentDeal.value = dealResponse.data.data;
                      updateStepsFromDeal();
                    }
                    resolve(true);
                  } else if (status.status === 'failed') {
                    error.value = status.error || 'Processing failed';
                    resolve(false);
                  } else {
                    // Continue polling
                    setTimeout(checkJob, 1000);
                  }
                }
              } catch (err) {
                error.value = 'Failed to check job status';
                resolve(false);
              }
            };
            checkJob();
          });
        } else {
          currentDeal.value = result.deal;
          updateStepsFromDeal();
        }

        // Mark step 1 as completed
        steps.value[0].completed = true;
        steps.value[0].data = initialData;
        steps.value[0].lastModified = new Date();
        
        return currentDeal.value;
      } else {
        error.value = response.data.message;
        return null;
      }
    } catch (err) {
      const apiError = processApiError(err);
      error.value = getErrorMessage(apiError);
      return null;
    } finally {
      loading.value = false;
      isProcessing.value = false;
      processingMessage.value = '';
    }
  }

  async function processStep(stepIndex: number, stepData: any) {
    if (!currentDeal.value?.id) return null;

    loading.value = true;
    error.value = null;
    isProcessing.value = true;
    
    const stepProcessors = {
      0: wizardSteps.defineProblems,
      1: wizardSteps.codifySolution,
      2: wizardSteps.setupProgram,
      3: wizardSteps.executeProgram,
      4: wizardSteps.verifyOutcome
    };

    const processor = stepProcessors[stepIndex as keyof typeof stepProcessors];
    if (!processor) {
      error.value = 'Invalid step';
      loading.value = false;
      isProcessing.value = false;
      return null;
    }

    processingMessage.value = `Processing ${steps.value[stepIndex].name}...`;

    try {
      const updatedDeal = await processor.process(
        currentDeal.value.id,
        stepData,
        (progressValue) => {
          progress.value = progressValue;
        }
      );

      currentDeal.value = updatedDeal;
      
      // Mark step as completed
      steps.value[stepIndex].completed = true;
      steps.value[stepIndex].data = stepData;
      steps.value[stepIndex].lastModified = new Date();
      
      // Update steps from deal
      updateStepsFromDeal();
      
      // Auto-save if enabled
      if (autoSaveEnabled.value) {
        await autoSave();
      }

      return updatedDeal;
    } catch (err) {
      const apiError = processApiError(err);
      error.value = getErrorMessage(apiError);
      return null;
    } finally {
      loading.value = false;
      isProcessing.value = false;
      processingMessage.value = '';
    }
  }

  async function navigateToStep(stepIndex: number) {
    if (!canNavigateToStep.value(stepIndex)) {
      error.value = 'Cannot navigate to this step yet';
      return false;
    }

    // Validate current step before moving
    if (currentStep.value < stepIndex && !validateCurrentStep()) {
      error.value = 'Please fix validation errors before proceeding';
      return false;
    }

    currentStep.value = stepIndex;
    return true;
  }

  async function saveProgress() {
    if (!currentDeal.value?.id) return false;

    loading.value = true;
    error.value = null;

    try {
      const allStepData = {
        step1: step1Data.value,
        step2: step2Data.value,
        step3: step3Data.value,
        step4: step4Data.value,
        step5: step5Data.value,
        currentStep: currentStep.value
      };

      const response = await wizardApiClient.saveWizardProgress(currentDeal.value.id, allStepData);

      if (response.data.success) {
        lastAutoSave.value = new Date();
        return true;
      } else {
        error.value = response.data.message;
        return false;
      }
    } catch (err) {
      const apiError = processApiError(err);
      error.value = getErrorMessage(apiError);
      return false;
    } finally {
      loading.value = false;
    }
  }

  async function autoSave() {
    if (!autoSaveEnabled.value || !hasUnsavedChanges.value) return;
    
    try {
      await saveProgress();
    } catch (err) {
      console.warn('Auto-save failed:', err);
    }
  }

  async function loadWizard(dealId: string) {
    loading.value = true;
    error.value = null;

    try {
      const response = await wizardApiClient.getDeal(dealId);

      if (response.data.success) {
        currentDeal.value = response.data.data;
        updateStepsFromDeal();
        
        // Determine current step based on wizard_step
        const stepMapping: Record<string, number> = {
          'define_problem': 0,
          'codify_solution': 1,
          'setup_program': 2,
          'execute_program': 3,
          'verify_outcome': 4
        };
        
        currentStep.value = stepMapping[currentDeal.value.wizard_step.toLowerCase()] || 0;
        
        // Load snapshots
        await loadSnapshots(dealId);
        
        // Load collaborators
        await loadCollaborators(dealId);

        return currentDeal.value;
      } else {
        error.value = response.data.message;
        return null;
      }
    } catch (err) {
      const apiError = processApiError(err);
      error.value = getErrorMessage(apiError);
      return null;
    } finally {
      loading.value = false;
    }
  }

  async function loadSnapshots(dealId: string) {
    try {
      const response = await wizardApiClient.getDealSnapshots(dealId);

      if (response.data.success) {
        snapshots.value = response.data.data.sort((a, b) => b.version - a.version);
      }
    } catch (err) {
      console.warn('Failed to load snapshots:', err);
    }
  }

  async function createSnapshot(comment?: string) {
    if (!currentDeal.value?.id) return null;

    loading.value = true;

    try {
      const response = await wizardApiClient.createDealSnapshot(
        currentDeal.value.id,
        comment || `Snapshot at step ${currentStep.value + 1}`
      );

      if (response.data.success) {
        const newSnapshot = response.data.data;
        snapshots.value.unshift(newSnapshot);
        return newSnapshot;
      } else {
        error.value = response.data.message;
        return null;
      }
    } catch (err) {
      const apiError = processApiError(err);
      error.value = getErrorMessage(apiError);
      return null;
    } finally {
      loading.value = false;
    }
  }

  async function restoreSnapshot(version: number) {
    if (!currentDeal.value?.id) return false;

    loading.value = true;

    try {
      const response = await wizardApiClient.restoreDealSnapshot(currentDeal.value.id, version);

      if (response.data.success) {
        currentDeal.value = response.data.data;
        updateStepsFromDeal();
        return true;
      } else {
        error.value = response.data.message;
        return false;
      }
    } catch (err) {
      const apiError = processApiError(err);
      error.value = getErrorMessage(apiError);
      return false;
    } finally {
      loading.value = false;
    }
  }

  async function loadCollaborators(dealId: string) {
    try {
      // This would be implemented when collaboration features are added
      // const response = await wizardApiClient.getDealCollaborators(dealId);
      // collaborators.value = response.data.data;
    } catch (err) {
      console.warn('Failed to load collaborators:', err);
    }
  }

  function updateStepsFromDeal() {
    if (!currentDeal.value) return;

    // Update step 1 data
    step1Data.value = {
      problem: currentDeal.value.problem || '',
      category: currentDeal.value.category || '',
      sub_category: currentDeal.value.sub_category || '',
      metadata: currentDeal.value.metadata || {}
    };

    // Update step 2 data
    if (currentDeal.value.solution_options) {
      step2Data.value.solution_options = [...currentDeal.value.solution_options];
    }

    // Update step 3 data
    if (currentDeal.value.stakeholders) {
      step3Data.value.stakeholders = [...currentDeal.value.stakeholders];
    }

    // Update step 4 data
    if (currentDeal.value.execution_plan) {
      step4Data.value.execution_plan = { ...currentDeal.value.execution_plan };
    }

    // Update step 5 data
    if (currentDeal.value.outcome) {
      step5Data.value.outcome = { ...currentDeal.value.outcome };
    }
    if (currentDeal.value.payout_status) {
      step5Data.value.payout_status = currentDeal.value.payout_status as PayoutStatus;
    }
    if (currentDeal.value.lessons_learned) {
      step5Data.value.lessons_learned = currentDeal.value.lessons_learned;
    }

    // Update step completion status
    steps.value.forEach((step, index) => {
      step.data = [step1Data.value, step2Data.value, step3Data.value, step4Data.value, step5Data.value][index];
      step.lastModified = new Date(currentDeal.value!.updated_at);
    });
  }

  function resetWizard() {
    currentDeal.value = null;
    currentStep.value = 0;
    progress.value = 0;
    error.value = null;
    snapshots.value = [];
    collaborators.value = [];
    validationErrors.value = {};
    lastAutoSave.value = null;

    // Reset step states
    steps.value.forEach(step => {
      step.completed = false;
      step.valid = false;
      step.data = {};
      step.errors = [];
      step.lastModified = null;
    });

    // Reset step data
    step1Data.value = {
      problem: '',
      category: '',
      sub_category: '',
      metadata: {}
    };

    step2Data.value = {
      solution_options: [],
      selected_solution: 0,
      metadata: {}
    };

    step3Data.value = {
      stakeholders: [],
      program_name: '',
      program_description: '',
      team_members: [],
      metadata: {}
    };

    step4Data.value = {
      execution_plan: {
        agents: [],
        tools: [],
        milestones: []
      },
      timeline: '',
      resources: '',
      metadata: {}
    };

    step5Data.value = {
      outcome: {
        verified: true,
        metrics: {}
      },
      payout_status: PayoutStatus.PENDING,
      lessons_learned: '',
      metadata: {}
    };
  }

  function clearError() {
    error.value = null;
  }

  function setAutoSave(enabled: boolean) {
    autoSaveEnabled.value = enabled;
  }

  // Auto-save interval
  let autoSaveInterval: NodeJS.Timeout | null = null;

  function startAutoSave() {
    if (autoSaveInterval) clearInterval(autoSaveInterval);
    
    autoSaveInterval = setInterval(() => {
      if (autoSaveEnabled.value && hasUnsavedChanges.value) {
        autoSave();
      }
    }, 30000); // Auto-save every 30 seconds
  }

  function stopAutoSave() {
    if (autoSaveInterval) {
      clearInterval(autoSaveInterval);
      autoSaveInterval = null;
    }
  }

  return {
    // State
    currentDeal,
    currentStep,
    steps,
    loading,
    error,
    progress,
    snapshots,
    collaborators,
    isProcessing,
    processingMessage,
    validationErrors,
    autoSaveEnabled,
    lastAutoSave,
    
    // Step data
    step1Data,
    step2Data,
    step3Data,
    step4Data,
    step5Data,
    
    // Getters
    currentStepData,
    currentStepState,
    isCurrentStepValid,
    canNavigateToStep,
    completedStepsCount,
    overallProgress,
    isWizardComplete,
    hasUnsavedChanges,
    activeCollaborators,
    
    // Actions
    validateCurrentStep,
    validateAllSteps,
    startWizard,
    processStep,
    navigateToStep,
    saveProgress,
    autoSave,
    loadWizard,
    loadSnapshots,
    createSnapshot,
    restoreSnapshot,
    resetWizard,
    clearError,
    setAutoSave,
    startAutoSave,
    stopAutoSave
  };
});
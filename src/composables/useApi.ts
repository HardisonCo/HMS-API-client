/**
 * API Composable - Advanced API interaction with caching and error handling
 * 
 * Provides a reactive way to handle API calls with built-in loading states,
 * error handling, caching, retry logic, and optimistic updates.
 */

import { ref, computed, watch, onUnmounted } from 'vue';
import { hmsApiClient } from '../api';
import { useNotificationStore } from '../stores/notifications';
import { processApiError, getErrorMessage } from '../api/error-handling';

interface ApiOptions {
  immediate?: boolean;
  throwOnError?: boolean;
  showErrorNotification?: boolean;
  showSuccessNotification?: boolean;
  cache?: boolean;
  cacheTime?: number;
  retry?: number;
  retryDelay?: number;
  optimistic?: boolean;
  transform?: (data: any) => any;
  onSuccess?: (data: any) => void;
  onError?: (error: any) => void;
}

interface ApiState<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
  rawError: any;
  success: boolean;
  lastFetch: Date | null;
}

const cache = new Map<string, { data: any; timestamp: number; expiry: number }>();
const pendingRequests = new Map<string, Promise<any>>();

export function useApi<T = any>(
  apiFn: (...args: any[]) => Promise<any>,
  options: ApiOptions = {}
) {
  const {
    immediate = false,
    throwOnError = false,
    showErrorNotification = true,
    showSuccessNotification = false,
    cache: useCache = false,
    cacheTime = 5 * 60 * 1000, // 5 minutes
    retry = 0,
    retryDelay = 1000,
    optimistic = false,
    transform,
    onSuccess,
    onError
  } = options;

  const notificationStore = useNotificationStore();

  // State
  const state = ref<ApiState<T>>({
    data: null,
    loading: false,
    error: null,
    rawError: null,
    success: false,
    lastFetch: null
  });

  // Computed
  const isStale = computed(() => {
    if (!state.value.lastFetch || !useCache) return false;
    return Date.now() - state.value.lastFetch.getTime() > cacheTime;
  });

  const canRetry = computed(() => retry > 0 && !state.value.loading);

  // Generate cache key from function and arguments
  function getCacheKey(args: any[]): string {
    return `${apiFn.name || 'anonymous'}-${JSON.stringify(args)}`;
  }

  // Get cached data
  function getCached(key: string) {
    const cached = cache.get(key);
    if (cached && Date.now() < cached.expiry) {
      return cached.data;
    }
    cache.delete(key);
    return null;
  }

  // Set cached data
  function setCached(key: string, data: any) {
    cache.set(key, {
      data,
      timestamp: Date.now(),
      expiry: Date.now() + cacheTime
    });
  }

  // Execute API call with retry logic
  async function executeWithRetry(args: any[], attempts = 0): Promise<any> {
    try {
      const response = await apiFn(...args);
      return response;
    } catch (error) {
      if (attempts < retry) {
        await new Promise(resolve => setTimeout(resolve, retryDelay * (attempts + 1)));
        return executeWithRetry(args, attempts + 1);
      }
      throw error;
    }
  }

  // Main execute function
  async function execute(...args: any[]) {
    const cacheKey = getCacheKey(args);

    // Check cache first
    if (useCache && !isStale.value) {
      const cached = getCached(cacheKey);
      if (cached) {
        state.value.data = transform ? transform(cached) : cached;
        state.value.success = true;
        state.value.error = null;
        state.value.rawError = null;
        return cached;
      }
    }

    // Check for pending request
    if (pendingRequests.has(cacheKey)) {
      return pendingRequests.get(cacheKey);
    }

    state.value.loading = true;
    state.value.error = null;
    state.value.rawError = null;
    state.value.success = false;

    const promise = (async () => {
      try {
        const response = await executeWithRetry(args);
        
        if (response.data.success) {
          const responseData = response.data.data;
          const transformedData = transform ? transform(responseData) : responseData;
          
          state.value.data = transformedData;
          state.value.success = true;
          state.value.lastFetch = new Date();

          // Cache the result
          if (useCache) {
            setCached(cacheKey, responseData);
          }

          // Success callback
          if (onSuccess) {
            onSuccess(transformedData);
          }

          // Success notification
          if (showSuccessNotification) {
            notificationStore.apiSuccess();
          }

          return transformedData;
        } else {
          throw new Error(response.data.message || 'API request failed');
        }
      } catch (error) {
        const apiError = processApiError(error);
        const errorMessage = getErrorMessage(apiError);
        
        state.value.error = errorMessage;
        state.value.rawError = apiError;
        state.value.success = false;

        // Error callback
        if (onError) {
          onError(apiError);
        }

        // Error notification
        if (showErrorNotification) {
          notificationStore.apiError(apiError);
        }

        if (throwOnError) {
          throw apiError;
        }

        return null;
      } finally {
        state.value.loading = false;
        pendingRequests.delete(cacheKey);
      }
    })();

    pendingRequests.set(cacheKey, promise);
    return promise;
  }

  // Refresh data (bypass cache)
  async function refresh(...args: any[]) {
    const cacheKey = getCacheKey(args);
    cache.delete(cacheKey);
    return execute(...args);
  }

  // Clear cache
  function clearCache() {
    cache.clear();
  }

  // Clear specific cache entry
  function clearCacheEntry(...args: any[]) {
    const cacheKey = getCacheKey(args);
    cache.delete(cacheKey);
  }

  // Reset state
  function reset() {
    state.value = {
      data: null,
      loading: false,
      error: null,
      rawError: null,
      success: false,
      lastFetch: null
    };
  }

  // Execute immediately if requested
  if (immediate) {
    execute();
  }

  // Cleanup on unmount
  onUnmounted(() => {
    reset();
  });

  return {
    // State
    ...state.value,
    state,
    
    // Computed
    isStale,
    canRetry,
    
    // Actions
    execute,
    refresh,
    clearCache,
    clearCacheEntry,
    reset
  };
}

// Specialized composables for common patterns
export function useQuery<T = any>(
  queryFn: () => Promise<any>,
  options: ApiOptions = {}
) {
  return useApi<T>(queryFn, {
    immediate: true,
    cache: true,
    ...options
  });
}

export function useMutation<T = any, P = any>(
  mutationFn: (params: P) => Promise<any>,
  options: ApiOptions = {}
) {
  const api = useApi<T>(mutationFn, {
    immediate: false,
    showSuccessNotification: true,
    optimistic: true,
    ...options
  });

  const mutate = async (params: P) => {
    return api.execute(params);
  };

  return {
    ...api,
    mutate
  };
}

export function useInfiniteQuery<T = any>(
  queryFn: (page: number, ...args: any[]) => Promise<any>,
  options: ApiOptions = {}
) {
  const data = ref<T[]>([]);
  const currentPage = ref(1);
  const hasMore = ref(true);
  const loading = ref(false);
  const error = ref<string | null>(null);

  const loadPage = async (page: number, ...args: any[]) => {
    loading.value = true;
    error.value = null;

    try {
      const response = await queryFn(page, ...args);
      
      if (response.data.success) {
        const result = response.data.data;
        
        if (page === 1) {
          data.value = result.items;
        } else {
          data.value.push(...result.items);
        }
        
        hasMore.value = result.pagination.currentPage < result.pagination.lastPage;
        currentPage.value = page;
        
        return result;
      } else {
        throw new Error(response.data.message);
      }
    } catch (err) {
      const apiError = processApiError(err);
      error.value = getErrorMessage(apiError);
      throw apiError;
    } finally {
      loading.value = false;
    }
  };

  const loadMore = async (...args: any[]) => {
    if (!hasMore.value || loading.value) return;
    return loadPage(currentPage.value + 1, ...args);
  };

  const refresh = async (...args: any[]) => {
    currentPage.value = 1;
    hasMore.value = true;
    return loadPage(1, ...args);
  };

  const reset = () => {
    data.value = [];
    currentPage.value = 1;
    hasMore.value = true;
    loading.value = false;
    error.value = null;
  };

  return {
    data,
    currentPage,
    hasMore,
    loading,
    error,
    loadPage,
    loadMore,
    refresh,
    reset
  };
}

// Reactive API state management
export function useApiState() {
  const pendingRequests = ref(0);
  const isLoading = computed(() => pendingRequests.value > 0);

  const startRequest = () => {
    pendingRequests.value++;
  };

  const endRequest = () => {
    pendingRequests.value = Math.max(0, pendingRequests.value - 1);
  };

  return {
    pendingRequests,
    isLoading,
    startRequest,
    endRequest
  };
}
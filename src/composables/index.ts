/**
 * Vue Composables - Advanced Reusable Logic
 * 
 * Collection of powerful composables that provide reusable functionality
 * across Vue components using the Composition API.
 */

export { useApi } from './useApi';
export { useAuth } from './useAuth';
export { useForm } from './useForm';
export { useModal } from './useModal';
export { usePagination } from './usePagination';
export { useSearch } from './useSearch';
export { useWebSocket } from './useWebSocket';
export { useLocalStorage } from './useLocalStorage';
export { useTheme } from './useTheme';
export { useBreakpoints } from './useBreakpoints';
export { useInfiniteScroll } from './useInfiniteScroll';
export { useClipboard } from './useClipboard';
export { useKeyboard } from './useKeyboard';
export { useDragAndDrop } from './useDragAndDrop';
export { usePermissions } from './usePermissions';
export { useValidation } from './useValidation';

// Re-export commonly used VueUse composables with custom configurations
export {
  useStorage,
  useToggle,
  useCounter,
  useAsyncState,
  useDebounce,
  useThrottle,
  useEventListener,
  useResizeObserver,
  useIntersectionObserver,
  useFetch,
  useTimeAgo,
  useNow,
  useIntervalFn,
  useTimeoutFn
} from '@vueuse/core';
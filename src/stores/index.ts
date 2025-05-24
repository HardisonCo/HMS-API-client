/**
 * Pinia Store Configuration and Exports
 * 
 * This file sets up Pinia stores for state management across the Vue application.
 * It provides centralized state management for authentication, items, chat, and wizard flows.
 */

export { useAuthStore } from './auth';
export { useItemsStore } from './items';
export { useChatStore } from './chat';
export { useWizardStore } from './wizard';
export { useNotificationStore } from './notifications';

// Store types
export type { AuthState } from './auth';
export type { ItemsState } from './items';
export type { ChatState } from './chat';
export type { WizardState } from './wizard';
export type { NotificationState } from './notifications';
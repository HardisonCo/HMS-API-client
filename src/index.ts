/**
 * @wizard/api-client
 * TypeScript client library for HMS API with Five-Step Wizard integration
 * 
 * @version 1.0.0
 * @author HMS Team
 * @license MIT
 */

// Core API clients
export { BaseApiClient, AuthApiClient, ItemsApiClient } from './api-client';
export { createHmsApiClient, hmsApiClient } from './api/hms-api-client';
export { WizardApiClient } from './api/wizard-api-client';

// API utilities and error handling
export * from './api/error-handling';

// Core utilities (excluding React hooks and examples with errors)
export * from './examples/programs-example';
export * from './examples/items-example';
export * from './examples/auth-example';
export * from './examples/chat-example';

// Type definitions and interfaces
export type {
  ApiResponse,
  ApiError,
  ApiClientConfig,
  ApiMetaData,
  AuthData,
  LoginData,
  UserData,
  ItemData,
  ItemStatus,
  ItemCollectionData,
  FoodData,
  PaginatedResponse,
  PaginationData
} from './api-client';

export type {
  ProgramData,
  ProtocolData,
  TeamMemberData
} from './api/hms-api-client';

// Re-export commonly used types
export type { AxiosResponse, AxiosError } from 'axios';
/**
 * Individual Module Exports for Tree-Shaking Optimization
 * 
 * This file allows micro-frontends to import only the specific
 * API clients they need, reducing bundle size.
 */

// =================== INDIVIDUAL CLIENT EXPORTS =====================

// Core clients (authentication & user management)
export { AuthApiClient } from '../hms-api-client';
export { UserApiClient } from '../hms-api-client';
export { TeamApiClient } from '../hms-api-client';

// Business logic clients
export { ItemsApiClient } from '../hms-api-client';
export { ProgramsApiClient } from '../hms-api-client';
export { ProtocolApiClient } from '../hms-api-client';

// New module clients
export { OrderApiClient } from '../hms-api-client';
export { NudgeApiClient } from '../hms-api-client';
export { ChallengeApiClient } from '../hms-api-client';
export { AssessmentsApiClient } from '../hms-api-client';
export { ActivityApiClient } from '../hms-api-client';
export { FollowUpsApiClient } from '../hms-api-client';

// Analytics & monitoring
export { KPIApiClient } from '../hms-api-client';

// Communication
export { ChatApiClient } from '../hms-api-client';
export { NotificationApiClient } from '../hms-api-client';

// Payment & financial
export { StripeApiClient } from '../hms-api-client';
export { PaymentApiClient } from '../hms-api-client';

// =================== TYPE EXPORTS =====================

// Base types
export type {
  ApiResponse,
  ApiMetaData,
  ApiClientConfig,
  ApiError,
  PaginationData,
  PaginatedResponse
} from '../hms-api-client';

// User & Auth types
export type {
  UserData,
  AuthData,
  LoginData,
  RegisterData,
  ProfileUpdateData,
  BillingInfo
} from '../hms-api-client';

// Order types
export type {
  OrderData,
  OrderItemData,
  CheckoutData,
  CheckoutSession,
  OrderConfirmation,
  BillingAddress
} from '../hms-api-client';
export { OrderStatus } from '../hms-api-client';

// Challenge types
export type {
  ChallengeData,
  ChallengeSettings,
  ChallengeRunData,
  TaskData,
  TaskStartData,
  ResultData,
  VideoResponse
} from '../hms-api-client';
export { ChallengeType, ChallengeStatus, TaskStatus } from '../hms-api-client';

// Assessment types
export type {
  AssessmentData,
  AssessmentSettings,
  QuestionData,
  QuestionSettings,
  ChoiceData,
  ResponseData,
  CreateAssessmentData
} from '../hms-api-client';
export { AssessmentStatus, QuestionType } from '../hms-api-client';

// Activity types
export type {
  ActivityData,
  ActivitySettings,
  ActivityQuery,
  LocationData,
  ProviderData,
  ReservationData,
  BookingData,
  EventData
} from '../hms-api-client';
export { ActivityType, ActivityStatus, EventStatus } from '../hms-api-client';

// Follow-up types
export type {
  FollowUpData,
  FollowUpSettings,
  TimelineData,
  RecommendationData,
  VoiceResponse,
  VoiceFinalizeData,
  PaymentResult
} from '../hms-api-client';
export { FollowUpType, FollowUpStatus, TimelineEventType, RecommendationType, PaymentStatus } from '../hms-api-client';

// Nudge types
export type {
  NudgeData,
  NudgeSettings,
  CheckinData,
  CreateNudgeData
} from '../hms-api-client';
export { NudgeStatus } from '../hms-api-client';

// Chain types
export type {
  ChainData,
  ChainProgress,
  ChainSettings
} from '../hms-api-client';
export { ChainStatus } from '../hms-api-client';

// =================== UTILITY EXPORTS =====================

export {
  processApiError,
  handleApiCall,
  createFormErrors,
  getErrorMessage
} from '../error-handling';

// Import client classes for the factory function
import {
  AuthApiClient,
  UserApiClient,
  OrderApiClient,
  ChallengeApiClient,
  AssessmentsApiClient,
  ActivityApiClient,
  FollowUpsApiClient,
  NudgeApiClient,
  ItemsApiClient,
  ProgramsApiClient,
  ChatApiClient,
  PaymentApiClient,
  ApiClientConfig
} from '../hms-api-client';

// =================== CONVENIENCE FACTORIES =====================

/**
 * Create a minimal client with only specified modules
 * Perfect for micro-frontends that only need specific functionality
 */
export function createMinimalClient(config: ApiClientConfig, modules: string[]) {
  const clients: any = {};
  
  if (modules.includes('auth')) {
    clients.auth = new AuthApiClient(config);
  }
  if (modules.includes('user')) {
    clients.user = new UserApiClient(config);
  }
  if (modules.includes('order')) {
    clients.order = new OrderApiClient(config);
  }
  if (modules.includes('challenge')) {
    clients.challenge = new ChallengeApiClient(config);
  }
  if (modules.includes('assessment')) {
    clients.assessments = new AssessmentsApiClient(config);
  }
  if (modules.includes('activity')) {
    clients.activity = new ActivityApiClient(config);
  }
  if (modules.includes('followup')) {
    clients.followUps = new FollowUpsApiClient(config);
  }
  if (modules.includes('nudge')) {
    clients.nudge = new NudgeApiClient(config);
  }
  if (modules.includes('items')) {
    clients.items = new ItemsApiClient(config);
  }
  if (modules.includes('programs')) {
    clients.programs = new ProgramsApiClient(config);
  }
  if (modules.includes('chat')) {
    clients.chat = new ChatApiClient(config);
  }
  if (modules.includes('payment')) {
    clients.payment = new PaymentApiClient(config);
  }
  
  return clients;
}
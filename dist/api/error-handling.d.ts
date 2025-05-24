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
export declare class ApiError extends Error {
    readonly status: number;
    readonly data: any;
    readonly errors?: Record<string, string[]>;
    readonly isApiError: boolean;
    readonly originalError: AxiosError;
    /**
     * Create a new ApiError instance from an AxiosError
     * @param error - The original Axios error
     */
    constructor(error: AxiosError<ApiResponse>);
    /**
     * Check if this is a validation error (HTTP 422)
     */
    isValidationError(): boolean;
    /**
     * Check if this is an authentication error (HTTP 401)
     */
    isAuthError(): boolean;
    /**
     * Check if this is a forbidden error (HTTP 403)
     */
    isForbiddenError(): boolean;
    /**
     * Check if this is a not found error (HTTP 404)
     */
    isNotFoundError(): boolean;
    /**
     * Check if this is a server error (HTTP 500+)
     */
    isServerError(): boolean;
    /**
     * Get all validation errors
     */
    getValidationErrors(): Record<string, string[]>;
    /**
     * Get the first validation error for a specific field
     * @param field - The field name
     */
    getFieldError(field: string): string | undefined;
    /**
     * Get simplified validation errors as a Record of field to first error message
     */
    getSimplifiedValidationErrors(): Record<string, string>;
}
/**
 * Process an error and convert it to an ApiError if possible
 * @param error - The error to process
 */
export declare function processApiError(error: any): ApiError;
/**
 * Async error handler that wraps an API call and processes errors consistently
 * @param apiCall - The API call function to execute
 * @param errorHandler - Optional custom error handler
 */
export declare function handleApiCall<T>(apiCall: () => Promise<T>, errorHandler?: (error: ApiError) => void): Promise<T>;
/**
 * Create a form validation object from an ApiError for use with form libraries
 * @param error - The API error
 */
export declare function createFormErrors(error: any): Record<string, string>;
/**
 * Extract error messages from an API error in a user-friendly format
 * @param error - The API error
 */
export declare function getErrorMessage(error: any): string;
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
//# sourceMappingURL=error-handling.d.ts.map
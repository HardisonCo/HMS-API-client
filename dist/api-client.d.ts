/**
 * HMS-API TypeScript Client
 *
 * This is a TypeScript client for the HMS API generated from OpenAPI specifications.
 * It provides type-safe access to API endpoints and request/response handling.
 */
import { AxiosInstance, AxiosResponse } from 'axios';
export interface ApiResponse<T = any> {
    success: boolean;
    message: string;
    data: T;
    meta?: ApiMetaData;
}
export interface ApiMetaData {
    timestamp: string;
    apiVersion: string;
}
export interface ApiClientConfig {
    baseURL: string;
    timeout?: number;
    withCredentials?: boolean;
    headers?: Record<string, string>;
}
export interface ApiError {
    message: string;
    errors?: Record<string, string[]>;
    code?: string;
}
/**
 * Base API Client class that handles common functionality
 */
export declare class BaseApiClient {
    protected readonly client: AxiosInstance;
    constructor(config: ApiClientConfig);
}
/**
 * Item DTO interfaces based on PHP DTOs
 */
export interface ItemData {
    id: number;
    name: string;
    description: string;
    price: number;
    status: ItemStatus;
    imageUrl?: string | null;
    createdAt?: string | null;
    updatedAt?: string | null;
}
/**
 * ItemCollection DTO
 */
export interface ItemCollectionData {
    items: ItemData[];
}
/**
 * Item Status Enum
 */
export declare enum ItemStatus {
    ACTIVE = "active",
    INACTIVE = "inactive",
    PENDING = "pending",
    DELETED = "deleted"
}
/**
 * FoodData DTO
 */
export interface FoodData {
    id: number;
    name: string;
    description: string | null;
    protein: number | null;
    carbs: number | null;
    fat: number | null;
    calories: number | null;
    createdAt: string | null;
    updatedAt: string | null;
}
/**
 * FoodCollection DTO
 */
export interface FoodCollectionData {
    items: FoodData[];
}
/**
 * User DTO
 */
export interface UserData {
    id: number;
    name: string;
    email: string;
    roles: string[];
    createdAt: string;
    updatedAt: string;
}
/**
 * Authentication DTO
 */
export interface AuthData {
    token: string;
    user: UserData;
    expiresAt: string;
}
/**
 * Login DTO
 */
export interface LoginData {
    email: string;
    password: string;
    rememberMe?: boolean;
}
/**
 * Pagination DTO
 */
export interface PaginationData {
    currentPage: number;
    lastPage: number;
    perPage: number;
    total: number;
}
/**
 * Paginated Response DTO
 */
export interface PaginatedResponse<T> {
    items: T[];
    pagination: PaginationData;
}
/**
 * Specific client implementation for the Items module
 */
export declare class ItemsApiClient extends BaseApiClient {
    /**
     * Get a list of all items
     * @param params - Query parameters for filtering
     */
    getItems(params?: {
        status?: ItemStatus;
        page?: number;
        perPage?: number;
    }): Promise<AxiosResponse<ApiResponse<ItemCollectionData>>>;
    /**
     * Get a specific item by ID
     * @param id - Item ID
     */
    getItem(id: number): Promise<AxiosResponse<ApiResponse<ItemData>>>;
    /**
     * Create a new item
     * @param data - Item data
     */
    createItem(data: Omit<ItemData, 'id' | 'createdAt' | 'updatedAt'>): Promise<AxiosResponse<ApiResponse<ItemData>>>;
    /**
     * Update an existing item
     * @param id - Item ID
     * @param data - Updated item data
     */
    updateItem(id: number, data: Partial<Omit<ItemData, 'id' | 'createdAt' | 'updatedAt'>>): Promise<AxiosResponse<ApiResponse<ItemData>>>;
    /**
     * Delete an item
     * @param id - Item ID
     */
    deleteItem(id: number): Promise<AxiosResponse<ApiResponse<null>>>;
}
/**
 * Authentication API Client
 */
export declare class AuthApiClient extends BaseApiClient {
    /**
     * Login with email and password
     * @param data - Login credentials
     */
    login(data: LoginData): Promise<AxiosResponse<ApiResponse<AuthData>>>;
    /**
     * Logout the current user
     */
    logout(): Promise<AxiosResponse<ApiResponse<null>>>;
    /**
     * Get the currently authenticated user
     */
    getCurrentUser(): Promise<AxiosResponse<ApiResponse<UserData>>>;
    /**
     * Check if the user is authenticated
     */
    isAuthenticated(): boolean;
}
/**
 * Factory function to create API clients
 * @param config - API client configuration
 */
export declare function createApiClient(config: ApiClientConfig): {
    items: ItemsApiClient;
    auth: AuthApiClient;
};
//# sourceMappingURL=api-client.d.ts.map
/**
 * HMS-API TypeScript Client
 * 
 * This is a TypeScript client for the HMS API generated from OpenAPI specifications.
 * It provides type-safe access to API endpoints and request/response handling.
 */

import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';

// Base API response structure
export interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  data: T;
  meta?: ApiMetaData;
}

// Metadata included in API responses
export interface ApiMetaData {
  timestamp: string;
  apiVersion: string;
}

// Configuration options for the API client
export interface ApiClientConfig {
  baseURL: string;
  timeout?: number;
  withCredentials?: boolean;
  headers?: Record<string, string>;
}

// Generic Error interface for API Errors
export interface ApiError {
  message: string;
  errors?: Record<string, string[]>;
  code?: string;
}

/**
 * Base API Client class that handles common functionality
 */
export class BaseApiClient {
  protected readonly client: AxiosInstance;
  
  constructor(config: ApiClientConfig) {
    this.client = axios.create({
      baseURL: config.baseURL,
      timeout: config.timeout || 30000,
      withCredentials: config.withCredentials || false,
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        ...config.headers
      }
    });
    
    // Add request interceptor for authentication
    this.client.interceptors.request.use(
      (config) => {
        const token = localStorage.getItem('auth_token');
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => Promise.reject(error)
    );
    
    // Add response interceptor for error handling
    this.client.interceptors.response.use(
      (response) => response,
      (error) => {
        // Handle common error scenarios
        if (error.response?.status === 401) {
          // Handle unauthorized access
          window.dispatchEvent(new CustomEvent('auth:unauthorized'));
        }
        
        return Promise.reject(error);
      }
    );
  }
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
export enum ItemStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  PENDING = 'pending',
  DELETED = 'deleted'
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
export class ItemsApiClient extends BaseApiClient {
  /**
   * Get a list of all items
   * @param params - Query parameters for filtering
   */
  async getItems(params?: { status?: ItemStatus; page?: number; perPage?: number }): Promise<AxiosResponse<ApiResponse<ItemCollectionData>>> {
    return this.client.get('/items', { params });
  }
  
  /**
   * Get a specific item by ID
   * @param id - Item ID
   */
  async getItem(id: number): Promise<AxiosResponse<ApiResponse<ItemData>>> {
    return this.client.get(`/items/${id}`);
  }
  
  /**
   * Create a new item
   * @param data - Item data
   */
  async createItem(data: Omit<ItemData, 'id' | 'createdAt' | 'updatedAt'>): Promise<AxiosResponse<ApiResponse<ItemData>>> {
    return this.client.post('/items', data);
  }
  
  /**
   * Update an existing item
   * @param id - Item ID
   * @param data - Updated item data
   */
  async updateItem(id: number, data: Partial<Omit<ItemData, 'id' | 'createdAt' | 'updatedAt'>>): Promise<AxiosResponse<ApiResponse<ItemData>>> {
    return this.client.put(`/items/${id}`, data);
  }
  
  /**
   * Delete an item
   * @param id - Item ID
   */
  async deleteItem(id: number): Promise<AxiosResponse<ApiResponse<null>>> {
    return this.client.delete(`/items/${id}`);
  }
}

/**
 * Authentication API Client
 */
export class AuthApiClient extends BaseApiClient {
  /**
   * Login with email and password
   * @param data - Login credentials
   */
  async login(data: LoginData): Promise<AxiosResponse<ApiResponse<AuthData>>> {
    const response = await this.client.post('/auth/login', data);
    
    if (response.data.success && response.data.data.token) {
      // Store the token
      localStorage.setItem('auth_token', response.data.data.token);
    }
    
    return response;
  }
  
  /**
   * Logout the current user
   */
  async logout(): Promise<AxiosResponse<ApiResponse<null>>> {
    try {
      const response = await this.client.post('/auth/logout');
      localStorage.removeItem('auth_token');
      return response;
    } catch (error) {
      // Always remove the token even if the API call fails
      localStorage.removeItem('auth_token');
      throw error;
    }
  }
  
  /**
   * Get the currently authenticated user
   */
  async getCurrentUser(): Promise<AxiosResponse<ApiResponse<UserData>>> {
    return this.client.get('/auth/user');
  }
  
  /**
   * Check if the user is authenticated
   */
  isAuthenticated(): boolean {
    return !!localStorage.getItem('auth_token');
  }
}

/**
 * Factory function to create API clients
 * @param config - API client configuration
 */
export function createApiClient(config: ApiClientConfig) {
  return {
    items: new ItemsApiClient(config),
    auth: new AuthApiClient(config)
  };
}

// Example usage
// const api = createApiClient({ baseURL: 'http://api.example.com' });
// api.items.getItems().then(response => console.log(response.data));
/**
 * HMS-API TypeScript Client
 * 
 * This is a TypeScript client for the HMS API using native fetch.
 * It provides type-safe access to API endpoints and request/response handling.
 */

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
 * Base API Client class that handles common functionality using fetch
 */
export class BaseApiClient {
  protected readonly baseURL: string;
  protected readonly timeout: number;
  protected readonly withCredentials: boolean;
  protected readonly defaultHeaders: Record<string, string>;
  
  constructor(config: ApiClientConfig) {
    this.baseURL = config.baseURL;
    this.timeout = config.timeout || 30000;
    this.withCredentials = config.withCredentials || false;
    this.defaultHeaders = {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      ...config.headers
    };
  }

  /**
   * Make an HTTP request using fetch
   */
  protected async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    const url = `${this.baseURL}${endpoint}`;
    
    // Get auth token
    const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;
    
    // Prepare headers
    const headers: Record<string, string> = {
      ...this.defaultHeaders,
      ...((options.headers as Record<string, string>) || {})
    };
    
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }

    // Create abort controller for timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeout);

    try {
      const response = await fetch(url, {
        ...options,
        headers,
        credentials: this.withCredentials ? 'include' : 'omit',
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      // Handle unauthorized access
      if (response.status === 401) {
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('auth:unauthorized'));
        }
      }

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      clearTimeout(timeoutId);
      throw error;
    }
  }

  /**
   * GET request
   */
  protected async get<T>(endpoint: string, params?: Record<string, any>): Promise<ApiResponse<T>> {
    let url = endpoint;
    if (params) {
      const searchParams = new URLSearchParams();
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          searchParams.append(key, String(value));
        }
      });
      const paramString = searchParams.toString();
      if (paramString) {
        url += `?${paramString}`;
      }
    }
    
    return this.request<T>(url, { method: 'GET' });
  }

  /**
   * POST request
   */
  protected async post<T>(endpoint: string, data?: any): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined
    });
  }

  /**
   * PUT request
   */
  protected async put<T>(endpoint: string, data?: any): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined
    });
  }

  /**
   * DELETE request
   */
  protected async delete<T>(endpoint: string): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { method: 'DELETE' });
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
  async getItems(params?: { status?: ItemStatus; page?: number; perPage?: number }): Promise<ApiResponse<ItemCollectionData>> {
    return this.get<ItemCollectionData>('/items', params);
  }
  
  /**
   * Get a specific item by ID
   * @param id - Item ID
   */
  async getItem(id: number): Promise<ApiResponse<ItemData>> {
    return this.get<ItemData>(`/items/${id}`);
  }
  
  /**
   * Create a new item
   * @param data - Item data
   */
  async createItem(data: Omit<ItemData, 'id' | 'createdAt' | 'updatedAt'>): Promise<ApiResponse<ItemData>> {
    return this.post<ItemData>('/items', data);
  }
  
  /**
   * Update an existing item
   * @param id - Item ID
   * @param data - Updated item data
   */
  async updateItem(id: number, data: Partial<Omit<ItemData, 'id' | 'createdAt' | 'updatedAt'>>): Promise<ApiResponse<ItemData>> {
    return this.put<ItemData>(`/items/${id}`, data);
  }
  
  /**
   * Delete an item
   * @param id - Item ID
   */
  async deleteItem(id: number): Promise<ApiResponse<null>> {
    return this.delete<null>(`/items/${id}`);
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
  async login(data: LoginData): Promise<ApiResponse<AuthData>> {
    const response = await this.post<AuthData>('/auth/login', data);
    
    if (response.success && response.data.token) {
      // Store the token
      if (typeof window !== 'undefined') {
        localStorage.setItem('auth_token', response.data.token);
      }
    }
    
    return response;
  }
  
  /**
   * Logout the current user
   */
  async logout(): Promise<ApiResponse<null>> {
    try {
      const response = await this.post<null>('/auth/logout');
      if (typeof window !== 'undefined') {
        localStorage.removeItem('auth_token');
      }
      return response;
    } catch (error) {
      // Always remove the token even if the API call fails
      if (typeof window !== 'undefined') {
        localStorage.removeItem('auth_token');
      }
      throw error;
    }
  }
  
  /**
   * Get the currently authenticated user
   */
  async getCurrentUser(): Promise<ApiResponse<UserData>> {
    return this.get<UserData>('/auth/user');
  }
  
  /**
   * Check if the user is authenticated
   */
  isAuthenticated(): boolean {
    return typeof window !== 'undefined' ? !!localStorage.getItem('auth_token') : false;
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
// api.items.getItems().then(response => console.log(response));
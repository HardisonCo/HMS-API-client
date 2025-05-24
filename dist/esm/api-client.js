/**
 * HMS-API TypeScript Client
 *
 * This is a TypeScript client for the HMS API generated from OpenAPI specifications.
 * It provides type-safe access to API endpoints and request/response handling.
 */
import axios from 'axios';
/**
 * Base API Client class that handles common functionality
 */
export class BaseApiClient {
    constructor(config) {
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
        this.client.interceptors.request.use((config) => {
            const token = localStorage.getItem('auth_token');
            if (token) {
                config.headers.Authorization = `Bearer ${token}`;
            }
            return config;
        }, (error) => Promise.reject(error));
        // Add response interceptor for error handling
        this.client.interceptors.response.use((response) => response, (error) => {
            // Handle common error scenarios
            if (error.response?.status === 401) {
                // Handle unauthorized access
                window.dispatchEvent(new CustomEvent('auth:unauthorized'));
            }
            return Promise.reject(error);
        });
    }
}
/**
 * Item Status Enum
 */
export var ItemStatus;
(function (ItemStatus) {
    ItemStatus["ACTIVE"] = "active";
    ItemStatus["INACTIVE"] = "inactive";
    ItemStatus["PENDING"] = "pending";
    ItemStatus["DELETED"] = "deleted";
})(ItemStatus || (ItemStatus = {}));
/**
 * Specific client implementation for the Items module
 */
export class ItemsApiClient extends BaseApiClient {
    /**
     * Get a list of all items
     * @param params - Query parameters for filtering
     */
    async getItems(params) {
        return this.client.get('/items', { params });
    }
    /**
     * Get a specific item by ID
     * @param id - Item ID
     */
    async getItem(id) {
        return this.client.get(`/items/${id}`);
    }
    /**
     * Create a new item
     * @param data - Item data
     */
    async createItem(data) {
        return this.client.post('/items', data);
    }
    /**
     * Update an existing item
     * @param id - Item ID
     * @param data - Updated item data
     */
    async updateItem(id, data) {
        return this.client.put(`/items/${id}`, data);
    }
    /**
     * Delete an item
     * @param id - Item ID
     */
    async deleteItem(id) {
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
    async login(data) {
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
    async logout() {
        try {
            const response = await this.client.post('/auth/logout');
            localStorage.removeItem('auth_token');
            return response;
        }
        catch (error) {
            // Always remove the token even if the API call fails
            localStorage.removeItem('auth_token');
            throw error;
        }
    }
    /**
     * Get the currently authenticated user
     */
    async getCurrentUser() {
        return this.client.get('/auth/user');
    }
    /**
     * Check if the user is authenticated
     */
    isAuthenticated() {
        return !!localStorage.getItem('auth_token');
    }
}
/**
 * Factory function to create API clients
 * @param config - API client configuration
 */
export function createApiClient(config) {
    return {
        items: new ItemsApiClient(config),
        auth: new AuthApiClient(config)
    };
}
// Example usage
// const api = createApiClient({ baseURL: 'http://api.example.com' });
// api.items.getItems().then(response => console.log(response.data));
//# sourceMappingURL=api-client.js.map
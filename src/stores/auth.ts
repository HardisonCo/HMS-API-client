/**
 * Authentication Store using Pinia
 * 
 * Manages user authentication state, login/logout flows, and user session persistence.
 * Provides reactive state management for authentication across the Vue application.
 */

import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { hmsApiClient } from '../api';
import { processApiError, getErrorMessage } from '../api/error-handling';
import type { UserData, AuthData } from '../api/hms-api-client';

// Extended user data interface to include permissions
export interface ExtendedUserData extends UserData {
  permissions?: string[];
}

export interface AuthState {
  user: ExtendedUserData | null;
  isAuthenticated: boolean;
  loading: boolean;
  error: string | null;
  token: string | null;
  refreshToken: string | null;
  sessionExpiry: Date | null;
}

export const useAuthStore = defineStore('auth', () => {
  // State
  const user = ref<ExtendedUserData | null>(null);
  const loading = ref(false);
  const error = ref<string | null>(null);
  const token = ref<string | null>(localStorage.getItem('auth_token'));
  const refreshToken = ref<string | null>(localStorage.getItem('refresh_token'));
  const sessionExpiry = ref<Date | null>(
    localStorage.getItem('session_expiry') 
      ? new Date(localStorage.getItem('session_expiry')!) 
      : null
  );

  // Getters
  const isAuthenticated = computed(() => {
    return !!token.value && !!user.value && !isSessionExpired.value;
  });

  const isSessionExpired = computed(() => {
    return sessionExpiry.value ? new Date() > sessionExpiry.value : false;
  });

  const userInitials = computed(() => {
    if (!user.value) return '';
    const names = user.value.name.split(' ');
    return names.map(name => name[0]).join('').toUpperCase();
  });

  const userRole = computed(() => {
    return user.value?.roles?.[0] || 'user';
  });

  const hasRole = computed(() => (role: string) => {
    return user.value?.roles?.includes(role) || false;
  });

  const hasPermission = computed(() => (permission: string) => {
    return user.value?.permissions?.includes(permission) || false;
  });

  // Actions
  async function login(email: string, password: string, rememberMe = false) {
    loading.value = true;
    error.value = null;

    try {
      const response = await hmsApiClient.auth.login({
        email,
        password,
        rememberMe
      });

      if (response.data.success) {
        const authData = response.data.data;
        
        // Set user data
        user.value = authData.user;
        token.value = authData.token;
        // AuthData doesn't have refresh_token, use token for now
        refreshToken.value = authData.token;
        
        // Calculate session expiry (default 24 hours, or based on server response)
        const expiryTime = new Date();
        expiryTime.setHours(expiryTime.getHours() + (rememberMe ? 24 * 7 : 24)); // 7 days if remember me
        sessionExpiry.value = expiryTime;

        // Persist to localStorage
        if (token.value) {
          localStorage.setItem('auth_token', token.value);
        }
        if (refreshToken.value) {
          localStorage.setItem('refresh_token', refreshToken.value);
        }
        localStorage.setItem('session_expiry', sessionExpiry.value.toISOString());
        localStorage.setItem('user_data', JSON.stringify(user.value));

        return { success: true, user: user.value };
      } else {
        error.value = response.data.message;
        return { success: false, error: error.value };
      }
    } catch (err) {
      const apiError = processApiError(err);
      error.value = getErrorMessage(apiError);
      return { success: false, error: error.value };
    } finally {
      loading.value = false;
    }
  }

  async function register(
    name: string,
    email: string,
    password: string,
    passwordConfirmation: string
  ) {
    loading.value = true;
    error.value = null;

    try {
      const response = await hmsApiClient.auth.register({
        name,
        email,
        password,
        password_confirmation: passwordConfirmation,
        terms: true
      });

      if (response.data.success) {
        const authData = response.data.data;
        
        // Set user data
        user.value = authData.user;
        token.value = authData.token;
        // AuthData doesn't have refresh_token, use token for now
        refreshToken.value = authData.token;
        
        // Calculate session expiry
        const expiryTime = new Date();
        expiryTime.setHours(expiryTime.getHours() + 24);
        sessionExpiry.value = expiryTime;

        // Persist to localStorage
        if (token.value) {
          localStorage.setItem('auth_token', token.value);
        }
        if (refreshToken.value) {
          localStorage.setItem('refresh_token', refreshToken.value);
        }
        localStorage.setItem('session_expiry', sessionExpiry.value.toISOString());
        localStorage.setItem('user_data', JSON.stringify(user.value));

        return { success: true, user: user.value };
      } else {
        error.value = response.data.message;
        return { success: false, error: error.value };
      }
    } catch (err) {
      const apiError = processApiError(err);
      error.value = getErrorMessage(apiError);
      return { success: false, error: error.value };
    } finally {
      loading.value = false;
    }
  }

  async function logout() {
    loading.value = true;
    
    try {
      // Call API logout if token exists
      if (token.value) {
        await hmsApiClient.auth.logout();
      }
    } catch (err) {
      // Continue with logout even if API call fails
      console.warn('Logout API call failed:', err);
    } finally {
      // Clear all state and localStorage
      user.value = null;
      token.value = null;
      refreshToken.value = null;
      sessionExpiry.value = null;
      error.value = null;
      
      localStorage.removeItem('auth_token');
      localStorage.removeItem('refresh_token');
      localStorage.removeItem('session_expiry');
      localStorage.removeItem('user_data');
      
      loading.value = false;
    }
  }

  async function refreshSession() {
    if (!refreshToken.value || !isSessionExpired.value) {
      return false;
    }

    loading.value = true;
    error.value = null;

    try {
      // refreshToken method doesn't exist on API client, skip refresh for now
      throw new Error('Refresh token method not implemented');

      if (response.data.success) {
        const authData = response.data.data;
        
        token.value = authData.token;
        // AuthData doesn't have refresh_token, use token for now
        refreshToken.value = authData.token;
        
        // Update session expiry
        const expiryTime = new Date();
        expiryTime.setHours(expiryTime.getHours() + 24);
        sessionExpiry.value = expiryTime;

        // Update localStorage
        if (token.value) {
          localStorage.setItem('auth_token', token.value);
        }
        if (refreshToken.value) {
          localStorage.setItem('refresh_token', refreshToken.value);
        }
        localStorage.setItem('session_expiry', sessionExpiry.value.toISOString());

        return true;
      } else {
        // Refresh failed, logout user
        await logout();
        return false;
      }
    } catch (err) {
      // Refresh failed, logout user
      await logout();
      return false;
    } finally {
      loading.value = false;
    }
  }

  async function fetchCurrentUser() {
    if (!token.value) return false;

    loading.value = true;
    error.value = null;

    try {
      const response = await hmsApiClient.auth.getCurrentUser();

      if (response.data.success) {
        user.value = response.data.data;
        localStorage.setItem('user_data', JSON.stringify(user.value));
        return true;
      } else {
        error.value = response.data.message;
        return false;
      }
    } catch (err) {
      const apiError = processApiError(err);
      error.value = getErrorMessage(apiError);
      
      // If unauthorized, clear session
      if (apiError.status === 401) {
        await logout();
      }
      
      return false;
    } finally {
      loading.value = false;
    }
  }

  async function updateProfile(profileData: Partial<UserData>) {
    loading.value = true;
    error.value = null;

    try {
      const response = await hmsApiClient.auth.updateProfile(user.value!.id, profileData);

      if (response.data.success) {
        user.value = { ...user.value, ...response.data.data };
        localStorage.setItem('user_data', JSON.stringify(user.value));
        return { success: true, user: user.value };
      } else {
        error.value = response.data.message;
        return { success: false, error: error.value };
      }
    } catch (err) {
      const apiError = processApiError(err);
      error.value = getErrorMessage(apiError);
      return { success: false, error: error.value };
    } finally {
      loading.value = false;
    }
  }

  async function changePassword(currentPassword: string, newPassword: string) {
    loading.value = true;
    error.value = null;

    try {
      const response = await hmsApiClient.auth.updatePassword(
        user.value!.id,
        currentPassword,
        newPassword
      );

      if (response.data.success) {
        return { success: true };
      } else {
        error.value = response.data.message;
        return { success: false, error: error.value };
      }
    } catch (err) {
      const apiError = processApiError(err);
      error.value = getErrorMessage(apiError);
      return { success: false, error: error.value };
    } finally {
      loading.value = false;
    }
  }

  // Initialize store from localStorage
  async function initializeAuth() {
    const storedUser = localStorage.getItem('user_data');
    if (storedUser && token.value) {
      try {
        user.value = JSON.parse(storedUser);
        
        // Check if session is expired
        if (isSessionExpired.value) {
          // Try to refresh the session
          const refreshed = await refreshSession();
          if (!refreshed) {
            return false;
          }
        }
        
        // Fetch fresh user data
        return await fetchCurrentUser();
      } catch (err) {
        // Clear corrupted data
        await logout();
        return false;
      }
    }
    return false;
  }

  function clearError() {
    error.value = null;
  }

  return {
    // State
    user,
    loading,
    error,
    token,
    refreshToken,
    sessionExpiry,
    
    // Getters
    isAuthenticated,
    isSessionExpired,
    userInitials,
    userRole,
    hasRole,
    hasPermission,
    
    // Actions
    login,
    register,
    logout,
    refreshSession,
    fetchCurrentUser,
    updateProfile,
    changePassword,
    initializeAuth,
    clearError
  };
});
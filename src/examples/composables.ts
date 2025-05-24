/**
 * HMS API Vue Composables
 * 
 * This file provides Vue composables (composition API functions) for using the HMS API client.
 * These composables make it easy to use the API client in Vue components with reactive state.
 */

import { ref, computed, onMounted, watch, Ref } from 'vue';
import { hmsApiClient } from '../api';
import { processApiError, getErrorMessage } from '../api/error-handling';

/**
 * Composable for handling API queries
 * @param apiFn - Function that returns a promise from the API client
 * @param immediate - Whether to execute the query immediately
 * @param args - Arguments to pass to the API function
 * @returns Object with reactive query state
 */
export function useApiQuery<T, A extends any[]>(
  apiFn: (...args: A) => Promise<any>,
  immediate = true,
  ...initialArgs: A
) {
  const data = ref<T | null>(null) as Ref<T | null>;
  const error = ref<string | null>(null);
  const loading = ref<boolean>(false);
  const rawError = ref<any>(null);
  const success = ref<boolean>(false);
  
  const execute = async (...args: A) => {
    loading.value = true;
    error.value = null;
    rawError.value = null;
    success.value = false;
    
    try {
      const response = await apiFn(...args);
      
      if (response.data.success) {
        data.value = response.data.data;
        success.value = true;
      } else {
        error.value = response.data.message;
        success.value = false;
      }
      
      return response;
    } catch (err) {
      const apiError = processApiError(err);
      error.value = getErrorMessage(apiError);
      rawError.value = apiError;
      success.value = false;
      throw apiError;
    } finally {
      loading.value = false;
    }
  };
  
  if (immediate) {
    onMounted(() => {
      execute(...initialArgs);
    });
  }
  
  return {
    data,
    error,
    loading,
    rawError,
    success,
    execute,
  };
}

/**
 * Composable for handling API mutations (create, update, delete)
 * @param mutationFn - Function that performs the mutation
 * @returns Object with reactive mutation state
 */
export function useApiMutation<T, P>(
  mutationFn: (params: P) => Promise<any>
) {
  const data = ref<T | null>(null) as Ref<T | null>;
  const error = ref<string | null>(null);
  const loading = ref<boolean>(false);
  const rawError = ref<any>(null);
  const success = ref<boolean>(false);
  
  const execute = async (params: P) => {
    loading.value = true;
    error.value = null;
    rawError.value = null;
    success.value = false;
    
    try {
      const response = await mutationFn(params);
      
      if (response.data.success) {
        data.value = response.data.data;
        success.value = true;
      } else {
        error.value = response.data.message;
        success.value = false;
      }
      
      return response;
    } catch (err) {
      const apiError = processApiError(err);
      error.value = getErrorMessage(apiError);
      rawError.value = apiError;
      success.value = false;
      throw apiError;
    } finally {
      loading.value = false;
    }
  };
  
  const reset = () => {
    data.value = null;
    error.value = null;
    loading.value = false;
    rawError.value = null;
    success.value = false;
  };
  
  return {
    data,
    error,
    loading,
    rawError,
    success,
    execute,
    reset
  };
}

/**
 * Composable for authentication
 * @returns Object with authentication state and methods
 */
export function useAuth() {
  const user = ref(null);
  const isAuthenticated = ref(false);
  const loading = ref(false);
  const error = ref<string | null>(null);
  
  // Check if user is already authenticated
  const checkAuthStatus = async () => {
    isAuthenticated.value = hmsApiClient.auth.isAuthenticated();
    
    if (isAuthenticated.value) {
      try {
        loading.value = true;
        const response = await hmsApiClient.auth.getCurrentUser();
        
        if (response.data.success) {
          user.value = response.data.data;
        } else {
          // If getCurrentUser fails, user is not properly authenticated
          isAuthenticated.value = false;
          await hmsApiClient.auth.logout();
        }
      } catch (err) {
        isAuthenticated.value = false;
        error.value = 'Failed to get user data';
        await hmsApiClient.auth.logout();
      } finally {
        loading.value = false;
      }
    }
  };
  
  // Login
  const login = async (email: string, password: string, rememberMe = false) => {
    loading.value = true;
    error.value = null;
    
    try {
      const response = await hmsApiClient.auth.login({
        email,
        password,
        rememberMe
      });
      
      if (response.data.success) {
        user.value = response.data.data.user;
        isAuthenticated.value = true;
        return true;
      } else {
        error.value = response.data.message;
        return false;
      }
    } catch (err) {
      const apiError = processApiError(err);
      error.value = getErrorMessage(apiError);
      return false;
    } finally {
      loading.value = false;
    }
  };
  
  // Register
  const register = async (
    name: string,
    email: string,
    password: string,
    passwordConfirmation: string
  ) => {
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
        user.value = response.data.data.user;
        isAuthenticated.value = true;
        return true;
      } else {
        error.value = response.data.message;
        return false;
      }
    } catch (err) {
      const apiError = processApiError(err);
      error.value = getErrorMessage(apiError);
      return false;
    } finally {
      loading.value = false;
    }
  };
  
  // Logout
  const logout = async () => {
    loading.value = true;
    error.value = null;
    
    try {
      await hmsApiClient.auth.logout();
      user.value = null;
      isAuthenticated.value = false;
      return true;
    } catch (err) {
      error.value = 'Failed to logout';
      return false;
    } finally {
      loading.value = false;
    }
  };
  
  // Check auth status on mount
  onMounted(checkAuthStatus);
  
  return {
    user,
    isAuthenticated,
    loading,
    error,
    login,
    register,
    logout,
    checkAuthStatus
  };
}

/**
 * Composable for items
 * @returns Object with items state and methods
 */
export function useItems(options = {}) {
  const items = ref([]);
  const loading = ref(false);
  const error = ref<string | null>(null);
  const pagination = ref({
    currentPage: 1,
    lastPage: 1,
    perPage: 20,
    total: 0
  });
  
  // Fetch items
  const fetchItems = async (page = 1, itemsPerPage = 20) => {
    loading.value = true;
    error.value = null;
    
    try {
      const response = await hmsApiClient.items.getItems({
        ...options,
        page,
        perPage: itemsPerPage
      });
      
      if (response.data.success) {
        items.value = response.data.data.items;
        pagination.value = response.data.data.pagination;
      } else {
        error.value = response.data.message;
      }
    } catch (err) {
      const apiError = processApiError(err);
      error.value = getErrorMessage(apiError);
    } finally {
      loading.value = false;
    }
  };
  
  // Create item
  const createItem = async (itemData: any) => {
    loading.value = true;
    error.value = null;
    
    try {
      const response = await hmsApiClient.items.createItem(itemData);
      
      if (response.data.success) {
        // Refresh the items list
        await fetchItems(pagination.value.currentPage, pagination.value.perPage);
        return response.data.data;
      } else {
        error.value = response.data.message;
        return null;
      }
    } catch (err) {
      const apiError = processApiError(err);
      error.value = getErrorMessage(apiError);
      return null;
    } finally {
      loading.value = false;
    }
  };
  
  // Update item
  const updateItem = async (id: number, itemData: any) => {
    loading.value = true;
    error.value = null;
    
    try {
      const response = await hmsApiClient.items.updateItem(id, itemData);
      
      if (response.data.success) {
        // Refresh the items list
        await fetchItems(pagination.value.currentPage, pagination.value.perPage);
        return response.data.data;
      } else {
        error.value = response.data.message;
        return null;
      }
    } catch (err) {
      const apiError = processApiError(err);
      error.value = getErrorMessage(apiError);
      return null;
    } finally {
      loading.value = false;
    }
  };
  
  // Delete item
  const deleteItem = async (id: number) => {
    loading.value = true;
    error.value = null;
    
    try {
      const response = await hmsApiClient.items.deleteItem(id);
      
      if (response.data.success) {
        // Refresh the items list
        await fetchItems(pagination.value.currentPage, pagination.value.perPage);
        return true;
      } else {
        error.value = response.data.message;
        return false;
      }
    } catch (err) {
      const apiError = processApiError(err);
      error.value = getErrorMessage(apiError);
      return false;
    } finally {
      loading.value = false;
    }
  };
  
  // Fetch initial items
  onMounted(() => {
    fetchItems();
  });
  
  return {
    items,
    loading,
    error,
    pagination,
    fetchItems,
    createItem,
    updateItem,
    deleteItem
  };
}

/**
 * Composable for chat functionality
 * @returns Object with chat state and methods
 */
export function useChat() {
  const chatRooms = ref([]);
  const selectedRoom = ref(null);
  const messages = ref([]);
  const loading = ref(false);
  const error = ref<string | null>(null);
  
  // Fetch chat rooms
  const fetchChatRooms = async () => {
    loading.value = true;
    error.value = null;
    
    try {
      const response = await hmsApiClient.chat.getChatList();
      
      if (response.data.success) {
        chatRooms.value = response.data.data;
      } else {
        error.value = response.data.message;
      }
    } catch (err) {
      const apiError = processApiError(err);
      error.value = getErrorMessage(apiError);
    } finally {
      loading.value = false;
    }
  };
  
  // Select a chat room and load messages
  const selectRoom = async (roomId: number) => {
    loading.value = true;
    error.value = null;
    
    try {
      const response = await hmsApiClient.chat.getChatRoomById(roomId);
      
      if (response.data.success) {
        selectedRoom.value = response.data.data;
        await fetchMessages(roomId);
      } else {
        error.value = response.data.message;
      }
    } catch (err) {
      const apiError = processApiError(err);
      error.value = getErrorMessage(apiError);
    } finally {
      loading.value = false;
    }
  };
  
  // Fetch messages for a room
  const fetchMessages = async (roomId: number) => {
    if (!roomId) return;
    
    loading.value = true;
    error.value = null;
    
    try {
      const response = await hmsApiClient.chat.getMessages(roomId);
      
      if (response.data.success) {
        messages.value = response.data.data;
      } else {
        error.value = response.data.message;
      }
    } catch (err) {
      const apiError = processApiError(err);
      error.value = getErrorMessage(apiError);
    } finally {
      loading.value = false;
    }
  };
  
  // Send a message
  const sendMessage = async (message: string, attachments?: File[]) => {
    if (!selectedRoom.value) return null;
    
    loading.value = true;
    error.value = null;
    
    try {
      const response = await hmsApiClient.chat.sendMessage({
        roomId: selectedRoom.value.id,
        message,
        attachments
      });
      
      if (response.data.success) {
        // Add the new message to the list
        messages.value.push(response.data.data);
        return response.data.data;
      } else {
        error.value = response.data.message;
        return null;
      }
    } catch (err) {
      const apiError = processApiError(err);
      error.value = getErrorMessage(apiError);
      return null;
    } finally {
      loading.value = false;
    }
  };
  
  // Find users to chat with
  const findUsers = async (search: string) => {
    if (!search) return [];
    
    loading.value = true;
    error.value = null;
    
    try {
      const response = await hmsApiClient.chat.findUserToChat(search);
      
      if (response.data.success) {
        return response.data.data;
      } else {
        error.value = response.data.message;
        return [];
      }
    } catch (err) {
      const apiError = processApiError(err);
      error.value = getErrorMessage(apiError);
      return [];
    } finally {
      loading.value = false;
    }
  };
  
  // Start a new chat with a user
  const startChatWithUser = async (userId: number) => {
    loading.value = true;
    error.value = null;
    
    try {
      const response = await hmsApiClient.chat.getChatRoom(userId);
      
      if (response.data.success) {
        selectedRoom.value = response.data.data;
        await fetchMessages(response.data.data.id);
        
        // Update the chat rooms list
        await fetchChatRooms();
        
        return response.data.data;
      } else {
        error.value = response.data.message;
        return null;
      }
    } catch (err) {
      const apiError = processApiError(err);
      error.value = getErrorMessage(apiError);
      return null;
    } finally {
      loading.value = false;
    }
  };
  
  // Fetch chat rooms on mount
  onMounted(fetchChatRooms);
  
  // Computed properties
  const hasUnreadMessages = computed(() => {
    return chatRooms.value.some((room: any) => room.unreadCount > 0);
  });
  
  const totalUnreadCount = computed(() => {
    return chatRooms.value.reduce(
      (total: number, room: any) => total + (room.unreadCount || 0), 
      0
    );
  });
  
  return {
    chatRooms,
    selectedRoom,
    messages,
    loading,
    error,
    hasUnreadMessages,
    totalUnreadCount,
    fetchChatRooms,
    selectRoom,
    fetchMessages,
    sendMessage,
    findUsers,
    startChatWithUser
  };
}

/**
 * Usage example:
 * 
 * <script setup>
 * import { useItems } from '@/examples/composables';
 * 
 * const { 
 *   items, 
 *   loading, 
 *   error, 
 *   pagination,
 *   fetchItems,
 *   createItem, 
 *   updateItem, 
 *   deleteItem 
 * } = useItems({ status: 'active' });
 * 
 * const currentPage = ref(1);
 * 
 * // Fetch new page when currentPage changes
 * watch(currentPage, (newPage) => {
 *   fetchItems(newPage);
 * });
 * 
 * async function handleCreateItem(data) {
 *   const newItem = await createItem(data);
 *   if (newItem) {
 *     // Item created successfully
 *   }
 * }
 * </script>
 * 
 * <template>
 *   <div>
 *     <div v-if="loading">Loading...</div>
 *     <div v-else-if="error" class="error">{{ error }}</div>
 *     <div v-else>
 *       <h2>Items ({{ pagination.total }})</h2>
 *       
 *       <div class="items-list">
 *         <div v-for="item in items" :key="item.id" class="item">
 *           <h3>{{ item.name }}</h3>
 *           <p>{{ item.description }}</p>
 *           <div class="price">${{ item.price }}</div>
 *           
 *           <div class="actions">
 *             <button @click="handleUpdateItem(item.id, { status: 'inactive' })">
 *               Deactivate
 *             </button>
 *             <button @click="handleDeleteItem(item.id)">
 *               Delete
 *             </button>
 *           </div>
 *         </div>
 *       </div>
 *       
 *       <div class="pagination">
 *         <button 
 *           :disabled="currentPage === 1" 
 *           @click="currentPage--"
 *         >
 *           Previous
 *         </button>
 *         <span>{{ currentPage }} / {{ pagination.lastPage }}</span>
 *         <button 
 *           :disabled="currentPage === pagination.lastPage" 
 *           @click="currentPage++"
 *         >
 *           Next
 *         </button>
 *       </div>
 *     </div>
 *   </div>
 * </template>
 */
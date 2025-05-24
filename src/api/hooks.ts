/**
 * HMS API Hooks
 * 
 * This module provides React hooks for using the HMS API client in React applications.
 * These hooks make it easy to fetch data from the API with built-in loading, error handling, and caching.
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { hmsApiClient } from './hms-api-client';
import { ApiError, processApiError, getErrorMessage } from './error-handling';

/**
 * Generic state interface for API hooks
 */
interface ApiState<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
  rawError: ApiError | null;
}

/**
 * Hook for fetching data from the API
 * @param apiFn - Function that returns a promise from the API client
 * @param dependencies - Optional dependency array for refetching
 */
export function useApiQuery<T>(
  apiFn: () => Promise<{ data: { success: boolean; data: T; message: string } }>,
  dependencies: any[] = []
) {
  const [state, setState] = useState<ApiState<T>>({
    data: null,
    loading: true,
    error: null,
    rawError: null
  });

  const fetchData = useCallback(async () => {
    setState(prev => ({ ...prev, loading: true, error: null, rawError: null }));
    
    try {
      const response = await apiFn();
      
      if (response.data.success) {
        setState({
          data: response.data.data,
          loading: false,
          error: null,
          rawError: null
        });
      } else {
        setState({
          data: null,
          loading: false,
          error: response.data.message,
          rawError: null
        });
      }
    } catch (error) {
      const apiError = processApiError(error);
      setState({
        data: null,
        loading: false,
        error: getErrorMessage(apiError),
        rawError: apiError
      });
    }
  }, [apiFn, ...dependencies]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return {
    ...state,
    refetch: fetchData
  };
}

/**
 * Hook for mutation operations (create, update, delete)
 * @param mutationFn - Function that performs the mutation
 */
export function useApiMutation<T, P>(
  mutationFn: (params: P) => Promise<{ data: { success: boolean; data: T; message: string } }>
) {
  const [state, setState] = useState<ApiState<T> & { success: boolean }>({
    data: null,
    loading: false,
    error: null,
    rawError: null,
    success: false
  });

  const mountedRef = useRef(true);
  
  useEffect(() => {
    return () => {
      mountedRef.current = false;
    };
  }, []);

  const mutate = useCallback(async (params: P) => {
    if (!mountedRef.current) return null;
    
    setState(prev => ({ 
      ...prev, 
      loading: true, 
      error: null, 
      rawError: null, 
      success: false 
    }));
    
    try {
      const response = await mutationFn(params);
      
      if (!mountedRef.current) return null;
      
      if (response.data.success) {
        setState({
          data: response.data.data,
          loading: false,
          error: null,
          rawError: null,
          success: true
        });
        return response.data.data;
      } else {
        setState({
          data: null,
          loading: false,
          error: response.data.message,
          rawError: null,
          success: false
        });
        return null;
      }
    } catch (error) {
      if (!mountedRef.current) return null;
      
      const apiError = processApiError(error);
      setState({
        data: null,
        loading: false,
        error: getErrorMessage(apiError),
        rawError: apiError,
        success: false
      });
      return null;
    }
  }, [mutationFn]);

  return {
    ...state,
    mutate,
    reset: () => setState({
      data: null,
      loading: false,
      error: null,
      rawError: null,
      success: false
    })
  };
}

// Typed hooks for common API operations

/**
 * Hook for fetching a user by ID
 * @param userId - User ID
 * @param skip - Whether to skip the fetch
 */
export function useUser(userId: number, skip = false) {
  const [shouldFetch, setShouldFetch] = useState(!skip);
  
  useEffect(() => {
    setShouldFetch(!skip);
  }, [skip]);
  
  return useApiQuery(
    () => shouldFetch ? hmsApiClient.user.getUserById(userId) : Promise.reject('Skipped'),
    [userId, shouldFetch]
  );
}

/**
 * Hook for fetching the currently authenticated user
 */
export function useCurrentUser() {
  return useApiQuery(
    () => hmsApiClient.auth.getCurrentUser(),
    []
  );
}

/**
 * Hook for fetching items
 * @param options - Query options
 */
export function useItems(options: any = {}, skip = false) {
  const [shouldFetch, setShouldFetch] = useState(!skip);
  
  useEffect(() => {
    setShouldFetch(!skip);
  }, [skip]);
  
  return useApiQuery(
    () => shouldFetch ? hmsApiClient.items.getItems(options) : Promise.reject('Skipped'),
    [JSON.stringify(options), shouldFetch]
  );
}

/**
 * Hook for fetching a single item by ID
 * @param itemId - Item ID
 * @param skip - Whether to skip the fetch
 */
export function useItem(itemId: number, skip = false) {
  const [shouldFetch, setShouldFetch] = useState(!skip);
  
  useEffect(() => {
    setShouldFetch(!skip);
  }, [skip]);
  
  return useApiQuery(
    () => shouldFetch ? hmsApiClient.items.getItem(itemId) : Promise.reject('Skipped'),
    [itemId, shouldFetch]
  );
}

/**
 * Hook for creating an item
 */
export function useCreateItem() {
  return useApiMutation(
    (data) => hmsApiClient.items.createItem(data)
  );
}

/**
 * Hook for updating an item
 */
export function useUpdateItem() {
  return useApiMutation(
    ({ id, ...data }) => hmsApiClient.items.updateItem(id, data)
  );
}

/**
 * Hook for deleting an item
 */
export function useDeleteItem() {
  return useApiMutation(
    (id) => hmsApiClient.items.deleteItem(id)
  );
}

/**
 * Hook for fetching programs
 */
export function usePrograms(options: any = {}, skip = false) {
  const [shouldFetch, setShouldFetch] = useState(!skip);
  
  useEffect(() => {
    setShouldFetch(!skip);
  }, [skip]);
  
  return useApiQuery(
    () => shouldFetch ? 
      (options.featured ? 
        hmsApiClient.programs.getFeaturedPrograms() : 
        hmsApiClient.programs.getRecentPrograms()) : 
      Promise.reject('Skipped'),
    [JSON.stringify(options), shouldFetch]
  );
}

/**
 * Hook for searching programs
 */
export function useProgramSearch(query: string, categoryId?: number, skip = false) {
  const [shouldFetch, setShouldFetch] = useState(!skip && !!query);
  
  useEffect(() => {
    setShouldFetch(!skip && !!query);
  }, [skip, query]);
  
  return useApiQuery(
    () => shouldFetch ? 
      hmsApiClient.programs.searchPrograms(query, categoryId) : 
      Promise.reject('Skipped'),
    [query, categoryId, shouldFetch]
  );
}

/**
 * Hook for authentication
 */
export function useAuth() {
  const [isAuthenticated, setIsAuthenticated] = useState(() => 
    hmsApiClient.auth.isAuthenticated()
  );
  
  const login = useApiMutation(
    (credentials) => hmsApiClient.auth.login(credentials)
  );
  
  const register = useApiMutation(
    (data) => hmsApiClient.auth.register(data)
  );
  
  const currentUser = useCurrentUser();
  
  const logout = useCallback(async () => {
    try {
      await hmsApiClient.auth.logout();
      setIsAuthenticated(false);
      return true;
    } catch (error) {
      return false;
    }
  }, []);
  
  // Update authentication status when login/register/logout
  useEffect(() => {
    if (login.success || register.success) {
      setIsAuthenticated(true);
    }
  }, [login.success, register.success]);
  
  return {
    isAuthenticated,
    user: currentUser.data,
    userLoading: currentUser.loading,
    login: login.mutate,
    loginLoading: login.loading,
    loginError: login.error,
    register: register.mutate,
    registerLoading: register.loading,
    registerError: register.error,
    logout
  };
}

/**
 * Hook for chat functionality
 */
export function useChat() {
  const [selectedRoomId, setSelectedRoomId] = useState<number | null>(null);
  
  const chatRooms = useApiQuery(
    () => hmsApiClient.chat.getChatList(),
    []
  );
  
  const chatMessages = useApiQuery(
    () => selectedRoomId ? 
      hmsApiClient.chat.getMessages(selectedRoomId) : 
      Promise.reject('No room selected'),
    [selectedRoomId]
  );
  
  const sendMessage = useApiMutation(
    (data: { roomId: number; message: string; attachments?: File[] }) => 
      hmsApiClient.chat.sendMessage(data)
  );
  
  const refetchMessages = useCallback(() => {
    if (selectedRoomId) {
      chatMessages.refetch();
    }
  }, [selectedRoomId, chatMessages.refetch]);
  
  // Auto-refetch messages when sending was successful
  useEffect(() => {
    if (sendMessage.success) {
      refetchMessages();
    }
  }, [sendMessage.success, refetchMessages]);
  
  return {
    rooms: chatRooms.data || [],
    roomsLoading: chatRooms.loading,
    roomsError: chatRooms.error,
    refetchRooms: chatRooms.refetch,
    
    selectedRoomId,
    selectRoom: setSelectedRoomId,
    
    messages: chatMessages.data || [],
    messagesLoading: chatMessages.loading,
    messagesError: chatMessages.error,
    refetchMessages,
    
    sendMessage: sendMessage.mutate,
    sendingMessage: sendMessage.loading,
    sendMessageError: sendMessage.error
  };
}

/**
 * Usage example:
 * 
 * function ItemsList() {
 *   const { data: items, loading, error, refetch } = useItems({ status: 'active' });
 *   
 *   if (loading) return <div>Loading...</div>;
 *   if (error) return <div>Error: {error}</div>;
 *   
 *   return (
 *     <div>
 *       <h2>Items ({items?.length || 0})</h2>
 *       <button onClick={refetch}>Refresh</button>
 *       <ul>
 *         {items?.map(item => (
 *           <li key={item.id}>{item.name}</li>
 *         ))}
 *       </ul>
 *     </div>
 *   );
 * }
 * 
 * function CreateItemForm() {
 *   const { mutate: createItem, loading, error, success } = useCreateItem();
 *   const [name, setName] = useState('');
 *   const [price, setPrice] = useState('');
 *   
 *   const handleSubmit = async (e) => {
 *     e.preventDefault();
 *     await createItem({
 *       name,
 *       description: '',
 *       price: parseFloat(price),
 *       status: 'active'
 *     });
 *   };
 *   
 *   return (
 *     <form onSubmit={handleSubmit}>
 *       {success && <div>Item created successfully!</div>}
 *       {error && <div>Error: {error}</div>}
 *       
 *       <div>
 *         <label>Name:</label>
 *         <input type="text" value={name} onChange={e => setName(e.target.value)} />
 *       </div>
 *       
 *       <div>
 *         <label>Price:</label>
 *         <input type="number" value={price} onChange={e => setPrice(e.target.value)} />
 *       </div>
 *       
 *       <button type="submit" disabled={loading}>
 *         {loading ? 'Creating...' : 'Create Item'}
 *       </button>
 *     </form>
 *   );
 * }
 */
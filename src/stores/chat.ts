/**
 * Chat Store using Pinia
 * 
 * Manages chat state including rooms, messages, real-time updates, and user presence.
 * Provides reactive state management with WebSocket integration and message caching.
 */

import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { hmsApiClient } from '../api';
import { processApiError, getErrorMessage } from '../api/error-handling';

export interface ChatState {
  rooms: ChatRoom[];
  currentRoom: ChatRoom | null;
  messages: ChatMessage[];
  loading: boolean;
  error: string | null;
  onlineUsers: string[];
  typingUsers: Record<string, string[]>;
  unreadCounts: Record<string, number>;
  socket: WebSocket | null;
  connectionStatus: 'connecting' | 'connected' | 'disconnected' | 'error';
}

interface ChatRoom {
  id: number;
  name: string;
  type: 'direct' | 'group' | 'channel';
  participants: ChatParticipant[];
  lastMessage?: ChatMessage;
  updatedAt: string;
  unreadCount: number;
  avatar?: string;
  description?: string;
  isPrivate: boolean;
  settings: {
    notifications: boolean;
    pinned: boolean;
    archived: boolean;
  };
}

interface ChatParticipant {
  id: number;
  name: string;
  email: string;
  avatar?: string;
  role: 'admin' | 'moderator' | 'member';
  isOnline: boolean;
  lastSeen?: string;
}

interface ChatMessage {
  id: number;
  roomId: number;
  senderId: number;
  senderName: string;
  senderAvatar?: string;
  content: string;
  type: 'text' | 'image' | 'file' | 'system';
  attachments?: ChatAttachment[];
  replyTo?: number;
  mentions?: number[];
  reactions?: Record<string, number[]>;
  isEdited: boolean;
  editedAt?: string;
  createdAt: string;
  readBy: Record<number, string>;
}

interface ChatAttachment {
  id: number;
  name: string;
  type: string;
  size: number;
  url: string;
  thumbnail?: string;
}

interface SendMessageData {
  content: string;
  type?: 'text' | 'image' | 'file';
  attachments?: File[];
  replyTo?: number;
  mentions?: number[];
}

export const useChatStore = defineStore('chat', () => {
  // State
  const rooms = ref<ChatRoom[]>([]);
  const currentRoom = ref<ChatRoom | null>(null);
  const messages = ref<ChatMessage[]>([]);
  const loading = ref(false);
  const error = ref<string | null>(null);
  const onlineUsers = ref<string[]>([]);
  const typingUsers = ref<Record<string, string[]>>({});
  const unreadCounts = ref<Record<string, number>>({});
  const socket = ref<WebSocket | null>(null);
  const connectionStatus = ref<'connecting' | 'connected' | 'disconnected' | 'error'>('disconnected');

  // Getters
  const sortedRooms = computed(() => {
    return [...rooms.value].sort((a, b) => {
      // Pinned rooms first
      if (a.settings.pinned !== b.settings.pinned) {
        return a.settings.pinned ? -1 : 1;
      }
      
      // Then by last activity
      return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
    });
  });

  const totalUnreadCount = computed(() => {
    return Object.values(unreadCounts.value).reduce((total, count) => total + count, 0);
  });

  const currentRoomMessages = computed(() => {
    return messages.value.filter(msg => msg.roomId === currentRoom.value?.id);
  });

  const currentRoomParticipants = computed(() => {
    return currentRoom.value?.participants || [];
  });

  const isCurrentUserTyping = computed(() => {
    if (!currentRoom.value) return false;
    return typingUsers.value[currentRoom.value.id.toString()]?.length > 0;
  });

  // WebSocket management
  function connectWebSocket() {
    if (socket.value?.readyState === WebSocket.OPEN) return;

    connectionStatus.value = 'connecting';
    
    try {
      const wsUrl = process.env.VUE_APP_WS_URL || 'ws://localhost:8000/ws/chat';
      socket.value = new WebSocket(wsUrl);

      socket.value.onopen = () => {
        connectionStatus.value = 'connected';
        console.log('Chat WebSocket connected');
      };

      socket.value.onmessage = (event) => {
        handleWebSocketMessage(JSON.parse(event.data));
      };

      socket.value.onclose = () => {
        connectionStatus.value = 'disconnected';
        console.log('Chat WebSocket disconnected');
        // Attempt to reconnect after 3 seconds
        setTimeout(() => {
          if (connectionStatus.value === 'disconnected') {
            connectWebSocket();
          }
        }, 3000);
      };

      socket.value.onerror = (error) => {
        connectionStatus.value = 'error';
        console.error('Chat WebSocket error:', error);
      };
    } catch (err) {
      connectionStatus.value = 'error';
      console.error('Failed to connect WebSocket:', err);
    }
  }

  function disconnectWebSocket() {
    if (socket.value) {
      socket.value.close();
      socket.value = null;
    }
    connectionStatus.value = 'disconnected';
  }

  function handleWebSocketMessage(data: any) {
    switch (data.type) {
      case 'new_message':
        handleNewMessage(data.message);
        break;
      case 'message_updated':
        handleMessageUpdate(data.message);
        break;
      case 'message_deleted':
        handleMessageDelete(data.messageId);
        break;
      case 'user_typing':
        handleUserTyping(data.roomId, data.userId, data.userName);
        break;
      case 'user_stopped_typing':
        handleUserStoppedTyping(data.roomId, data.userId);
        break;
      case 'user_online':
        handleUserOnline(data.userId);
        break;
      case 'user_offline':
        handleUserOffline(data.userId);
        break;
      case 'room_updated':
        handleRoomUpdate(data.room);
        break;
    }
  }

  function handleNewMessage(message: ChatMessage) {
    // Add message to the list
    const existingIndex = messages.value.findIndex(m => m.id === message.id);
    if (existingIndex === -1) {
      messages.value.push(message);
      
      // Update room's last message
      const room = rooms.value.find(r => r.id === message.roomId);
      if (room) {
        room.lastMessage = message;
        room.updatedAt = message.createdAt;
        
        // Update unread count if not current room
        if (currentRoom.value?.id !== message.roomId) {
          unreadCounts.value[message.roomId] = (unreadCounts.value[message.roomId] || 0) + 1;
          room.unreadCount = unreadCounts.value[message.roomId];
        }
      }
    }
  }

  function handleMessageUpdate(updatedMessage: ChatMessage) {
    const index = messages.value.findIndex(m => m.id === updatedMessage.id);
    if (index !== -1) {
      messages.value[index] = updatedMessage;
    }
  }

  function handleMessageDelete(messageId: number) {
    const index = messages.value.findIndex(m => m.id === messageId);
    if (index !== -1) {
      messages.value.splice(index, 1);
    }
  }

  function handleUserTyping(roomId: number, userId: number, userName: string) {
    const roomKey = roomId.toString();
    if (!typingUsers.value[roomKey]) {
      typingUsers.value[roomKey] = [];
    }
    
    if (!typingUsers.value[roomKey].includes(userName)) {
      typingUsers.value[roomKey].push(userName);
    }
  }

  function handleUserStoppedTyping(roomId: number, userId: number) {
    const roomKey = roomId.toString();
    if (typingUsers.value[roomKey]) {
      const room = rooms.value.find(r => r.id === roomId);
      const participant = room?.participants.find(p => p.id === userId);
      if (participant) {
        const index = typingUsers.value[roomKey].indexOf(participant.name);
        if (index !== -1) {
          typingUsers.value[roomKey].splice(index, 1);
        }
      }
    }
  }

  function handleUserOnline(userId: string) {
    if (!onlineUsers.value.includes(userId)) {
      onlineUsers.value.push(userId);
    }
    
    // Update participant status in rooms
    rooms.value.forEach(room => {
      const participant = room.participants.find(p => p.id.toString() === userId);
      if (participant) {
        participant.isOnline = true;
      }
    });
  }

  function handleUserOffline(userId: string) {
    const index = onlineUsers.value.indexOf(userId);
    if (index !== -1) {
      onlineUsers.value.splice(index, 1);
    }
    
    // Update participant status in rooms
    rooms.value.forEach(room => {
      const participant = room.participants.find(p => p.id.toString() === userId);
      if (participant) {
        participant.isOnline = false;
        participant.lastSeen = new Date().toISOString();
      }
    });
  }

  function handleRoomUpdate(updatedRoom: ChatRoom) {
    const index = rooms.value.findIndex(r => r.id === updatedRoom.id);
    if (index !== -1) {
      rooms.value[index] = updatedRoom;
      if (currentRoom.value?.id === updatedRoom.id) {
        currentRoom.value = updatedRoom;
      }
    }
  }

  // Actions
  async function fetchRooms() {
    loading.value = true;
    error.value = null;

    try {
      const response = await hmsApiClient.chat.getChatList();

      if (response.data.success) {
        rooms.value = response.data.data;
        
        // Initialize unread counts
        rooms.value.forEach(room => {
          unreadCounts.value[room.id] = room.unreadCount;
        });

        return rooms.value;
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
  }

  async function selectRoom(roomId: number) {
    loading.value = true;
    error.value = null;

    try {
      // Find room in local state
      const room = rooms.value.find(r => r.id === roomId);
      if (!room) {
        throw new Error('Room not found');
      }

      currentRoom.value = room;

      // Fetch messages for the room
      const response = await hmsApiClient.chat.getMessages(roomId);

      if (response.data.success) {
        // Filter messages for this room (in case we have mixed messages)
        const roomMessages = response.data.data.filter((msg: ChatMessage) => msg.roomId === roomId);
        
        // Replace messages for this room
        messages.value = messages.value.filter(m => m.roomId !== roomId).concat(roomMessages);

        // Mark room as read
        unreadCounts.value[roomId] = 0;
        room.unreadCount = 0;

        // Mark messages as read on server
        await markRoomAsRead(roomId);

        return roomMessages;
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
  }

  async function sendMessage(messageData: SendMessageData) {
    if (!currentRoom.value) return null;

    loading.value = true;
    error.value = null;

    // Create optimistic message
    const optimisticMessage: ChatMessage = {
      id: Date.now(), // Temporary ID
      roomId: currentRoom.value.id,
      senderId: 0, // Will be set by server
      senderName: 'You',
      content: messageData.content,
      type: messageData.type || 'text',
      attachments: [],
      isEdited: false,
      createdAt: new Date().toISOString(),
      readBy: {},
      replyTo: messageData.replyTo,
      mentions: messageData.mentions
    };

    // Add optimistic message
    messages.value.push(optimisticMessage);

    try {
      const response = await hmsApiClient.chat.sendMessage({
        roomId: currentRoom.value.id,
        ...messageData
      });

      if (response.data.success) {
        const actualMessage = response.data.data;
        
        // Replace optimistic message with actual message
        const index = messages.value.findIndex(m => m.id === optimisticMessage.id);
        if (index !== -1) {
          messages.value[index] = actualMessage;
        }

        // Update room's last message
        const room = rooms.value.find(r => r.id === currentRoom.value!.id);
        if (room) {
          room.lastMessage = actualMessage;
          room.updatedAt = actualMessage.createdAt;
        }

        return actualMessage;
      } else {
        // Remove optimistic message on failure
        const index = messages.value.findIndex(m => m.id === optimisticMessage.id);
        if (index !== -1) {
          messages.value.splice(index, 1);
        }
        
        error.value = response.data.message;
        return null;
      }
    } catch (err) {
      // Remove optimistic message on error
      const index = messages.value.findIndex(m => m.id === optimisticMessage.id);
      if (index !== -1) {
        messages.value.splice(index, 1);
      }
      
      const apiError = processApiError(err);
      error.value = getErrorMessage(apiError);
      return null;
    } finally {
      loading.value = false;
    }
  }

  async function editMessage(messageId: number, newContent: string) {
    const messageIndex = messages.value.findIndex(m => m.id === messageId);
    if (messageIndex === -1) return false;

    const originalContent = messages.value[messageIndex].content;
    
    // Optimistic update
    messages.value[messageIndex].content = newContent;
    messages.value[messageIndex].isEdited = true;
    messages.value[messageIndex].editedAt = new Date().toISOString();

    try {
      const response = await hmsApiClient.chat.editMessage(messageId, newContent);

      if (response.data.success) {
        // Update with server response
        messages.value[messageIndex] = response.data.data;
        return true;
      } else {
        // Revert on failure
        messages.value[messageIndex].content = originalContent;
        messages.value[messageIndex].isEdited = false;
        delete messages.value[messageIndex].editedAt;
        
        error.value = response.data.message;
        return false;
      }
    } catch (err) {
      // Revert on error
      messages.value[messageIndex].content = originalContent;
      messages.value[messageIndex].isEdited = false;
      delete messages.value[messageIndex].editedAt;
      
      const apiError = processApiError(err);
      error.value = getErrorMessage(apiError);
      return false;
    }
  }

  async function deleteMessage(messageId: number) {
    const messageIndex = messages.value.findIndex(m => m.id === messageId);
    if (messageIndex === -1) return false;

    const originalMessage = { ...messages.value[messageIndex] };
    
    // Optimistic removal
    messages.value.splice(messageIndex, 1);

    try {
      const response = await hmsApiClient.chat.deleteMessage(messageId);

      if (response.data.success) {
        return true;
      } else {
        // Revert on failure
        messages.value.splice(messageIndex, 0, originalMessage);
        error.value = response.data.message;
        return false;
      }
    } catch (err) {
      // Revert on error
      messages.value.splice(messageIndex, 0, originalMessage);
      const apiError = processApiError(err);
      error.value = getErrorMessage(apiError);
      return false;
    }
  }

  async function markRoomAsRead(roomId: number) {
    try {
      await hmsApiClient.chat.markAsRead(roomId);
      return true;
    } catch (err) {
      console.error('Failed to mark room as read:', err);
      return false;
    }
  }

  async function createRoom(name: string, type: 'direct' | 'group' | 'channel', participantIds: number[]) {
    loading.value = true;
    error.value = null;

    try {
      const response = await hmsApiClient.chat.createRoom({
        name,
        type,
        participantIds
      });

      if (response.data.success) {
        const newRoom = response.data.data;
        rooms.value.unshift(newRoom);
        return newRoom;
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
  }

  async function searchUsers(query: string) {
    if (!query) return [];

    try {
      const response = await hmsApiClient.chat.findUserToChat(query);

      if (response.data.success) {
        return response.data.data;
      } else {
        return [];
      }
    } catch (err) {
      console.error('Failed to search users:', err);
      return [];
    }
  }

  function sendTypingIndicator() {
    if (socket.value?.readyState === WebSocket.OPEN && currentRoom.value) {
      socket.value.send(JSON.stringify({
        type: 'typing',
        roomId: currentRoom.value.id
      }));
    }
  }

  function stopTypingIndicator() {
    if (socket.value?.readyState === WebSocket.OPEN && currentRoom.value) {
      socket.value.send(JSON.stringify({
        type: 'stop_typing',
        roomId: currentRoom.value.id
      }));
    }
  }

  function clearError() {
    error.value = null;
  }

  function clearCurrentRoom() {
    currentRoom.value = null;
  }

  // Initialize chat
  function initializeChat() {
    connectWebSocket();
    return fetchRooms();
  }

  // Cleanup
  function cleanup() {
    disconnectWebSocket();
    rooms.value = [];
    currentRoom.value = null;
    messages.value = [];
    onlineUsers.value = [];
    typingUsers.value = {};
    unreadCounts.value = {};
  }

  return {
    // State
    rooms,
    currentRoom,
    messages,
    loading,
    error,
    onlineUsers,
    typingUsers,
    unreadCounts,
    connectionStatus,
    
    // Getters
    sortedRooms,
    totalUnreadCount,
    currentRoomMessages,
    currentRoomParticipants,
    isCurrentUserTyping,
    
    // Actions
    fetchRooms,
    selectRoom,
    sendMessage,
    editMessage,
    deleteMessage,
    markRoomAsRead,
    createRoom,
    searchUsers,
    sendTypingIndicator,
    stopTypingIndicator,
    clearError,
    clearCurrentRoom,
    initializeChat,
    cleanup,
    
    // WebSocket
    connectWebSocket,
    disconnectWebSocket
  };
});
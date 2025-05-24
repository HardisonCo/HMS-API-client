/**
 * HMS API TypeScript Client Library
 *
 * This client library provides type-safe access to all HMS API endpoints
 * organized by modules and functionality.
 */
import axios from 'axios';
/**
 * Item status enum
 */
export var ItemStatus;
(function (ItemStatus) {
    ItemStatus["ACTIVE"] = "active";
    ItemStatus["INACTIVE"] = "inactive";
    ItemStatus["PENDING"] = "pending";
    ItemStatus["DELETED"] = "deleted";
})(ItemStatus || (ItemStatus = {}));
/**
 * Program status enum
 */
export var ProgramStatus;
(function (ProgramStatus) {
    ProgramStatus["DRAFT"] = "draft";
    ProgramStatus["PUBLISHED"] = "published";
    ProgramStatus["ARCHIVED"] = "archived";
})(ProgramStatus || (ProgramStatus = {}));
/**
 * Protocol status enum
 */
export var ProtocolStatus;
(function (ProtocolStatus) {
    ProtocolStatus["DRAFT"] = "draft";
    ProtocolStatus["ACTIVE"] = "active";
    ProtocolStatus["INACTIVE"] = "inactive";
})(ProtocolStatus || (ProtocolStatus = {}));
// =================== BASE API CLIENT =====================
/**
 * Base API Client class
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
// =================== MODULE-SPECIFIC API CLIENTS =====================
/**
 * Authentication API Client
 */
export class AuthApiClient extends BaseApiClient {
    /**
     * Login with email and password
     * @param data - Login credentials
     */
    async login(data) {
        const response = await this.client.post('/auth/sign-in', data);
        if (response.data.success && response.data.data.token) {
            // Store the token
            localStorage.setItem('auth_token', response.data.data.token);
        }
        return response;
    }
    /**
     * Register a new user
     * @param data - Registration data
     */
    async register(data) {
        const response = await this.client.post('/auth/sign-up', data);
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
            const response = await this.client.get('/logout');
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
        return this.client.get('/user/get-data');
    }
    /**
     * Request password reset
     * @param data - Password reset request data
     */
    async requestPasswordReset(data) {
        return this.client.post('/auth/reset', data);
    }
    /**
     * Set new password
     * @param data - New password data
     */
    async setNewPassword(data) {
        return this.client.post('/auth/new-password', data);
    }
    /**
     * Check if the user is authenticated
     */
    isAuthenticated() {
        return !!localStorage.getItem('auth_token');
    }
}
/**
 * User API Client
 */
export class UserApiClient extends BaseApiClient {
    /**
     * Update user profile
     * @param userId - User ID
     * @param data - Profile update data
     */
    async updateProfile(userId, data) {
        return this.client.patch(`/users/update/${userId}`, data);
    }
    /**
     * Update billing information
     * @param data - Billing information
     */
    async updateBillingInfo(data) {
        return this.client.patch('/users/update-billing-info', data);
    }
    /**
     * Update phone number
     * @param phone - Phone number
     */
    async updatePhone(phone) {
        return this.client.patch('/users/update-phone', { phone });
    }
    /**
     * Update password
     * @param userId - User ID
     * @param currentPassword - Current password
     * @param newPassword - New password
     * @param newPasswordConfirmation - New password confirmation
     */
    async updatePassword(userId, currentPassword, newPassword, newPasswordConfirmation) {
        return this.client.patch(`/users/update-password/${userId}`, {
            current_password: currentPassword,
            password: newPassword,
            password_confirmation: newPasswordConfirmation
        });
    }
    /**
     * Upload profile photo
     * @param userId - User ID
     * @param photo - Photo file
     */
    async uploadProfilePhoto(userId, photo) {
        const formData = new FormData();
        formData.append('photo', photo);
        return this.client.post(`/users/change-photo/${userId}`, formData, {
            headers: {
                'Content-Type': 'multipart/form-data'
            }
        });
    }
    /**
     * Upload cover photo
     * @param userId - User ID
     * @param cover - Cover photo file
     */
    async uploadCoverPhoto(userId, cover) {
        const formData = new FormData();
        formData.append('cover', cover);
        return this.client.post(`/users/change-cover/${userId}`, formData, {
            headers: {
                'Content-Type': 'multipart/form-data'
            }
        });
    }
    /**
     * Get user by username
     * @param username - Username
     */
    async getUserByUsername(username) {
        return this.client.get(`/users/name/${username}`);
    }
    /**
     * Get user by ID
     * @param userId - User ID
     */
    async getUserById(userId) {
        return this.client.get(`/users/id/${userId}`);
    }
    /**
     * Search for users
     * @param query - Search query
     */
    async searchUsers(query) {
        return this.client.get(`/users/find/${query}`);
    }
    /**
     * Delete account
     * @param userId - User ID
     */
    async deleteAccount(userId) {
        return this.client.delete(`/users/delete/${userId}`);
    }
    /**
     * Get user wallet balance
     */
    async getWalletBalance() {
        return this.client.get('/user/get-wallet');
    }
}
/**
 * Team API Client
 */
export class TeamApiClient extends BaseApiClient {
    /**
     * Get all team members
     */
    async getAllMembers() {
        return this.client.get('/team/all');
    }
    /**
     * Get team members by status
     * @param status - Member status
     */
    async getMembersByStatus(status) {
        return this.client.get(`/team/list/${status}`);
    }
    /**
     * Get invites
     */
    async getInvites() {
        return this.client.get('/team/member/pending');
    }
    /**
     * Invite team member
     * @param data - Invite data
     */
    async inviteMember(data) {
        return this.client.post('/team/invite', data);
    }
    /**
     * Invite network member
     * @param userId - User ID
     * @param role - Role
     */
    async inviteNetworkMember(userId, role) {
        return this.client.post('/team/network-invite', { user_id: userId, role });
    }
    /**
     * Search network members
     * @param query - Search query
     */
    async searchNetworkMembers(query) {
        return this.client.post('/team/network-search', { search: query });
    }
    /**
     * Accept invite
     * @param inviteId - Invite ID
     */
    async acceptInvite(inviteId) {
        return this.client.post('/team/accept', { invite_id: inviteId });
    }
    /**
     * Reject invite
     * @param inviteId - Invite ID
     */
    async rejectInvite(inviteId) {
        return this.client.post('/team/reject', { invite_id: inviteId });
    }
    /**
     * Leave team
     * @param teamId - Team ID
     */
    async leaveTeam(teamId) {
        return this.client.post('/team/leave', { team_id: teamId });
    }
    /**
     * Remove member
     * @param memberId - Member ID
     */
    async removeMember(memberId) {
        return this.client.post('/team/remove', { member_id: memberId });
    }
    /**
     * Get invite by token
     * @param token - Invite token
     */
    async getInviteByToken(token) {
        return this.client.get(`/public/team/get-invite/${token}`);
    }
    /**
     * Accept invite by token
     * @param token - Invite token
     */
    async acceptInviteByToken(token) {
        return this.client.get(`/team/accept-invite/${token}`);
    }
    /**
     * Reject invite by token
     * @param token - Invite token
     */
    async rejectInviteByToken(token) {
        return this.client.delete(`/public/team/reject-invite/${token}`);
    }
}
/**
 * Items API Client
 */
export class ItemsApiClient extends BaseApiClient {
    /**
     * Get all items
     * @param params - Query parameters
     */
    async getItems(params) {
        return this.client.get('/items', { params });
    }
    /**
     * Get item by ID
     * @param id - Item ID
     */
    async getItem(id) {
        return this.client.get(`/items/${id}`);
    }
    /**
     * Create item
     * @param data - Item data
     */
    async createItem(data) {
        return this.client.post('/items', data);
    }
    /**
     * Update item
     * @param id - Item ID
     * @param data - Item data
     */
    async updateItem(id, data) {
        return this.client.put(`/items/${id}`, data);
    }
    /**
     * Delete item
     * @param id - Item ID
     */
    async deleteItem(id) {
        return this.client.delete(`/items/${id}`);
    }
    /**
     * Search items
     * @param search - Search query
     * @param type - Item type
     */
    async searchItems(search, type) {
        return this.client.get(`/items/find-item/${search}/${type}`);
    }
    /**
     * Get food categories
     */
    async getFoodCategories() {
        return this.client.get('/items/food-categories');
    }
    /**
     * Get all item collections
     */
    async getCollections() {
        return this.client.get('/collection-list');
    }
    /**
     * Get collection by ID
     * @param id - Collection ID
     */
    async getCollection(id) {
        return this.client.get(`/collection/${id}`);
    }
    /**
     * Create collection
     * @param data - Collection data
     */
    async createCollection(data) {
        return this.client.post('/collection', data);
    }
    /**
     * Add item to collection
     * @param collectionId - Collection ID
     * @param itemId - Item ID
     */
    async addItemToCollection(collectionId, itemId) {
        return this.client.post('/collection-item', { collection_id: collectionId, item_id: itemId });
    }
    /**
     * Remove item from collection
     * @param itemId - Collection item ID
     */
    async removeItemFromCollection(itemId) {
        return this.client.delete(`/collection-item/${itemId}`);
    }
}
/**
 * Programs API Client
 */
export class ProgramsApiClient extends BaseApiClient {
    /**
     * Get featured programs
     */
    async getFeaturedPrograms() {
        return this.client.get('/home/featured-programs');
    }
    /**
     * Get recent programs
     */
    async getRecentPrograms() {
        return this.client.get('/home/most-recent-programs');
    }
    /**
     * Get program by ID
     * @param id - Program ID
     */
    async getProgram(id) {
        return this.client.get(`/public/get-program/${id}`);
    }
    /**
     * Get program feedback
     * @param id - Program ID
     */
    async getProgramFeedback(id) {
        return this.client.get(`/public/get-program-feedback/${id}`);
    }
    /**
     * Search programs
     * @param query - Search query
     * @param category - Category ID
     */
    async searchPrograms(query, category) {
        return this.client.post('/program/search', { query, category });
    }
    /**
     * Get programs by user
     * @param userId - User ID
     */
    async getUserPrograms(userId) {
        return this.client.get(`/public/get-user-feed/${userId}`);
    }
    /**
     * Get featured programs by user
     * @param userId - User ID
     */
    async getUserFeaturedPrograms(userId) {
        return this.client.get(`/public/get-user-featured/${userId}`);
    }
    /**
     * Toggle program bookmark
     * @param programId - Program ID
     */
    async toggleBookmark(programId) {
        return this.client.post('/program/toggle-bookmark', { program_id: programId });
    }
    /**
     * Get bookmarked programs
     */
    async getBookmarks() {
        return this.client.get('/program/get-bookmarks');
    }
    /**
     * Get program categories
     */
    async getCategories() {
        return this.client.get('/public/get-program-categories');
    }
}
/**
 * Protocol API Client
 */
export class ProtocolApiClient extends BaseApiClient {
    /**
     * Get protocol by ID
     * @param id - Protocol ID
     */
    async getProtocol(id) {
        return this.client.get(`/protocol/${id}`);
    }
    /**
     * Get protocols by category
     * @param categoryId - Category ID
     */
    async getProtocolsByCategory(categoryId) {
        const endpoint = categoryId ? `/protocol/by-category/${categoryId}` : '/protocol/by-category';
        return this.client.get(endpoint);
    }
    /**
     * Get available protocol modules
     * @param recurring - Get recurring modules only
     */
    async getModules(recurring) {
        const endpoint = recurring ? '/protocol/modules/1' : '/protocol/modules';
        return this.client.get(endpoint);
    }
    /**
     * Get protocol steps
     * @param protocolId - Protocol ID
     */
    async getProtocolSteps(protocolId) {
        return this.client.get(`/protocol/get-steps/${protocolId}`);
    }
    /**
     * Get protocol categories
     */
    async getCategories() {
        return this.client.get('/protocol-category/all');
    }
}
/**
 * KPI API Client
 */
export class KPIApiClient extends BaseApiClient {
    /**
     * Get user devices
     */
    async getUserDevices() {
        return this.client.get('/user-devices/list');
    }
    /**
     * Redirect to Withings for authentication
     */
    async authorizeWithings() {
        return this.client.get('/withings/auth');
    }
    /**
     * Get KPI setup for a chain
     * @param chainId - Chain ID
     * @param protocolId - Protocol ID
     */
    async getKPISetup(chainId, protocolId) {
        return this.client.get(`/kpi/get-setup/${chainId}/${protocolId}`);
    }
    /**
     * Save KPI setup
     * @param data - KPI setup data
     */
    async saveKPISetup(data) {
        return this.client.post('/kpi/save-setup', data);
    }
    /**
     * Remove KPI rule
     * @param ruleId - Rule ID
     */
    async removeKPIRule(ruleId) {
        return this.client.delete(`/kpi/remove-rule/${ruleId}`);
    }
    /**
     * Save round results
     * @param data - Round results data
     */
    async saveRoundResults(data) {
        return this.client.post('/kpi/save-round-results', data);
    }
}
/**
 * Chat API Client
 */
export class ChatApiClient extends BaseApiClient {
    /**
     * Get chat list
     * @param search - Search query
     */
    async getChatList(search) {
        const endpoint = search ? `/chat/get-list/${search}` : '/chat/get-list';
        return this.client.get(endpoint);
    }
    /**
     * Get chat room
     * @param userId - User ID (to create or get a 1:1 chat)
     */
    async getChatRoom(userId) {
        return this.client.post('/chat/get-room', { user_id: userId });
    }
    /**
     * Get chat room by ID
     * @param roomId - Room ID
     */
    async getChatRoomById(roomId) {
        return this.client.get(`/chat/get-room-by-id/${roomId}`);
    }
    /**
     * Get messages for a chat
     * @param chatId - Chat ID
     * @param search - Search query
     */
    async getMessages(chatId, search) {
        const endpoint = search ? `/chat/messages/${chatId}/${search}` : `/chat/messages/${chatId}`;
        return this.client.get(endpoint);
    }
    /**
     * Send message
     * @param data - Message data
     */
    async sendMessage(data) {
        if (data.attachments && data.attachments.length > 0) {
            const formData = new FormData();
            formData.append('room_id', data.roomId.toString());
            formData.append('message', data.message);
            data.attachments.forEach((attachment, index) => {
                formData.append(`attachments[${index}]`, attachment);
            });
            return this.client.post('/chat/send-message', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data'
                }
            });
        }
        return this.client.post('/chat/send-message', {
            room_id: data.roomId,
            message: data.message
        });
    }
    /**
     * Find user to chat with
     * @param search - Search query
     */
    async findUserToChat(search) {
        return this.client.get(`/chat/find-user/${search}`);
    }
    /**
     * Delete message
     * @param messageId - Message ID
     */
    async deleteMessage(messageId) {
        return this.client.delete(`/chat/delete-message/${messageId}`);
    }
    /**
     * Delete chat
     * @param chatId - Chat ID
     */
    async deleteChat(chatId) {
        return this.client.delete(`/chat/delete-сhat/${chatId}`);
    }
}
/**
 * Notification API Client
 */
export class NotificationApiClient extends BaseApiClient {
    /**
     * Get notifications
     */
    async getNotifications() {
        return this.client.get('/notification/get');
    }
    /**
     * Get unread notifications count
     */
    async getUnreadCount() {
        return this.client.get('/notification/get-unread');
    }
    /**
     * Delete notification
     * @param notificationId - Notification ID
     */
    async deleteNotification(notificationId) {
        return this.client.delete(`/notification/delete-notification/${notificationId}`);
    }
}
/**
 * Stripe API Client
 */
export class StripeApiClient extends BaseApiClient {
    /**
     * Connect to Stripe
     */
    async connectToStripe() {
        return this.client.get('/stripe/connect');
    }
    /**
     * Withdraw money
     */
    async withdrawMoney() {
        return this.client.get('/stripe/withdraw');
    }
    /**
     * Get transactions
     */
    async getTransactions() {
        return this.client.get('/stripe/transactions');
    }
    /**
     * Check Stripe account
     */
    async checkAccount() {
        return this.client.get('/stripe/check-account');
    }
    /**
     * Delete Stripe account
     */
    async deleteAccount() {
        return this.client.delete('/stripe/delete-account');
    }
}
/**
 * Payment API Client
 */
export class PaymentApiClient extends BaseApiClient {
    /**
     * Get payment history for subscriptions
     */
    async getSubscriptionPayments() {
        return this.client.get('/payment/subscriptions');
    }
    /**
     * Get payment history for program purchases
     */
    async getProgramPurchases() {
        return this.client.get('/payment/program-purchases');
    }
    /**
     * Get purchased items
     */
    async getPurchasedItems() {
        return this.client.get('/payment/purchased-items');
    }
    /**
     * Setup payment method
     */
    async setupPaymentMethod() {
        return this.client.get('/payment/setup-payment-method');
    }
    /**
     * Save payment method
     * @param paymentMethodId - Payment method ID
     */
    async savePaymentMethod(paymentMethodId) {
        return this.client.post('/payment/save-payment-method', { payment_method_id: paymentMethodId });
    }
    /**
     * Get payment methods
     */
    async getPaymentMethods() {
        return this.client.get('/payment/get-payment-method');
    }
    /**
     * Delete payment method
     * @param paymentMethodId - Payment method ID
     */
    async deletePaymentMethod(paymentMethodId) {
        return this.client.delete(`/payment/delete-payment-method/${paymentMethodId}`);
    }
}
// =================== COMBINED API CLIENT =====================
/**
 * Factory function to create a complete HMS API client
 * @param config - API client configuration
 */
export function createHmsApiClient(config) {
    return {
        auth: new AuthApiClient(config),
        user: new UserApiClient(config),
        team: new TeamApiClient(config),
        items: new ItemsApiClient(config),
        programs: new ProgramsApiClient(config),
        protocols: new ProtocolApiClient(config),
        kpi: new KPIApiClient(config),
        chat: new ChatApiClient(config),
        notifications: new NotificationApiClient(config),
        stripe: new StripeApiClient(config),
        payment: new PaymentApiClient(config)
    };
}
// Create a default client instance
export const hmsApiClient = createHmsApiClient({
    baseURL: typeof window !== 'undefined' ?
        (window.location.hostname === 'localhost' ? 'http://localhost:8000/api' : '/api') :
        'https://api.hms-platform.com/api'
});
//# sourceMappingURL=hms-api-client.js.map
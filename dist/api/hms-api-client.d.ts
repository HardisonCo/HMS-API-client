/**
 * HMS API TypeScript Client Library
 *
 * This client library provides type-safe access to all HMS API endpoints
 * organized by modules and functionality.
 */
import { AxiosInstance, AxiosResponse } from 'axios';
/**
 * Base API response structure
 */
export interface ApiResponse<T = any> {
    success: boolean;
    message: string;
    data: T;
    meta?: ApiMetaData;
}
/**
 * Metadata included in API responses
 */
export interface ApiMetaData {
    timestamp: string;
    apiVersion: string;
}
/**
 * Configuration options for the API client
 */
export interface ApiClientConfig {
    baseURL: string;
    timeout?: number;
    withCredentials?: boolean;
    headers?: Record<string, string>;
}
/**
 * Generic Error interface for API Errors
 */
export interface ApiError {
    message: string;
    errors?: Record<string, string[]>;
    code?: string;
}
/**
 * Pagination data
 */
export interface PaginationData {
    currentPage: number;
    lastPage: number;
    perPage: number;
    total: number;
}
/**
 * Paginated response wrapper
 */
export interface PaginatedResponse<T> {
    items: T[];
    pagination: PaginationData;
}
/**
 * User data
 */
export interface UserData {
    id: number;
    name: string;
    email: string;
    roles: string[];
    createdAt: string;
    updatedAt: string;
    profileData?: {
        photoUrl?: string;
        coverUrl?: string;
        bio?: string;
        phone?: string;
        timezone?: string;
    };
}
/**
 * Authentication data
 */
export interface AuthData {
    token: string;
    user: UserData;
    expiresAt: string;
}
/**
 * Login credentials
 */
export interface LoginData {
    email: string;
    password: string;
    rememberMe?: boolean;
}
/**
 * Registration data
 */
export interface RegisterData {
    name: string;
    email: string;
    password: string;
    password_confirmation: string;
    terms: boolean;
}
/**
 * Password reset request
 */
export interface PasswordResetRequest {
    email: string;
}
/**
 * New password submission
 */
export interface NewPasswordRequest {
    email: string;
    token: string;
    password: string;
    password_confirmation: string;
}
/**
 * Profile update data
 */
export interface ProfileUpdateData {
    name?: string;
    bio?: string;
    phone?: string;
    timezone?: string;
}
/**
 * Billing information
 */
export interface BillingInfo {
    billingName?: string;
    billingAddress?: string;
    billingCity?: string;
    billingState?: string;
    billingZip?: string;
    billingCountry?: string;
}
/**
 * Team member data
 */
export interface TeamMemberData {
    id: number;
    name: string;
    email: string;
    role: string;
    status: string;
    joinedAt?: string;
    photoUrl?: string;
}
/**
 * Team invite data
 */
export interface TeamInviteData {
    id: number;
    email: string;
    name?: string;
    role: string;
    status: string;
    token: string;
    expiresAt: string;
}
/**
 * Team invite request
 */
export interface TeamInviteRequest {
    email: string;
    name?: string;
    role: string;
    message?: string;
}
/**
 * Item data
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
 * Item collection data
 */
export interface ItemCollectionData {
    id: number;
    name: string;
    description: string;
    items: ItemData[];
    createdAt: string;
    updatedAt: string;
}
/**
 * Item status enum
 */
export declare enum ItemStatus {
    ACTIVE = "active",
    INACTIVE = "inactive",
    PENDING = "pending",
    DELETED = "deleted"
}
/**
 * Food data
 */
export interface FoodData {
    id: number;
    name: string;
    description: string | null;
    protein: number | null;
    carbs: number | null;
    fat: number | null;
    calories: number | null;
    categoryId: number | null;
    createdAt: string | null;
    updatedAt: string | null;
}
/**
 * Food category
 */
export interface FoodCategory {
    id: number;
    name: string;
    description: string | null;
}
/**
 * Program data
 */
export interface ProgramData {
    id: number;
    name: string;
    description: string;
    imageUrl?: string;
    status: ProgramStatus;
    price: number;
    authorId: number;
    author: UserData;
    categoryId: number;
    category: CategoryData;
    createdAt: string;
    updatedAt: string;
}
/**
 * Program status enum
 */
export declare enum ProgramStatus {
    DRAFT = "draft",
    PUBLISHED = "published",
    ARCHIVED = "archived"
}
/**
 * Category data
 */
export interface CategoryData {
    id: number;
    name: string;
    description: string | null;
    parentId: number | null;
}
/**
 * Program feedback
 */
export interface ProgramFeedback {
    id: number;
    userId: number;
    programId: number;
    rating: number;
    comment: string;
    createdAt: string;
    user: {
        name: string;
        photoUrl?: string;
    };
}
/**
 * Protocol data
 */
export interface ProtocolData {
    id: number;
    name: string;
    description: string;
    status: ProtocolStatus;
    categoryId: number;
    category: CategoryData;
    createdAt: string;
    updatedAt: string;
}
/**
 * Protocol status enum
 */
export declare enum ProtocolStatus {
    DRAFT = "draft",
    ACTIVE = "active",
    INACTIVE = "inactive"
}
/**
 * Protocol module data
 */
export interface ProtocolModuleData {
    id: number;
    name: string;
    type: string;
    description: string;
    settings: Record<string, any>;
}
/**
 * User device data
 */
export interface UserDeviceData {
    id: number;
    userId: number;
    deviceType: string;
    deviceId: string;
    name: string;
    status: string;
    lastSyncAt: string | null;
    createdAt: string;
    updatedAt: string;
}
/**
 * KPI setup data
 */
export interface KPISetupData {
    id: number;
    protocolId: number;
    chainId: number;
    parameters: Record<string, any>;
    rules: KPIRuleData[];
}
/**
 * KPI rule data
 */
export interface KPIRuleData {
    id: number;
    setupId: number;
    parameter: string;
    operator: string;
    value: string;
    action: string;
}
/**
 * Chat room data
 */
export interface ChatRoomData {
    id: number;
    type: string;
    participants: UserData[];
    lastMessage: ChatMessageData | null;
    unreadCount: number;
    createdAt: string;
    updatedAt: string;
}
/**
 * Chat message data
 */
export interface ChatMessageData {
    id: number;
    roomId: number;
    userId: number;
    message: string;
    attachments: any[];
    readAt: string | null;
    createdAt: string;
    updatedAt: string;
    user: {
        id: number;
        name: string;
        photoUrl?: string;
    };
}
/**
 * New message request
 */
export interface NewMessageRequest {
    roomId: number;
    message: string;
    attachments?: File[];
}
/**
 * Base API Client class
 */
export declare class BaseApiClient {
    protected readonly client: AxiosInstance;
    constructor(config: ApiClientConfig);
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
     * Register a new user
     * @param data - Registration data
     */
    register(data: RegisterData): Promise<AxiosResponse<ApiResponse<AuthData>>>;
    /**
     * Logout the current user
     */
    logout(): Promise<AxiosResponse<ApiResponse<null>>>;
    /**
     * Get the currently authenticated user
     */
    getCurrentUser(): Promise<AxiosResponse<ApiResponse<UserData>>>;
    /**
     * Request password reset
     * @param data - Password reset request data
     */
    requestPasswordReset(data: PasswordResetRequest): Promise<AxiosResponse<ApiResponse<null>>>;
    /**
     * Set new password
     * @param data - New password data
     */
    setNewPassword(data: NewPasswordRequest): Promise<AxiosResponse<ApiResponse<null>>>;
    /**
     * Check if the user is authenticated
     */
    isAuthenticated(): boolean;
}
/**
 * User API Client
 */
export declare class UserApiClient extends BaseApiClient {
    /**
     * Update user profile
     * @param userId - User ID
     * @param data - Profile update data
     */
    updateProfile(userId: number, data: ProfileUpdateData): Promise<AxiosResponse<ApiResponse<UserData>>>;
    /**
     * Update billing information
     * @param data - Billing information
     */
    updateBillingInfo(data: BillingInfo): Promise<AxiosResponse<ApiResponse<null>>>;
    /**
     * Update phone number
     * @param phone - Phone number
     */
    updatePhone(phone: string): Promise<AxiosResponse<ApiResponse<null>>>;
    /**
     * Update password
     * @param userId - User ID
     * @param currentPassword - Current password
     * @param newPassword - New password
     * @param newPasswordConfirmation - New password confirmation
     */
    updatePassword(userId: number, currentPassword: string, newPassword: string, newPasswordConfirmation: string): Promise<AxiosResponse<ApiResponse<null>>>;
    /**
     * Upload profile photo
     * @param userId - User ID
     * @param photo - Photo file
     */
    uploadProfilePhoto(userId: number, photo: File): Promise<AxiosResponse<ApiResponse<{
        photoUrl: string;
    }>>>;
    /**
     * Upload cover photo
     * @param userId - User ID
     * @param cover - Cover photo file
     */
    uploadCoverPhoto(userId: number, cover: File): Promise<AxiosResponse<ApiResponse<{
        coverUrl: string;
    }>>>;
    /**
     * Get user by username
     * @param username - Username
     */
    getUserByUsername(username: string): Promise<AxiosResponse<ApiResponse<UserData>>>;
    /**
     * Get user by ID
     * @param userId - User ID
     */
    getUserById(userId: number): Promise<AxiosResponse<ApiResponse<UserData>>>;
    /**
     * Search for users
     * @param query - Search query
     */
    searchUsers(query: string): Promise<AxiosResponse<ApiResponse<UserData[]>>>;
    /**
     * Delete account
     * @param userId - User ID
     */
    deleteAccount(userId: number): Promise<AxiosResponse<ApiResponse<null>>>;
    /**
     * Get user wallet balance
     */
    getWalletBalance(): Promise<AxiosResponse<ApiResponse<{
        balance: number;
        currency: string;
    }>>>;
}
/**
 * Team API Client
 */
export declare class TeamApiClient extends BaseApiClient {
    /**
     * Get all team members
     */
    getAllMembers(): Promise<AxiosResponse<ApiResponse<TeamMemberData[]>>>;
    /**
     * Get team members by status
     * @param status - Member status
     */
    getMembersByStatus(status: string): Promise<AxiosResponse<ApiResponse<TeamMemberData[]>>>;
    /**
     * Get invites
     */
    getInvites(): Promise<AxiosResponse<ApiResponse<TeamInviteData[]>>>;
    /**
     * Invite team member
     * @param data - Invite data
     */
    inviteMember(data: TeamInviteRequest): Promise<AxiosResponse<ApiResponse<TeamInviteData>>>;
    /**
     * Invite network member
     * @param userId - User ID
     * @param role - Role
     */
    inviteNetworkMember(userId: number, role: string): Promise<AxiosResponse<ApiResponse<TeamInviteData>>>;
    /**
     * Search network members
     * @param query - Search query
     */
    searchNetworkMembers(query: string): Promise<AxiosResponse<ApiResponse<UserData[]>>>;
    /**
     * Accept invite
     * @param inviteId - Invite ID
     */
    acceptInvite(inviteId: number): Promise<AxiosResponse<ApiResponse<null>>>;
    /**
     * Reject invite
     * @param inviteId - Invite ID
     */
    rejectInvite(inviteId: number): Promise<AxiosResponse<ApiResponse<null>>>;
    /**
     * Leave team
     * @param teamId - Team ID
     */
    leaveTeam(teamId: number): Promise<AxiosResponse<ApiResponse<null>>>;
    /**
     * Remove member
     * @param memberId - Member ID
     */
    removeMember(memberId: number): Promise<AxiosResponse<ApiResponse<null>>>;
    /**
     * Get invite by token
     * @param token - Invite token
     */
    getInviteByToken(token: string): Promise<AxiosResponse<ApiResponse<TeamInviteData>>>;
    /**
     * Accept invite by token
     * @param token - Invite token
     */
    acceptInviteByToken(token: string): Promise<AxiosResponse<ApiResponse<null>>>;
    /**
     * Reject invite by token
     * @param token - Invite token
     */
    rejectInviteByToken(token: string): Promise<AxiosResponse<ApiResponse<null>>>;
}
/**
 * Items API Client
 */
export declare class ItemsApiClient extends BaseApiClient {
    /**
     * Get all items
     * @param params - Query parameters
     */
    getItems(params?: {
        status?: ItemStatus;
        page?: number;
        perPage?: number;
    }): Promise<AxiosResponse<ApiResponse<PaginatedResponse<ItemData>>>>;
    /**
     * Get item by ID
     * @param id - Item ID
     */
    getItem(id: number): Promise<AxiosResponse<ApiResponse<ItemData>>>;
    /**
     * Create item
     * @param data - Item data
     */
    createItem(data: Omit<ItemData, 'id' | 'createdAt' | 'updatedAt'>): Promise<AxiosResponse<ApiResponse<ItemData>>>;
    /**
     * Update item
     * @param id - Item ID
     * @param data - Item data
     */
    updateItem(id: number, data: Partial<Omit<ItemData, 'id' | 'createdAt' | 'updatedAt'>>): Promise<AxiosResponse<ApiResponse<ItemData>>>;
    /**
     * Delete item
     * @param id - Item ID
     */
    deleteItem(id: number): Promise<AxiosResponse<ApiResponse<null>>>;
    /**
     * Search items
     * @param search - Search query
     * @param type - Item type
     */
    searchItems(search: string, type: string): Promise<AxiosResponse<ApiResponse<ItemData[]>>>;
    /**
     * Get food categories
     */
    getFoodCategories(): Promise<AxiosResponse<ApiResponse<FoodCategory[]>>>;
    /**
     * Get all item collections
     */
    getCollections(): Promise<AxiosResponse<ApiResponse<ItemCollectionData[]>>>;
    /**
     * Get collection by ID
     * @param id - Collection ID
     */
    getCollection(id: number): Promise<AxiosResponse<ApiResponse<ItemCollectionData>>>;
    /**
     * Create collection
     * @param data - Collection data
     */
    createCollection(data: {
        name: string;
        description: string;
    }): Promise<AxiosResponse<ApiResponse<ItemCollectionData>>>;
    /**
     * Add item to collection
     * @param collectionId - Collection ID
     * @param itemId - Item ID
     */
    addItemToCollection(collectionId: number, itemId: number): Promise<AxiosResponse<ApiResponse<null>>>;
    /**
     * Remove item from collection
     * @param itemId - Collection item ID
     */
    removeItemFromCollection(itemId: number): Promise<AxiosResponse<ApiResponse<null>>>;
}
/**
 * Programs API Client
 */
export declare class ProgramsApiClient extends BaseApiClient {
    /**
     * Get featured programs
     */
    getFeaturedPrograms(): Promise<AxiosResponse<ApiResponse<ProgramData[]>>>;
    /**
     * Get recent programs
     */
    getRecentPrograms(): Promise<AxiosResponse<ApiResponse<ProgramData[]>>>;
    /**
     * Get program by ID
     * @param id - Program ID
     */
    getProgram(id: number): Promise<AxiosResponse<ApiResponse<ProgramData>>>;
    /**
     * Get program feedback
     * @param id - Program ID
     */
    getProgramFeedback(id: number): Promise<AxiosResponse<ApiResponse<ProgramFeedback[]>>>;
    /**
     * Search programs
     * @param query - Search query
     * @param category - Category ID
     */
    searchPrograms(query: string, category?: number): Promise<AxiosResponse<ApiResponse<ProgramData[]>>>;
    /**
     * Get programs by user
     * @param userId - User ID
     */
    getUserPrograms(userId: number): Promise<AxiosResponse<ApiResponse<ProgramData[]>>>;
    /**
     * Get featured programs by user
     * @param userId - User ID
     */
    getUserFeaturedPrograms(userId: number): Promise<AxiosResponse<ApiResponse<ProgramData[]>>>;
    /**
     * Toggle program bookmark
     * @param programId - Program ID
     */
    toggleBookmark(programId: number): Promise<AxiosResponse<ApiResponse<{
        bookmarked: boolean;
    }>>>;
    /**
     * Get bookmarked programs
     */
    getBookmarks(): Promise<AxiosResponse<ApiResponse<ProgramData[]>>>;
    /**
     * Get program categories
     */
    getCategories(): Promise<AxiosResponse<ApiResponse<CategoryData[]>>>;
}
/**
 * Protocol API Client
 */
export declare class ProtocolApiClient extends BaseApiClient {
    /**
     * Get protocol by ID
     * @param id - Protocol ID
     */
    getProtocol(id: number): Promise<AxiosResponse<ApiResponse<ProtocolData>>>;
    /**
     * Get protocols by category
     * @param categoryId - Category ID
     */
    getProtocolsByCategory(categoryId?: number): Promise<AxiosResponse<ApiResponse<ProtocolData[]>>>;
    /**
     * Get available protocol modules
     * @param recurring - Get recurring modules only
     */
    getModules(recurring?: boolean): Promise<AxiosResponse<ApiResponse<ProtocolModuleData[]>>>;
    /**
     * Get protocol steps
     * @param protocolId - Protocol ID
     */
    getProtocolSteps(protocolId: number): Promise<AxiosResponse<ApiResponse<any[]>>>;
    /**
     * Get protocol categories
     */
    getCategories(): Promise<AxiosResponse<ApiResponse<CategoryData[]>>>;
}
/**
 * KPI API Client
 */
export declare class KPIApiClient extends BaseApiClient {
    /**
     * Get user devices
     */
    getUserDevices(): Promise<AxiosResponse<ApiResponse<UserDeviceData[]>>>;
    /**
     * Redirect to Withings for authentication
     */
    authorizeWithings(): Promise<AxiosResponse<ApiResponse<{
        redirectUrl: string;
    }>>>;
    /**
     * Get KPI setup for a chain
     * @param chainId - Chain ID
     * @param protocolId - Protocol ID
     */
    getKPISetup(chainId: number, protocolId: number): Promise<AxiosResponse<ApiResponse<KPISetupData>>>;
    /**
     * Save KPI setup
     * @param data - KPI setup data
     */
    saveKPISetup(data: Omit<KPISetupData, 'id' | 'rules'>): Promise<AxiosResponse<ApiResponse<KPISetupData>>>;
    /**
     * Remove KPI rule
     * @param ruleId - Rule ID
     */
    removeKPIRule(ruleId: number): Promise<AxiosResponse<ApiResponse<null>>>;
    /**
     * Save round results
     * @param data - Round results data
     */
    saveRoundResults(data: any): Promise<AxiosResponse<ApiResponse<null>>>;
}
/**
 * Chat API Client
 */
export declare class ChatApiClient extends BaseApiClient {
    /**
     * Get chat list
     * @param search - Search query
     */
    getChatList(search?: string): Promise<AxiosResponse<ApiResponse<ChatRoomData[]>>>;
    /**
     * Get chat room
     * @param userId - User ID (to create or get a 1:1 chat)
     */
    getChatRoom(userId: number): Promise<AxiosResponse<ApiResponse<ChatRoomData>>>;
    /**
     * Get chat room by ID
     * @param roomId - Room ID
     */
    getChatRoomById(roomId: number): Promise<AxiosResponse<ApiResponse<ChatRoomData>>>;
    /**
     * Get messages for a chat
     * @param chatId - Chat ID
     * @param search - Search query
     */
    getMessages(chatId: number, search?: string): Promise<AxiosResponse<ApiResponse<ChatMessageData[]>>>;
    /**
     * Send message
     * @param data - Message data
     */
    sendMessage(data: NewMessageRequest): Promise<AxiosResponse<ApiResponse<ChatMessageData>>>;
    /**
     * Find user to chat with
     * @param search - Search query
     */
    findUserToChat(search: string): Promise<AxiosResponse<ApiResponse<UserData[]>>>;
    /**
     * Delete message
     * @param messageId - Message ID
     */
    deleteMessage(messageId: number): Promise<AxiosResponse<ApiResponse<null>>>;
    /**
     * Delete chat
     * @param chatId - Chat ID
     */
    deleteChat(chatId: number): Promise<AxiosResponse<ApiResponse<null>>>;
}
/**
 * Notification API Client
 */
export declare class NotificationApiClient extends BaseApiClient {
    /**
     * Get notifications
     */
    getNotifications(): Promise<AxiosResponse<ApiResponse<any[]>>>;
    /**
     * Get unread notifications count
     */
    getUnreadCount(): Promise<AxiosResponse<ApiResponse<{
        count: number;
    }>>>;
    /**
     * Delete notification
     * @param notificationId - Notification ID
     */
    deleteNotification(notificationId: number): Promise<AxiosResponse<ApiResponse<null>>>;
}
/**
 * Stripe API Client
 */
export declare class StripeApiClient extends BaseApiClient {
    /**
     * Connect to Stripe
     */
    connectToStripe(): Promise<AxiosResponse<ApiResponse<{
        redirectUrl: string;
    }>>>;
    /**
     * Withdraw money
     */
    withdrawMoney(): Promise<AxiosResponse<ApiResponse<any>>>;
    /**
     * Get transactions
     */
    getTransactions(): Promise<AxiosResponse<ApiResponse<any[]>>>;
    /**
     * Check Stripe account
     */
    checkAccount(): Promise<AxiosResponse<ApiResponse<{
        connected: boolean;
        accountId?: string;
    }>>>;
    /**
     * Delete Stripe account
     */
    deleteAccount(): Promise<AxiosResponse<ApiResponse<null>>>;
}
/**
 * Payment API Client
 */
export declare class PaymentApiClient extends BaseApiClient {
    /**
     * Get payment history for subscriptions
     */
    getSubscriptionPayments(): Promise<AxiosResponse<ApiResponse<any[]>>>;
    /**
     * Get payment history for program purchases
     */
    getProgramPurchases(): Promise<AxiosResponse<ApiResponse<any[]>>>;
    /**
     * Get purchased items
     */
    getPurchasedItems(): Promise<AxiosResponse<ApiResponse<any[]>>>;
    /**
     * Setup payment method
     */
    setupPaymentMethod(): Promise<AxiosResponse<ApiResponse<{
        clientSecret: string;
    }>>>;
    /**
     * Save payment method
     * @param paymentMethodId - Payment method ID
     */
    savePaymentMethod(paymentMethodId: string): Promise<AxiosResponse<ApiResponse<null>>>;
    /**
     * Get payment methods
     */
    getPaymentMethods(): Promise<AxiosResponse<ApiResponse<any[]>>>;
    /**
     * Delete payment method
     * @param paymentMethodId - Payment method ID
     */
    deletePaymentMethod(paymentMethodId: string): Promise<AxiosResponse<ApiResponse<null>>>;
}
/**
 * Factory function to create a complete HMS API client
 * @param config - API client configuration
 */
export declare function createHmsApiClient(config: ApiClientConfig): {
    auth: AuthApiClient;
    user: UserApiClient;
    team: TeamApiClient;
    items: ItemsApiClient;
    programs: ProgramsApiClient;
    protocols: ProtocolApiClient;
    kpi: KPIApiClient;
    chat: ChatApiClient;
    notifications: NotificationApiClient;
    stripe: StripeApiClient;
    payment: PaymentApiClient;
};
export declare const hmsApiClient: {
    auth: AuthApiClient;
    user: UserApiClient;
    team: TeamApiClient;
    items: ItemsApiClient;
    programs: ProgramsApiClient;
    protocols: ProtocolApiClient;
    kpi: KPIApiClient;
    chat: ChatApiClient;
    notifications: NotificationApiClient;
    stripe: StripeApiClient;
    payment: PaymentApiClient;
};
//# sourceMappingURL=hms-api-client.d.ts.map
/**
 * Vue Router Configuration
 * 
 * Defines application routes with advanced features like guards, lazy loading,
 * meta properties, and dynamic route generation.
 */

import { createRouter, createWebHistory, type RouteRecordRaw } from 'vue-router';
import { useAuthStore } from '../stores/auth';
import { useNotificationStore } from '../stores/notifications';

// Lazy load components for better performance
const Dashboard = () => import('../views/Dashboard.vue');
const Login = () => import('../views/auth/Login.vue');
const Register = () => import('../views/auth/Register.vue');
const Profile = () => import('../views/auth/Profile.vue');
const Items = () => import('../views/items/Items.vue');
const ItemDetail = () => import('../views/items/ItemDetail.vue');
const ItemCreate = () => import('../views/items/ItemCreate.vue');
const ItemEdit = () => import('../views/items/ItemEdit.vue');
const Chat = () => import('../views/chat/Chat.vue');
const Wizard = () => import('../views/wizard/Wizard.vue');
const WizardHistory = () => import('../views/wizard/WizardHistory.vue');
const Settings = () => import('../views/Settings.vue');
const NotFound = () => import('../views/NotFound.vue');

// Advanced layout components
const AppLayout = () => import('../layouts/AppLayout.vue');
const AuthLayout = () => import('../layouts/AuthLayout.vue');
const FullscreenLayout = () => import('../layouts/FullscreenLayout.vue');

const routes: RouteRecordRaw[] = [
  // Public routes with auth layout
  {
    path: '/auth',
    component: AuthLayout,
    meta: { requiresGuest: true },
    children: [
      {
        path: 'login',
        name: 'Login',
        component: Login,
        meta: {
          title: 'Sign In',
          description: 'Sign in to your HMS account'
        }
      },
      {
        path: 'register',
        name: 'Register',
        component: Register,
        meta: {
          title: 'Create Account',
          description: 'Create a new HMS account'
        }
      }
    ]
  },

  // Redirect root to dashboard
  {
    path: '/',
    redirect: '/dashboard'
  },

  // Main application routes with app layout
  {
    path: '/app',
    component: AppLayout,
    meta: { requiresAuth: true },
    children: [
      {
        path: 'dashboard',
        name: 'Dashboard',
        component: Dashboard,
        meta: {
          title: 'Dashboard',
          description: 'HMS Dashboard Overview',
          icon: 'dashboard',
          showInSidebar: true
        }
      },
      {
        path: 'profile',
        name: 'Profile',
        component: Profile,
        meta: {
          title: 'Profile',
          description: 'Manage your profile settings'
        }
      },
      {
        path: 'items',
        name: 'Items',
        component: Items,
        meta: {
          title: 'Items',
          description: 'Manage items in the system',
          icon: 'inventory',
          showInSidebar: true,
          permissions: ['view_items']
        }
      },
      {
        path: 'items/create',
        name: 'ItemCreate',
        component: ItemCreate,
        meta: {
          title: 'Create Item',
          description: 'Create a new item',
          breadcrumb: [
            { name: 'Items', to: '/app/items' },
            { name: 'Create' }
          ],
          permissions: ['create_items']
        }
      },
      {
        path: 'items/:id',
        name: 'ItemDetail',
        component: ItemDetail,
        props: true,
        meta: {
          title: 'Item Details',
          description: 'View item details',
          breadcrumb: [
            { name: 'Items', to: '/app/items' },
            { name: 'Details' }
          ],
          permissions: ['view_items']
        }
      },
      {
        path: 'items/:id/edit',
        name: 'ItemEdit',
        component: ItemEdit,
        props: true,
        meta: {
          title: 'Edit Item',
          description: 'Edit item details',
          breadcrumb: [
            { name: 'Items', to: '/app/items' },
            { name: 'Edit' }
          ],
          permissions: ['edit_items']
        }
      },
      {
        path: 'chat',
        name: 'Chat',
        component: Chat,
        meta: {
          title: 'Chat',
          description: 'Communication and messaging',
          icon: 'chat',
          showInSidebar: true,
          permissions: ['use_chat']
        }
      },
      {
        path: 'wizard',
        name: 'Wizard',
        component: Wizard,
        meta: {
          title: 'Five-Step Wizard',
          description: 'Problem-solving wizard',
          icon: 'wizard',
          showInSidebar: true
        }
      },
      {
        path: 'wizard/history',
        name: 'WizardHistory',
        component: WizardHistory,
        meta: {
          title: 'Wizard History',
          description: 'View previous wizard sessions',
          breadcrumb: [
            { name: 'Wizard', to: '/app/wizard' },
            { name: 'History' }
          ]
        }
      },
      {
        path: 'settings',
        name: 'Settings',
        component: Settings,
        meta: {
          title: 'Settings',
          description: 'Application settings and preferences',
          icon: 'settings',
          showInSidebar: true
        }
      }
    ]
  },

  // Fullscreen routes (wizard, chat in fullscreen mode)
  {
    path: '/fullscreen',
    component: FullscreenLayout,
    meta: { requiresAuth: true },
    children: [
      {
        path: 'wizard/:id?',
        name: 'FullscreenWizard',
        component: Wizard,
        props: true,
        meta: {
          title: 'Wizard - Fullscreen',
          hideNavigation: true
        }
      },
      {
        path: 'chat/:roomId?',
        name: 'FullscreenChat',
        component: Chat,
        props: true,
        meta: {
          title: 'Chat - Fullscreen',
          hideNavigation: true
        }
      }
    ]
  },

  // Legacy routes (redirect to new structure)
  {
    path: '/dashboard',
    redirect: '/app/dashboard'
  },
  {
    path: '/items',
    redirect: '/app/items'
  },
  {
    path: '/chat',
    redirect: '/app/chat'
  },
  {
    path: '/wizard',
    redirect: '/app/wizard'
  },
  {
    path: '/login',
    redirect: '/auth/login'
  },
  {
    path: '/register',
    redirect: '/auth/register'
  },

  // 404 catch-all
  {
    path: '/:pathMatch(.*)*',
    name: 'NotFound',
    component: NotFound,
    meta: {
      title: 'Page Not Found',
      layout: 'minimal'
    }
  }
];

const router = createRouter({
  history: createWebHistory(),
  routes,
  scrollBehavior(to, from, savedPosition) {
    if (savedPosition) {
      return savedPosition;
    } else if (to.hash) {
      return {
        el: to.hash,
        behavior: 'smooth'
      };
    } else {
      return { top: 0 };
    }
  }
});

// Navigation guards
router.beforeEach(async (to, from, next) => {
  const authStore = useAuthStore();
  const notificationStore = useNotificationStore();

  // Initialize auth if not already done
  if (!authStore.isAuthenticated && !authStore.loading) {
    await authStore.initializeAuth();
  }

  // Check authentication requirements
  if (to.meta.requiresAuth && !authStore.isAuthenticated) {
    notificationStore.warning('Authentication Required', 'Please sign in to access this page.');
    next({
      name: 'Login',
      query: { redirect: to.fullPath }
    });
    return;
  }

  // Check guest-only routes
  if (to.meta.requiresGuest && authStore.isAuthenticated) {
    next('/dashboard');
    return;
  }

  // Check permissions
  if (to.meta.permissions && Array.isArray(to.meta.permissions)) {
    const hasPermission = to.meta.permissions.every(permission => 
      authStore.hasPermission(permission)
    );
    
    if (!hasPermission) {
      notificationStore.error('Access Denied', 'You do not have permission to access this page.');
      next('/dashboard');
      return;
    }
  }

  // Check role requirements
  if (to.meta.roles && Array.isArray(to.meta.roles)) {
    const hasRole = to.meta.roles.some(role => authStore.hasRole(role));
    
    if (!hasRole) {
      notificationStore.error('Access Denied', 'Your role does not allow access to this page.');
      next('/dashboard');
      return;
    }
  }

  // Handle session expiry
  if (authStore.isAuthenticated && authStore.isSessionExpired) {
    const refreshed = await authStore.refreshSession();
    if (!refreshed) {
      notificationStore.warning('Session Expired', 'Your session has expired. Please sign in again.');
      next({
        name: 'Login',
        query: { redirect: to.fullPath }
      });
      return;
    }
  }

  next();
});

router.afterEach((to, from) => {
  // Update document title
  const title = to.meta.title || 'HMS';
  document.title = `${title} | HMS`;

  // Update meta description
  const description = to.meta.description || 'HMS Application';
  const metaDescription = document.querySelector('meta[name="description"]');
  if (metaDescription) {
    metaDescription.setAttribute('content', description);
  }

  // Track page views (you can integrate analytics here)
  if (typeof gtag !== 'undefined') {
    gtag('config', 'GA_MEASUREMENT_ID', {
      page_title: title,
      page_location: window.location.href
    });
  }

  // Clear any loading states
  const authStore = useAuthStore();
  if (authStore.loading) {
    authStore.loading = false;
  }
});

// Error handling
router.onError((error) => {
  console.error('Router error:', error);
  
  const notificationStore = useNotificationStore();
  notificationStore.error('Navigation Error', 'An error occurred while navigating. Please try again.');
});

// Route helper functions
export function generateBreadcrumb(route: any) {
  const breadcrumb = [];
  
  if (route.meta.breadcrumb) {
    breadcrumb.push(...route.meta.breadcrumb);
  } else {
    // Auto-generate breadcrumb from route hierarchy
    const pathSegments = route.path.split('/').filter(Boolean);
    let currentPath = '';
    
    pathSegments.forEach((segment, index) => {
      currentPath += `/${segment}`;
      
      if (index === pathSegments.length - 1) {
        // Current page
        breadcrumb.push({
          name: route.meta.title || segment,
          current: true
        });
      } else {
        // Parent pages
        breadcrumb.push({
          name: segment.charAt(0).toUpperCase() + segment.slice(1),
          to: currentPath
        });
      }
    });
  }
  
  return breadcrumb;
}

export function getSidebarRoutes() {
  return routes
    .filter(route => route.meta?.showInSidebar)
    .map(route => ({
      name: route.name,
      path: route.path,
      title: route.meta?.title,
      icon: route.meta?.icon,
      permissions: route.meta?.permissions
    }));
}

export function canAccessRoute(route: any, authStore: any) {
  // Check authentication
  if (route.meta?.requiresAuth && !authStore.isAuthenticated) {
    return false;
  }

  // Check permissions
  if (route.meta?.permissions) {
    const hasPermission = route.meta.permissions.every((permission: string) => 
      authStore.hasPermission(permission)
    );
    if (!hasPermission) return false;
  }

  // Check roles
  if (route.meta?.roles) {
    const hasRole = route.meta.roles.some((role: string) => authStore.hasRole(role));
    if (!hasRole) return false;
  }

  return true;
}

export default router;

// Type augmentation for route meta
declare module 'vue-router' {
  interface RouteMeta {
    title?: string;
    description?: string;
    icon?: string;
    requiresAuth?: boolean;
    requiresGuest?: boolean;
    permissions?: string[];
    roles?: string[];
    showInSidebar?: boolean;
    breadcrumb?: Array<{ name: string; to?: string; current?: boolean }>;
    layout?: string;
    hideNavigation?: boolean;
  }
}
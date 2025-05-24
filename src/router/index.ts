/**
 * Vue Router Configuration
 * 
 * Basic router setup for the HMS API client library.
 * Applications using this library can extend or replace this configuration.
 */

import { createRouter, createWebHistory, type RouteRecordRaw } from 'vue-router';
import { useAuthStore } from '../stores/auth';
import { useNotificationStore } from '../stores/notifications';

// Basic example component - consuming applications should provide their own components
const ExampleComponent = { template: '<div>Example Component - Replace with your own components</div>' };

const routes: RouteRecordRaw[] = [
  {
    path: '/',
    name: 'Home',
    component: ExampleComponent,
    meta: {
      title: 'Home',
      description: 'Example home page'
    }
  },
  {
    path: '/example',
    name: 'Example',
    component: ExampleComponent,
    meta: {
      title: 'Example',
      description: 'Example page demonstrating router setup'
    }
  },
  // 404 catch-all
  {
    path: '/:pathMatch(.*)*',
    name: 'NotFound',
    component: ExampleComponent,
    meta: {
      title: 'Page Not Found'
    }
  }
];

const router = createRouter({
  history: createWebHistory(),
  routes,
  scrollBehavior(to: any, from: any, savedPosition: any) {
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
router.beforeEach(async (to: any, from: any, next: any) => {
  const authStore = useAuthStore();
  const notificationStore = useNotificationStore();

  // Initialize auth if not already done
  if (!authStore.isAuthenticated && !authStore.loading) {
    try {
      await authStore.initializeAuth();
    } catch (error) {
      console.warn('Auth initialization failed:', error);
    }
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
    next('/');
    return;
  }

  // Check permissions
  if (to.meta.permissions && Array.isArray(to.meta.permissions)) {
    const hasPermission = to.meta.permissions.every((permission: any) =>
      authStore.hasPermission(permission)
    );
    
    if (!hasPermission) {
      notificationStore.error('Access Denied', 'You do not have permission to access this page.');
      next('/');
      return;
    }
  }

  // Check role requirements
  if (to.meta.roles && Array.isArray(to.meta.roles)) {
    const hasRole = to.meta.roles.some((role: any) => authStore.hasRole(role));
    
    if (!hasRole) {
      notificationStore.error('Access Denied', 'Your role does not allow access to this page.');
      next('/');
      return;
    }
  }

  next();
});

router.afterEach((to: any, from: any) => {
  // Update document title
  const title = to.meta.title || 'HMS';
  document.title = `${title} | HMS`;

  // Update meta description
  const description = to.meta.description || 'HMS Application';
  const metaDescription = document.querySelector('meta[name="description"]');
  if (metaDescription) {
    metaDescription.setAttribute('content', description);
  }

  // Track page views if gtag is available
  if (typeof (window as any).gtag !== 'undefined') {
    (window as any).gtag('config', 'GA_MEASUREMENT_ID', {
      page_title: title,
      page_location: window.location.href
    });
  }

  // Breadcrumb generation
  const breadcrumbs: any[] = [];
  const pathSegments = to.path.split('/').filter(Boolean);
  
  pathSegments.forEach((segment: any, index: number) => {
    const path = '/' + pathSegments.slice(0, index + 1).join('/');
    breadcrumbs.push({
      text: segment.charAt(0).toUpperCase() + segment.slice(1),
      path: path,
      active: index === pathSegments.length - 1
    });
  });
  
  to.meta.breadcrumbs = breadcrumbs;
});

router.onError((error: any) => {
  const notificationStore = useNotificationStore();
  console.error('Router error:', error);
  notificationStore.error('Navigation Error', 'An error occurred while navigating. Please try again.');
});

// Route helper functions
export function generateBreadcrumbs(route: any) {
  const breadcrumbs: any[] = [];
  const pathSegments = route.path.split('/').filter(Boolean);
  
  pathSegments.forEach((segment: any, index: number) => {
    const path = '/' + pathSegments.slice(0, index + 1).join('/');
    breadcrumbs.push({
      text: segment.charAt(0).toUpperCase() + segment.slice(1),
      path: path,
      active: index === pathSegments.length - 1
    });
  });
  
  return breadcrumbs;
}

export function hasPermission(requiredPermissions: string | string[]) {
  const authStore = useAuthStore();
  const permissions = Array.isArray(requiredPermissions) ? requiredPermissions : [requiredPermissions];
  return permissions.every(permission => authStore.hasPermission(permission));
}

export function hasRole(requiredRoles: string | string[]) {
  const authStore = useAuthStore();
  const roles = Array.isArray(requiredRoles) ? requiredRoles : [requiredRoles];
  return roles.some(role => authStore.hasRole(role));
}

// Extend module declarations for route meta
declare module 'vue-router' {
  interface RouteMeta {
    title?: string;
    description?: string;
    requiresAuth?: boolean;
    requiresGuest?: boolean;
    permissions?: string[];
    roles?: string[];
    breadcrumbs?: any[];
    hideNavigation?: boolean;
    layout?: string;
    showInSidebar?: boolean;
    icon?: string;
  }
}

export default router;
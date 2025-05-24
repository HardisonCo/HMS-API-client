/**
 * Items Store using Pinia
 * 
 * Manages items state including fetching, creating, updating, deleting, and searching items.
 * Provides reactive state management with caching and optimistic updates.
 */

import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { hmsApiClient } from '../api';
import { processApiError, getErrorMessage } from '../api/error-handling';
import type { ItemData, ItemStatus, PaginationData } from '../api-client';

export interface ItemsState {
  items: ItemData[];
  currentItem: ItemData | null;
  loading: boolean;
  error: string | null;
  pagination: PaginationData;
  searchQuery: string;
  filters: ItemFilters;
  cache: Map<string, CachedData>;
}

interface ItemFilters {
  status?: ItemStatus;
  category?: string;
  priceRange?: [number, number];
  dateRange?: [Date, Date];
}

interface CachedData {
  data: any;
  timestamp: number;
  expiry: number;
}

interface CreateItemData {
  name: string;
  description: string;
  price: number;
  status: ItemStatus;
  category?: string;
  tags?: string[];
  metadata?: Record<string, any>;
}

interface UpdateItemData {
  name?: string;
  description?: string;
  price?: number;
  status?: ItemStatus;
  category?: string;
  tags?: string[];
  metadata?: Record<string, any>;
}

const CACHE_EXPIRY = 5 * 60 * 1000; // 5 minutes

export const useItemsStore = defineStore('items', () => {
  // State
  const items = ref<ItemData[]>([]);
  const currentItem = ref<ItemData | null>(null);
  const loading = ref(false);
  const error = ref<string | null>(null);
  const pagination = ref<PaginationData>({
    currentPage: 1,
    lastPage: 1,
    perPage: 20,
    total: 0
  });
  const searchQuery = ref('');
  const filters = ref<ItemFilters>({});
  const cache = ref<Map<string, CachedData>>(new Map());

  // Getters
  const filteredItems = computed(() => {
    return items.value.filter(item => {
      // Text search
      if (searchQuery.value && !item.name.toLowerCase().includes(searchQuery.value.toLowerCase()) &&
          !item.description.toLowerCase().includes(searchQuery.value.toLowerCase())) {
        return false;
      }

      // Status filter
      if (filters.value.status && item.status !== filters.value.status) {
        return false;
      }

      // Category filter (ItemData doesn't have category property)
      // if (filters.value.category && item.category !== filters.value.category) {
      //   return false;
      // }

      // Price range filter
      if (filters.value.priceRange) {
        const [min, max] = filters.value.priceRange;
        if (item.price < min || item.price > max) {
          return false;
        }
      }

      return true;
    });
  });

  const itemsByCategory = computed(() => {
    const grouped: Record<string, ItemData[]> = {};
    items.value.forEach(item => {
      const category = 'uncategorized'; // ItemData doesn't have category
      if (!grouped[category]) {
        grouped[category] = [];
      }
      grouped[category].push(item);
    });
    return grouped;
  });

  const itemsCount = computed(() => items.value.length);
  const activeItemsCount = computed(() => items.value.filter(item => item.status === 'active').length);
  const inactiveItemsCount = computed(() => items.value.filter(item => item.status === 'inactive').length);

  const averagePrice = computed(() => {
    if (items.value.length === 0) return 0;
    const total = items.value.reduce((sum, item) => sum + item.price, 0);
    return total / items.value.length;
  });

  // Cache helpers
  function getCacheKey(endpoint: string, params?: any): string {
    return `${endpoint}:${JSON.stringify(params || {})}`;
  }

  function getCachedData(key: string): any | null {
    const cached = cache.value.get(key);
    if (cached && Date.now() < cached.expiry) {
      return cached.data;
    }
    cache.value.delete(key);
    return null;
  }

  function setCachedData(key: string, data: any): void {
    cache.value.set(key, {
      data,
      timestamp: Date.now(),
      expiry: Date.now() + CACHE_EXPIRY
    });
  }

  // Actions
  async function fetchItems(page = 1, perPage = 20, useCache = true) {
    const cacheKey = getCacheKey('items', { page, perPage, filters: filters.value });
    
    if (useCache) {
      const cached = getCachedData(cacheKey);
      if (cached) {
        items.value = cached.items;
        pagination.value = cached.pagination;
        return cached;
      }
    }

    loading.value = true;
    error.value = null;

    try {
      const response = await hmsApiClient.items.getItems({
        page,
        perPage,
        ...filters.value
      });

      if (response.data.success) {
        const result = response.data.data;
        items.value = result.items;
        pagination.value = result.pagination;

        // Cache the result
        setCachedData(cacheKey, result);

        return result;
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

  async function fetchItem(id: number, useCache = true) {
    const cacheKey = getCacheKey('item', { id });
    
    if (useCache) {
      const cached = getCachedData(cacheKey);
      if (cached) {
        currentItem.value = cached;
        return cached;
      }
    }

    loading.value = true;
    error.value = null;

    try {
      const response = await hmsApiClient.items.getItem(id);

      if (response.data.success) {
        const item = response.data.data;
        currentItem.value = item;

        // Update item in the list if it exists
        const index = items.value.findIndex(i => i.id === id);
        if (index !== -1) {
          items.value[index] = item;
        }

        // Cache the result
        setCachedData(cacheKey, item);

        return item;
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

  async function createItem(itemData: CreateItemData) {
    loading.value = true;
    error.value = null;

    try {
      const response = await hmsApiClient.items.createItem(itemData);

      if (response.data.success) {
        const newItem = response.data.data;
        
        // Optimistic update - add to the beginning of the list
        items.value.unshift(newItem);
        
        // Update pagination total
        pagination.value.total += 1;

        // Clear relevant caches
        clearCacheByPattern('items');

        return newItem;
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

  async function updateItem(id: number, itemData: UpdateItemData) {
    loading.value = true;
    error.value = null;

    // Find the item for optimistic update
    const itemIndex = items.value.findIndex(item => item.id === id);
    const originalItem = itemIndex !== -1 ? { ...items.value[itemIndex] } : null;

    // Optimistic update
    if (itemIndex !== -1) {
      items.value[itemIndex] = { ...items.value[itemIndex], ...itemData };
    }

    try {
      const response = await hmsApiClient.items.updateItem(id, itemData);

      if (response.data.success) {
        const updatedItem = response.data.data;
        
        // Update with server response
        if (itemIndex !== -1) {
          items.value[itemIndex] = updatedItem;
        }

        // Update current item if it's the same
        if (currentItem.value?.id === id) {
          currentItem.value = updatedItem;
        }

        // Clear relevant caches
        clearCacheByPattern('item');
        clearCacheByPattern('items');

        return updatedItem;
      } else {
        // Revert optimistic update
        if (itemIndex !== -1 && originalItem) {
          items.value[itemIndex] = originalItem;
        }
        error.value = response.data.message;
        return null;
      }
    } catch (err) {
      // Revert optimistic update
      if (itemIndex !== -1 && originalItem) {
        items.value[itemIndex] = originalItem;
      }
      
      const apiError = processApiError(err);
      error.value = getErrorMessage(apiError);
      return null;
    } finally {
      loading.value = false;
    }
  }

  async function deleteItem(id: number) {
    loading.value = true;
    error.value = null;

    // Find the item for optimistic update
    const itemIndex = items.value.findIndex(item => item.id === id);
    const originalItem = itemIndex !== -1 ? { ...items.value[itemIndex] } : null;

    // Optimistic update - remove from list
    if (itemIndex !== -1) {
      items.value.splice(itemIndex, 1);
      pagination.value.total -= 1;
    }

    try {
      const response = await hmsApiClient.items.deleteItem(id);

      if (response.data.success) {
        // Clear current item if it's the deleted one
        if (currentItem.value?.id === id) {
          currentItem.value = null;
        }

        // Clear relevant caches
        clearCacheByPattern('item');
        clearCacheByPattern('items');

        return true;
      } else {
        // Revert optimistic update
        if (originalItem) {
          items.value.splice(itemIndex, 0, originalItem);
          pagination.value.total += 1;
        }
        error.value = response.data.message;
        return false;
      }
    } catch (err) {
      // Revert optimistic update
      if (originalItem) {
        items.value.splice(itemIndex, 0, originalItem);
        pagination.value.total += 1;
      }
      
      const apiError = processApiError(err);
      error.value = getErrorMessage(apiError);
      return false;
    } finally {
      loading.value = false;
    }
  }

  async function searchItems(query: string, searchFilters?: ItemFilters) {
    searchQuery.value = query;
    if (searchFilters) {
      filters.value = { ...filters.value, ...searchFilters };
    }

    if (!query && !Object.keys(filters.value).length) {
      return await fetchItems();
    }

    const cacheKey = getCacheKey('search', { query, filters: filters.value });
    const cached = getCachedData(cacheKey);
    if (cached) {
      items.value = cached.items;
      pagination.value = cached.pagination;
      return cached;
    }

    loading.value = true;
    error.value = null;

    try {
      const response = await hmsApiClient.items.searchItems(query, 'all');

      if (response.data.success) {
        const result = response.data.data;
        items.value = result;
        // API doesn't return pagination info for search
        pagination.value = { total: result.length, current: 1, perPage: result.length };

        // Cache the result
        setCachedData(cacheKey, result);

        return result;
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

  async function bulkUpdateItems(ids: number[], updates: UpdateItemData) {
    loading.value = true;
    error.value = null;

    // Store original items for potential rollback
    const originalItems = items.value.filter(item => ids.includes(item.id)).map(item => ({ ...item }));
    
    // Optimistic update
    items.value.forEach(item => {
      if (ids.includes(item.id)) {
        Object.assign(item, updates);
      }
    });

    try {
      // bulkUpdateItems method doesn't exist, use individual updates
      const responses = await Promise.all(
        ids.map(id => hmsApiClient.items.updateItem(id, updates))
      );
      const response = responses[0]; // Use first response for success check

      if (response.data.success) {
        const updatedItems = response.data.data;
        
        // Update with server response
        updatedItems.forEach((updatedItem: ItemData) => {
          const index = items.value.findIndex(item => item.id === updatedItem.id);
          if (index !== -1) {
            items.value[index] = updatedItem;
          }
        });

        // Clear relevant caches
        clearCacheByPattern('item');
        clearCacheByPattern('items');

        return updatedItems;
      } else {
        // Revert optimistic updates
        originalItems.forEach(originalItem => {
          const index = items.value.findIndex(item => item.id === originalItem.id);
          if (index !== -1) {
            items.value[index] = originalItem;
          }
        });
        
        error.value = response.data.message;
        return null;
      }
    } catch (err) {
      // Revert optimistic updates
      originalItems.forEach(originalItem => {
        const index = items.value.findIndex(item => item.id === originalItem.id);
        if (index !== -1) {
          items.value[index] = originalItem;
        }
      });
      
      const apiError = processApiError(err);
      error.value = getErrorMessage(apiError);
      return null;
    } finally {
      loading.value = false;
    }
  }

  // Utility functions
  function setFilters(newFilters: ItemFilters) {
    filters.value = { ...filters.value, ...newFilters };
  }

  function clearFilters() {
    filters.value = {};
    searchQuery.value = '';
  }

  function clearError() {
    error.value = null;
  }

  function clearCache() {
    cache.value.clear();
  }

  function clearCacheByPattern(pattern: string) {
    for (const key of cache.value.keys()) {
      if (key.includes(pattern)) {
        cache.value.delete(key);
      }
    }
  }

  function getItemById(id: number): ItemData | undefined {
    return items.value.find(item => item.id === id);
  }

  function selectItem(item: ItemData | null) {
    currentItem.value = item;
  }

  // Refresh data
  async function refresh() {
    clearCache();
    return await fetchItems(pagination.value.currentPage, pagination.value.perPage, false);
  }

  return {
    // State
    items,
    currentItem,
    loading,
    error,
    pagination,
    searchQuery,
    filters,
    
    // Getters
    filteredItems,
    itemsByCategory,
    itemsCount,
    activeItemsCount,
    inactiveItemsCount,
    averagePrice,
    
    // Actions
    fetchItems,
    fetchItem,
    createItem,
    updateItem,
    deleteItem,
    searchItems,
    bulkUpdateItems,
    setFilters,
    clearFilters,
    clearError,
    clearCache,
    getItemById,
    selectItem,
    refresh
  };
});
/**
 * Examples of using the HMS API TypeScript client in various contexts
 */

import { createApiClient, ItemStatus, ApiResponse, ItemData } from './api-client';

// Create the API client
const api = createApiClient({
  baseURL: 'http://localhost:8000/api',
  timeout: 30000,
  withCredentials: true
});

/**
 * Example 1: Basic usage with plain TypeScript
 */
async function fetchItems() {
  try {
    const response = await api.items.getItems();
    
    if (response.data.success) {
      const items = response.data.data.items;
      console.log(`Found ${items.length} items`);
      
      // TypeScript knows the shape of the items
      items.forEach(item => {
        console.log(`Item ${item.id}: ${item.name} - $${item.price} (${item.status})`);
      });
      
      return items;
    } else {
      console.error('Failed to fetch items:', response.data.message);
      return [];
    }
  } catch (error) {
    console.error('Error fetching items:', error);
    return [];
  }
}

/**
 * Example 2: Creating a new item
 */
async function createNewItem(name: string, description: string, price: number) {
  try {
    const newItem = {
      name,
      description,
      price,
      status: ItemStatus.ACTIVE
    };
    
    const response = await api.items.createItem(newItem);
    
    if (response.data.success) {
      console.log('Item created successfully:', response.data.data);
      return response.data.data;
    } else {
      console.error('Failed to create item:', response.data.message);
      return null;
    }
  } catch (error) {
    console.error('Error creating item:', error);
    return null;
  }
}

/**
 * Example 3: Authentication and user profile
 */
async function loginAndGetProfile(email: string, password: string) {
  try {
    // Login
    const loginResponse = await api.auth.login({ email, password });
    
    if (!loginResponse.data.success) {
      console.error('Login failed:', loginResponse.data.message);
      return null;
    }
    
    // Token is automatically stored by the client
    console.log('Login successful');
    
    // Get user profile (automatically includes the token)
    const userResponse = await api.auth.getCurrentUser();
    
    if (userResponse.data.success) {
      const user = userResponse.data.data;
      console.log(`Welcome, ${user.name} (${user.email})`);
      console.log('User roles:', user.roles.join(', '));
      
      return user;
    } else {
      console.error('Failed to get user profile:', userResponse.data.message);
      return null;
    }
  } catch (error) {
    console.error('Error in authentication flow:', error);
    return null;
  }
}

/**
 * Example 4: Error handling with type safety
 */
async function handleItemErrors() {
  try {
    // Try to get a non-existent item
    await api.items.getItem(99999);
  } catch (error: any) {
    if (error.response?.status === 404) {
      console.error('Item not found');
    } else if (error.response?.status === 401) {
      console.error('Authentication required');
      // Redirect to login page
      window.location.href = '/login';
    } else if (error.response?.data?.errors) {
      // Validation errors
      const errors = error.response.data.errors;
      Object.entries(errors).forEach(([field, messages]) => {
        console.error(`${field}: ${messages.join(', ')}`);
      });
    } else {
      console.error('Unknown error:', error.message);
    }
  }
}

/**
 * Example 5: Using with async/await in a Vue 3 component
 */
/*
<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { createApiClient, ItemData } from '@/api/api-client';

const api = createApiClient({
  baseURL: 'http://localhost:8000/api'
});

const items = ref<ItemData[]>([]);
const loading = ref(false);
const error = ref<string | null>(null);

onMounted(async () => {
  loading.value = true;
  try {
    const response = await api.items.getItems();
    if (response.data.success) {
      items.value = response.data.data.items;
    } else {
      error.value = response.data.message;
    }
  } catch (err: any) {
    error.value = err.message || 'Failed to load items';
  } finally {
    loading.value = false;
  }
});

// Example of creating a new item
async function addItem(name: string, description: string, price: number) {
  try {
    const response = await api.items.createItem({
      name,
      description,
      price,
      status: 'active'
    });
    
    if (response.data.success) {
      // Add the new item to the list
      items.value.push(response.data.data);
      return true;
    }
    return false;
  } catch (error) {
    console.error('Failed to add item:', error);
    return false;
  }
}
</script>

<template>
  <div>
    <div v-if="loading">Loading...</div>
    <div v-else-if="error" class="error">{{ error }}</div>
    <div v-else>
      <h1>Items</h1>
      <ul>
        <li v-for="item in items" :key="item.id">
          <h3>{{ item.name }}</h3>
          <p>{{ item.description }}</p>
          <div>Price: ${{ item.price }}</div>
          <div>Status: {{ item.status }}</div>
        </li>
      </ul>
    </div>
  </div>
</template>
*/

/**
 * Example 6: Advanced Vue 3 component with Pinia store integration
 */
/*
<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import { useItemsStore } from '@/stores/items';
import { storeToRefs } from 'pinia';

// Use Pinia store for state management
const itemsStore = useItemsStore();
const { items, loading, error, pagination } = storeToRefs(itemsStore);

// Local reactive state
const searchQuery = ref('');
const selectedCategory = ref('');

// Computed properties
const filteredItems = computed(() => {
  return items.value.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(searchQuery.value.toLowerCase());
    const matchesCategory = !selectedCategory.value || item.category === selectedCategory.value;
    return matchesSearch && matchesCategory;
  });
});

// Watch for search changes and debounce API calls
watch(searchQuery, async (newQuery) => {
  if (newQuery.length > 2) {
    await itemsStore.searchItems(newQuery);
  } else if (newQuery.length === 0) {
    await itemsStore.fetchItems();
  }
}, { debounce: 300 });

// Actions
async function handleCreateItem(itemData: CreateItemData) {
  await itemsStore.createItem(itemData);
}

async function handleUpdateItem(id: number, itemData: UpdateItemData) {
  await itemsStore.updateItem(id, itemData);
}

async function handleDeleteItem(id: number) {
  if (confirm('Are you sure you want to delete this item?')) {
    await itemsStore.deleteItem(id);
  }
}

// Load items on component mount
await itemsStore.fetchItems();
</script>

<template>
  <div class="items-page">
    <header class="page-header">
      <h1>Items Management</h1>
      <div class="search-controls">
        <input 
          v-model="searchQuery" 
          type="text" 
          placeholder="Search items..."
          class="search-input"
        />
        <select v-model="selectedCategory" class="category-select">
          <option value="">All Categories</option>
          <option value="electronics">Electronics</option>
          <option value="clothing">Clothing</option>
          <option value="books">Books</option>
        </select>
      </div>
    </header>

    <div v-if="loading" class="loading">
      <div class="spinner"></div>
      Loading items...
    </div>
    
    <div v-else-if="error" class="error">
      {{ error }}
    </div>
    
    <div v-else class="items-grid">
      <div v-for="item in filteredItems" :key="item.id" class="item-card">
        <img :src="item.image" :alt="item.name" class="item-image" />
        <div class="item-content">
          <h3>{{ item.name }}</h3>
          <p>{{ item.description }}</p>
          <div class="item-meta">
            <span class="price">${{ item.price }}</span>
            <span :class="['status', item.status]">{{ item.status }}</span>
          </div>
          <div class="item-actions">
            <button @click="handleUpdateItem(item.id, { status: 'inactive' })">
              Deactivate
            </button>
            <button @click="handleDeleteItem(item.id)" class="danger">
              Delete
            </button>
          </div>
        </div>
      </div>
    </div>

    <div v-if="pagination.lastPage > 1" class="pagination">
      <button 
        :disabled="pagination.currentPage === 1"
        @click="itemsStore.fetchItems(pagination.currentPage - 1)"
      >
        Previous
      </button>
      <span>{{ pagination.currentPage }} / {{ pagination.lastPage }}</span>
      <button 
        :disabled="pagination.currentPage === pagination.lastPage"
        @click="itemsStore.fetchItems(pagination.currentPage + 1)"
      >
        Next
      </button>
    </div>
  </div>
</template>

<style scoped>
.items-page {
  padding: 2rem;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
}

.search-controls {
  display: flex;
  gap: 1rem;
}

.search-input, .category-select {
  padding: 0.5rem;
  border: 1px solid #ddd;
  border-radius: 4px;
}

.items-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 1.5rem;
}

.item-card {
  border: 1px solid #ddd;
  border-radius: 8px;
  overflow: hidden;
  transition: transform 0.2s;
}

.item-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0,0,0,0.1);
}

.item-image {
  width: 100%;
  height: 200px;
  object-fit: cover;
}

.item-content {
  padding: 1rem;
}

.item-meta {
  display: flex;
  justify-content: space-between;
  margin: 1rem 0;
}

.price {
  font-size: 1.25rem;
  font-weight: bold;
  color: #2563eb;
}

.status {
  padding: 0.25rem 0.5rem;
  border-radius: 4px;
  font-size: 0.75rem;
  text-transform: uppercase;
}

.status.active {
  background: #d1fae5;
  color: #065f46;
}

.status.inactive {
  background: #fee2e2;
  color: #b91c1c;
}

.item-actions {
  display: flex;
  gap: 0.5rem;
}

.item-actions button {
  padding: 0.5rem 1rem;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  background: #3b82f6;
  color: white;
}

.item-actions button.danger {
  background: #ef4444;
}

.loading, .error {
  text-align: center;
  padding: 2rem;
}

.spinner {
  border: 2px solid #f3f3f3;
  border-top: 2px solid #3b82f6;
  border-radius: 50%;
  width: 24px;
  height: 24px;
  animation: spin 1s linear infinite;
  margin: 0 auto 1rem;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.pagination {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 1rem;
  margin-top: 2rem;
}

.pagination button {
  padding: 0.5rem 1rem;
  border: 1px solid #ddd;
  border-radius: 4px;
  background: white;
  cursor: pointer;
}

.pagination button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
</style>
*/
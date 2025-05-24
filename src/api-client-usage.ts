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
 * Example 6: Integration with React
 */
/*
import React, { useState, useEffect } from 'react';
import { createApiClient, ItemData } from '../api/api-client';

const api = createApiClient({
  baseURL: 'http://localhost:8000/api'
});

const ItemsList: React.FC = () => {
  const [items, setItems] = useState<ItemData[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchData() {
      try {
        const response = await api.items.getItems();
        if (response.data.success) {
          setItems(response.data.data.items);
        } else {
          setError(response.data.message);
        }
      } catch (err: any) {
        setError(err.message || 'An error occurred');
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, []);

  if (loading) return <div>Loading...</div>;
  if (error) return <div className="error">{error}</div>;

  return (
    <div>
      <h1>Items</h1>
      <ul>
        {items.map(item => (
          <li key={item.id}>
            <h3>{item.name}</h3>
            <p>{item.description}</p>
            <div>Price: ${item.price}</div>
            <div>Status: {item.status}</div>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default ItemsList;
*/
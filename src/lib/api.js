// src/lib/api.js
const API_BASE_URL = import.meta.env.VITE_API_URL;

// Helper to get token from localStorage
const getToken = () => localStorage.getItem('admin_token');

// Generic fetch wrapper
async function apiCall(endpoint, options = {}) {
  const token = getToken();
  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...options.headers,
  };
  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });
  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Request failed' }));
    throw new Error(error.error || `HTTP ${response.status}`);
  }
  return response.json();
}

// Auth
export const login = (email, password) =>
  apiCall('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });

// Profile
export const getProfile = () => apiCall('/api/profile');

// Providers
export const getProviders = () => apiCall('/api/providers');
export const getProviderById = (id) => apiCall(`/api/providers/${id}`);
export const createProvider = (data) =>
  apiCall('/api/providers', { method: 'POST', body: JSON.stringify(data) });
export const updateProvider = (id, data) =>
  apiCall(`/api/providers/${id}`, { method: 'PUT', body: JSON.stringify(data) });
export const deleteProvider = (id) =>
  apiCall(`/api/providers/${id}`, { method: 'DELETE' });

// Categories
export const getCategories = () => apiCall('/api/categories');
export const createCategory = (data) =>
  apiCall('/api/categories', { method: 'POST', body: JSON.stringify(data) });
export const updateCategory = (id, data) =>
  apiCall(`/api/categories/${id}`, { method: 'PUT', body: JSON.stringify(data) });
export const deleteCategory = (id) =>
  apiCall(`/api/categories/${id}`, { method: 'DELETE' });
export const getTags = (categoryId) =>
  apiCall(`/api/categories/tags${categoryId ? `?categoryId=${categoryId}` : ''}`);

// Tags (CRUD operations for tags)
export const addTag = (categoryId, name) =>
  apiCall('/api/tags', { method: 'POST', body: JSON.stringify({ category_id: categoryId, name }) });

export const deleteTag = (tagId) =>
  apiCall(`/api/tags/${tagId}`, { method: 'DELETE' });

// Users
export const getUsers = () => apiCall('/api/users');
export const updateUserType = (id, user_type) =>
  apiCall(`/api/users/${id}/role`, { method: 'PUT', body: JSON.stringify({ user_type }) });
export const deleteUser = (id) => apiCall(`/api/users/${id}`, { method: 'DELETE' });
export const createUser = (data) =>
  apiCall('/api/users', { method: 'POST', body: JSON.stringify(data) });

// Dashboard stats (optional – you can still use Supabase counts or create a new endpoint)
// For simplicity, keep dashboard stats using the existing getUsers, getProviders, getCategories
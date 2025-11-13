/**
 * API Configuration
 * Centralized configuration for backend API connection
 * 
 * In development, the Vite proxy will handle /api requests automatically.
 * In production, set VITE_API_BASE_URL environment variable to your backend URL.
 */

// Get API base URL from environment variable or use default
// In development with Vite proxy, we can use relative URLs
// In production, use the full backend URL
const getApiBaseUrl = () => {
  // If VITE_API_BASE_URL is set, use it
  if (import.meta.env.VITE_API_BASE_URL) {
    return import.meta.env.VITE_API_BASE_URL;
  }
  
  // In development, use relative URL (Vite proxy handles it)
  if (import.meta.env.DEV) {
    return '';
  }
  
  // Production default
  return 'http://localhost:3000';
};

export const API_BASE_URL = getApiBaseUrl();

// API version prefix
export const API_PREFIX = '/api/v1';

// Full API URL
export const API_URL = `${API_BASE_URL}${API_PREFIX}`;


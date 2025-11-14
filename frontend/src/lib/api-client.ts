/**
 * API Client
 * Centralized HTTP client for backend API communication
 */

import { API_URL } from './api-config';
import { tokenStorage } from './token-storage';

export interface ApiError {
  message: string;
  statusCode?: number;
  errors?: Record<string, string[]>;
}

export class ApiClientError extends Error {
  statusCode?: number;
  errors?: Record<string, string[]>;

  constructor(message: string, statusCode?: number, errors?: Record<string, string[]>) {
    super(message);
    this.name = 'ApiClientError';
    this.statusCode = statusCode;
    this.errors = errors;
  }
}

/**
 * Parse error response from API
 */
async function parseErrorResponse(response: Response): Promise<ApiError> {
  try {
    const data = await response.json();
    return {
      message: data.message || response.statusText || 'An error occurred',
      statusCode: response.status,
      errors: data.errors,
    };
  } catch {
    return {
      message: response.statusText || 'An error occurred',
      statusCode: response.status,
    };
  }
}

/**
 * Refresh access token using refresh token
 */
async function refreshAccessToken(): Promise<string | null> {
  const refreshToken = tokenStorage.getRefreshToken();
  if (!refreshToken) {
    return null;
  }

  try {
    const response = await fetch(`${API_URL}/auth/refresh`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ refreshToken }),
    });

    if (!response.ok) {
      // Refresh failed, clear tokens
      tokenStorage.clearTokens();
      return null;
    }

    const data = await response.json();
    tokenStorage.setAccessToken(data.accessToken);
    if (data.refreshToken) {
      tokenStorage.setRefreshToken(data.refreshToken);
    }
    if (data.expiresIn) {
      tokenStorage.setTokenExpiry(data.expiresIn);
    }

    return data.accessToken;
  } catch (error) {
    console.error('Token refresh failed:', error);
    tokenStorage.clearTokens();
    return null;
  }
}

/**
 * Make authenticated API request with automatic token refresh
 */
async function makeRequest<T>(
  endpoint: string,
  options: RequestInit = {},
  retry = true
): Promise<T> {
  const url = endpoint.startsWith('http') ? endpoint : `${API_URL}${endpoint}`;

  // Get access token
  let accessToken = tokenStorage.getAccessToken();

  // Check if token is expired and refresh if needed
  if (accessToken && tokenStorage.isTokenExpired() && retry) {
    accessToken = await refreshAccessToken();
  }

  // Prepare headers
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  // Add authorization header if token exists
  if (accessToken) {
    headers['Authorization'] = `Bearer ${accessToken}`;
  }

  // Make request
  const response = await fetch(url, {
    ...options,
    headers,
  });

  // Handle 401 Unauthorized - try to refresh token once
  if (response.status === 401 && retry && tokenStorage.getRefreshToken()) {
    const newToken = await refreshAccessToken();
    if (newToken) {
      // Retry request with new token
      headers['Authorization'] = `Bearer ${newToken}`;
      const retryResponse = await fetch(url, {
        ...options,
        headers,
      });

      if (!retryResponse.ok) {
        const error = await parseErrorResponse(retryResponse);
        throw new ApiClientError(error.message, error.statusCode, error.errors);
      }

      return retryResponse.json();
    } else {
      // Refresh failed, clear tokens and throw error
      tokenStorage.clearTokens();
      const error = await parseErrorResponse(response);
      throw new ApiClientError(error.message, error.statusCode, error.errors);
    }
  }

  // Handle non-ok responses
  if (!response.ok) {
    const error = await parseErrorResponse(response);
    throw new ApiClientError(error.message, error.statusCode, error.errors);
  }

  // Handle empty responses (e.g., 204 No Content)
  if (response.status === 204 || response.headers.get('content-length') === '0') {
    return null as T;
  }

  return response.json();
}

/**
 * API Client with common HTTP methods
 */
export const apiClient = {
  /**
   * GET request
   */
  async get<T>(endpoint: string, options?: RequestInit): Promise<T> {
    return makeRequest<T>(endpoint, { ...options, method: 'GET' });
  },

  /**
   * POST request
   */
  async post<T>(endpoint: string, data?: unknown, options?: RequestInit): Promise<T> {
    return makeRequest<T>(endpoint, {
      ...options,
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
    });
  },

  /**
   * PUT request
   */
  async put<T>(endpoint: string, data?: unknown, options?: RequestInit): Promise<T> {
    return makeRequest<T>(endpoint, {
      ...options,
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined,
    });
  },

  /**
   * PATCH request
   */
  async patch<T>(endpoint: string, data?: unknown, options?: RequestInit): Promise<T> {
    return makeRequest<T>(endpoint, {
      ...options,
      method: 'PATCH',
      body: data ? JSON.stringify(data) : undefined,
    });
  },

  /**
   * DELETE request
   */
  async delete<T>(endpoint: string, options?: RequestInit): Promise<T> {
    return makeRequest<T>(endpoint, { ...options, method: 'DELETE' });
  },
};


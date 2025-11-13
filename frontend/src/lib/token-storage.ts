/**
 * Token Storage Utility
 * Handles secure storage and retrieval of JWT tokens
 */

const ACCESS_TOKEN_KEY = 'accessToken';
const REFRESH_TOKEN_KEY = 'refreshToken';
const TOKEN_EXPIRY_KEY = 'tokenExpiry';

export const tokenStorage = {
  /**
   * Store access token
   */
  setAccessToken(token: string): void {
    localStorage.setItem(ACCESS_TOKEN_KEY, token);
  },

  /**
   * Get access token
   */
  getAccessToken(): string | null {
    return localStorage.getItem(ACCESS_TOKEN_KEY);
  },

  /**
   * Store refresh token
   */
  setRefreshToken(token: string): void {
    localStorage.setItem(REFRESH_TOKEN_KEY, token);
  },

  /**
   * Get refresh token
   */
  getRefreshToken(): string | null {
    return localStorage.getItem(REFRESH_TOKEN_KEY);
  },

  /**
   * Store token expiry timestamp
   */
  setTokenExpiry(expiresIn: number): void {
    const expiryTime = Date.now() + expiresIn * 1000;
    localStorage.setItem(TOKEN_EXPIRY_KEY, expiryTime.toString());
  },

  /**
   * Check if access token is expired
   */
  isTokenExpired(): boolean {
    const expiryTime = localStorage.getItem(TOKEN_EXPIRY_KEY);
    if (!expiryTime) return true;
    return Date.now() >= parseInt(expiryTime, 10);
  },

  /**
   * Clear all tokens
   */
  clearTokens(): void {
    localStorage.removeItem(ACCESS_TOKEN_KEY);
    localStorage.removeItem(REFRESH_TOKEN_KEY);
    localStorage.removeItem(TOKEN_EXPIRY_KEY);
  },

  /**
   * Check if user has tokens
   */
  hasTokens(): boolean {
    return !!this.getAccessToken() && !!this.getRefreshToken();
  },
};


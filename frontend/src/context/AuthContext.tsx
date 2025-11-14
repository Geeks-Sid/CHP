
import { apiClient, ApiClientError } from '@/lib/api-client';
import { tokenStorage } from '@/lib/token-storage';
import React, { createContext, useContext, useEffect, useState } from 'react';

export type UserRole = 'patient' | 'receptionist' | 'clinician' | 'pharmacy' | 'admin' | 'warehousemanager';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  profileImage?: string;
  roles?: string[]; // Backend roles array
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (username: string, password: string) => Promise<void>;
  logout: (allDevices?: boolean) => Promise<void>;
  isAuthenticated: boolean;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Map backend roles to frontend UserRole
// This is a simple mapping - you may need to adjust based on your actual role names
function mapBackendRoleToFrontendRole(roles: string[]): UserRole {
  // Check for admin first
  if (roles.includes('admin') || roles.includes('administrator')) {
    return 'admin';
  }
  // Check for clinician/doctor
  if (roles.includes('clinician') || roles.includes('doctor') || roles.includes('physician')) {
    return 'clinician';
  }
  // Check for receptionist
  if (roles.includes('receptionist') || roles.includes('reception')) {
    return 'receptionist';
  }
  // Check for pharmacy
  if (roles.includes('pharmacy') || roles.includes('pharmacist')) {
    return 'pharmacy';
  }
  // Check for warehouse manager
  if (roles.includes('warehouse') || roles.includes('warehousemanager')) {
    return 'warehousemanager';
  }
  // Default to patient
  return 'patient';
}

// Convert backend user to frontend User format
function convertBackendUserToFrontendUser(backendUser: {
  user_id: string;
  username: string;
  email: string;
  roles: string[];
}): User {
  return {
    id: backendUser.user_id,
    name: backendUser.username,
    email: backendUser.email,
    role: mapBackendRoleToFrontendRole(backendUser.roles),
    roles: backendUser.roles,
  };
}

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Check for existing session on mount
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        // Check if we have tokens
        if (tokenStorage.hasTokens() && !tokenStorage.isTokenExpired()) {
          // Try to fetch current user
          await refreshUser();
        } else if (tokenStorage.hasTokens()) {
          // Token expired, try to refresh
          const refreshToken = tokenStorage.getRefreshToken();
          if (refreshToken) {
            try {
              const response = await apiClient.post<{
                accessToken: string;
                refreshToken?: string;
                expiresIn: number;
              }>('/auth/refresh', { refreshToken });

              tokenStorage.setAccessToken(response.accessToken);
              if (response.refreshToken) {
                tokenStorage.setRefreshToken(response.refreshToken);
              }
              if (response.expiresIn) {
                tokenStorage.setTokenExpiry(response.expiresIn);
              }

              // Now fetch user
              await refreshUser();
            } catch (error) {
              // Refresh failed, clear tokens
              tokenStorage.clearTokens();
            }
          }
        }
      } catch (error) {
        console.error('Auth initialization error:', error);
        tokenStorage.clearTokens();
      } finally {
        setIsLoading(false);
      }
    };

    initializeAuth();
  }, []);

  const refreshUser = async () => {
    try {
      const backendUser = await apiClient.get<{
        user_id: string;
        username: string;
        email: string;
        roles: string[];
      }>('/auth/me');

      const frontendUser = convertBackendUserToFrontendUser(backendUser);
      setUser(frontendUser);
      localStorage.setItem('medicalAppUser', JSON.stringify(frontendUser));
    } catch (error) {
      console.error('Failed to refresh user:', error);
      // If we can't get user, clear everything
      setUser(null);
      tokenStorage.clearTokens();
      localStorage.removeItem('medicalAppUser');
      throw error;
    }
  };

  const login = async (username: string, password: string) => {
    setIsLoading(true);
    try {
      const response = await apiClient.post<{
        accessToken: string;
        refreshToken: string;
        expiresIn: number;
        user: {
          user_id: string;
          username: string;
          email: string;
          roles: string[];
        };
      }>('/auth/login', { username, password });

      // Store tokens
      tokenStorage.setAccessToken(response.accessToken);
      tokenStorage.setRefreshToken(response.refreshToken);
      tokenStorage.setTokenExpiry(response.expiresIn);

      // Convert and store user
      const frontendUser = convertBackendUserToFrontendUser(response.user);
      setUser(frontendUser);
      localStorage.setItem('medicalAppUser', JSON.stringify(frontendUser));
    } catch (error) {
      console.error('Login error:', error);
      if (error instanceof ApiClientError) {
        throw new Error(error.message);
      }
      throw new Error('Login failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async (allDevices = false) => {
    try {
      // Call logout endpoint if we have tokens
      if (tokenStorage.hasTokens()) {
        try {
          await apiClient.post('/auth/logout', { allDevices });
        } catch (error) {
          // Even if logout fails, clear local state
          console.error('Logout API call failed:', error);
        }
      }
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      // Always clear local state
      setUser(null);
      tokenStorage.clearTokens();
      localStorage.removeItem('medicalAppUser');
    }
  };

  return (
    <AuthContext.Provider value={{
      user,
      isLoading,
      login,
      logout,
      isAuthenticated: !!user && tokenStorage.hasTokens(),
      refreshUser,
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

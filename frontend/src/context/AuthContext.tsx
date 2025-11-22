
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
// Backend returns capitalized role names: "Admin", "Doctor", "Patient", "Receptionist", "Pharmacist", "Warehouse Manager"
function mapBackendRoleToFrontendRole(roles: string[]): UserRole {
  // Normalize roles to lowercase for comparison
  const normalizedRoles = roles.map(r => r.toLowerCase());
  
  // Check for admin first
  if (normalizedRoles.includes('admin') || normalizedRoles.includes('administrator')) {
    return 'admin';
  }
  // Check for clinician/doctor (backend uses "Doctor")
  if (normalizedRoles.includes('clinician') || normalizedRoles.includes('doctor') || normalizedRoles.includes('physician')) {
    return 'clinician';
  }
  // Check for receptionist (backend uses "Receptionist")
  if (normalizedRoles.includes('receptionist') || normalizedRoles.includes('reception')) {
    return 'receptionist';
  }
  // Check for pharmacy (backend uses "Pharmacist")
  if (normalizedRoles.includes('pharmacy') || normalizedRoles.includes('pharmacist')) {
    return 'pharmacy';
  }
  // Check for warehouse manager (backend uses "Warehouse Manager" - two words)
  if (normalizedRoles.some(r => r.includes('warehouse'))) {
    return 'warehousemanager';
  }
  // Default to patient (backend uses "Patient")
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

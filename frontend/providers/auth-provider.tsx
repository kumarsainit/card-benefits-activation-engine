'use client';

import * as React from 'react';
import { User, UserRole } from '@/types';
import { apiClient } from '@/services/api-client';

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (data: { email: string; password: string; fullName: string; role?: string }) => Promise<void>;
  logout: () => void;
  hasRole: (role: UserRole) => boolean;
}

const AuthContext = React.createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = React.useState<User | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);

  React.useEffect(() => {
    const initAuth = async () => {
      const token = apiClient.getToken();
      if (!token) {
        setIsLoading(false);
        return;
      }

      // Check stored user first for snappy hydration
      const storedUser = apiClient.getStoredUser();
      if (storedUser) {
        setUser(storedUser);
      }

      try {
        const remoteUser = await apiClient.getMe();
        setUser(remoteUser);
      } catch (err) {
        // Token invalid or expired
        apiClient.clearToken();
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    };

    initAuth();
  }, []);

  const login = async (email: string, password: string) => {
    const res = await apiClient.login({ email, password });
    const token = res.accessToken || res.token;
    apiClient.setToken(token, res.refreshToken, res.user);
    setUser(res.user);
  };

  const register = async (data: { email: string; password: string; fullName: string; role?: string }) => {
    const res = await apiClient.register(data);
    const token = res.accessToken || res.token;
    apiClient.setToken(token, res.refreshToken, res.user);
    setUser(res.user);
  };

  const logout = () => {
    apiClient.clearToken();
    setUser(null);
  };

  const hasRole = (role: UserRole) => {
    return user?.role === role;
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        login,
        register,
        logout,
        hasRole,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextType {
  const context = React.useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

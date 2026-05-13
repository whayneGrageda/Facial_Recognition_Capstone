import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface AuthUser {
  id: number;
  name: string;
  email: string;
  role: string;
  userType: string; // 'college' | 'shs' | 'faculty'
}

interface AuthContextValue {
  user: AuthUser | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (credentials: { email: string; password: string; userType?: string }) => Promise<void>;
  logout: () => Promise<void>;
}

// ─── Storage Keys ─────────────────────────────────────────────────────────────

const TOKEN_KEY = '@facetrack_token';
const USER_KEY = '@facetrack_user';

// ─── Context ──────────────────────────────────────────────────────────────────

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

// ─── Provider ─────────────────────────────────────────────────────────────────

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Restore session on app start
  useEffect(() => {
    const restoreSession = async () => {
      try {
        const [storedToken, storedUser] = await Promise.all([
          AsyncStorage.getItem(TOKEN_KEY),
          AsyncStorage.getItem(USER_KEY),
        ]);

        if (storedToken && storedUser) {
          setToken(storedToken);
          setUser(JSON.parse(storedUser));
        }
      } catch (error) {
        console.error('Failed to restore session:', error);
      } finally {
        setIsLoading(false);
      }
    };

    restoreSession();
  }, []);

  const login = async (credentials: {
    email: string;
    password: string;
    userType?: string;
  }) => {
    const { authService } = await import('../services/authService');
    const result = await authService.login(credentials);

    // Persist token and user to AsyncStorage
    await Promise.all([
      AsyncStorage.setItem(TOKEN_KEY, result.token),
      AsyncStorage.setItem(USER_KEY, JSON.stringify(result.user)),
    ]);

    setToken(result.token);
    setUser(result.user);
  };

  const logout = async () => {
    try {
      // Optionally call backend logout to invalidate token
      if (token) {
        const { authService } = await import('../services/authService');
        await authService.logout(token).catch(() => {
          // Ignore errors on logout — we still clear local state
        });
      }
    } finally {
      await Promise.all([
        AsyncStorage.removeItem(TOKEN_KEY),
        AsyncStorage.removeItem(USER_KEY),
      ]);
      setToken(null);
      setUser(null);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: !!token && !!user,
        isLoading,
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

// ─── Hook ─────────────────────────────────────────────────────────────────────

export const useAuth = (): AuthContextValue => {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used inside <AuthProvider>');
  }
  return ctx;
};

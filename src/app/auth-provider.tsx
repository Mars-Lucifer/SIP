'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';

import { apiRequest, type AuthUser } from '@/app/lib/api';

interface AuthContextValue {
  user: AuthUser | null;
  ready: boolean;
  refreshUser: () => Promise<void>;
  setUser: (user: AuthUser | null) => void;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUserState] = useState<AuthUser | null>(null);
  const [ready, setReady] = useState(false);

  const refreshUser = useCallback(async () => {
    const response = await apiRequest<{ user: AuthUser | null }>('/api/auth/me');
    setUserState(response.user);
    setReady(true);
  }, []);

  const setUser = useCallback((nextUser: AuthUser | null) => {
    setUserState(nextUser);
    setReady(true);
  }, []);

  const logout = useCallback(async () => {
    await apiRequest<{ success: boolean }>('/api/auth/logout', {
      method: 'POST',
    });
    setUserState(null);
    setReady(true);
  }, []);

  useEffect(() => {
    refreshUser().catch(() => {
      setUserState(null);
      setReady(true);
    });
  }, [refreshUser]);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      ready,
      refreshUser,
      setUser,
      logout,
    }),
    [logout, ready, refreshUser, setUser, user],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }

  return context;
}

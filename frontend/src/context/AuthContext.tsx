/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useState } from 'react';
import type { ReactNode } from 'react';
import type { AuthRole, AuthSession } from '../types/auth';
import {
  clearStoredAuthSession,
  getStoredAuthSession,
  setStoredAuthSession,
} from '../utils/auth';

interface AuthContextType {
  token: string | null;
  expiresAt: string | null;
  userId: number | null;
  role: AuthRole | null;
  username: string | null;
  isAuthenticated: boolean;
  login: (session: AuthSession) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [session, setSession] = useState<AuthSession | null>(() => getStoredAuthSession());

  const login = (newSession: AuthSession) => {
    setSession(newSession);
    setStoredAuthSession(newSession);
  };

  const logout = () => {
    setSession(null);
    clearStoredAuthSession();
  };

  const value = {
    token: session?.token ?? null,
    expiresAt: session?.expiresAt ?? null,
    userId: session?.userId ?? null,
    role: session?.role ?? null,
    username: session?.username ?? null,
    isAuthenticated: !!session?.token,
    login,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

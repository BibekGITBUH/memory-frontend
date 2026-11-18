import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { getSession, login as apiLogin, logout as apiLogout, register as apiRegister } from '../api/auth.api';
import type { User } from '../api/auth.api';

interface AuthState {
  loading: boolean;
  authenticated: boolean;
  user: User | null;
  csrf: string | null;
}

interface AuthContextValue extends AuthState {
  register: (username: string, password: string) => Promise<void>;
  login: (username: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  refresh: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AuthState>({
    loading: true,
    authenticated: false,
    user: null,
    csrf: null,
  });

  const refresh = useCallback(async () => {
    try {
      const session = await getSession();
      setState({
        loading: false,
        authenticated: session.authenticated,
        user: session.user ?? null,
        csrf: session.csrf ?? null,
      });
    } catch {
      setState({ loading: false, authenticated: false, user: null, csrf: null });
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const register = useCallback(
    async (username: string, password: string) => {
      await apiRegister(username, password);
      await refresh();
    },
    [refresh]
  );

  const login = useCallback(
    async (username: string, password: string) => {
      await apiLogin(username, password);
      await refresh();
    },
    [refresh]
  );

  const logout = useCallback(async () => {
    await apiLogout();
    setState({ loading: false, authenticated: false, user: null, csrf: null });
  }, []);

  return (
    <AuthContext.Provider value={{ ...state, register, login, logout, refresh }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}

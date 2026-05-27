import React, { createContext, useEffect, useState, useContext, ReactNode } from 'react';
import {
  AuthSession,
  login as loginRequest,
  logout as logoutRequest,
  validateSession,
} from '../services/auth.service';

type AuthContextType = {
  token: string | null;
  user: AuthSession['user'] | null;
  isReady: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<AuthSession['user'] | null>(null);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    let isMounted = true;

    const restoreSession = async () => {
      try {
        const session = await Promise.race<AuthSession | null>([
          validateSession(),
          new Promise<null>((resolve) => {
            setTimeout(() => resolve(null), 3000);
          }),
        ]);

        if (!isMounted) {
          return;
        }

        if (session) {
          setToken(session.token);
          setUser(session.user);
        }
      } finally {
        if (isMounted) {
          setIsReady(true);
        }
      }
    };

    void restoreSession();

    return () => {
      isMounted = false;
    };
  }, []);

  const login = async (email: string, password: string) => {
    const session = await loginRequest(email, password);
    setToken(session.token);
    setUser(session.user);
  };

  const logout = async () => {
    await logoutRequest();
    setToken(null);
    setUser(null);
  };

  return <AuthContext.Provider value={{ token, user, isReady, login, logout }}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be inside AuthProvider');
  return ctx;
};

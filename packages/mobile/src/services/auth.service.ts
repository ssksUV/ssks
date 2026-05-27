import {
  clearStoredToken,
  clearStoredUser,
  getStoredToken,
  getStoredUser,
  setStoredToken,
  setStoredUser,
} from './tokenStorage';
import { post } from './http';

export type AuthUser = {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: 'ADMIN' | 'MANAGER' | 'AUDITOR';
  tenantId: string | null;
};

export type LoginResponse = {
  accessToken: string;
  user: AuthUser;
};

export type AuthSession = {
  token: string;
  user: AuthUser;
};

export async function login(email: string, password: string): Promise<AuthSession> {
  const result = await post<LoginResponse>('/auth/login', { email, password }, { auth: false });
  await setStoredToken(result.accessToken);
  await setStoredUser(JSON.stringify(result.user));
  return { token: result.accessToken, user: result.user };
}

export async function validateSession(): Promise<AuthSession | null> {
  try {
    const [token, rawUser] = await Promise.all([getStoredToken(), getStoredUser()]);

    if (!token || !rawUser) {
      await clearStoredToken();
      await clearStoredUser();
      return null;
    }

    const user = JSON.parse(rawUser) as AuthUser;

    if (!user?.id || !user?.email || !user?.role) {
      await clearStoredToken();
      await clearStoredUser();
      return null;
    }

    return { token, user };
  } catch {
    await clearStoredToken();
    await clearStoredUser();
    return null;
  }
}

export async function logout(): Promise<void> {
  await clearStoredToken();
  await clearStoredUser();
}
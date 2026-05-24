import { clearStoredToken, getStoredToken, setStoredToken } from './tokenStorage';
import { get, post } from './http';

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

export type ValidateResponse = {
  valid: boolean;
  user: AuthUser | null;
};

export type AuthSession = {
  token: string;
  user: AuthUser;
};

export async function login(email: string, password: string): Promise<AuthSession> {
  const result = await post<LoginResponse>('/auth/login', { email, password }, { auth: false });
  await setStoredToken(result.accessToken);
  return { token: result.accessToken, user: result.user };
}

export async function validateSession(): Promise<AuthSession | null> {
  const token = await getStoredToken();
  if (!token) {
    return null;
  }

  try {
    const response = await get<ValidateResponse>('/auth/validate');

    if (!response.valid || !response.user) {
      await clearStoredToken();
      return null;
    }

    return { token, user: response.user };
  } catch {
    await clearStoredToken();
    return null;
  }
}

export async function logout(): Promise<void> {
  await clearStoredToken();
}
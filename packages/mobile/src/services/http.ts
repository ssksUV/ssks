import { getStoredToken } from './tokenStorage';
import { Platform } from 'react-native';

function getDefaultApiBaseUrl(): string {
  if (Platform.OS === 'android') {
    // Android emulator maps host machine localhost to 10.0.2.2
    return 'http://10.0.2.2:3000/api';
  }
  return 'http://localhost:3000/api';
}

export const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL ?? getDefaultApiBaseUrl();

type RequestOptions = Omit<RequestInit, 'body'> & {
  body?: unknown;
  auth?: boolean;
};

export type HttpRequestError = Error & {
  statusCode?: number;
};

async function parseResponse<T>(response: Response): Promise<T> {
  const rawBody = await response.text();

  if (!rawBody) {
    return undefined as T;
  }

  try {
    return JSON.parse(rawBody) as T;
  } catch {
    return rawBody as T;
  }
}

export async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const headers = new Headers(options.headers);

  if (options.body !== undefined && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }

  if (options.auth !== false) {
    const token = await getStoredToken();
    if (token) {
      headers.set('Authorization', `Bearer ${token}`);
    }
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers,
    body: options.body === undefined ? undefined : JSON.stringify(options.body),
  });

  const data = await parseResponse<{ error?: string; message?: string } & T>(response);

  if (!response.ok) {
    const errorMessage =
      (data && typeof data === 'object' && 'error' in data && data.error) ||
      (data && typeof data === 'object' && 'message' in data && data.message) ||
      `HTTP ${response.status}`;
    const error = new Error(errorMessage) as HttpRequestError;
    error.statusCode = response.status;
    throw error;
  }

  return data as T;
}

export function get<T>(path: string, options: Omit<RequestOptions, 'method' | 'body'> = {}) {
  return request<T>(path, { ...options, method: 'GET' });
}

export function post<T>(path: string, body?: unknown, options: Omit<RequestOptions, 'method'> = {}) {
  return request<T>(path, { ...options, method: 'POST', body });
}

export function put<T>(path: string, body?: unknown, options: Omit<RequestOptions, 'method'> = {}) {
  return request<T>(path, { ...options, method: 'PUT', body });
}

export function patch<T>(path: string, body?: unknown, options: Omit<RequestOptions, 'method'> = {}) {
  return request<T>(path, { ...options, method: 'PATCH', body });
}

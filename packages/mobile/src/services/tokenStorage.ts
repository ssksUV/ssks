import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

const TOKEN_KEY = 'ssks.auth.token';
const USER_KEY = 'ssks.auth.user';

let memoryToken: string | null = null;
let memoryUser: string | null = null;

function getWebStorage(): Storage | null {
  if (Platform.OS !== 'web') {
    return null;
  }
  if (typeof globalThis === 'undefined') {
    return null;
  }
  if (!('localStorage' in globalThis)) {
    return null;
  }
  return globalThis.localStorage;
}

async function getStoredValue(key: string): Promise<string | null> {
  const storage = getWebStorage();
  if (storage) {
    return storage.getItem(key);
  }

  return SecureStore.getItemAsync(key);
}

async function setStoredValue(key: string, value: string): Promise<void> {
  const storage = getWebStorage();
  if (storage) {
    storage.setItem(key, value);
    return;
  }

  await SecureStore.setItemAsync(key, value);
}

async function clearStoredValue(key: string): Promise<void> {
  const storage = getWebStorage();
  if (storage) {
    storage.removeItem(key);
    return;
  }

  await SecureStore.deleteItemAsync(key);
}

export async function getStoredToken(): Promise<string | null> {
  try {
    const token = await getStoredValue(TOKEN_KEY);
    memoryToken = token;
    return token;
  } catch {
    return memoryToken;
  }
}

export async function setStoredToken(token: string): Promise<void> {
  try {
    await setStoredValue(TOKEN_KEY, token);
    memoryToken = token;
  } catch {
    memoryToken = token;
  }
}

export async function clearStoredToken(): Promise<void> {
  try {
    await clearStoredValue(TOKEN_KEY);
    memoryToken = null;
  } catch {
    memoryToken = null;
  }
}

export async function getStoredUser(): Promise<string | null> {
  try {
    const user = await getStoredValue(USER_KEY);
    memoryUser = user;
    return user;
  } catch {
    return memoryUser;
  }
}

export async function setStoredUser(user: string): Promise<void> {
  try {
    await setStoredValue(USER_KEY, user);
    memoryUser = user;
  } catch {
    memoryUser = user;
  }
}

export async function clearStoredUser(): Promise<void> {
  try {
    await clearStoredValue(USER_KEY);
    memoryUser = null;
  } catch {
    memoryUser = null;
  }
}
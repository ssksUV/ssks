const TOKEN_KEY = 'ssks.auth.token';
let memoryToken: string | null = null;

function getWebStorage(): Storage | null {
  if (typeof globalThis === 'undefined') {
    return null;
  }
  if (!('localStorage' in globalThis)) {
    return null;
  }
  return globalThis.localStorage;
}

export async function getStoredToken(): Promise<string | null> {
  try {
    const storage = getWebStorage();
    if (storage) {
      return storage.getItem(TOKEN_KEY);
    }
    return memoryToken;
  } catch {
    return memoryToken;
  }
}

export async function setStoredToken(token: string): Promise<void> {
  try {
    const storage = getWebStorage();
    if (storage) {
      storage.setItem(TOKEN_KEY, token);
    }
    memoryToken = token;
  } catch {
    memoryToken = token;
  }
}

export async function clearStoredToken(): Promise<void> {
  try {
    const storage = getWebStorage();
    if (storage) {
      storage.removeItem(TOKEN_KEY);
    }
    memoryToken = null;
  } catch {
    memoryToken = null;
  }
}
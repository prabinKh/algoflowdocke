
const isStorageAvailable = () => {
  try {
    return typeof window !== 'undefined' && !!window.localStorage;
  } catch (e) {
    return false;
  }
};

export const safeStorage = {
  getItem: (key: string): string | null => {
    if (!isStorageAvailable()) return null;
    try {
      return localStorage.getItem(key);
    } catch (e) {
      console.warn("localStorage.getItem failed", e);
      return null;
    }
  },
  setItem: (key: string, value: string): void => {
    if (!isStorageAvailable()) return;
    try {
      localStorage.setItem(key, value);
    } catch (e) {
      console.warn("localStorage.setItem failed", e);
    }
  },
  removeItem: (key: string): void => {
    if (!isStorageAvailable()) return;
    try {
      localStorage.removeItem(key);
    } catch (e) {
      console.warn("localStorage.removeItem failed", e);
    }
  },
  clear: (): void => {
    if (!isStorageAvailable()) return;
    try {
      localStorage.clear();
    } catch (e) {
      console.warn("localStorage.clear failed", e);
    }
  }
};

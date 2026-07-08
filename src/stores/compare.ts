import type { Product } from '@/lib/types';

let compareItems: Product[] = [];
let listeners: (() => void)[] = [];

const notifyListeners = () => listeners.forEach(l => l());

export const compareStore = {
  subscribe(listener: () => void) {
    listeners.push(listener);
    return () => { listeners = listeners.filter(l => l !== listener); };
  },
  getSnapshot() {
    return compareItems;
  },
  toggle(product: Product) {
    const exists = compareItems.find(p => p.id === product.id);
    if (exists) {
      compareItems = compareItems.filter(p => p.id !== product.id);
      notifyListeners();
      return false;
    }
    if (compareItems.length >= 4) return null; // max 4
    compareItems = [...compareItems, product];
    notifyListeners();
    return true;
  },
  has(productId: string) {
    return compareItems.some(p => p.id === productId);
  },
  remove(productId: string) {
    compareItems = compareItems.filter(p => p.id !== productId);
    notifyListeners();
  },
  clear() {
    compareItems = [];
    notifyListeners();
  },
  getCount() {
    return compareItems.length;
  },
};

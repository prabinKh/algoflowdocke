import type { Product } from './products';
import { customerService } from "@/api/customerService";

// Simple cart using React useSyncExternalStore pattern
export type CartItem = {
  product: Product;
  quantity: number;
};

let cartItems: CartItem[] = [];
let listeners: (() => void)[] = [];

// The current authenticated user id — set by AuthContext
let _currentUserId: string | null = null;

/** Call this from AuthContext/AuthProvider to keep cart in sync */
export const setCartUserId = (id: string | null) => {
  _currentUserId = id;
};

const notifyListeners = () => {
  listeners.forEach(l => l());
  syncWithBackend();
};

const syncWithBackend = async () => {
  if (_currentUserId) {
    try {
      await customerService.updateCart(_currentUserId, cartItems.map(item => ({
        productId: item.product.id,
        name: item.product.name,
        price: item.product.price,
        quantity: item.quantity,
        image: item.product.image,
        features: item.product.specs || []
      })));
    } catch (error) {
      console.error("Error syncing cart:", error);
    }
  }
};

export const cartStore = {
  subscribe(listener: () => void) {
    listeners.push(listener);
    return () => {
      listeners = listeners.filter(l => l !== listener);
    };
  },
  getSnapshot() {
    return cartItems;
  },
  addItem(product: Product) {
    const existing = cartItems.find(i => i.product.id === product.id);
    if (existing) {
      cartItems = cartItems.map(i =>
        i.product.id === product.id ? { ...i, quantity: i.quantity + 1 } : i
      );
    } else {
      cartItems = [...cartItems, { product, quantity: 1 }];
    }
    notifyListeners();
  },
  removeItem(productId: string) {
    cartItems = cartItems.filter(i => i.product.id !== productId);
    notifyListeners();
  },
  updateQuantity(productId: string, quantity: number) {
    if (quantity <= 0) {
      cartStore.removeItem(productId);
      return;
    }
    cartItems = cartItems.map(i =>
      i.product.id === productId ? { ...i, quantity } : i
    );
    notifyListeners();
  },
  getTotal() {
    return cartItems.reduce((sum, i) => sum + i.product.price * i.quantity, 0);
  },
  getCount() {
    return cartItems.reduce((sum, i) => sum + i.quantity, 0);
  },
  clear() {
    cartItems = [];
    notifyListeners();
  },
};

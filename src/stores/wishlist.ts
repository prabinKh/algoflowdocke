import type { Product } from '@/lib/types';
import { userActivityService } from '@/api/userActivityService';

let wishlistItems: Product[] = [];
let listeners: (() => void)[] = [];

const notifyListeners = () => listeners.forEach(l => l());

export const wishlistStore = {
  subscribe(listener: () => void) {
    listeners.push(listener);
    return () => { listeners = listeners.filter(l => l !== listener); };
  },
  getSnapshot() {
    return wishlistItems;
  },
  toggle(product: Product) {
    const exists = wishlistItems.find(p => p.id === product.id);
    if (exists) {
      wishlistItems = wishlistItems.filter(p => p.id !== product.id);
    } else {
      wishlistItems = [...wishlistItems, product];
      // Track adding to wishlist
      userActivityService.track('add_to_wishlist', {
        productId: product.id,
        productName: product.name,
        productSlug: product.slug,
        productPrice: product.price,
        productBrand: product.brand_name || product.brand
      });
    }
    notifyListeners();
    return !exists; // returns true if added
  },
  has(productId: string) {
    return wishlistItems.some(p => p.id === productId);
  },
  remove(productId: string) {
    wishlistItems = wishlistItems.filter(p => p.id !== productId);
    notifyListeners();
  },
  getCount() {
    return wishlistItems.length;
  },
};

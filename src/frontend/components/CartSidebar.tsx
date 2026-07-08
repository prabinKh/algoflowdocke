import { useSyncExternalStore } from "react";
import { X, Minus, Plus, ShoppingBag, Heart } from "lucide-react";
import { Link } from "react-router-dom";
import { cartStore } from "@/stores/cart";
import { wishlistStore } from "@/stores/wishlist";
import { formatPrice } from "@/lib/utils";
import { toast } from "sonner";

type Props = { open: boolean; onClose: () => void };

export const CartSidebar = ({ open, onClose }: Props) => {
  const items = useSyncExternalStore(cartStore.subscribe, cartStore.getSnapshot);
  const total = items.reduce((sum, i) => sum + i.product.price * i.quantity, 0);

  if (!open) return null;

  const handleSaveForLater = (productId: string) => {
    const item = items.find(i => i.product.id === productId);
    if (item) {
      wishlistStore.toggle(item.product);
      cartStore.removeItem(productId);
      toast("Saved to wishlist");
    }
  };

  return (
    <div className="fixed inset-0 z-50" onClick={onClose}>
      <div className="absolute inset-0 bg-foreground/30 backdrop-blur-sm" />
      <div
        className="absolute right-0 top-0 bottom-0 w-full max-w-sm sm:max-w-md bg-card shadow-[var(--shadow-xl)] animate-slide-in-right flex flex-col"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-4 border-b border-border">
          <h2 className="text-lg font-display font-semibold">Cart ({items.length})</h2>
          <button onClick={onClose} className="p-1.5 text-muted-foreground hover:text-foreground rounded-lg hover:bg-accent transition-colors">
            <X size={20} />
          </button>
        </div>

        {items.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center gap-4 text-muted-foreground">
            <div className="w-16 h-16 rounded-full bg-accent flex items-center justify-center">
              <ShoppingBag size={32} strokeWidth={1} />
            </div>
            <p className="text-sm">Your cart is empty</p>
            <button onClick={onClose} className="text-sm text-primary hover:underline font-medium">
              Continue browsing
            </button>
          </div>
        ) : (
          <>
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {items.map(item => (
                <div key={item.product.id} className="flex gap-3 p-3 bg-accent/50 border border-border/50 rounded-xl">
                  <img src={item.product.image} alt={item.product.name} className="w-16 h-16 object-cover rounded-lg bg-accent" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{item.product.name}</p>
                    <p className="price-display text-sm mt-1">{formatPrice(item.product.price)}</p>
                    <div className="flex items-center gap-2 mt-2">
                      <button
                        onClick={() => cartStore.updateQuantity(item.product.id, item.quantity - 1)}
                        className="w-6 h-6 flex items-center justify-center border border-border rounded-md text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
                      >
                        <Minus size={12} />
                      </button>
                      <span className="text-sm font-mono tabular-nums w-6 text-center">{item.quantity}</span>
                      <button
                        onClick={() => cartStore.updateQuantity(item.product.id, item.quantity + 1)}
                        className="w-6 h-6 flex items-center justify-center border border-border rounded-md text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
                      >
                        <Plus size={12} />
                      </button>
                      <div className="ml-auto flex items-center gap-2">
                        <button
                          onClick={() => handleSaveForLater(item.product.id)}
                          className="text-xs text-muted-foreground hover:text-primary font-medium flex items-center gap-1 transition-colors"
                          title="Save for later"
                        >
                          <Heart size={12} />
                        </button>
                        <button
                          onClick={() => cartStore.removeItem(item.product.id)}
                          className="text-xs text-destructive hover:underline font-medium"
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <div className="p-4 border-t border-border space-y-3 bg-card">
              <div className="flex justify-between items-center">
                <span className="font-medium">Total</span>
                <span className="price-display text-lg">{formatPrice(total)}</span>
              </div>
              <Link
                to="/checkout"
                onClick={onClose}
                className="btn-primary w-full justify-center py-3"
              >
                Checkout
              </Link>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

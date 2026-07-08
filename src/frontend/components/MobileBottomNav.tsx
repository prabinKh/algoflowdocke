import { Link, useLocation } from "react-router-dom";
import { useSyncExternalStore } from "react";
import { Home, Search, Heart, ShoppingCart, User, Wrench } from "lucide-react";
import { cartStore } from "@/stores/cart";
import { wishlistStore } from "@/stores/wishlist";

export const MobileBottomNav = () => {
  const location = useLocation();
  const cartItems = useSyncExternalStore(cartStore.subscribe, cartStore.getSnapshot);
  const wishlistItems = useSyncExternalStore(wishlistStore.subscribe, wishlistStore.getSnapshot);
  const cartCount = cartItems.reduce((sum, i) => sum + i.quantity, 0);
  const wishlistCount = wishlistItems.length;

  const navItems = [
    { icon: Home, label: "Home", path: "/" },
    { icon: Search, label: "Search", path: "/search" },
    { icon: Wrench, label: "Repair", path: "/service-center" },
    { icon: Heart, label: "Wishlist", path: "/wishlist", badge: wishlistCount },
    { icon: ShoppingCart, label: "Cart", path: "/checkout", badge: cartCount },
    { icon: User, label: "Account", path: "/signin" },
  ];

  return (
    <nav className="fixed bottom-4 left-4 right-4 z-[100] bg-card/90 backdrop-blur-xl border border-border/50 shadow-[0_8px_32px_rgba(0,0,0,0.12)] lg:hidden rounded-2xl overflow-hidden">
      <div className="flex items-center justify-around h-16 px-2">
        {navItems.map(item => {
          const isActive = location.pathname === item.path;
          return (
            <Link
              key={item.path}
              to={item.path}
              className={`relative flex flex-col items-center justify-center gap-1 px-1 py-1 min-w-[50px] transition-all duration-300
                ${isActive ? "text-primary scale-110" : "text-muted-foreground hover:text-foreground"}`}
            >
              <div className="relative">
                <item.icon size={isActive ? 22 : 20} strokeWidth={isActive ? 2.5 : 1.5} />
                {item.badge !== undefined && item.badge > 0 && (
                  <span className="absolute -top-1.5 -right-2 min-w-[16px] h-4 bg-primary text-primary-foreground text-[8px] font-bold rounded-full flex items-center justify-center px-1 border-2 border-card">
                    {item.badge}
                  </span>
                )}
              </div>
              <span className={`text-[9px] tracking-tight ${isActive ? "font-bold" : "font-medium"}`}>{item.label}</span>
              {isActive && (
                <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 bg-primary rounded-full shadow-[0_0_10px_rgba(var(--primary),0.5)]" />
              )}
            </Link>
          );
        })}
      </div>
      {/* Safe area for iOS - only if not using floating style, but let's keep it for padding if needed */}
      <div className="h-[env(safe-area-inset-bottom)]" />
    </nav>
  );
};

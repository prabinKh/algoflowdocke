import { useSyncExternalStore, useRef } from "react";
import { Link } from "react-router-dom";
import { useGSAPReveal } from "@/hooks/useGSAP";
import { Header } from "@/frontend/components/Header";
import { Footer } from "@/frontend/components/Footer";
import { MobileBottomNav } from "@/frontend/components/MobileBottomNav";
import { ProductCard } from "@/frontend/components/ProductCard";
import { wishlistStore } from "@/stores/wishlist";
import { ChevronRight, Heart } from "lucide-react";

const WishlistPage = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const items = useSyncExternalStore(wishlistStore.subscribe, wishlistStore.getSnapshot);

  useGSAPReveal(containerRef, ".gsap-reveal", { opacity: 0, y: 20, duration: 0.6, stagger: 0.1 });

  return (
    <div className="min-h-screen bg-background pb-16 lg:pb-0" ref={containerRef}>
      <Header />
      <main className="neo-container py-4 sm:py-6">
        <nav className="flex items-center gap-1.5 text-[10px] sm:text-xs text-muted-foreground mb-4 sm:mb-6 gsap-reveal">
          <Link to="/" className="hover:text-primary transition-colors">Home</Link>
          <ChevronRight size={12} />
          <span className="text-foreground">Wishlist</span>
        </nav>

        <div className="flex items-center gap-3 mb-6 gsap-reveal">
          <div className="w-1 h-6 bg-destructive rounded-full" />
          <h1 className="text-xl sm:text-2xl font-display font-bold">My Wishlist</h1>
          <span className="text-sm text-muted-foreground">({items.length} items)</span>
        </div>

        {items.length === 0 ? (
          <div className="text-center py-20 text-muted-foreground gsap-reveal">
            <div className="w-20 h-20 rounded-full bg-accent flex items-center justify-center mx-auto mb-4">
              <Heart size={36} strokeWidth={1} />
            </div>
            <p className="text-lg mb-2">Your wishlist is empty</p>
            <p className="text-sm mb-6">Browse products and add your favorites</p>
            <Link to="/" className="btn-primary">Browse Products</Link>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 sm:gap-4">
            {items.map((product, i) => (
              <ProductCard key={product.id} product={product} index={i} />
            ))}
          </div>
        )}
      </main>
      <Footer />
      <MobileBottomNav />
    </div>
  );
};

export default WishlistPage;

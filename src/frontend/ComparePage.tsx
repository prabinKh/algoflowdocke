import { useSyncExternalStore, useRef } from "react";
import { Link } from "react-router-dom";
import { useGSAPReveal } from "@/hooks/useGSAP";
import { Header } from "@/frontend/components/Header";
import { Footer } from "@/frontend/components/Footer";
import { MobileBottomNav } from "@/frontend/components/MobileBottomNav";
import { compareStore } from "@/stores/compare";
import { cartStore } from "@/stores/cart";
import { formatPrice } from "@/lib/utils";
import { ChevronRight, X, ShoppingCart, Star, GitCompareArrows } from "lucide-react";
import { toast } from "sonner";

const ComparePage = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const items = useSyncExternalStore(compareStore.subscribe, compareStore.getSnapshot);

  useGSAPReveal(containerRef, ".gsap-reveal", { opacity: 0, y: 20, duration: 0.6, stagger: 0.1 });

  // Collect all spec keys
  const allSpecKeys = [...new Set(items.flatMap(p => Object.keys(p.detailedSpecs || {})))];

  return (
    <div className="min-h-screen bg-background pb-16 lg:pb-0" ref={containerRef}>
      <Header />
      <main className="neo-container py-4 sm:py-6">
        <nav className="flex items-center gap-1.5 text-[10px] sm:text-xs text-muted-foreground mb-4 sm:mb-6 gsap-reveal">
          <Link to="/" className="hover:text-primary transition-colors">Home</Link>
          <ChevronRight size={12} />
          <span className="text-foreground">Compare Products</span>
        </nav>

        <div className="flex items-center justify-between mb-6 gsap-reveal">
          <div className="flex items-center gap-3">
            <div className="w-1 h-6 bg-primary rounded-full" />
            <h1 className="text-xl sm:text-2xl font-display font-bold">Compare Products</h1>
            <span className="text-sm text-muted-foreground">({items.length}/4)</span>
          </div>
          {items.length > 0 && (
            <button
              onClick={() => { compareStore.clear(); toast("Comparison cleared"); }}
              className="text-xs text-destructive hover:underline font-medium"
            >
              Clear all
            </button>
          )}
        </div>

        {items.length === 0 ? (
          <div className="text-center py-20 text-muted-foreground gsap-reveal">
            <div className="w-20 h-20 rounded-full bg-accent flex items-center justify-center mx-auto mb-4">
              <GitCompareArrows size={36} strokeWidth={1} />
            </div>
            <p className="text-lg mb-2">No products to compare</p>
            <p className="text-sm mb-6">Add products from any page to compare them side by side</p>
            <Link to="/" className="btn-primary">Browse Products</Link>
          </div>
        ) : (
          <div className="overflow-x-auto -mx-4 px-4 gsap-reveal">
            <table className="w-full min-w-[600px] border-collapse">
              <thead>
                <tr>
                  <th className="text-left p-3 bg-accent/50 border border-border rounded-tl-lg w-36 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Feature
                  </th>
                  {items.map(product => (
                    <th key={product.id} className="p-3 bg-accent/50 border border-border text-center min-w-[180px]">
                      <div className="relative">
                        <button
                          onClick={() => { compareStore.remove(product.id); toast("Removed from compare"); }}
                          className="absolute -top-1 -right-1 w-6 h-6 rounded-full bg-card border border-border flex items-center justify-center text-muted-foreground hover:text-destructive hover:border-destructive/30 transition-colors"
                        >
                          <X size={12} />
                        </button>
                        <Link to={product.slug || product.id ? `/product/${product.slug || product.id}` : "#"} className={`block ${!(product.slug || product.id) ? "pointer-events-none" : ""}`}>
                          <img src={product.image} alt={product.name} className="w-24 h-24 object-contain mx-auto mb-2" />
                          <p className={`text-xs font-medium text-foreground hover:text-primary transition-colors line-clamp-2 ${!(product.slug || product.id) ? "opacity-50" : ""}`}>
                            {product.name}
                          </p>
                        </Link>
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {/* Price row */}
                <tr>
                  <td className="p-3 border border-border text-xs font-medium text-foreground bg-card">Price</td>
                  {items.map(p => (
                    <td key={p.id} className="p-3 border border-border text-center bg-card">
                      <span className="price-display text-sm">{formatPrice(p.price)}</span>
                      {p.originalPrice && (
                        <span className="block price-original text-xs mt-0.5">{formatPrice(p.originalPrice)}</span>
                      )}
                    </td>
                  ))}
                </tr>
                {/* Brand */}
                <tr>
                  <td className="p-3 border border-border text-xs font-medium text-foreground bg-accent/30">Brand</td>
                  {items.map(p => (
                    <td key={p.id} className="p-3 border border-border text-center text-xs bg-accent/30 font-mono">{p.brand}</td>
                  ))}
                </tr>
                {/* Rating */}
                <tr>
                  <td className="p-3 border border-border text-xs font-medium text-foreground bg-card">Rating</td>
                  {items.map(p => (
                    <td key={p.id} className="p-3 border border-border text-center bg-card">
                      <div className="flex items-center justify-center gap-1">
                        <div className="flex gap-px">
                          {[...Array(5)].map((_, i) => (
                            <Star key={i} size={10} className={i < Math.floor(p.rating) ? "fill-warning text-warning" : "text-border"} />
                          ))}
                        </div>
                        <span className="text-[10px] text-muted-foreground">({p.reviews})</span>
                      </div>
                    </td>
                  ))}
                </tr>
                {/* Specs */}
                <tr>
                  <td className="p-3 border border-border text-xs font-medium text-foreground bg-accent/30">Key Specs</td>
                  {items.map(p => (
                    <td key={p.id} className="p-3 border border-border text-center bg-accent/30">
                      <div className="flex flex-wrap justify-center gap-1">
                        {p.specs.map((s, i) => (
                          <span key={i} className="px-1.5 py-0.5 bg-accent rounded text-[10px] font-mono text-muted-foreground">{s}</span>
                        ))}
                      </div>
                    </td>
                  ))}
                </tr>
                {/* Detailed specs */}
                {allSpecKeys.map(key => (
                  <tr key={key}>
                    <td className="p-3 border border-border text-xs font-medium text-foreground bg-card">{key}</td>
                    {items.map(p => (
                      <td key={p.id} className="p-3 border border-border text-center text-xs font-mono text-muted-foreground bg-card">
                        {p.detailedSpecs?.[key] || "—"}
                      </td>
                    ))}
                  </tr>
                ))}
                {/* Stock */}
                <tr>
                  <td className="p-3 border border-border text-xs font-medium text-foreground bg-accent/30">Availability</td>
                  {items.map(p => (
                    <td key={p.id} className="p-3 border border-border text-center bg-accent/30">
                      <span className={`text-xs font-medium ${p.inStock ? "text-success" : "text-destructive"}`}>
                        {p.inStock ? "In Stock" : "Out of Stock"}
                      </span>
                    </td>
                  ))}
                </tr>
                {/* Add to cart */}
                <tr>
                  <td className="p-3 border border-border bg-card" />
                  {items.map(p => (
                    <td key={p.id} className="p-3 border border-border text-center bg-card">
                      <button
                        onClick={() => { cartStore.addItem(p); toast.success(`${p.name} added to cart`); }}
                        disabled={!p.inStock}
                        className="btn-primary text-xs py-2 px-4 disabled:opacity-40"
                      >
                        <ShoppingCart size={14} />
                        Add to Cart
                      </button>
                    </td>
                  ))}
                </tr>
              </tbody>
            </table>
          </div>
        )}
      </main>
      <Footer />
      <MobileBottomNav />
    </div>
  );
};

export default ComparePage;

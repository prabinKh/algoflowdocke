import { Link } from "react-router-dom";
import { ShoppingCart, Star, Heart, GitCompareArrows, Eye, Check, Truck, MessageCircle, HelpCircle } from "lucide-react";
import { type Product } from "@/lib/types";
import { formatPrice } from "@/lib/utils";
import { cartStore } from "@/stores/cart";
import { wishlistStore } from "@/stores/wishlist";
import { compareStore } from "@/stores/compare";
import { toast } from "sonner";
import { useSyncExternalStore, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { CachedImage } from "@/components/ui/cached-image";
import { userActivityService } from "@/api/userActivityService";

type Props = {
  product: Product;
  index?: number;
};

export const ProductCard = ({ product, index = 0 }: Props) => {
  const wishlist = useSyncExternalStore(wishlistStore.subscribe, wishlistStore.getSnapshot);
  const compare = useSyncExternalStore(compareStore.subscribe, compareStore.getSnapshot);
  const isWishlisted = wishlist.some(p => p.id === product.id);
  const isComparing = compare.some(p => p.id === product.id);
  const [isAdding, setIsAdding] = useState(false);

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!product.inStock || isAdding) return;
    
    setIsAdding(true);
    cartStore.addItem(product);
    
    userActivityService.track("add_to_cart", {
      productId: product.id,
      productName: product.name,
      productSlug: product.slug,
      price: product.price
    });

    toast.success(`${product.name} added to cart`, {
      icon: <ShoppingCart className="w-4 h-4 text-primary" />,
    });

    setTimeout(() => setIsAdding(false), 2000);
  };

  const handleCardClick = () => {
    userActivityService.track("click_product_card", {
      productId: product.id,
      productName: product.name,
      productSlug: product.slug,
      index
    });
  };

  const handleWishlist = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const added = wishlistStore.toggle(product);
    toast(added ? "Added to wishlist" : "Removed from wishlist", {
      icon: <Heart className={`w-4 h-4 ${added ? "text-destructive fill-destructive" : ""}`} />,
    });
  };

  const handleCompare = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const result = compareStore.toggle(product);
    if (result === null) {
      toast.error("You can compare up to 4 products");
    } else {
      toast(result ? "Added to compare" : "Removed from compare", {
        icon: <GitCompareArrows className="w-4 h-4 text-primary" />,
      });
    }
  };

  const handleQuery = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const payload = {
      type: 'product' as const,
      productName: product.name,
      productPrice: formatPrice(product.price),
      productUrl: window.location.origin + (product.slug || product.id ? `/product/${product.slug || product.id}` : ""),
      productImage: product.image
    };

    if (window.openChat) {
      window.openChat(payload);
    } else {
      window.dispatchEvent(new CustomEvent("open-chat", { detail: payload }));
    }
  };

  return (
    <div
      className="h-full gsap-reveal"
    >
        <Link
          to={product.slug || product.id ? `/product/${product.slug || product.id}` : "#"}
          onClick={handleCardClick}
          className={`group product-card h-full flex flex-col ${!(product.slug || product.id) ? "pointer-events-none" : ""}`}
        >
        {/* Badges */}
        <div className="absolute top-3 left-3 z-10 flex flex-col gap-1.5">
          <AnimatePresence>
            {product.discount && product.discount > 0 && (
              <motion.span 
                key="sale-badge"
                initial={{ scale: 0.8, opacity: 0, x: -10 }}
                animate={{ scale: 1, opacity: 1, x: 0 }}
                className="neo-badge-sale"
              >
                -{product.discount}%
              </motion.span>
            )}
            {product.isNew && (
              <motion.span 
                key="new-badge"
                initial={{ scale: 0.8, opacity: 0, x: -10 }}
                animate={{ scale: 1, opacity: 1, x: 0 }}
                className="neo-badge-new"
              >
                New
              </motion.span>
            )}
            {product.rating >= 4.8 && (
              <motion.span 
                key="best-seller-badge"
                initial={{ scale: 0.8, opacity: 0, x: -10 }}
                animate={{ scale: 1, opacity: 1, x: 0 }}
                className="neo-badge bg-amber-500 text-white shadow-sm flex items-center gap-1"
              >
                <Star size={10} className="fill-white" />
                Best Seller
              </motion.span>
            )}
            {product.price > 500 && (
              <motion.span 
                key="trust-badge"
                initial={{ scale: 0.8, opacity: 0, x: -10 }}
                animate={{ scale: 1, opacity: 1, x: 0 }}
                className="neo-badge-trust flex items-center gap-1"
              >
                <Truck size={10} />
                Free Shipping
              </motion.span>
            )}
            {product.collections && product.collections.map(c => (
              <motion.span 
                key={c}
                initial={{ scale: 0.8, opacity: 0, x: -10 }}
                animate={{ scale: 1, opacity: 1, x: 0 }}
                className="px-2 py-0.5 bg-primary/10 text-primary text-[8px] font-bold uppercase tracking-widest rounded-full border border-primary/20 backdrop-blur-sm"
              >
                {c}
              </motion.span>
            ))}
          </AnimatePresence>
        </div>

        {/* Action buttons */}
        <div className="absolute top-3 right-3 z-10 flex flex-col gap-2 translate-x-4 opacity-0 group-hover:translate-x-0 group-hover:opacity-100 transition-all duration-300 ease-out">
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={handleWishlist}
            className={`w-9 h-9 rounded-full backdrop-blur-md border flex items-center justify-center shadow-sm transition-all duration-200
              ${isWishlisted
                ? "bg-destructive/10 border-destructive/30 text-destructive"
                : "bg-background/80 border-border/50 text-muted-foreground hover:text-destructive hover:border-destructive/30"
              }`}
            title="Add to wishlist"
          >
            <Heart size={16} fill={isWishlisted ? "currentColor" : "none"} />
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={handleCompare}
            className={`w-9 h-9 rounded-full backdrop-blur-md border flex items-center justify-center shadow-sm transition-all duration-200
              ${isComparing
                ? "bg-primary/10 border-primary/30 text-primary"
                : "bg-background/80 border-border/50 text-muted-foreground hover:text-primary hover:border-primary/30"
              }`}
            title="Add to compare"
          >
            <GitCompareArrows size={16} />
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={handleQuery}
            className="w-9 h-9 rounded-full backdrop-blur-md border border-border/50 bg-background/80 text-muted-foreground hover:text-primary hover:border-primary/30 flex items-center justify-center shadow-sm transition-all duration-200"
            title="Ask about this product"
          >
            <MessageCircle size={16} />
          </motion.button>
        </div>

        {/* Image */}
        <div className="product-card-image relative mb-3 overflow-hidden">
          <CachedImage
            whileHover={{ scale: 1.1, rotate: 2 }}
            transition={{ type: "spring", stiffness: 300, damping: 15 }}
            src={product.image}
            alt={product.name}
            className="w-full h-full object-contain"
          />
          
          {/* Quick View Overlay */}
          <div className="absolute inset-0 bg-primary/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              whileHover={{ scale: 1.1 }}
              className="bg-card text-primary px-4 py-2 rounded-full font-bold text-xs shadow-xl flex items-center gap-2"
            >
              <Eye size={14} />
              Quick View
            </motion.div>
          </div>
          {!product.inStock && (
            <div className="absolute inset-0 bg-background/60 backdrop-blur-[2px] flex items-center justify-center rounded-[var(--radius-inner)]">
              <div className="flex flex-col items-center gap-1">
                <span className="px-3 py-1 bg-destructive/10 text-destructive text-[10px] font-bold uppercase tracking-widest rounded-full border border-destructive/20">
                  Out of Stock
                </span>
                <span className="text-[8px] font-black italic text-destructive/80 uppercase tracking-tighter bg-white/80 px-2 py-0.5 rounded-md">
                  In 1 Day
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Info */}
        <div className="flex-1 flex flex-col gap-2 px-1 pb-1">
          <div className="flex items-center justify-between gap-2">
            <span className="text-[10px] font-bold text-primary/70 uppercase tracking-[0.15em]">{product.brand}</span>
            <div className="flex items-center gap-1 px-1.5 py-0.5 bg-warning/10 rounded-full">
              <Star size={10} className="fill-warning text-warning" />
              <span className="text-[10px] font-bold text-warning-foreground/80">{product.rating}</span>
            </div>
          </div>

          <h3 className="text-sm font-bold leading-tight line-clamp-2 text-foreground group-hover:text-primary transition-colors min-h-[2.5rem]">
            {product.name}
          </h3>

          {/* Add to Cart - Moved Up */}
          <div className="mt-1">
            <motion.button
              whileHover={{ scale: 1.02, boxShadow: "0 10px 20px rgba(37,99,235,0.15)" }}
              whileTap={{ scale: 0.98 }}
              onClick={handleAddToCart}
              disabled={!product.inStock || isAdding}
              className={`w-full h-10 rounded-xl text-primary-foreground
                       shadow-sm transition-all duration-300
                       flex items-center justify-center gap-2 group/btn relative overflow-hidden px-4
                       ${isAdding ? "bg-emerald-500 shadow-emerald-200" : "bg-primary shadow-primary/20"}`}
            >
              <AnimatePresence mode="wait">
                {isAdding ? (
                  <motion.div
                    key="check"
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    exit={{ y: -20, opacity: 0 }}
                    className="flex items-center gap-2"
                  >
                    <Check size={16} />
                    <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider">Added</span>
                  </motion.div>
                ) : (
                  <motion.div
                    key="cart"
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    exit={{ y: -20, opacity: 0 }}
                    className="flex items-center gap-2"
                  >
                    <ShoppingCart size={16} className="group-hover/btn:scale-110 transition-transform" />
                    <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider">Add to Cart</span>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.button>
          </div>

          {/* Colors */}
          {product.colors && product.colors.length > 0 && (
            <div className="flex gap-1.5 mt-1">
              {product.colors.slice(0, 4).map((color, i) => (
                <div 
                  key={i}
                  className="w-3 h-3 rounded-full border border-border/50 shadow-sm"
                  style={{ backgroundColor: color.hex }}
                  title={color.name}
                />
              ))}
              {product.colors.length > 4 && (
                <span className="text-[8px] text-muted-foreground font-bold">+{product.colors.length - 4}</span>
              )}
            </div>
          )}

          {/* Quick Specs */}
          <div className="flex gap-1.5 flex-wrap mt-1">
            {(Array.isArray(product.specs) ? product.specs : []).slice(0, 2).map((spec, i) => (
              <span key={i} className="px-2 py-0.5 bg-accent/50 rounded text-[9px] uppercase tracking-wider font-semibold text-muted-foreground/80">
                {spec}
              </span>
            ))}
          </div>

          <div className="mt-auto pt-3 flex flex-col gap-2">
            <div className="flex flex-wrap items-end justify-between gap-2">
              <div className="flex flex-col min-w-0">
                <span className="text-lg sm:text-xl font-black tracking-tighter text-foreground truncate">
                  {formatPrice(product.price)}
                </span>
                {product.originalPrice && (
                  <span className="text-[10px] sm:text-xs text-muted-foreground/50 line-through decoration-destructive/30 font-medium truncate">
                    {formatPrice(product.originalPrice)}
                  </span>
                )}
              </div>
              <button 
                onClick={handleQuery}
                className="flex items-center gap-1.5 text-[10px] font-black text-primary hover:bg-primary hover:text-primary-foreground uppercase tracking-widest shrink-0 bg-primary/10 px-3 py-2 rounded-xl mb-0.5 transition-all active:scale-95 shadow-sm"
              >
                <MessageCircle size={12} className="sm:w-3.5 sm:h-3.5" />
                Query
              </button>
            </div>
            
            {product.isLimitedStock && (
              <div className="flex flex-col gap-1 mt-1">
                <span className="text-[9px] font-bold text-destructive uppercase tracking-widest">
                  Only a few left!
                </span>
                <div className="stock-progress-bar">
                  <motion.div 
                    initial={{ width: "100%" }}
                    animate={{ width: "25%" }}
                    transition={{ duration: 1.5, delay: 0.5 }}
                    className="stock-progress-fill" 
                  />
                </div>
              </div>
            )}
          </div>
        </div>
      </Link>
    </div>
  );
};

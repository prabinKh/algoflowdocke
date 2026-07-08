import { useParams, Link } from "react-router-dom";
import { useState, useSyncExternalStore, useRef, useMemo } from "react";
import { Helmet } from "react-helmet-async";
import { useGSAPReveal, useGSAPParallax } from "@/hooks/useGSAP";
import { Header } from "@/frontend/components/Header";
import { Footer } from "@/frontend/components/Footer";
import { MobileBottomNav } from "@/frontend/components/MobileBottomNav";
import { wishlistStore } from "@/stores/wishlist";
import { compareStore } from "@/stores/compare";
import { ProductCard } from "@/frontend/components/ProductCard";
import { formatPrice } from "@/lib/utils";
import { useProducts } from "@/hooks/useProducts";
import { cartStore } from "@/stores/cart";
import { ChevronRight, ShoppingCart, Truck, Shield, RotateCcw, Star, CheckCircle, Heart, GitCompareArrows, Search, Box, Check, MessageCircle, Settings } from "lucide-react";
import { toast } from "sonner";
import Product3DShowcase from "@/frontend/components/Product3DShowcase";
import Stack from "@/frontend/components/Stack";
import TiltedCard from "@/frontend/components/TiltedCard";
import { motion } from "motion/react";
import { CachedImage } from "@/components/ui/cached-image";

const ProductDetailPage = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const showcaseRef = useRef<HTMLDivElement>(null);
  const { slug } = useParams<{ slug: string }>();
  const { products: allProducts, loading } = useProducts();
  
  const product = useMemo(() => 
    allProducts.find(p => p.slug === slug || p.id === slug), 
    [allProducts, slug]
  );

  const related = useMemo(() => 
    allProducts
      .filter(p => product && p.categorySlug === product.categorySlug && p.id !== product.id)
      .slice(0, 4),
    [allProducts, product]
  );

  const [activeTab, setActiveTab] = useState<"description" | "specs">("description");
  const [selectedColor, setSelectedColor] = useState<string | null>(null);

  const scrollToShowcase = () => {
    showcaseRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // Reveal animations
  useGSAPReveal(containerRef, ".gsap-reveal", { opacity: 0, y: 30, duration: 0.8, stagger: 0.1 });
  useGSAPReveal(containerRef, ".gsap-reveal-img", { opacity: 0, scale: 0.9, duration: 1 });
  
  // Parallax for product image
  useGSAPParallax(containerRef, ".product-parallax-img", 10);

  // Subscribe to stores to trigger re-renders
  useSyncExternalStore(wishlistStore.subscribe, wishlistStore.getSnapshot);
  useSyncExternalStore(compareStore.subscribe, compareStore.getSnapshot);

  if (!product) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <Header />
        <main className="flex-grow flex items-center justify-center py-24">
          <div className="neo-container text-center max-w-md mx-auto">
            <div className="w-20 h-20 bg-muted rounded-full flex items-center justify-center mx-auto mb-6">
              <Search className="w-10 h-10 text-muted-foreground" />
            </div>
            <h1 className="text-3xl font-display font-bold mb-4">Product Not Found</h1>
            <p className="text-muted-foreground mb-8">
              The product you are looking for might have been moved, deleted, or the link is incorrect.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link 
                to="/" 
                className="neo-button bg-primary text-primary-foreground px-8 py-3 rounded-full font-medium hover:opacity-90 transition-opacity"
              >
                Back to Home
              </Link>
              <Link 
                to="/search" 
                className="neo-button bg-secondary text-secondary-foreground px-8 py-3 rounded-full font-medium hover:opacity-90 transition-opacity"
              >
                Search Products
              </Link>
            </div>
          </div>
        </main>
        <Footer />
        <MobileBottomNav />
      </div>
    );
  }

  const handleAddToCart = () => {
    cartStore.addItem(product);
    toast.success(`${product.name} added to cart`);
  };

  const handleQuery = () => {
    const payload = {
      type: 'product' as const,
      productName: product.name,
      productPrice: formatPrice(product.price),
      productUrl: window.location.href,
      productImage: product.image
    };

    if (window.openChat) {
      window.openChat(payload);
    } else {
      window.dispatchEvent(new CustomEvent("open-chat", { detail: payload }));
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-background" ref={containerRef}>
      <Helmet>
        <title>{`${product.name} | FixItAll Store`}</title>
        <meta name="description" content={product.description.substring(0, 160)} />
        <meta name="keywords" content={`${product.name}, ${product.brand}, ${product.category}, electronics repair, buy ${product.name}, FixItAll`} />
        <link rel="canonical" href={window.location.href} />
        
        {/* Open Graph / Facebook */}
        <meta property="og:title" content={`${product.name} | FixItAll Store`} />
        <meta property="og:description" content={product.description.substring(0, 160)} />
        <meta property="og:image" content={product.image} />
        <meta property="og:url" content={window.location.href} />
        <meta property="og:type" content="product" />
        <meta property="product:brand" content={product.brand} />
        <meta property="product:category" content={product.category} />
        <meta property="product:price:amount" content={product.price.toString()} />
        <meta property="product:price:currency" content="USD" />
        <meta property="product:availability" content={product.inStock ? "instock" : "oos"} />
        
        {/* Twitter */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={`${product.name} | FixItAll Store`} />
        <meta name="twitter:description" content={product.description.substring(0, 160)} />
        <meta name="twitter:image" content={product.image} />

        {/* Structured Data (JSON-LD) */}
        <script type="application/ld+json">
          {JSON.stringify({
            "@context": "https://schema.org/",
            "@type": "Product",
            "name": product.name,
            "image": product.image,
            "description": product.description,
            "brand": {
              "@type": "Brand",
              "name": product.brand
            },
            "offers": {
              "@type": "Offer",
              "url": window.location.href,
              "priceCurrency": "USD",
              "price": product.price,
              "availability": product.inStock ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
              "itemCondition": "https://schema.org/NewCondition"
            },
            "aggregateRating": {
              "@type": "AggregateRating",
              "ratingValue": product.rating,
              "reviewCount": product.reviews
            }
          })}
        </script>
      </Helmet>
      <Header />
      
      <main className="flex-grow pt-24 pb-20">
        <div className="neo-container space-y-6">
          {/* Breadcrumb */}
          <nav className="flex items-center gap-1.5 text-[10px] sm:text-xs text-muted-foreground flex-wrap">
            <Link to="/" className="hover:text-primary transition-colors">Home</Link>
            <ChevronRight size={12} />
            <Link to={`/category/${product.categorySlug}`} className="hover:text-primary transition-colors">{product.category}</Link>
            <ChevronRight size={12} />
            <span className="text-foreground truncate max-w-[200px] sm:max-w-none">{product.name}</span>
          </nav>

          {/* Product Detail */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8 lg:gap-12">
            {/* Images */}
            <div className="gsap-reveal-img relative group">
              <div className="bg-gradient-to-br from-accent to-muted rounded-[var(--radius-outer)] p-6 sm:p-8 flex items-center justify-center aspect-square border border-border/50 shadow-[var(--shadow-sm)] overflow-hidden">
                <TiltedCard
                  imageSrc={product.image}
                  altText={product.name}
                  captionText={product.name}
                  containerClassName="w-full h-full"
                  imageClassName="product-parallax-img"
                  rotateAmplitude={25}
                  scaleOnHover={1.3}
                  showTooltip={true}
                />
                
                <button 
                  onClick={scrollToShowcase}
                  className="absolute bottom-4 right-4 bg-emerald-500/90 hover:bg-emerald-500 text-white p-2 rounded-full shadow-lg backdrop-blur-sm transition-all duration-300 hover:scale-110 active:scale-95 flex items-center gap-2 px-4"
                >
                  <Box size={16} />
                  <span className="text-[10px] font-bold uppercase tracking-wider">View 3D</span>
                </button>
              </div>
            </div>

            {/* Info */}
            <div className="space-y-4 sm:space-y-6 gsap-reveal">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <p className="spec-label">{product.brand}</p>
                  {product.collections && product.collections.length > 0 && (
                    <div className="flex gap-1">
                      {product.collections.map(c => (
                        <span key={c} className="px-2 py-0.5 bg-primary/10 text-primary text-[8px] font-bold uppercase tracking-widest rounded-full border border-primary/20">
                          {c}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
                <h1 className="text-xl sm:text-2xl lg:text-3xl font-display font-bold tracking-tight">{product.name}</h1>
              </div>

              {/* Rating */}
              <div className="flex items-center gap-3">
                <div className="flex gap-0.5">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      size={16}
                      className={i < Math.floor(product.rating) ? "fill-warning text-warning" : "text-border"}
                    />
                  ))}
                </div>
                <span className="text-sm text-muted-foreground">({product.reviews} reviews)</span>
              </div>

              {/* Specs */}
              <div className="flex gap-2 flex-wrap">
                {(Array.isArray(product.specs) ? product.specs : []).map((spec, i) => (
                  <span key={i} className="px-3 py-1.5 bg-accent border border-border/50 rounded-lg text-xs font-mono uppercase tracking-wider text-muted-foreground">
                    {spec}
                  </span>
                ))}
              </div>

              {/* Price */}
              <div className="flex items-end gap-3 bg-accent/50 border border-border/50 rounded-xl p-4">
                <span className="price-display text-2xl sm:text-3xl">{formatPrice(product.price)}</span>
                {product.originalPrice && (
                  <span className="price-original text-base sm:text-lg">{formatPrice(product.originalPrice)}</span>
                )}
                {product.discount && (
                  <span className="neo-badge-sale ml-auto">{product.discount}% off</span>
                )}
              </div>

              {/* Key Highlights */}
              {product.keySpecifications && product.keySpecifications.length > 0 && (
                <div className="space-y-3 bg-primary/5 border border-primary/10 rounded-xl p-4">
                  <h3 className="text-[10px] font-bold uppercase tracking-widest text-primary flex items-center gap-2">
                    <CheckCircle size={12} />
                    Product Highlights
                  </h3>
                  <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {product.keySpecifications.map((spec, i) => (
                      <li key={i} className="flex items-start gap-2 text-[11px] text-muted-foreground leading-tight">
                        <span className="w-1.5 h-1.5 rounded-full bg-primary mt-1 shrink-0" />
                        {spec}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Stock */}
              <div className="text-sm flex items-center gap-2">
                {product.inStock ? (
                  <>
                    <CheckCircle size={16} className="text-success" />
                    <span className="text-success font-medium font-mono">
                      In Stock{product.stockCount ? `: ${product.stockCount} Units` : ""}
                    </span>
                  </>
                ) : (
                  <div className="flex flex-col gap-1">
                    <span className="text-destructive font-bold flex items-center gap-2">
                      <Shield size={16} className="text-destructive" />
                      Out of Stock
                    </span>
                    <span className="text-[10px] font-black italic text-destructive/80 uppercase tracking-widest bg-destructive/5 px-3 py-1 rounded-full border border-destructive/10 w-fit">
                      In 1 Day
                    </span>
                  </div>
                )}
              </div>

              {/* Color Selection */}
              {product.colors && product.colors.length > 0 && (
                <div className="space-y-4">
                  <h3 className="text-sm font-bold uppercase tracking-wider">Select Color</h3>
                  <div className="flex flex-wrap gap-3">
                    {product.colors.map((color) => (
                      <button
                        key={color.name}
                        onClick={() => setSelectedColor(color.name)}
                        className={`group relative p-1 rounded-full border-2 transition-all duration-300 ${
                          selectedColor === color.name ? 'border-primary scale-110' : 'border-transparent hover:border-zinc-300'
                        }`}
                        title={color.name}
                      >
                        <div 
                          className="w-8 h-8 rounded-full shadow-inner"
                          style={{ backgroundColor: color.hex }}
                        />
                        {selectedColor === color.name && (
                          <motion.div 
                            layoutId="color-check"
                            className="absolute -top-1 -right-1 bg-primary text-white rounded-full p-0.5 shadow-lg"
                          >
                            <Check size={10} strokeWidth={3} />
                          </motion.div>
                        )}
                      </button>
                    ))}
                  </div>
                  {selectedColor && (
                    <p className="text-xs font-medium text-muted-foreground">
                      Selected: <span className="text-foreground uppercase">{selectedColor}</span>
                    </p>
                  )}
                </div>
              )}

              {/* Actions */}
              <div className="flex flex-wrap gap-2 sm:gap-3">
                <button
                  onClick={handleAddToCart}
                  disabled={!product.inStock}
                  className="flex-1 min-w-[140px] btn-primary py-3 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <ShoppingCart size={18} />
                  Add to Cart
                </button>
                <div className="flex gap-2 sm:gap-3">
                  <button
                    onClick={handleQuery}
                    className="btn-outline py-3 px-3 sm:px-4 text-primary border-primary/20 bg-primary/10 hover:bg-primary hover:text-primary-foreground transition-all active:scale-95 shadow-sm"
                    title="Ask about this product"
                  >
                    <MessageCircle size={18} />
                    <span className="hidden sm:inline ml-2 text-xs font-black uppercase tracking-widest">Query</span>
                  </button>
                  <button
                    onClick={() => { const added = wishlistStore.toggle(product); toast(added ? "Added to wishlist" : "Removed from wishlist"); }}
                    className={`btn-outline py-3 px-3 sm:px-4 ${wishlistStore.has(product.id) ? "text-destructive border-destructive/20 bg-destructive/5" : ""}`}
                    title="Add to wishlist"
                  >
                    <Heart size={18} className={wishlistStore.has(product.id) ? "fill-current" : ""} />
                  </button>
                  <button
                    onClick={() => { const r = compareStore.toggle(product); if (r === null) toast.error("Max 4 products"); else toast(r ? "Added to compare" : "Removed"); }}
                    className={`btn-outline py-3 px-3 sm:px-4 ${compareStore.has(product.id) ? "text-primary border-primary/20 bg-primary/5" : ""}`}
                    title="Add to compare"
                  >
                    <GitCompareArrows size={18} />
                  </button>
                  <button
                    onClick={scrollToShowcase}
                    className="btn-outline py-3 px-3 sm:px-4 text-emerald-500 border-emerald-500/20 bg-emerald-500/5 hover:bg-emerald-500/10"
                    title="View 3D Experience"
                  >
                    <Box size={18} />
                  </button>
                </div>
              </div>

              {/* Guarantees */}
              <div className="grid grid-cols-3 gap-3 sm:gap-4 pt-4 border-t border-border">
                {[
                  { icon: Truck, label: "Free Delivery" },
                  { icon: Shield, label: "3 Year Warranty" },
                  { icon: RotateCcw, label: "Easy Returns" },
                ].map(({ icon: Icon, label }) => (
                  <div key={label} className="flex flex-col items-center gap-1.5 text-center p-3 bg-accent/50 rounded-xl">
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                      <Icon size={16} className="text-primary" />
                    </div>
                    <span className="text-[10px] sm:text-[11px] text-muted-foreground font-medium">{label}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* 3D Showcase Section */}
          <div ref={showcaseRef} className="mt-12 sm:mt-16 gsap-reveal">
            <div className="flex items-center gap-3 mb-6 sm:mb-8">
              <div className="w-1 h-6 bg-emerald-500 rounded-full shadow-[0_0_10px_#10b981]" />
              <h2 className="section-title">Immersive 3D Experience</h2>
            </div>
            <Product3DShowcase 
              mainImage={product.image} 
              additionalImages={product.images} 
              model3D={product.model3D}
            />
            {product.images && product.images.length > 0 && (
              <div className="mt-16 h-96 w-96 mx-auto">
                <Stack 
                  cards={product.images.map((img, i) => (
                    <CachedImage key={i} src={img} alt={`Gallery ${i}`} className="w-full h-full object-cover" />
                  ))} 
                />
              </div>
            )}
          </div>

          {/* Tabs */}
          <div className="mt-12 sm:mt-16 gsap-reveal">
            <div className="flex border-b border-border gap-0">
              {(["description", "specs"] as const).map(tab => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`px-4 sm:px-6 py-3 text-xs sm:text-sm font-medium border-b-2 transition-colors capitalize
                    ${activeTab === tab
                      ? "border-primary text-primary"
                      : "border-transparent text-muted-foreground hover:text-foreground"
                    }`}
                >
                  {tab === "specs" ? "Specifications" : "Description"}
                </button>
              ))}
            </div>
            <div className="py-6 sm:py-8">
              {activeTab === "description" ? (
                <div className="space-y-6 max-w-3xl">
                  <div className="space-y-3">
                    <h3 className="text-sm font-bold uppercase tracking-widest">Summary</h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      {product.description}
                    </p>
                  </div>
                  
                  {product.details && (
                    <div className="space-y-3 pt-6 border-t border-border/50">
                      <h3 className="text-sm font-bold uppercase tracking-widest">Detailed Information</h3>
                      <div className="text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap">
                        {product.details}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="max-w-2xl space-y-8">
                  {/* General Specs */}
                  {product.specs && product.specs.length > 0 && (
                    <div className="space-y-4">
                      <h3 className="text-sm font-bold uppercase tracking-widest flex items-center gap-2">
                        <Box size={14} className="text-primary" />
                        Key Features
                      </h3>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-12 gap-y-3 bg-accent/30 p-4 rounded-xl border border-border/50">
                        {product.specs.map((spec, i) => {
                          const [key, ...val] = spec.includes(':') ? spec.split(':') : [spec, ''];
                          return (
                            <div key={i} className="flex justify-between items-center py-1">
                              <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">{key}</span>
                              <span className="text-xs font-mono font-medium text-foreground">{val.join(':').trim() || "Yes"}</span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Technical Table */}
                  <div className="space-y-4">
                    <h3 className="text-sm font-bold uppercase tracking-widest flex items-center gap-2">
                      <Settings size={14} className="text-primary" />
                      Detailed Specifications
                    </h3>
                    <div className="border border-border rounded-xl overflow-hidden shadow-sm">
                      <table className="w-full text-sm">
                        <tbody className="divide-y divide-border">
                          {product.detailedSpecs && Object.entries(product.detailedSpecs).length > 0 ? (
                            Object.entries(product.detailedSpecs).map(([key, val]) => (
                              <tr key={key} className="bg-card hover:bg-accent/30 transition-colors">
                                <td className="py-4 px-6 font-medium text-foreground w-1/3 border-r border-border/50 bg-accent/10">{key}</td>
                                <td className="py-4 px-6 text-muted-foreground font-mono text-xs">{val}</td>
                              </tr>
                            ))
                          ) : (
                            <tr>
                              <td colSpan={2} className="py-8 px-6 text-center text-muted-foreground italic bg-accent/5">
                                No technical specifications listed for this product.
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Related */}
          {related.length > 0 && (
            <section className="py-8 sm:py-12 border-t border-border gsap-reveal">
              <div className="flex items-center gap-3 mb-6 sm:mb-8">
                <div className="w-1 h-6 bg-primary rounded-full" />
                <h2 className="section-title">Related Products</h2>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 sm:gap-4">
                {related.map((p, i) => (
                  <ProductCard key={p.id} product={p} index={i} />
                ))}
              </div>
            </section>
          )}
        </div>
      </main>

      <Footer />
      <MobileBottomNav />
    </div>
  );
};

export default ProductDetailPage;

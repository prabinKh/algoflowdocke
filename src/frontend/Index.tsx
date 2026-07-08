import { useRef, useMemo } from "react";
import { Helmet } from "react-helmet-async";
import { useGSAPReveal, useGSAPParallax } from "@/hooks/useGSAP";
import gsap from "gsap";
import { Header } from "@/frontend/components/Header";
import { Footer } from "@/frontend/components/Footer";
import { MobileBottomNav } from "@/frontend/components/MobileBottomNav";
import { CategorySidebar } from "@/frontend/components/CategorySidebar";
import { HeroBanner } from "@/frontend/components/HeroBanner";
import { ProductSection } from "@/frontend/components/ProductSection";
import { ProductCard } from "@/frontend/components/ProductCard";
import { BrandStrip } from "@/frontend/components/BrandStrip";
import { DealCountdown } from "@/frontend/components/DealCountdown";
import { useProducts } from "@/hooks/useProducts";
import { useCollections } from "@/hooks/useCollections";
import { type Product } from "@/lib/types";
import { type Collection } from "@/api/collectionService";

const HARDCODED_COLLECTIONS = [
  "New Arrivals",
  "Deal Of The Week",
  "Best Price",
  "Laptops",
  "Mobiles And Tablets",
  "Popular"
].map(n => n.toLowerCase());

const Index = () => {
  console.log("Index: Rendering component...");
  const containerRef = useRef<HTMLDivElement>(null);
  const dealSectionRef = useRef<HTMLElement>(null);
  const { products: allProducts, loading } = useProducts();
  const { collections, loading: collectionsLoading } = useCollections();

  const activeCollectionNames = useMemo(() => 
    collections.map(c => c.name.toLowerCase()), 
    [collections]
  );

  const isCollectionActive = (name: string) => 
    activeCollectionNames.includes(name.toLowerCase());

  const otherCollections = useMemo(() => 
    collections.filter((c: Collection) => !HARDCODED_COLLECTIONS.includes(c.name.toLowerCase())),
    [collections]
  );

  const sortedProducts = useMemo(() => {
    if (!allProducts) return [];
    return [...allProducts].sort((a, b) => {
      const dateA = a.created_at ? new Date(a.created_at).getTime() : 0;
      const dateB = b.created_at ? new Date(b.created_at).getTime() : 0;
      return dateB - dateA;
    });
  }, [allProducts]);

  const newArrivals = useMemo(() => sortedProducts.filter(p => p && p.isNew), [sortedProducts]);
  const bestPrice = useMemo(() => sortedProducts.filter(p => p && p.discount && p.discount > 0).slice(0, 6), [sortedProducts]);
  const deals = useMemo(() => sortedProducts.filter(p => p && p.discount && p.discount >= 20), [sortedProducts]);
  const popular = useMemo(() => [...sortedProducts].sort((a, b) => (b.reviews || 0) - (a.reviews || 0)), [sortedProducts]);
  const laptops = useMemo(() => sortedProducts.filter(p => p && p.categorySlug && p.categorySlug.toLowerCase().includes("laptop")).slice(0, 4), [sortedProducts]);
  const mobiles = useMemo(() => sortedProducts.filter(p => p && p.categorySlug && p.categorySlug.toLowerCase().includes("mobil")).slice(0, 6), [sortedProducts]);

  // Reveal animations for sections
  useGSAPReveal(containerRef, ".gsap-reveal", { opacity: 0, y: 50, duration: 1, stagger: 0.2 });

  // Parallax effect for deal section
  useGSAPReveal(containerRef, ".deal-section-glow", { 
    scale: 0.95, 
    opacity: 0.8, 
    duration: 1.5 
  }, { 
    scrub: 1, 
    start: "top bottom", 
    end: "center center" 
  });

  // Parallax for hero image
  useGSAPParallax(containerRef, ".hero-parallax-img", 15);
  
  // Parallax for deal background elements
  useGSAPParallax(containerRef, ".deal-bg-1", -30);
  useGSAPParallax(containerRef, ".deal-bg-2", 40);

  return (
    <div ref={containerRef} className="min-h-screen bg-background pb-16 lg:pb-0">
      <Helmet>
        <title>FixItAll | Professional Electronics Repair & Premium Store</title>
        <meta name="description" content="Expert repair services for laptops, mobiles, and more. Shop the latest electronics with professional support. Best prices on genuine tech products." />
        <meta name="keywords" content="electronics store, laptop repair, mobile repair, smartphone repair, buy laptops, buy smartphones, FixItAll, tech repair" />
        <link rel="canonical" href={window.location.origin} />
        
        {/* Open Graph / Facebook */}
        <meta property="og:title" content="FixItAll | Professional Electronics Repair & Premium Store" />
        <meta property="og:description" content="Expert repair services and premium electronics store. Quality you can trust." />
        <meta property="og:url" content={window.location.origin} />
        <meta property="og:type" content="website" />
        <meta property="og:image" content="https://picsum.photos/seed/store/1200/630" />
        
        {/* Twitter */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="FixItAll | Professional Electronics Repair & Premium Store" />
        <meta name="twitter:description" content="Expert repair services and premium electronics store." />
        <meta name="twitter:image" content="https://picsum.photos/seed/store/1200/630" />

        {/* Structured Data (JSON-LD) */}
        <script type="application/ld+json">
          {JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Store",
            "name": "FixItAll",
            "image": "https://picsum.photos/seed/store/800/600",
            "@id": window.location.origin,
            "url": window.location.origin,
            "telephone": "+1-555-0123",
            "address": {
              "@type": "PostalAddress",
              "streetAddress": "123 Tech Lane",
              "addressLocality": "Silicon Valley",
              "addressRegion": "CA",
              "postalCode": "94025",
              "addressCountry": "US"
            },
            "geo": {
              "@type": "GeoCoordinates",
              "latitude": 37.4529,
              "longitude": -122.1817
            },
            "openingHoursSpecification": {
              "@type": "OpeningHoursSpecification",
              "dayOfWeek": [
                "Monday",
                "Tuesday",
                "Wednesday",
                "Thursday",
                "Friday",
                "Saturday"
              ],
              "opens": "09:00",
              "closes": "20:00"
            },
            "sameAs": [
              "https://facebook.com/fixitall",
              "https://instagram.com/fixitall",
              "https://twitter.com/fixitall"
            ]
          })}
        </script>
      </Helmet>
      <Header />
      <main>
        <div className="neo-container gsap-reveal">
          {/* Hero + Categories */}
          <div className="flex gap-4 sm:gap-6 py-4 sm:py-8 items-stretch">
            <div className="hidden lg:block h-full">
              <CategorySidebar />
            </div>
            <div className="flex-1 min-w-0">
              <HeroBanner />
            </div>
          </div>

          {/* New Arrivals - Full Width (First) */}
          {isCollectionActive("New Arrivals") && (
            <div className="gsap-reveal">
              <ProductSection 
                title="New Arrivals" 
                products={newArrivals.slice(0, 5)} 
                viewAllLink="/category/new-arrivals" 
              />
            </div>
          )}
        </div>

        <div className="neo-container">
          {/* Deal of the Week */}
          {isCollectionActive("Deal Of The Week") && (
            <section ref={dealSectionRef} className="relative overflow-hidden py-12 sm:py-20 my-16 rounded-[2.5rem] sm:rounded-[3.5rem] bg-gradient-to-br from-accent/30 via-background to-background border border-border/50 deal-section-glow">
              {/* Decorative elements */}
              <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none deal-bg-1" />
              <div className="absolute bottom-0 left-0 w-96 h-96 bg-destructive/5 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2 pointer-events-none deal-bg-2" />
              
              <div className="relative z-10 px-6 sm:px-12">
                <div className="flex flex-col lg:flex-row items-center lg:items-end justify-between mb-12 sm:mb-16 gap-10">
                  <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6 text-center sm:text-left gsap-reveal">
                    <div className="w-2 h-16 bg-destructive rounded-full shadow-[0_0_20px_rgba(239,68,68,0.5)] hidden sm:block" />
                    <div>
                      <span className="text-destructive font-bold text-[10px] sm:text-xs uppercase tracking-[0.3em] mb-3 block">Limited Time Offer</span>
                      <h2 className="text-3xl sm:text-4xl lg:text-6xl font-display font-black tracking-tighter leading-none">Deal Of The Week</h2>
                      <p className="text-sm sm:text-base text-muted-foreground mt-4 max-w-md mx-auto sm:mx-0 leading-relaxed">Grab the best electronics at unbeatable prices before they're gone!</p>
                    </div>
                  </div>
                  <div className="bg-card/40 backdrop-blur-md p-6 sm:p-8 rounded-[2rem] border border-white/10 shadow-2xl flex flex-col sm:flex-row items-center gap-5 sm:gap-10 w-full lg:w-auto gsap-reveal">
                    <span className="text-[10px] sm:text-xs font-bold text-muted-foreground uppercase tracking-[0.2em] whitespace-nowrap">Offer Ends In:</span>
                    <DealCountdown />
                  </div>
                </div>
                
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 sm:gap-6 lg:gap-8 gsap-reveal">
                  {deals.slice(0, 5).map((p, i) => (
                    <ProductCard key={p.id} product={p} index={i} />
                  ))}
                </div>
              </div>
            </section>
          )}
          
          {/* Best Price - Full Width (Second) */}
          {isCollectionActive("Best Price") && (
            <section className="bg-card py-12 sm:py-16 lg:py-20 border-y border-border/50 gsap-reveal">
              <div className="neo-container">
                <ProductSection 
                  title="Best Price" 
                  products={bestPrice.slice(0, 5)} 
                  viewAllLink="/category/best-price" 
                />
              </div>
            </section>
          )}

          {/* Laptops */}
          {isCollectionActive("Laptops") && (
            <div className="gsap-reveal">
              <ProductSection title="Laptops" products={laptops} viewAllLink="/category/laptops-computers" />
            </div>
          )}

          {/* Mobiles */}
          {isCollectionActive("Mobiles And Tablets") && (
            <div className="gsap-reveal">
              <ProductSection title="Mobiles And Tablets" products={mobiles.slice(0, 5)} viewAllLink="/category/mobiles-tablets" />
            </div>
          )}

          {/* Popular */}
          {isCollectionActive("Popular") && (
            <div className="gsap-reveal">
              <ProductSection title="Popular" products={popular.slice(0, 5)} viewAllLink="/category/popular" />
            </div>
          )}

          {/* Other Custom Collections */}
          {otherCollections.map(coll => (
            <div key={coll.id} className="gsap-reveal">
              <ProductSection 
                title={coll.name} 
                products={sortedProducts.filter(p => (p.collections as string[])?.includes(coll.name)).slice(0, 5)} 
                viewAllLink={`/category/all?collection=${coll.name}`} 
              />
            </div>
          ))}

          {/* Brand Strip */}
          <div className="gsap-reveal">
            <BrandStrip />
          </div>
        </div>
      </main>
      <Footer />
      <MobileBottomNav />
    </div>
  );
};

export default Index;

import { useSearchParams, Link } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { useState, useMemo, useRef } from "react";
import { useGSAPReveal } from "@/hooks/useGSAP";
import { Header } from "@/frontend/components/Header";
import { Footer } from "@/frontend/components/Footer";
import { MobileBottomNav } from "@/frontend/components/MobileBottomNav";
import { ProductCard } from "@/frontend/components/ProductCard";
import { type Product } from "@/lib/types";
import { formatPrice } from "@/lib/utils";
import { useProducts } from "@/hooks/useProducts";
import { ChevronRight, SlidersHorizontal, X } from "lucide-react";
import { Slider } from "@/components/ui/slider";

const SORT_OPTIONS = [
  { value: "relevance", label: "Most Relevant" },
  { value: "price-low", label: "Price: Low to High" },
  { value: "price-high", label: "Price: High to Low" },
  { value: "rating", label: "Top Rated" },
  { value: "popularity", label: "Popularity" },
];

const SearchPage = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [searchParams, setSearchParams] = useSearchParams();
  const { products: allProducts } = useProducts();
  const query = searchParams.get("q") || "";
  const sortBy = searchParams.get("sort") || "relevance";
  const selectedBrands = searchParams.getAll("brand");
  const [filtersOpen, setFiltersOpen] = useState(false);

  useGSAPReveal(containerRef, ".gsap-reveal", { opacity: 0, y: 20, duration: 0.6, stagger: 0.1 });
  useGSAPReveal(containerRef, ".gsap-reveal-sidebar", { opacity: 0, x: -20, duration: 0.8 });

  const baseResults = useMemo(() => {
    if (!query) return [];
    const q = query.toLowerCase();
    return allProducts.filter(p =>
      (p.name?.toLowerCase() || "").includes(q) ||
      (p.brand?.toLowerCase() || "").includes(q) ||
      (p.category?.toString().toLowerCase() || "").includes(q) ||
      (Array.isArray(p.specs) ? p.specs.some(s => s?.toLowerCase().includes(q)) : false)
    );
  }, [query, allProducts]);

  const priceRange = useMemo(() => {
    if (baseResults.length === 0) return { min: 0, max: 500000 };
    const prices = baseResults.map(p => p.price);
    return { min: Math.min(...prices), max: Math.max(...prices) };
  }, [baseResults]);

  const urlMinPrice = searchParams.get("minPrice");
  const urlMaxPrice = searchParams.get("maxPrice");
  const [priceSlider, setPriceSlider] = useState<[number, number]>([
    urlMinPrice ? Number(urlMinPrice) : priceRange.min,
    urlMaxPrice ? Number(urlMaxPrice) : priceRange.max,
  ]);

  const availableBrands = useMemo(() => [...new Set(baseResults.map(p => p.brand))].sort(), [baseResults]);

  const availableColors = useMemo(() => {
    const colorsMap = new Map<string, string>();
    baseResults.forEach(p => {
      if (p.color && p.colorHex) {
        colorsMap.set(p.color, p.colorHex);
      }
    });
    return Array.from(colorsMap.entries()).map(([name, hex]) => ({ name, hex })).sort((a, b) => a.name.localeCompare(b.name));
  }, [baseResults]);

  const filtered = useMemo(() => {
    let result = [...baseResults];
    if (selectedBrands.length > 0) result = result.filter(p => selectedBrands.includes(p.brand));
    
    const selectedColors = searchParams.getAll("color");
    if (selectedColors.length > 0) {
      result = result.filter(p => p.color && selectedColors.includes(p.color));
    }

    const minP = urlMinPrice ? Number(urlMinPrice) : priceRange.min;
    const maxP = urlMaxPrice ? Number(urlMaxPrice) : priceRange.max;
    result = result.filter(p => p.price >= minP && p.price <= maxP);

    switch (sortBy) {
      case "price-low": result.sort((a, b) => a.price - b.price); break;
      case "price-high": result.sort((a, b) => b.price - a.price); break;
      case "rating": result.sort((a, b) => b.rating - a.rating); break;
      case "popularity": result.sort((a, b) => b.reviews - a.reviews); break;
    }
    return result;
  }, [baseResults, selectedBrands, urlMinPrice, urlMaxPrice, sortBy, priceRange, searchParams]);

  const toggleBrand = (brand: string) => {
    setSearchParams(prev => {
      const next = new URLSearchParams(prev);
      next.delete("brand");
      const brands = selectedBrands.includes(brand)
        ? selectedBrands.filter(b => b !== brand)
        : [...selectedBrands, brand];
      brands.forEach(b => next.append("brand", b));
      return next;
    }, { replace: true });
  };

  const toggleColor = (color: string) => {
    setSearchParams(prev => {
      const next = new URLSearchParams(prev);
      const current = searchParams.getAll("color");
      const nextColors = current.includes(color)
        ? current.filter(c => c !== color)
        : [...current, color];
      next.delete("color");
      nextColors.forEach(c => next.append("color", c));
      return next;
    }, { replace: true });
  };

  const hasActiveFilters = selectedBrands.length > 0 || urlMinPrice || urlMaxPrice || searchParams.getAll("color").length > 0;

  return (
    <div className="min-h-screen bg-background pb-16 lg:pb-0" ref={containerRef}>
      <Helmet>
        <title>{query ? `Search results for "${query}" | FixItAll` : "Search Products | FixItAll"}</title>
        <meta name="description" content={query ? `Find the best deals on ${query} at FixItAll. Professional electronics and repair services.` : "Search our extensive catalog of electronics and repair services."} />
        <meta name="robots" content="noindex, follow" />
        <link rel="canonical" href={window.location.href} />
      </Helmet>
      <Header />
      <main className="neo-container py-4 sm:py-6">
        <nav className="flex items-center gap-1.5 text-[10px] sm:text-xs text-muted-foreground mb-4 sm:mb-6 gsap-reveal">
          <Link to="/" className="hover:text-primary transition-colors">Home</Link>
          <ChevronRight size={12} />
          <span className="text-foreground">Search: "{query}"</span>
        </nav>

        <div className="flex gap-6 sm:gap-8">
          {/* Sidebar Filters */}
          <aside className="hidden lg:block lg:w-56 lg:shrink-0 gsap-reveal-sidebar">
            <div className="bg-card border border-border rounded-[var(--radius-outer)] p-4 shadow-[var(--shadow-sm)] sticky top-32 space-y-6">
              <h2 className="font-display font-semibold text-sm">Filters</h2>

              {/* Price */}
              <div>
                <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-4">Price</h3>
                <Slider
                  value={priceSlider}
                  onValueChange={(val) => setPriceSlider(val as [number, number])}
                  onValueCommit={() => {
                    setSearchParams(prev => {
                      const next = new URLSearchParams(prev);
                      if (priceSlider[0] > priceRange.min) next.set("minPrice", String(priceSlider[0]));
                      else next.delete("minPrice");
                      if (priceSlider[1] < priceRange.max) next.set("maxPrice", String(priceSlider[1]));
                      else next.delete("maxPrice");
                      return next;
                    }, { replace: true });
                  }}
                  min={priceRange.min}
                  max={priceRange.max}
                  step={Math.max(100, Math.floor((priceRange.max - priceRange.min) / 100))}
                  minStepsBetweenThumbs={1}
                />
                <div className="flex justify-between text-xs font-mono text-muted-foreground mt-2">
                  <span>{formatPrice(priceSlider[0])}</span>
                  <span>{formatPrice(priceSlider[1])}</span>
                </div>
              </div>

              {/* Brands */}
              {availableBrands.length > 1 && (
                <div>
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">Brand</h3>
                  <div className="space-y-2">
                    {availableBrands.map(brand => (
                      <label key={brand} className="filter-checkbox">
                        <input
                          type="checkbox"
                          checked={selectedBrands.includes(brand)}
                          onChange={() => toggleBrand(brand)}
                          className="w-3.5 h-3.5 rounded-sm border-border text-primary focus:ring-primary accent-primary"
                        />
                        <span className="text-xs">{brand}</span>
                      </label>
                    ))}
                  </div>
                </div>
              )}

              {/* Colors */}
              {availableColors.length > 0 && (
                <div>
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">Color</h3>
                  <div className="flex flex-wrap gap-2">
                    {availableColors.map(({ name, hex }) => {
                      const isSelected = searchParams.getAll("color").includes(name);
                      return (
                        <button
                          key={name}
                          onClick={() => toggleColor(name)}
                          className={`w-6 h-6 rounded-full border-2 transition-all duration-300 flex items-center justify-center
                            ${isSelected ? 'border-primary scale-110 shadow-md' : 'border-transparent hover:border-border hover:scale-105'}`}
                          style={{ backgroundColor: hex }}
                          title={name}
                        >
                          {isSelected && (
                            <div className={`w-1 h-1 rounded-full ${hex.toLowerCase() === '#ffffff' ? 'bg-black' : 'bg-card'}`} />
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {hasActiveFilters && (
                <button
                  onClick={() => {
                    setSearchParams(prev => {
                      const next = new URLSearchParams();
                      next.set("q", query);
                      return next;
                    }, { replace: true });
                    setPriceSlider([priceRange.min, priceRange.max]);
                  }}
                  className="text-xs text-destructive hover:underline font-medium"
                >
                  Clear all filters
                </button>
              )}
            </div>
          </aside>

          {/* Results */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between mb-4 sm:mb-6 gap-3 gsap-reveal">
              <div>
                <h1 className="text-lg sm:text-xl font-display font-bold">Results for "{query}"</h1>
                <p className="text-xs text-muted-foreground mt-0.5">{filtered.length} products found</p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={() => setFiltersOpen(!filtersOpen)}
                  className="lg:hidden flex items-center gap-1.5 text-xs border border-border px-3 py-1.5 rounded-lg hover:bg-accent transition-colors"
                >
                  <SlidersHorizontal size={14} /> Filters
                </button>
                <select
                  value={sortBy}
                  onChange={e => {
                    setSearchParams(prev => {
                      const next = new URLSearchParams(prev);
                      if (e.target.value === "relevance") next.delete("sort");
                      else next.set("sort", e.target.value);
                      return next;
                    }, { replace: true });
                  }}
                  className="text-xs sm:text-sm bg-accent border border-border rounded-lg px-2 sm:px-3 py-1.5 text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
                >
                  {SORT_OPTIONS.map(opt => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </div>
            </div>

            {filtered.length === 0 ? (
              <div className="text-center py-16 sm:py-24 text-muted-foreground gsap-reveal">
                <p className="text-base sm:text-lg mb-2">No products found</p>
                <p className="text-xs sm:text-sm">Try different keywords or adjust filters</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4">
                {filtered.map((p, i) => (
                  <ProductCard key={p.id} product={p} index={i} />
                ))}
              </div>
            )}
          </div>
        </div>
      </main>
      <Footer />
      <MobileBottomNav />
    </div>
  );
};

export default SearchPage;

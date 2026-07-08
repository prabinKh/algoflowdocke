import { useParams, Link, useSearchParams } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { useState, useMemo, useCallback, useEffect, useRef } from "react";
import { useGSAPReveal } from "@/hooks/useGSAP";
import { Header } from "@/frontend/components/Header";
import { Footer } from "@/frontend/components/Footer";
import { MobileBottomNav } from "@/frontend/components/MobileBottomNav";
import { ProductCard } from "@/frontend/components/ProductCard";
import { type Product } from "@/lib/types";
import { formatPrice } from "@/lib/utils";
import { useProducts } from "@/hooks/useProducts";
import { ChevronRight, SlidersHorizontal, X, ChevronDown } from "lucide-react";
import { Slider } from "@/components/ui/slider";

const SORT_OPTIONS = [
  { value: "latest", label: "Sort by latest" },
  { value: "price-low", label: "Price: Low to High" },
  { value: "price-high", label: "Price: High to Low" },
  { value: "popularity", label: "Popularity" },
  { value: "rating", label: "Rating" },
];

const BOOLEAN_FILTERS = [
  { key: "inStock", label: "In Stock" },
  { key: "isNew", label: "New Arrival" },
  { key: "isBestSeller", label: "Best Seller" },
  { key: "isPopular", label: "Popular" },
  { key: "isOffer", label: "Special Offer" },
  { key: "freeShipping", label: "Free Shipping" },
] as const;

const BrandPage = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const { slug } = useParams<{ slug: string }>();
  const [searchParams, setSearchParams] = useSearchParams();
  const { products: allProducts } = useProducts();

  useGSAPReveal(containerRef, ".gsap-reveal", { opacity: 0, y: 30, duration: 0.8, stagger: 0.1 });
  useGSAPReveal(containerRef, ".gsap-reveal-sidebar", { opacity: 0, x: -30, duration: 1 });

  const sortBy = searchParams.get("sort") || "latest";
  const urlMinPrice = searchParams.get("minPrice");
  const urlMaxPrice = searchParams.get("maxPrice");
  
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({});

  const title = slug?.replace(/-/g, " ").replace(/\b\w/g, l => l.toUpperCase()) || "Brand Products";

  const baseProducts = useMemo(() => {
    return allProducts.filter(p => p.brand?.toLowerCase() === slug?.replace(/-/g, " ").toLowerCase());
  }, [slug, allProducts]);

  const activeFilterKeys = useMemo(() => {
    const keys = new Set<string>();
    const commonKeys = [
      "laptopSeries", "displaySize", "processor", "ram", "storage", "graphicCard", "generation",
      "screenSize", "refreshRate", "panelType",
      "mobileProcessor", "mobileRam", "mobileStorage",
      "type", "category", "subCategory", "material", "style", "fit", "gender", "ageGroup",
      "connectivity", "batteryLife", "waterResistance", "warranty"
    ];
    
    commonKeys.forEach(key => {
      if (baseProducts.some(p => p[key as keyof Product])) {
        keys.add(key);
      }
    });

    baseProducts.forEach(p => {
      if (p.detailedSpecs) {
        Object.keys(p.detailedSpecs).forEach(k => keys.add(`spec_${k}`));
      }
    });

    return Array.from(keys)
      .map(k => ({
        key: k,
        label: k.startsWith("spec_") 
          ? k.replace("spec_", "").replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())
          : k.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())
      }));
  }, [baseProducts]);

  const priceRange = useMemo(() => {
    const prices = baseProducts.map(p => p.price);
    if (prices.length === 0) return { min: 0, max: 1000000 };
    return { min: Math.min(...prices), max: Math.max(...prices) };
  }, [baseProducts]);

  const [priceSlider, setPriceSlider] = useState<[number, number]>([
    urlMinPrice ? Number(urlMinPrice) : priceRange.min,
    urlMaxPrice ? Number(urlMaxPrice) : priceRange.max,
  ]);

  useEffect(() => {
    setPriceSlider([
      urlMinPrice ? Number(urlMinPrice) : priceRange.min,
      urlMaxPrice ? Number(urlMaxPrice) : priceRange.max,
    ]);
  }, [slug, priceRange.min, priceRange.max, urlMinPrice, urlMaxPrice]);

  const dynamicFilterOptions = useMemo(() => {
    const options: Record<string, string[]> = {};
    activeFilterKeys.forEach(({ key }) => {
      let vals: string[] = [];
      if (key.startsWith("spec_")) {
        const specKey = key.replace("spec_", "");
        vals = baseProducts
          .map(p => p.detailedSpecs?.[specKey])
          .filter(Boolean) as string[];
      } else {
        vals = baseProducts
          .map(p => p[key as keyof Product] as string)
          .filter(Boolean);
      }
      options[key] = [...new Set(vals)].sort();
    });
    return options;
  }, [baseProducts, activeFilterKeys]);

  const updateParams = useCallback((key: string, value: string | string[] | null) => {
    setSearchParams(prev => {
      const next = new URLSearchParams(prev);
      if (Array.isArray(value)) {
        next.delete(key);
        value.forEach(v => next.append(key, v));
      } else if (value === null || value === "") {
        next.delete(key);
      } else {
        next.set(key, value as string);
      }
      return next;
    }, { replace: true });
  }, [setSearchParams]);

  const toggleFilter = (key: string, value: string) => {
    const current = searchParams.getAll(key);
    const next = current.includes(value)
      ? current.filter(v => v !== value)
      : [...current, value];
    updateParams(key, next);
  };

  const applyPriceFilter = () => {
    setSearchParams(prev => {
      const next = new URLSearchParams(prev);
      if (priceSlider[0] > priceRange.min) next.set("minPrice", String(priceSlider[0]));
      else next.delete("minPrice");
      if (priceSlider[1] < priceRange.max) next.set("maxPrice", String(priceSlider[1]));
      else next.delete("maxPrice");
      return next;
    }, { replace: true });
  };

  const clearAllFilters = () => {
    setSearchParams({}, { replace: true });
    setPriceSlider([priceRange.min, priceRange.max]);
  };

  const hasActiveFilters = useMemo(() => {
    if (urlMinPrice || urlMaxPrice || sortBy !== "latest" || searchParams.getAll("color").length > 0) return true;
    if (BOOLEAN_FILTERS.some(({ key }) => searchParams.get(key) === "true")) return true;
    return activeFilterKeys.some(({ key }) => searchParams.getAll(key).length > 0);
  }, [urlMinPrice, urlMaxPrice, sortBy, searchParams, activeFilterKeys]);

  const filtered = useMemo(() => {
    let result = [...baseProducts];

    BOOLEAN_FILTERS.forEach(({ key }) => {
      if (searchParams.get(key) === "true") {
        result = result.filter(p => p[key as keyof Product]);
      }
    });

    activeFilterKeys.forEach(({ key }) => {
      const selected = searchParams.getAll(key);
      if (selected.length > 0) {
        if (key.startsWith("spec_")) {
          const specKey = key.replace("spec_", "");
          result = result.filter(p => p.detailedSpecs && selected.includes(p.detailedSpecs[specKey]));
        } else {
          result = result.filter(p => selected.includes(p[key as keyof Product] as string));
        }
      }
    });

    const minP = urlMinPrice ? Number(urlMinPrice) : priceRange.min;
    const maxP = urlMaxPrice ? Number(urlMaxPrice) : priceRange.max;
    result = result.filter(p => p.price >= minP && p.price <= maxP);

    switch (sortBy) {
      case "price-low": result.sort((a, b) => a.price - b.price); break;
      case "price-high": result.sort((a, b) => b.price - a.price); break;
      case "popularity": result.sort((a, b) => b.reviews - a.reviews); break;
      case "rating": result.sort((a, b) => b.rating - a.rating); break;
      case "name": result.sort((a, b) => a.name.localeCompare(b.name)); break;
    }

    return result;
  }, [baseProducts, urlMinPrice, urlMaxPrice, sortBy, priceRange, searchParams, activeFilterKeys]);

  const FilterGroup = ({ title, options, filterKey, limit = 5 }: { title: string, options: string[], filterKey: string, limit?: number }) => {
    const isExpanded = expandedGroups[filterKey];
    const displayOptions = isExpanded ? options : options.slice(0, limit);
    const selected = searchParams.getAll(filterKey);

    if (options.length === 0) return null;

    return (
      <div className="border-b border-border/50 pb-6 last:border-0 transition-all duration-500">
        <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground mb-4">{title}</h3>
        <div className="space-y-2.5 transition-all duration-500">
          {displayOptions.map(opt => (
            <label key={opt} className="flex items-center gap-3 group cursor-pointer transition-all duration-300 hover:py-1.5 px-1 rounded-md hover:bg-accent/30">
              <div className="relative flex items-center justify-center">
                <input
                  type="checkbox"
                  checked={selected.includes(opt)}
                  onChange={() => toggleFilter(filterKey, opt)}
                  className="peer appearance-none w-4 h-4 rounded border border-border checked:bg-primary checked:border-primary transition-all duration-200"
                />
                <div className="absolute opacity-0 peer-checked:opacity-100 pointer-events-none text-white transition-opacity">
                  <svg width="10" height="8" viewBox="0 0 10 8" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M1 4L4 7L9 1" />
                  </svg>
                </div>
              </div>
              <span className="text-xs text-muted-foreground group-hover:text-foreground transition-colors">{opt}</span>
              <span className="ml-auto text-[10px] font-mono text-muted-foreground/50">
                ({baseProducts.filter(p => {
                  if (filterKey.startsWith("spec_")) {
                    const specKey = filterKey.replace("spec_", "");
                    return p.detailedSpecs?.[specKey] === opt;
                  }
                  return p[filterKey as keyof Product] === opt;
                }).length})
              </span>
            </label>
          ))}
          {options.length > limit && (
            <button
              onClick={() => setExpandedGroups(prev => ({ ...prev, [filterKey]: !isExpanded }))}
              className="text-[10px] font-bold text-primary hover:text-primary/80 uppercase tracking-widest pt-1 flex items-center gap-1"
            >
              {isExpanded ? "Show Less" : `Show More (${options.length - limit})`}
              <ChevronDown size={12} className={`transition-transform duration-300 ${isExpanded ? "rotate-180" : ""}`} />
            </button>
          )}
        </div>
      </div>
    );
  };

  const BooleanFilterGroup = () => {
    return (
      <div className="border-b border-border/50 pb-6 last:border-0 transition-all duration-500">
        <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground mb-4">Availability & Status</h3>
        <div className="space-y-2.5">
          {BOOLEAN_FILTERS.map(({ key, label }) => {
            const isActive = searchParams.get(key) === "true";
            const count = baseProducts.filter(p => p[key as keyof Product]).length;
            if (count === 0) return null;
            
            return (
              <label key={key} className="flex items-center gap-3 group cursor-pointer transition-all duration-300 hover:py-1.5 px-1 rounded-md hover:bg-accent/30">
                <div className="relative flex items-center justify-center">
                  <input
                    type="checkbox"
                    checked={isActive}
                    onChange={() => updateParams(key, isActive ? null : "true")}
                    className="peer appearance-none w-4 h-4 rounded border border-border checked:bg-primary checked:border-primary transition-all duration-200"
                  />
                  <div className="absolute opacity-0 peer-checked:opacity-100 pointer-events-none text-white transition-opacity">
                    <svg width="10" height="8" viewBox="0 0 10 8" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M1 4L4 7L9 1" />
                    </svg>
                  </div>
                </div>
                <span className="text-xs text-muted-foreground group-hover:text-foreground transition-colors">{label}</span>
                <span className="ml-auto text-[10px] font-mono text-muted-foreground/50">
                  ({count})
                </span>
              </label>
            );
          })}
        </div>
      </div>
    );
  };

  const FilterContent = () => (
    <div className="space-y-8">
      {hasActiveFilters && (
        <button 
          onClick={clearAllFilters} 
          className="w-full py-2 bg-destructive/5 text-destructive hover:bg-destructive/10 rounded-lg text-[10px] font-bold uppercase tracking-widest transition-colors border border-destructive/10"
        >
          Reset All Filters
        </button>
      )}

      <BooleanFilterGroup />

      <div className="border-b border-border/50 pb-8">
        <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground mb-6">Price Range</h3>
        <div className="px-2 space-y-6">
          <Slider
            value={priceSlider}
            onValueChange={(val) => setPriceSlider(val as [number, number])}
            onValueCommit={applyPriceFilter}
            min={priceRange.min}
            max={priceRange.max}
            step={Math.max(100, Math.floor((priceRange.max - priceRange.min) / 100))}
            minStepsBetweenThumbs={1}
            className="text-primary"
          />
          <div className="flex items-center justify-between gap-4">
            <div className="flex-1 p-2 bg-accent/50 rounded-lg border border-border/50 text-center">
              <p className="text-[8px] uppercase text-muted-foreground font-bold mb-0.5">Min</p>
              <p className="text-xs font-mono font-bold">{formatPrice(priceSlider[0])}</p>
            </div>
            <div className="w-2 h-px bg-border" />
            <div className="flex-1 p-2 bg-accent/50 rounded-lg border border-border/50 text-center">
              <p className="text-[8px] uppercase text-muted-foreground font-bold mb-0.5">Max</p>
              <p className="text-xs font-mono font-bold">{formatPrice(priceSlider[1])}</p>
            </div>
          </div>
        </div>
      </div>

      {activeFilterKeys.map(({ key, label }) => (
        <FilterGroup 
          key={key} 
          title={label} 
          options={dynamicFilterOptions[key] || []} 
          filterKey={key} 
        />
      ))}
    </div>
  );

  return (
    <div ref={containerRef} className="min-h-screen bg-background pb-16 lg:pb-0">
      <Helmet>
        <title>{`${title} | FixItAll Store`}</title>
      </Helmet>
      <Header />
      <main className="neo-container py-4 sm:py-6">
        <nav className="flex items-center gap-1.5 text-[10px] sm:text-xs text-muted-foreground mb-4 sm:mb-6 gsap-reveal">
          <Link to="/" className="hover:text-primary transition-colors">Home</Link>
          <ChevronRight size={12} />
          <span className="text-foreground">{title}</span>
        </nav>

        <div className="flex gap-6 sm:gap-8">
          <aside className="hidden lg:block lg:w-56 lg:shrink-0 group/sidebar gsap-reveal-sidebar">
            <div className="bg-card border border-border rounded-[var(--radius-outer)] p-4 shadow-[var(--shadow-sm)] lg:sticky lg:top-32">
              <h2 className="font-display font-semibold text-sm mb-4">Filters</h2>
              <FilterContent />
            </div>
          </aside>

          {filtersOpen && (
            <div className="fixed inset-0 z-50 lg:hidden" onClick={() => setFiltersOpen(false)}>
              <div className="absolute inset-0 bg-foreground/30 backdrop-blur-sm" />
              <div
                className="absolute left-0 top-0 bottom-0 w-80 max-w-[85vw] bg-card shadow-[var(--shadow-xl)] p-6 overflow-auto animate-slide-in-left"
                onClick={e => e.stopPropagation()}
              >
                <div className="flex items-center justify-between mb-6">
                  <h2 className="font-display font-semibold text-lg">Filters</h2>
                  <button onClick={() => setFiltersOpen(false)} className="p-2 text-muted-foreground hover:text-foreground rounded-lg hover:bg-accent">
                    <X size={20} />
                  </button>
                </div>
                <FilterContent />
              </div>
            </div>
          )}

          <div className="flex-1 min-w-0">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 sm:mb-8 gap-4 gsap-reveal">
              <div className="flex flex-col">
                <h1 className="text-xl sm:text-2xl font-display font-black tracking-tight text-foreground truncate">{title}</h1>
                <div className="flex items-center gap-2 mt-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-primary" />
                  <p className="text-[10px] sm:text-xs font-bold uppercase tracking-widest text-muted-foreground/60">{filtered.length} products found</p>
                </div>
              </div>
              <div className="flex items-center gap-2 sm:gap-3">
                <button
                  onClick={() => setFiltersOpen(true)}
                  className="lg:hidden flex-1 sm:flex-none flex items-center justify-center gap-2 text-xs font-bold uppercase tracking-wider text-foreground border border-border px-4 py-2.5 rounded-xl hover:bg-accent transition-all active:scale-95 shadow-sm bg-card"
                >
                  <SlidersHorizontal size={16} className="text-primary" />
                  <span>Filters</span>
                </button>
                <div className="relative flex-1 sm:flex-none">
                  <select
                    value={sortBy}
                    onChange={e => updateParams("sort", e.target.value === "latest" ? null : e.target.value)}
                    className="w-full sm:w-auto text-xs font-bold uppercase tracking-wider bg-card border border-border rounded-xl px-4 py-2.5 text-foreground focus:outline-none focus:ring-4 focus:ring-primary/10 transition-all appearance-none pr-10 shadow-sm"
                  >
                    {SORT_OPTIONS.map(opt => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                  <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-muted-foreground">
                    <ChevronDown size={14} />
                  </div>
                </div>
              </div>
            </div>

            {filtered.length === 0 ? (
              <div className="text-center py-16 sm:py-24 text-muted-foreground gsap-reveal">
                <p className="text-base sm:text-lg mb-2">No products found</p>
                <p className="text-xs sm:text-sm">Try adjusting your filters</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 sm:gap-4 lg:gap-6 gsap-reveal">
                {filtered.map((product, i) => (
                  <ProductCard key={product.id} product={product} index={i} />
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

export default BrandPage;

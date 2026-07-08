import { Link, useLocation } from "react-router-dom";
import { ChevronRight, ShoppingCart, ArrowRight } from "lucide-react";
import { type Category, type Product, type MegaMenuItem } from "@/lib/types";
import { formatPrice } from "@/lib/utils";
import { renderCategoryIcon } from "@/lib/icons";
import { useState, useRef, useEffect, useMemo } from "react";
import { CachedImage } from "@/components/ui/cached-image";

import { useCategories } from "@/hooks/useCategories";
import { useProducts } from "@/hooks/useProducts";

const getCategoryColor = (name: string) => {
  const colors: Record<string, string> = {
    "Laptops": "#3B82F6",
    "Computers": "#2563EB",
    "Mobiles": "#10B981",
    "Phones": "#059669",
    "Audio": "#8B5CF6",
    "Headphones": "#7C3AED",
    "Cameras": "#F59E0B",
    "Gaming": "#EF4444",
    "Monitors": "#06B6D4",
    "Peripherals": "#6366F1",
    "Accessories": "#EC4899",
    "Home": "#F97316",
    "Kitchen": "#D97706",
    "Fitness": "#14B8A6",
    "Health": "#0D9488",
    "Tablets": "#8B5CF6",
    "Smartwatch": "#F43F5E",
  };

  const lowerName = name.toLowerCase();
  for (const [key, color] of Object.entries(colors)) {
    if (lowerName.includes(key.toLowerCase())) return color;
  }
  return "#6366F1"; // Default Indigo
};

export const CategorySidebar = () => {
  const location = useLocation();
  const [hoveredSlug, setHoveredSlug] = useState<string | null>(null);
  const { categories } = useCategories();
  const { products: dbProducts } = useProducts();
  const [menuTop, setMenuTop] = useState(0);
  const [clampedTop, setClampedTop] = useState(0);
  const flyoutRef = useRef<HTMLDivElement>(null);
  const closeTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const handleMouseEnter = (slug: string, e?: React.MouseEvent) => {
    if (closeTimeoutRef.current) {
      clearTimeout(closeTimeoutRef.current);
      closeTimeoutRef.current = null;
    }

    if (e) {
      const rect = e.currentTarget.getBoundingClientRect();
      const container = e.currentTarget.closest('.relative.z-40');
      if (container) {
        const containerRect = container.getBoundingClientRect();
        setMenuTop(rect.top - containerRect.top + (rect.height / 2));
      }
    }

    setHoveredSlug(slug);
  };

  useEffect(() => {
    if (hoveredSlug && flyoutRef.current) {
      const flyoutHeight = flyoutRef.current.offsetHeight;
      const container = flyoutRef.current.closest('.relative.z-40');
      if (container) {
        const containerHeight = (container as HTMLElement).offsetHeight;
        const idealTop = menuTop - (flyoutHeight / 2);
        // Clamp between 0 and (containerHeight - flyoutHeight)
        // But if flyout is taller than container, just start at 0
        const safeTop = Math.max(0, Math.min(idealTop, Math.max(0, containerHeight - flyoutHeight)));
        setClampedTop(safeTop);
      }
    }
  }, [hoveredSlug, menuTop]);

  const handleMouseLeave = () => {
    closeTimeoutRef.current = setTimeout(() => {
      setHoveredSlug(null);
    }, 300);
  };

  useEffect(() => {
    return () => {
      if (closeTimeoutRef.current) clearTimeout(closeTimeoutRef.current);
    };
  }, []);

  const [megaMenuData, setMegaMenuData] = useState<Record<string, MegaMenuItem>>({});

  const dynamicMegaMenu = useMemo(() => {
    const menu: Record<string, MegaMenuItem> = { ...megaMenuData };

    categories.forEach(cat => {
      if (!menu[cat.slug]) {
        // Build dynamic menu for this category
        const catProducts = dbProducts.filter(p => p.category === cat.name || p.categorySlug === cat.slug);
        
        // Use architecture-defined sections if available, otherwise fallback to derived
        const columns: MegaMenuItem['columns'] = [];

        if (cat.sections && cat.sections.length > 0) {
          cat.sections.forEach(section => {
            columns.push({
              type: 'categories', // Default type for custom sections
              title: section.title,
              items: section.items.map(item => ({
                name: item.name,
                href: item.slug.startsWith('/') ? item.slug : `/category/${item.slug}`
              }))
            });
          });
        } else {
          // Fallback logic
          const uniqueBrands = Array.from(new Set(catProducts.map(p => p.brand_name || p.brand))).filter(Boolean);
          const uniqueTypes = Array.from(new Set(catProducts.map(p => p.type))).filter(Boolean);

          columns.push({
            type: 'brands',
            title: 'Available Brands',
            items: uniqueBrands.length > 0 
              ? uniqueBrands.map(brand => ({
                  name: brand,
                  href: `/category/${cat.slug}?brand=${brand}`
                }))
              : (cat.brands && cat.brands.length > 0 
                  ? cat.brands.map(b => ({ name: b, href: `/category/${cat.slug}?brand=${b}` }))
                  : [{ name: 'All Brands', href: `/category/${cat.slug}` }])
          });

          columns.push({
            type: 'categories',
            title: 'Product Types',
            items: uniqueTypes.length > 0
              ? uniqueTypes.map(type => ({
                  name: type as string,
                  href: `/category/${cat.slug}?type=${type}`
                }))
              : (cat.subcategories && cat.subcategories.length > 0
                  ? cat.subcategories.map(s => ({ name: s.name, href: `/category/${s.slug}` }))
                  : [{ name: 'All Types', href: `/category/${cat.slug}` }])
          });
        }

        // Always add popular products if not already present in columns
        if (!columns.some(c => c.type === 'products')) {
          columns.push({
            type: 'products',
            title: 'Popular in ' + cat.name,
            items: catProducts.length > 0
              ? catProducts.slice(0, 3).map(p => ({
                  name: p.name,
                  href: `/product/${p.slug || p.id}`,
                  image: p.image,
                  price: p.price,
                  badge: p.isNew ? 'New' : p.isBestSeller ? 'Best Seller' : undefined,
                  type: p.type,
                  features: p.features || []
                }))
              : []
          });
        }

        menu[cat.slug] = {
          title: cat.name,
          href: `/category/${cat.slug}`,
          columns
        };
      }
    });

    return menu;
  }, [categories, dbProducts, megaMenuData]);

  const renderIcon = (icon: string) => {
    return renderCategoryIcon(icon);
  };

  const activeMegaMenu = hoveredSlug ? dynamicMegaMenu[hoveredSlug] : null;

  return (
    <div className="relative z-40 h-full">
      <nav className="w-full lg:w-56 h-full shrink-0 bg-card border border-border rounded-[var(--radius-outer)] p-2 shadow-[var(--shadow-sm)] group/sidebar flex flex-col transition-all duration-500">
        <p className="px-3 py-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground transition-all duration-300">Categories</p>
        <ul className="space-y-0.5 transition-all duration-500 flex-1">
          {categories.map(cat => {
            const isActive = location.pathname.includes(cat.slug);
            const isHovered = hoveredSlug === cat.slug;
            
            return (
              <li 
                key={cat.slug}
                onMouseEnter={(e) => handleMouseEnter(cat.slug, e)}
                onMouseLeave={handleMouseLeave}
              >
                <Link
                  to={`/category/${cat.slug}`}
                  className={`flex items-center justify-between px-3 py-2.5 text-sm rounded-lg transition-all duration-300
                    ${isActive || isHovered
                      ? "bg-primary/10 text-primary font-medium border border-primary/20 py-4"
                      : "text-muted-foreground hover:bg-accent hover:text-foreground hover:py-4"
                    }`}
                >
                  <span className="flex items-center gap-2.5">
                    <span 
                      className={`text-lg transition-transform duration-300 ${isHovered ? "scale-125 rotate-6" : ""}`}
                      style={{ color: getCategoryColor(cat.name) }}
                    >
                      {renderIcon(cat.icon)}
                    </span>
                    <span className="transition-all duration-300 group-hover/sidebar:translate-x-1">{cat.name}</span>
                  </span>
                  <ChevronRight size={14} className={isActive || isHovered ? "text-primary translate-x-0.5" : "text-muted-foreground/40 transition-all duration-300 group-hover/sidebar:translate-x-1"} />
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Mega Menu Flyout */}
      {activeMegaMenu && (
        <div 
          ref={flyoutRef}
          className="absolute left-full ml-0 w-[800px] xl:w-[900px] bg-card border border-border rounded-[var(--radius-outer)] shadow-[var(--shadow-xl)] overflow-hidden animate-in fade-in slide-in-from-left-4 duration-300 flex flex-col"
          style={{ 
            top: `${clampedTop}px`, 
            // Ensure it doesn't go off-screen (top/bottom)
            minHeight: '200px',
            maxHeight: 'calc(100vh - 100px)'
          }}
          onMouseEnter={() => handleMouseEnter(hoveredSlug!)}
          onMouseLeave={handleMouseLeave}
        >
          <div className="p-8 grid grid-cols-3 gap-8 flex-1">
            {activeMegaMenu.columns.map((column, idx) => (
              <div key={idx} className="space-y-6">
                <h3 className="text-xs font-bold uppercase tracking-[0.15em] text-muted-foreground border-b border-border pb-3">
                  {column.title}
                </h3>
                
                {column.type === 'products' ? (
                  <div className="space-y-4">
                    {column.items.map((item, itemIdx) => (
                      <div key={itemIdx} className="group/item flex gap-4 p-2 rounded-xl hover:bg-accent/50 transition-colors border border-transparent hover:border-border">
                        <div className="w-20 h-20 rounded-lg overflow-hidden bg-muted shrink-0 border border-border">
                          <CachedImage 
                            src={item.image} 
                            alt={item.name} 
                            className="w-full h-full object-cover group-hover/item:scale-110 transition-transform duration-500"
                            referrerPolicy="no-referrer"
                          />
                        </div>
                        <div className="flex flex-col justify-between py-0.5 min-w-0">
                          <div>
                            {item.badge && (
                              <span className="inline-block px-1.5 py-0.5 rounded bg-primary/10 text-primary text-[9px] font-bold uppercase tracking-wider mb-1">
                                {item.badge}
                              </span>
                            )}
                            <Link to={item.href} className="block text-sm font-semibold text-foreground hover:text-primary transition-colors truncate">
                              {item.name}
                            </Link>
                            <div className="flex items-center gap-2 mt-1">
                              <p className="text-sm font-mono text-muted-foreground">
                                {item.price ? formatPrice(item.price) : 'N/A'}
                              </p>
                              {item.type && <span className="text-[9px] bg-accent px-1.5 rounded text-muted-foreground uppercase tracking-tighter font-bold">{item.type}</span>}
                            </div>
                            {item.features && item.features.length > 0 && (
                              <div className="flex flex-wrap gap-1 mt-1.5">
                                {item.features.slice(0, 3).map((f, fIdx) => (
                                  <span key={fIdx} className="text-[9px] text-muted-foreground/80 bg-muted/50 px-1.5 py-0.5 rounded-sm border border-border/50">
                                    {f}
                                  </span>
                                ))}
                              </div>
                            )}
                          </div>
                          <button className="flex items-center gap-1.5 text-[10px] font-bold text-primary hover:text-primary/80 transition-colors mt-2">
                            <ShoppingCart size={12} /> QUICK ADD
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <ul className="grid grid-cols-1 gap-y-2.5">
                    {column.items.map((item, itemIdx) => (
                      <li key={itemIdx}>
                        <Link 
                          to={item.href}
                          className="text-sm text-muted-foreground hover:text-primary hover:translate-x-1 transition-all inline-flex items-center gap-2"
                        >
                          <span className="w-1 h-1 rounded-full bg-border group-hover:bg-primary transition-colors" />
                          {item.name}
                        </Link>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            ))}
          </div>

          {/* Bottom Banner */}
          {activeMegaMenu.banner && (
            <div className="bg-gradient-to-r from-primary/5 via-primary/10 to-primary/5 border-t border-border p-5 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold text-lg">
                  {activeMegaMenu.banner.discount}%
                </div>
                <div>
                  <p className="text-sm font-bold text-foreground">{activeMegaMenu.banner.text}</p>
                  <p className="text-xs text-muted-foreground">Limited time offer. Terms & conditions apply.</p>
                </div>
              </div>
              <Link 
                to={activeMegaMenu.banner.buttonHref}
                className="flex items-center gap-2 px-6 py-2.5 bg-primary text-primary-foreground rounded-full text-xs font-bold hover:bg-primary/90 transition-all shadow-lg shadow-primary/20"
              >
                {activeMegaMenu.banner.buttonText}
                <ArrowRight size={14} />
              </Link>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

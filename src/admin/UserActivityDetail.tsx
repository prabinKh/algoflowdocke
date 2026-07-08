import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { userActivityService, UserActivity as UserActivityType } from "@/api/userActivityService";
import { 
  Activity, 
  ArrowLeft, 
  Clock, 
  Eye, 
  ShoppingCart, 
  Search, 
  Home, 
  Package, 
  Filter,
  ChevronRight,
  ChevronDown,
  Calendar,
  Layers,
  ExternalLink,
  MapPin,
  Laptop,
  Globe,
  Tag
} from "lucide-react";
import { useState, useMemo } from "react";
import { format } from "date-fns";
import { safeToDate, formatPrice } from "@/lib/utils";
import { motion, AnimatePresence } from "motion/react";
import { useProducts } from "@/hooks/useProducts";
import { Link } from "react-router-dom";
import { type Product } from "@/lib/types";

const UserActivityDetail = () => {
  const { uid } = useParams<{ uid: string }>();
  const navigate = useNavigate();
  const [expandedActivityId, setExpandedActivityId] = useState<string | null>(null);
  const [showTechnicalDetails, setShowTechnicalDetails] = useState<Record<string, boolean>>({});
  const { products: allProducts } = useProducts();

  const { data: rawData = [], isLoading } = useQuery({
    queryKey: ['user_activities', uid],
    queryFn: () => userActivityService.getByUser(uid!),
    enabled: !!uid,
  });

  const activities = useMemo(() => {
    if (Array.isArray(rawData)) return rawData;
    if (rawData && typeof rawData === 'object' && 'results' in rawData && Array.isArray((rawData as { results: UserActivityType[] }).results)) {
      return (rawData as { results: UserActivityType[] }).results;
    }
    return [];
  }, [rawData]);

  const userSummary = useMemo(() => {
    if (activities.length === 0) return null;
    const first = activities[0];
    return {
      uid: uid,
      email: first.email,
      displayName: first.displayName || 'User',
      totalActivities: activities.length,
      totalTime: activities.reduce((acc, a) => acc + a.duration, 0),
      lastActive: safeToDate(activities[0].timestamp) || new Date(),
    };
  }, [activities, uid]);

  const toggleTechnicalDetails = (id: string) => {
    setShowTechnicalDetails(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  const getIcon = (type: string) => {
    switch (type) {
      case "product_view":
      case "view_product": return <Package size={16} className="text-blue-600" />;
      case "category_view":
      case "view_category": return <Filter size={16} className="text-purple-600" />;
      case "checkout":
      case "view_checkout": return <ShoppingCart size={16} className="text-emerald-600" />;
      case "search": return <Search size={16} className="text-amber-600" />;
      case "home": return <Home size={16} className="text-indigo-600" />;
      case "compare":
      case "view_compare": return <Layers size={16} className="text-cyan-600" />;
      case "wishlist":
      case "view_wishlist": return <ShoppingCart size={16} className="text-pink-600" />;
      case "add_to_wishlist": return <ShoppingCart size={16} className="text-rose-600" />;
      case "click_product_card": return <Eye size={16} className="text-blue-400" />;
      case "add_to_cart": return <ShoppingCart size={16} className="text-orange-600" />;
      default: return <Activity size={16} className="text-muted-foreground" />;
    }
  };

  const getPageLabel = (activity: UserActivityType) => {
    if (!activity.pageType) return "System Event";
    if (activity.pageType === "view_product" || activity.pageType === "product_view") {
      const product = allProducts.find(p => p.slug === activity.metadata?.productSlug || p.id === activity.metadata?.productSlug || p.id === activity.metadata?.productId);
      return product ? `Viewed: ${product.name}` : (activity.metadata?.productName as string || `Product: ${activity.metadata?.productSlug || "Unknown"}`);
    }
    if (activity.pageType === "view_category" || activity.pageType === "category_view") return `Browsed Category: ${activity.metadata?.categorySlug || "Unknown"}`;
    if (activity.pageType === "search") return `Searched for: "${activity.metadata?.query || "..."}"`;
    if (activity.pageType === "click_product_card") return `Clicked Property: ${activity.metadata?.productName || "Product Card"}`;
    if (activity.pageType === "add_to_cart") return `Cart: Added ${activity.metadata?.productName || "Product"}`;
    if (activity.pageType === "add_to_wishlist") return `Wishlist: Liked ${activity.metadata?.productName || "Product"}`;
    
    return activity.pageType.charAt(0).toUpperCase() + activity.pageType.slice(1).replace(/_/g, " ");
  };

  const productInteractions = useMemo(() => {
    const products: Record<string, { product: Product, count: number, types: Set<string> }> = {};
    activities.forEach(a => {
      if (a.pageType === "view_product" || a.pageType === "product_view" || a.pageType === "add_to_cart" || a.pageType === "add_to_wishlist") {
        const slug = a.metadata?.productSlug || a.metadata?.productId as string;
        if (slug) {
          if (!products[slug]) {
            const p = allProducts.find(prod => prod.slug === slug || prod.id === slug);
            if (p) {
              products[slug] = { product: p, count: 0, types: new Set() };
            }
          }
          if (products[slug]) {
            products[slug].count++;
            products[slug].types.add(a.pageType);
          }
        }
      }
    });
    return Object.values(products).sort((a, b) => b.count - a.count);
  }, [activities, allProducts]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-muted/30 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm font-medium text-muted-foreground">Retrieving user data journey...</p>
        </div>
      </div>
    );
  }

  if (!userSummary) {
    return (
      <div className="min-h-screen bg-muted/30 p-8">
        <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-8">
          <ArrowLeft size={16} /> Back to Activity
        </button>
        <div className="bg-card border border-border rounded-3xl p-12 text-center">
          <h2 className="text-xl font-bold mb-2">No Activity Found</h2>
          <p className="text-muted-foreground">We couldn't find any recent activity for this user ID.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-muted/30 p-4 sm:p-6 lg:p-8">
      <div className="max-w-5xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex flex-col gap-6">
          <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-sm font-bold text-blue-600 hover:text-blue-700 w-fit transition-colors">
            <ArrowLeft size={16} /> BACK TO ACTIVITY LOG
          </button>
          
          <div className="bg-card border border-border rounded-3xl p-8 shadow-sm flex flex-col md:flex-row items-center gap-8 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-blue-600/5 rounded-full -mr-16 -mt-16" />
            <div className="absolute bottom-0 left-0 w-24 h-24 bg-purple-600/5 rounded-full -ml-12 -mb-12" />
            
            <div className="w-24 h-24 rounded-3xl bg-blue-600 text-white flex items-center justify-center text-4xl font-black border-8 border-blue-50 shadow-xl relative z-10">
              {userSummary.displayName.charAt(0).toUpperCase()}
            </div>
            
            <div className="flex-1 text-center md:text-left relative z-10">
              <div className="flex flex-wrap items-center justify-center md:justify-start gap-3 mb-2">
                <h1 className="text-3xl font-black text-foreground tracking-tight">{userSummary.displayName}</h1>
                <span className="px-3 py-1 bg-blue-100 text-blue-700 text-[10px] font-black rounded-full uppercase tracking-widest">Active User</span>
              </div>
              <p className="text-lg text-muted-foreground mb-6 font-medium">{userSummary.email}</p>
              
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="space-y-1">
                  <div className="text-[10px] font-black text-muted-foreground uppercase tracking-widest leading-none">Total Actions</div>
                  <div className="text-lg font-black text-foreground">{userSummary.totalActivities}</div>
                </div>
                <div className="space-y-1">
                  <div className="text-[10px] font-black text-muted-foreground uppercase tracking-widest leading-none">Session Time</div>
                  <div className="text-lg font-black text-foreground">{Math.round(userSummary.totalTime / 60)}m {userSummary.totalTime % 60}s</div>
                </div>
                <div className="space-y-1">
                  <div className="text-[10px] font-black text-muted-foreground uppercase tracking-widest leading-none">Last Seen</div>
                  <div className="text-lg font-black text-foreground">{format(userSummary.lastActive, "HH:mm")}</div>
                </div>
                <div className="space-y-1">
                  <div className="text-[10px] font-black text-muted-foreground uppercase tracking-widest leading-none">Engagement</div>
                  <div className="text-lg font-black text-blue-600">High</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Product Interest Gallery */}
        {productInteractions.length > 0 && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-black text-foreground uppercase tracking-tight flex items-center gap-2">
                <Package size={20} className="text-blue-600" />
                Product Interest Gallery
              </h2>
              <span className="text-xs font-bold text-muted-foreground bg-muted px-3 py-1 rounded-full uppercase tracking-widest">{productInteractions.length} Unique Products</span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {productInteractions.map(({ product, count, types }) => (
                <div key={product.id} className="bg-card border border-border rounded-3xl p-4 shadow-sm hover:border-blue-200 transition-all group relative">
                  <div className="absolute top-2 right-2 flex flex-col gap-1 z-10">
                    {types.has("add_to_cart") && (
                      <div className="w-6 h-6 rounded-full bg-orange-100 text-orange-600 flex items-center justify-center shadow-sm" title="Added to Cart">
                        <ShoppingCart size={12} />
                      </div>
                    )}
                    {types.has("add_to_wishlist") && (
                      <div className="w-6 h-6 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center shadow-sm" title="Liked">
                        <ShoppingCart size={12} />
                      </div>
                    )}
                  </div>
                  <div className="aspect-square bg-muted rounded-2xl flex items-center justify-center p-4 mb-3 relative overflow-hidden">
                    <img src={product.image} className="max-w-full max-h-full object-contain group-hover:scale-110 transition-transform duration-500" referrerPolicy="no-referrer" />
                  </div>
                  <div className="space-y-1">
                    <div className="text-[10px] font-bold text-blue-600 uppercase tracking-tight truncate">{product.brand_name || product.brand}</div>
                    <div className="text-xs font-bold text-foreground truncate leading-tight mb-2 h-8 line-clamp-2">{product.name}</div>
                    <div className="flex items-center justify-between pt-2 border-t border-dashed border-border">
                      <div className="text-[10px] font-black text-foreground">{formatPrice(product.price)}</div>
                      <div className="text-[10px] font-bold text-muted-foreground bg-muted px-2 py-0.5 rounded-full">{count} views</div>
                    </div>
                  </div>
                  <Link to={`/product/${product.slug}`} className="absolute inset-0 z-0" />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Timeline */}
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-black text-foreground uppercase tracking-tight flex items-center gap-2">
              <Activity size={20} className="text-blue-600" />
              Full Activity Journey
            </h2>
          </div>

          <div className="relative pl-8 space-y-8 before:absolute before:left-[15px] before:top-2 before:bottom-2 before:w-0.5 before:bg-blue-100">
            {activities.map((activity) => (
              <div key={activity.id} className="relative">
                {/* Timeline Dot */}
                <div className={`absolute -left-[23px] top-2 w-4 h-4 rounded-full border-4 border-white shadow-md z-10 ${
                  activity.pageType === "view_checkout" || activity.pageType === "checkout" ? "bg-emerald-500" : 
                  activity.pageType === "view_product" || activity.pageType === "product_view" ? "bg-blue-500" :
                  activity.pageType === "view_category" || activity.pageType === "category_view" ? "bg-purple-500" : 
                  activity.pageType === "add_to_cart" ? "bg-orange-500" :
                  activity.pageType === "add_to_wishlist" ? "bg-rose-500" :
                  "bg-gray-400"
                }`} />

                <div className="bg-card border border-border rounded-3xl p-6 shadow-sm hover:border-blue-200 transition-all group/card">
                  <div className="flex flex-col md:flex-row gap-6">
                    {/* Activity Icon/Image */}
                    <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center shrink-0 overflow-hidden border border-border group-hover/card:border-blue-100 transition-colors">
                      {(activity.pageType === "product_view" || activity.pageType === "view_product" || activity.pageType === "add_to_cart" || activity.pageType === "add_to_wishlist") ? (() => {
                        const product = allProducts.find(p => p.slug === activity.metadata?.productSlug || p.id === activity.metadata?.productSlug || p.id === activity.metadata?.productId);
                        return product?.image ? (
                          <img src={product.image} alt="" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                        ) : getIcon(activity.pageType);
                      })() : getIcon(activity.pageType)}
                    </div>

                    <div className="flex-1 space-y-4">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <span className={`text-[10px] font-black uppercase tracking-widest ${
                              activity.pageType.includes('product') ? 'text-blue-600' :
                              activity.pageType.includes('category') ? 'text-purple-600' :
                              activity.pageType.includes('checkout') ? 'text-emerald-600' :
                              'text-muted-foreground'
                            }`}>
                              {activity.pageType.replace('_', ' ')}
                            </span>
                            <span className="text-muted-foreground/30">•</span>
                            <span className="text-[10px] font-bold text-muted-foreground uppercase">{format(safeToDate(activity.timestamp) || new Date(), "MMM dd, HH:mm:ss")}</span>
                          </div>
                          <h3 className="text-lg font-bold text-foreground leading-tight">{getPageLabel(activity)}</h3>
                        </div>
                        
                        <div className="text-right">
                          <div className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-1">Time Spent</div>
                          <div className="text-sm font-black text-foreground flex items-center justify-end gap-1.5">
                            <Clock size={14} className="text-blue-600" />
                            {activity.duration}s
                          </div>
                        </div>
                      </div>

                      <div className="flex flex-wrap gap-4 pt-4 border-t border-dashed border-border">
                        <div className="flex items-center gap-2">
                          <Globe size={14} className="text-muted-foreground" />
                          <span className="text-[11px] font-mono text-muted-foreground truncate max-w-[200px]" title={activity.path}>{activity.path}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Laptop size={14} className="text-muted-foreground" />
                          <span className="text-[11px] font-medium text-muted-foreground">{activity.screenResolution}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <MapPin size={14} className="text-muted-foreground" />
                          <span className="text-[11px] font-medium text-muted-foreground">{activity.ipAddress || 'IP: Hidden'}</span>
                        </div>
                      </div>

                      {/* Product Content if applicable */}
                      {(activity.pageType === "product_view" || activity.pageType === "view_product" || activity.pageType === "add_to_cart" || activity.pageType === "add_to_wishlist") && (() => {
                        const product = allProducts.find(p => p.slug === activity.metadata?.productSlug || p.id === activity.metadata?.productSlug || p.id === activity.metadata?.productId);
                        if (!product) return null;

                        return (
                          <div className="mt-4 p-4 bg-muted/50 rounded-2xl border border-border flex items-center gap-4">
                            <div className="w-12 h-12 rounded-xl bg-white flex items-center justify-center p-1.5 shadow-sm">
                              <img src={product.image} className="max-w-full max-h-full object-contain" referrerPolicy="no-referrer" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="text-[10px] font-bold text-blue-600 uppercase tracking-tight">{product.brand_name || product.brand}</div>
                              <div className="text-xs font-bold text-foreground truncate">{product.name}</div>
                            </div>
                            <div className="text-sm font-black text-foreground">{formatPrice(product.price)}</div>
                            <Link 
                              to={`/product/${product.slug}`}
                              className="p-2 bg-white text-blue-600 rounded-xl border border-blue-100 hover:bg-blue-600 hover:text-white transition-all"
                            >
                              <ExternalLink size={14} />
                            </Link>
                          </div>
                        );
                      })()}

                      {/* Category specific info */}
                      {activity.pageType === "view_category" && activity.metadata?.categorySlug && (
                         <div className="mt-4 p-4 bg-purple-50 rounded-2xl border border-purple-100/50 space-y-2">
                            <div className="flex items-center gap-2">
                              <Tag size={14} className="text-purple-600" />
                              <span className="text-xs font-bold text-purple-700 underline capitalize">{activity.metadata.categorySlug}</span>
                            </div>
                            <div className="flex flex-wrap gap-2 text-[10px] font-medium text-purple-600/70">
                              {activity.metadata.brands && (
                                <span className="bg-white px-2 py-0.5 rounded-full border border-purple-100">Brands: {String(activity.metadata.brands)}</span>
                              )}
                              {activity.metadata.minPrice && (
                                <span className="bg-white px-2 py-0.5 rounded-full border border-purple-100">Min: {String(activity.metadata.minPrice)}</span>
                              )}
                            </div>
                         </div>
                      )}

                      {/* Search specific info */}
                      {activity.pageType === "search" && activity.metadata?.query && (
                        <div className="mt-4 p-4 bg-amber-50 rounded-2xl border border-amber-100/50 flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center text-amber-600 shadow-sm">
                              <Search size={14} />
                            </div>
                            <div>
                                <div className="text-[10px] font-black text-amber-600 uppercase tracking-widest leading-none mb-1">Search Keywords</div>
                                <div className="text-sm font-black text-amber-900">"{String(activity.metadata.query)}"</div>
                            </div>
                          </div>
                          <Link to={`/search?q=${encodeURIComponent(String(activity.metadata.query))}`} className="text-xs font-black text-amber-600 hover:underline">RE-RUN SEARCH</Link>
                        </div>
                      )}

                      {/* Action Dropdown */}
                      <div className="pt-2">
                        <button 
                          onClick={() => setExpandedActivityId(expandedActivityId === activity.id ? null : activity.id)}
                          className="text-[10px] font-black text-muted-foreground hover:text-blue-600 flex items-center gap-1 transition-colors"
                        >
                          {expandedActivityId === activity.id ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                          VIEW TECHNICAL PAYLOAD
                        </button>
                        
                        <AnimatePresence>
                          {expandedActivityId === activity.id && (
                            <motion.div
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: "auto", opacity: 1 }}
                              exit={{ height: 0, opacity: 0 }}
                              className="overflow-hidden"
                            >
                              <div className="mt-4 p-4 bg-slate-900 rounded-2xl">
                                <pre className="text-[10px] font-mono text-blue-300 overflow-x-auto">
                                  {JSON.stringify({
                                    id: activity.id,
                                    userAgent: activity.userAgent,
                                    metadata: activity.metadata,
                                    ipAddress: activity.ipAddress
                                  }, null, 2)}
                                </pre>
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserActivityDetail;

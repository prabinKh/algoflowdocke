import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { productService } from "@/api/productService";
import { type Product } from "@/lib/types";
import { formatPrice } from "@/lib/utils";
import { 
  AlertTriangle,
  ArrowUpRight,
  Package,
  Search,
  RefreshCcw,
  ExternalLink,
  ChevronRight
} from "lucide-react";
import { toast } from "sonner";
import { useGSAPReveal } from "@/hooks/useGSAP";

const OutOfStockReport = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const navigate = useNavigate();

  const { user, loading } = useAuth();
  const isAdmin = user?.is_staff || user?.is_superuser;

  useGSAPReveal(containerRef, ".gsap-reveal", { opacity: 0, y: 20, duration: 0.6, stagger: 0.05 });

  const fetchData = async () => {
    try {
      setLoadingProducts(true);
      const productsData = await productService.getAll();
      // Filter for out of stock products (stock <= 0 or inStock is false)
      const outOfStock = productsData.filter(p => {
        const currentStock = p.stockCount ?? p.stock ?? 0;
        return currentStock <= 0 || !p.inStock;
      });
      setProducts(outOfStock);
      setLoadingProducts(false);
    } catch (error) {
      console.error("Error fetching data:", error);
      toast.error("Failed to fetch products data");
      setLoadingProducts(false);
    }
  };

  useEffect(() => {
    if (!loading) {
      if (!user) {
        toast.error("Please sign in to access this page.");
        navigate("/signin");
      } else if (!isAdmin) {
        toast.error("Access denied. Admin only.");
        navigate("/");
      }
    }
  }, [user, loading, isAdmin, navigate]);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 60000); // Poll every minute
    return () => clearInterval(interval);
  }, []);

  const filteredProducts = products.filter(p => 
    p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.brand_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.category_name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading || loadingProducts) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
          <p className="text-sm font-medium animate-pulse">Loading stock data...</p>
        </div>
      </div>
    );
  }

  if (!isAdmin) return null;

  return (
    <div className="flex-1 min-h-screen overflow-y-auto no-scrollbar pb-20 lg:pb-0" ref={containerRef}>
      <div className="p-4 lg:p-8 max-w-7xl mx-auto space-y-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 gsap-reveal">
          <div>
            <h1 className="text-3xl font-display font-black tracking-tight flex items-center gap-3">
              <span className="p-2.5 bg-rose-500/10 text-rose-500 rounded-2xl">
                <AlertTriangle size={28} />
              </span>
              Out of Stock Report
            </h1>
            <p className="text-muted-foreground mt-1 font-medium italic">Monitor and manage products with zero inventory</p>
          </div>
          <button 
            onClick={fetchData}
            className="flex items-center gap-2 px-4 py-2 bg-accent hover:bg-accent/80 rounded-xl text-sm font-bold transition-all active:scale-95 border border-border"
          >
            <RefreshCcw size={16} />
            Refresh Data
          </button>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 gsap-reveal">
          <div className="bg-card border border-border rounded-3xl p-6 shadow-sm">
            <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-1">Total OOS Items</p>
            <p className="text-3xl font-black text-rose-500">{products.length}</p>
          </div>
          <div className="bg-card border border-border rounded-3xl p-6 shadow-sm">
            <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-1">Potential Loss</p>
            <p className="text-3xl font-black text-amber-500">
              {formatPrice(products.reduce((acc, p) => acc + p.price, 0))}
            </p>
            <p className="text-[10px] font-medium text-muted-foreground mt-1">Sum of unit prices</p>
          </div>
        </div>

        {/* Filters */}
        <div className="flex items-center gap-4 bg-card border border-border rounded-3xl p-3 shadow-sm gsap-reveal">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
            <input 
              type="text" 
              placeholder="Search by name, brand or category..."
              className="w-full pl-12 pr-4 py-3 bg-accent/30 rounded-2xl text-sm border-none focus:ring-2 focus:ring-primary/20 outline-none transition-all"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        <div className="bg-card border border-border rounded-3xl overflow-hidden shadow-sm gsap-reveal">
          <div className="p-6 border-b border-border flex items-center justify-between">
            <h3 className="text-lg font-display font-bold flex items-center gap-2">
              <Package size={20} className="text-primary" />
              Inventory Shortage
            </h3>
            <span className="px-3 py-1 bg-rose-500/10 text-rose-500 rounded-full text-[10px] font-bold uppercase tracking-wider border border-rose-500/20">
              {filteredProducts.length} Products
            </span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-accent/30 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                  <th className="px-6 py-4">Product Info</th>
                  <th className="px-6 py-4">Category / Brand</th>
                  <th className="px-6 py-4">Unit Price</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filteredProducts.map((product) => (
                  <tr key={product.id} className="hover:bg-accent/20 transition-colors group">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl bg-accent overflow-hidden border border-border">
                          {product.image ? (
                            <img src={product.image} alt={product.name} className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                              <Package size={20} />
                            </div>
                          )}
                        </div>
                        <div>
                          <p className="text-sm font-bold truncate max-w-[200px]">{product.name}</p>
                          <p className="text-[10px] text-muted-foreground font-mono">ID: {product.id.slice(0, 8)}...</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="space-y-1">
                        <span className="px-2 py-0.5 bg-blue-500/10 text-blue-500 rounded text-[10px] font-bold block w-fit">
                          {product.category_name || product.category}
                        </span>
                        <span className="px-2 py-0.5 bg-accent rounded text-[10px] font-medium block w-fit">
                           {product.brand_name || product.brand || "Generics"}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm font-bold">{formatPrice(product.price)}</span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1.5 text-rose-500 font-bold text-xs uppercase tracking-tight">
                        <AlertTriangle size={14} />
                        Out of Stock
                      </div>
                      <p className="text-[10px] text-muted-foreground mt-0.5">Quantity: {product.stockCount ?? product.stock ?? 0}</p>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button 
                          onClick={() => navigate(`/admin/products/edit/${product.id}`)}
                          className="p-2 hover:bg-primary/10 hover:text-primary rounded-lg transition-colors text-muted-foreground border border-transparent hover:border-primary/20"
                          title="Restock / Edit"
                        >
                          <ExternalLink size={16} />
                        </button>
                        <button 
                          onClick={() => navigate(`/product/${product.slug}`)}
                           className="p-2 hover:bg-accent rounded-lg transition-colors text-muted-foreground"
                           title="View Public Page"
                        >
                          <ArrowUpRight size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {filteredProducts.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-6 py-16 text-center">
                      <div className="flex flex-col items-center gap-3 grayscale opacity-30">
                        <Package size={48} />
                        <p className="text-sm font-bold uppercase tracking-widest">No Out of Stock Items Found</p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OutOfStockReport;

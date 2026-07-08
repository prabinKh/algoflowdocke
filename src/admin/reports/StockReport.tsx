import { useState, useEffect, useRef } from "react";
import { useNavigate, useOutletContext } from "react-router-dom";
import { productService } from "@/api/productService";
import { type Product } from "@/lib/types";
import { formatPrice } from "@/lib/utils";
import { 
  Menu,
  Download,
  ChevronRight,
  Package,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Search,
  Filter,
  ArrowUpRight
} from "lucide-react";
import { toast } from "sonner";
import { useGSAPReveal } from "@/hooks/useGSAP";

const StockReport = () => {
  const { setIsSidebarOpen } = useOutletContext<{ setIsSidebarOpen: (open: boolean) => void }>();
  const containerRef = useRef<HTMLDivElement>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  // Filter states
  const [searchQuery, setSearchQuery] = useState("");
  const [stockStatus, setStockStatus] = useState("all");

  useGSAPReveal(containerRef, ".gsap-reveal", { opacity: 0, y: 20, duration: 0.6, stagger: 0.05 });

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const productsData = await productService.getAll();
        setProducts(productsData);
        setFilteredProducts(productsData);
        setLoading(false);
      } catch (error) {
        console.error("Error fetching products:", error);
      }
    };

    fetchProducts();
    const interval = setInterval(fetchProducts, 30000); // Poll every 30 seconds

    return () => clearInterval(interval);
  }, [navigate]);

  useEffect(() => {
    let filtered = products.filter(p => 
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (p.id && p.id.toLowerCase().includes(searchQuery.toLowerCase()))
    );

    if (stockStatus === "in-stock") {
      filtered = filtered.filter(p => (p.stock || 0) > 10);
    } else if (stockStatus === "low-stock") {
      filtered = filtered.filter(p => (p.stock || 0) > 0 && (p.stock || 0) <= 10);
    } else if (stockStatus === "out-of-stock") {
      filtered = filtered.filter(p => (p.stock || 0) === 0);
    }

    setFilteredProducts(filtered);
  }, [searchQuery, stockStatus, products]);

  const totalProducts = products.length;
  const inStock = products.filter(p => (p.stock || 0) > 10).length;
  const lowStock = products.filter(p => (p.stock || 0) > 0 && (p.stock || 0) <= 10).length;
  const outOfStock = products.filter(p => (p.stock || 0) === 0).length;

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
          <p className="text-sm font-medium animate-pulse">Loading stock data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 min-h-screen overflow-y-auto no-scrollbar pb-20 lg:pb-0" ref={containerRef}>

        <div className="p-4 lg:p-8 max-w-7xl mx-auto space-y-8">
          {/* Stats Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 gsap-reveal">
            {[
              { label: "Total Products", value: totalProducts, icon: Package, color: "text-blue-500" },
              { label: "In Stock", value: inStock, icon: CheckCircle2, color: "text-emerald-500" },
              { label: "Low Stock", value: lowStock, icon: AlertTriangle, color: "text-amber-500" },
              { label: "Out of Stock", value: outOfStock, icon: XCircle, color: "text-rose-500" },
            ].map((stat, i) => (
              <div key={i} className="bg-card border border-border rounded-3xl p-6 shadow-sm hover:shadow-md transition-all group">
                <div className={`w-12 h-12 rounded-2xl bg-accent flex items-center justify-center ${stat.color} mb-4 group-hover:scale-110 transition-transform`}>
                  <stat.icon size={24} />
                </div>
                <p className="text-3xl font-display font-bold mb-1">{stat.value}</p>
                <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">{stat.label}</p>
              </div>
            ))}
          </div>

          {/* Filters */}
          <div className="bg-card border border-border rounded-3xl p-6 shadow-sm gsap-reveal">
            <div className="flex flex-col sm:flex-row items-center gap-4">
              <div className="relative flex-1 w-full">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
                <input 
                  type="text" 
                  placeholder="Search products by name or SKU..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-accent/50 border border-border rounded-xl pl-12 pr-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20" 
                />
              </div>
              <div className="flex items-center gap-2 w-full sm:w-auto">
                <Filter size={18} className="text-muted-foreground" />
                <select 
                  value={stockStatus}
                  onChange={(e) => setStockStatus(e.target.value)}
                  className="bg-accent/50 border border-border rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 min-w-[150px]"
                >
                  <option value="all">All Status</option>
                  <option value="in-stock">In Stock</option>
                  <option value="low-stock">Low Stock</option>
                  <option value="out-of-stock">Out of Stock</option>
                </select>
              </div>
            </div>
          </div>

          {/* Stock Table */}
          <div className="bg-card border border-border rounded-3xl overflow-hidden shadow-sm gsap-reveal">
            <div className="p-6 border-b border-border flex items-center justify-between">
              <h3 className="text-lg font-display font-bold">Stock Details</h3>
              <span className="text-xs font-bold text-muted-foreground">Showing {filteredProducts.length} products</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-accent/30 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                    <th className="px-6 py-4">Product</th>
                    <th className="px-6 py-4">SKU</th>
                    <th className="px-6 py-4">Category</th>
                    <th className="px-6 py-4">Price</th>
                    <th className="px-6 py-4">Stock</th>
                    <th className="px-6 py-4 text-right">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {filteredProducts.map((product) => (
                    <tr key={product.id} className="hover:bg-accent/20 transition-colors group">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg bg-muted overflow-hidden border border-border group-hover:scale-105 transition-transform">
                            <img src={product.image} alt={product.name} className="w-full h-full object-cover" />
                          </div>
                          <p className="text-sm font-bold truncate max-w-[200px]">{product.name}</p>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-xs font-mono font-bold text-primary">#{String(product.id || "").slice(-6).toUpperCase()}</span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-xs font-medium">{product.category}</span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm font-bold">{formatPrice(product.price)}</span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <div className="w-16 h-1.5 bg-accent rounded-full overflow-hidden">
                            <div 
                              className={`h-full rounded-full transition-all duration-1000 ${
                                (product.stock || 0) > 10 ? 'bg-emerald-500' : 
                                (product.stock || 0) > 0 ? 'bg-amber-500' : 'bg-rose-500'
                              }`} 
                              style={{ width: `${Math.min(((product.stock || 0) / 50) * 100, 100)}%` }}
                            />
                          </div>
                          <span className="text-xs font-bold">{product.stock || 0}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                          (product.stock || 0) > 10 ? 'bg-emerald-500/10 text-emerald-500' : 
                          (product.stock || 0) > 0 ? 'bg-amber-500/10 text-amber-500' : 
                          'bg-rose-500/10 text-rose-500'
                        }`}>
                          {(product.stock || 0) > 10 ? 'In Stock' : 
                           (product.stock || 0) > 0 ? 'Low Stock' : 'Out of Stock'}
                        </span>
                      </td>
                    </tr>
                  ))}
                  {filteredProducts.length === 0 && (
                    <tr>
                      <td colSpan={6} className="px-6 py-12 text-center text-muted-foreground">
                        No products found matching your search.
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

export default StockReport;

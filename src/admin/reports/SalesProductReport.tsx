import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import Sidebar from "@/admin/components/Sidebar";
import { useAuth } from "@/context/AuthContext";
import { productService } from "@/api/productService";
import { orderService } from "@/api/orderService";
import { type Order } from "@/types/admin";
import { type Product } from "@/lib/types";
import { formatPrice } from "@/lib/utils";
import { 
  Menu,
  Download,
  ChevronRight,
  Package,
  Search,
  Filter,
  ArrowUpRight
} from "lucide-react";
import { toast } from "sonner";
import { useGSAPReveal } from "@/hooks/useGSAP";
import { format } from "date-fns";

const SalesProductReport = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const navigate = useNavigate();
  
  const { user, loading } = useAuth();
  const isAdmin = user?.is_staff || user?.is_superuser;

  useGSAPReveal(containerRef, ".gsap-reveal", { opacity: 0, y: 20, duration: 0.6, stagger: 0.05 });

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
    const fetchData = async () => {
      try {
        const [productsData, ordersData] = await Promise.all([
          productService.getAll(),
          orderService.getAll()
        ]);
        setProducts(productsData);
        setOrders(ordersData);
        setLoadingProducts(false);
      } catch (error) {
        console.error("Error fetching data:", error);
      }
    };

    fetchData();
    const interval = setInterval(fetchData, 30000); // Poll every 30 seconds

    return () => {
      clearInterval(interval);
    };
  }, []);

  const productStats = products.map(p => {
    const conformOrders = orders.filter(o => o.status === "process_conform");
    
    const salesCount = conformOrders.reduce((acc, o) => {
      const item = o.items?.find(i => i.productId === p.id);
      return acc + (item ? item.quantity : 0);
    }, 0);
    const revenue = conformOrders.reduce((acc, o) => {
      const item = o.items?.find(i => i.productId === p.id);
      return acc + (item ? item.price * item.quantity : 0);
    }, 0);
    return {
      ...p,
      salesCount,
      revenue
    };
  }).sort((a, b) => b.salesCount - a.salesCount);

  if (loading || loadingProducts) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
          <p className="text-sm font-medium animate-pulse">Loading product sales data...</p>
        </div>
      </div>
    );
  }

  if (!isAdmin) return null;

  return (
    <div className="flex-1 min-h-screen overflow-y-auto no-scrollbar pb-20 lg:pb-0" ref={containerRef}>
      <div className="p-4 lg:p-8 max-w-7xl mx-auto space-y-8">
          <div className="bg-card border border-border rounded-3xl overflow-hidden shadow-sm gsap-reveal">
            <div className="p-6 border-b border-border flex items-center justify-between">
              <h3 className="text-lg font-display font-bold">Product Sales Details</h3>
              <span className="text-xs font-bold text-muted-foreground">Showing {productStats.length} products</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-accent/30 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                    <th className="px-6 py-4">Product</th>
                    <th className="px-6 py-4">Category</th>
                    <th className="px-6 py-4">Price</th>
                    <th className="px-6 py-4">Quantity Sold</th>
                    <th className="px-6 py-4 text-right">Total Revenue</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {productStats.map((product) => (
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
                        <span className="text-xs font-medium">{product.category_name || product.category}</span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm font-bold">{formatPrice(product.price)}</span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-xs font-bold">{product.salesCount} units</span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <span className="text-sm font-bold text-emerald-600">{formatPrice(product.revenue)}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
    </div>
  );
};

export default SalesProductReport;

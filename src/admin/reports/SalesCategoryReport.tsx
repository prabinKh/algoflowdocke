import { useState, useEffect, useRef } from "react";
import { useNavigate, useOutletContext } from "react-router-dom";
import { productService } from "@/api/productService";
import { orderService } from "@/api/orderService";
import { type Order } from "@/types/admin";
import { type Product } from "@/lib/types";
import { formatPrice } from "@/lib/utils";
import { 
  Menu,
  Download,
  ChevronRight,
  Layout,
  Search,
  Filter,
  ArrowUpRight
} from "lucide-react";
import { toast } from "sonner";
import { useGSAPReveal } from "@/hooks/useGSAP";

const SalesCategoryReport = () => {
  const { setIsSidebarOpen } = useOutletContext<{ setIsSidebarOpen: (open: boolean) => void }>();
  const containerRef = useRef<HTMLDivElement>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useGSAPReveal(containerRef, ".gsap-reveal", { opacity: 0, y: 20, duration: 0.6, stagger: 0.05 });

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [productsData, ordersData] = await Promise.all([
          productService.getAll(),
          orderService.getAll()
        ]);
        setProducts(productsData);
        setOrders(ordersData);
        setLoading(false);
      } catch (error) {
        console.error("Error fetching data:", error);
      }
    };

    fetchData();
    const interval = setInterval(fetchData, 30000); // Poll every 30 seconds

    return () => clearInterval(interval);
  }, [navigate]);

  const categories = Array.from(new Set(products.map(p => p.category_name || p.category)));
  const categoryStats = categories.map(categoryName => {
    const categoryProducts = products.filter(p => (p.category_name || p.category) === categoryName);
    const conformOrders = orders.filter(o => o.status === "process_conform");
    
    const salesCount = conformOrders.reduce((acc, o) => {
      const itemsInCategory = o.items?.filter(i => categoryProducts.some(p => p.id === i.productId)) || [];
      return acc + itemsInCategory.reduce((sum, item) => sum + item.quantity, 0);
    }, 0);
    const revenue = conformOrders.reduce((acc, o) => {
      const itemsInCategory = o.items?.filter(i => categoryProducts.some(p => p.id === i.productId)) || [];
      return acc + itemsInCategory.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    }, 0);
    return {
      name: categoryName,
      productCount: categoryProducts.length,
      salesCount,
      revenue
    };
  }).sort((a, b) => b.revenue - a.revenue);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
          <p className="text-sm font-medium animate-pulse">Loading category sales data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 min-h-screen overflow-y-auto no-scrollbar pb-20 lg:pb-0" ref={containerRef}>

        <div className="p-4 lg:p-8 max-w-7xl mx-auto space-y-8">
          <div className="bg-card border border-border rounded-3xl overflow-hidden shadow-sm gsap-reveal">
            <div className="p-6 border-b border-border flex items-center justify-between">
              <h3 className="text-lg font-display font-bold">Category Sales Details</h3>
              <span className="text-xs font-bold text-muted-foreground">Showing {categoryStats.length} categories</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-accent/30 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                    <th className="px-6 py-4">Category</th>
                    <th className="px-6 py-4">Products</th>
                    <th className="px-6 py-4">Quantity Sold</th>
                    <th className="px-6 py-4 text-right">Total Revenue</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {categoryStats.map((stat) => (
                    <tr key={stat.name} className="hover:bg-accent/20 transition-colors group">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
                            <Layout size={18} />
                          </div>
                          <p className="text-sm font-bold">{stat.name}</p>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-xs font-medium">{stat.productCount} products</span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-xs font-bold">{stat.salesCount} units</span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <span className="text-sm font-bold text-emerald-600">{formatPrice(stat.revenue)}</span>
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

export default SalesCategoryReport;

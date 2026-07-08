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
  TrendingUp,
  Award,
  BarChart2
} from "lucide-react";
import { toast } from "sonner";
import { useGSAPReveal } from "@/hooks/useGSAP";
import { 
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell
} from "recharts";

const TopSalesReports = () => {
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

  const productSales = products.map(p => {
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
      name: p.name,
      sales: salesCount,
      revenue,
      image: p.image
    };
  }).sort((a, b) => b.sales - a.sales).slice(0, 10);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
          <p className="text-sm font-medium animate-pulse">Loading top sales data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 min-h-screen overflow-y-auto no-scrollbar pb-20 lg:pb-0" ref={containerRef}>

        <div className="p-4 lg:p-8 max-w-7xl mx-auto space-y-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 gsap-reveal">
            <div className="lg:col-span-2 bg-card border border-border rounded-3xl p-6 shadow-sm">
              <div className="flex items-center justify-between mb-8">
                <div>
                  <h3 className="text-lg font-display font-bold">Top Selling Products</h3>
                  <p className="text-xs text-muted-foreground">Based on quantity sold</p>
                </div>
                <TrendingUp className="text-emerald-500" size={24} />
              </div>
              <div className="h-[400px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={productSales} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="hsl(var(--border))" />
                    <XAxis type="number" hide />
                    <YAxis 
                      dataKey="name" 
                      type="category" 
                      width={150}
                      axisLine={false}
                      tickLine={false}
                      tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
                    />
                    <Tooltip 
                      cursor={{ fill: "hsl(var(--accent))", opacity: 0.4 }}
                      contentStyle={{ 
                        backgroundColor: "hsl(var(--card))", 
                        borderColor: "hsl(var(--border))",
                        borderRadius: "12px",
                        fontSize: "12px"
                      }}
                    />
                    <Bar dataKey="sales" fill="#3b82f6" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="bg-card border border-border rounded-3xl p-6 shadow-sm">
              <h3 className="text-lg font-display font-bold mb-6">Leaderboard</h3>
              <div className="space-y-6">
                {productSales.map((product, i) => (
                  <div key={i} className="flex items-center gap-4 group">
                    <div className="relative">
                      <div className="w-12 h-12 rounded-xl bg-muted overflow-hidden border border-border group-hover:scale-105 transition-transform">
                        <img src={product.image} alt={product.name} className="w-full h-full object-cover" />
                      </div>
                      {i < 3 && (
                        <div className={`absolute -top-2 -left-2 w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold text-white shadow-lg ${
                          i === 0 ? "bg-amber-400" : i === 1 ? "bg-slate-400" : "bg-amber-700"
                        }`}>
                          {i + 1}
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold truncate">{product.name}</p>
                      <div className="flex items-center justify-between mt-1">
                        <span className="text-[10px] font-bold text-muted-foreground">{product.sales} sold</span>
                        <span className="text-[10px] font-bold text-emerald-600">{formatPrice(product.revenue)}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
  );
};

export default TopSalesReports;

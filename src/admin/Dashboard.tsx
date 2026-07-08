import { useRef, useMemo } from "react";
import { Link, useOutletContext } from "react-router-dom";
import { formatPrice, sumAmounts } from "@/lib/utils";
import { type Order } from "@/types/admin";
import { motion } from "motion/react";
import { 
  Plus, 
  ShoppingCart, 
  Users, 
  TrendingUp, 
  DollarSign,
  ArrowUpRight,
  ArrowDownRight,
  Clock,
  CheckCircle2,
  Truck,
  Wrench,
  MessageSquare
} from "lucide-react";
import { useGSAPReveal } from "@/hooks/useGSAP";
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer
} from "recharts";
import { format } from "date-fns";
import { useProducts } from "@/hooks/useProducts";
import { useOrders } from "@/hooks/useOrders";
import { useCustomers } from "@/hooks/useCustomers";
import { useRepairTickets } from "@/hooks/useRepairTickets";
import { SafeImage } from "@/frontend/components/SafeImage";
import { safeToDate } from "@/lib/utils";


const AdminDashboard = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const { setIsSidebarOpen } = useOutletContext<{ setIsSidebarOpen: (open: boolean) => void }>();
  
  const { products: productsList, loading: productsLoading } = useProducts();
  const { orders, loading: ordersLoading } = useOrders();
  const { customers, loading: customersLoading } = useCustomers();
  const { tickets: repairTickets, loading: ticketsLoading } = useRepairTickets();
  
  const loading = productsLoading || ordersLoading || customersLoading || ticketsLoading;

  useGSAPReveal(containerRef, ".gsap-reveal", { opacity: 0, y: 20, duration: 0.6, stagger: 0.05 });

  // Calculate Stats
  const conformOrders = useMemo(() => (Array.isArray(orders) ? orders : []).filter(o => o.status === "process_conform"), [orders]);
  const totalRevenue = useMemo(() => sumAmounts(conformOrders, 'totalAmount'), [conformOrders]);
  const pendingOrders = useMemo(() => (Array.isArray(orders) ? orders : []).filter(o => o.status === "pending" || o.status === "new").length, [orders]);
  const activeRepairs = useMemo(() => (Array.isArray(repairTickets) ? repairTickets : []).filter(t => t.status !== "Completed" && t.status !== "Cancelled").length, [repairTickets]);
  
  // Low Stock Products
  const lowStockProducts = useMemo(() => (Array.isArray(productsList) ? productsList : []).filter(p => (p.stock || 0) < 10).slice(0, 5), [productsList]);

  // Recent Activity
  const recentActivity = useMemo(() => {
    const activity = [
      ...(Array.isArray(orders) ? orders : []).slice(0, 3).map(order => {
        const date = safeToDate(order.createdAt);
        return {
          type: "order",
          message: `Order #${order.orderId || String(order.id).slice(-6)} from ${order.customerName}`,
          time: date ? format(date, "HH:mm a") : "Recently",
          icon: ShoppingCart,
          color: "text-emerald-500"
        };
      }),
      ...(Array.isArray(customers) ? customers : []).slice(0, 2).map(cust => {
        const date = safeToDate(cust.lastVisit);
        return {
          type: "user",
          message: `New customer: ${cust.name}`,
          time: date ? format(date, "HH:mm a") : "Recently",
          icon: Users,
          color: "text-blue-500"
        };
      })
    ].sort((a, b) => b.time.localeCompare(a.time)).slice(0, 5);

    return activity.length > 0 ? activity : [
      { type: "order", message: "No recent activity", time: "Now", icon: Clock, color: "text-muted-foreground" }
    ];
  }, [orders, customers]);

  // Quick Actions
  const quickActions = [
    { label: "POS System", icon: ShoppingCart, path: "/admin/pos", color: "bg-emerald-500" },
    { label: "Add Product", icon: Plus, path: "/admin/products/add", color: "bg-blue-500" },
    { label: "Live Chat", icon: MessageSquare, path: "/admin/messages", color: "bg-rose-500" },
    { label: "Repair Tickets", icon: Wrench, path: "/admin/repairs", color: "bg-amber-500" },
    { label: "View Orders", icon: Truck, path: "/admin/orders", color: "bg-indigo-500" },
    { label: "Staff Management", icon: Users, path: "/admin/staff/users", color: "bg-purple-500" },
  ];

  // Chart Data
  const chartData = useMemo(() => {
    return Array.from({ length: 7 }).map((_, i) => {
      const date = new Date();
      date.setDate(date.getDate() - (6 - i));
      const dateStr = format(date, "MMM dd");
      const dayConformOrders = conformOrders.filter(o => {
        const oDate = safeToDate(o.createdAt);
        return oDate && format(oDate, "MMM dd") === dateStr;
      });
      const revenue = sumAmounts(dayConformOrders, 'totalAmount');
      return { name: dateStr, revenue };
    });
  }, [conformOrders]);

  // Top Products (Based on conform orders for actual sales)
  const topProducts = useMemo(() => {
    return (Array.isArray(productsList) ? productsList : [])
      .slice(0, 5)
      .map(p => ({
        id: p.id,
        name: p.name,
        sales: conformOrders.reduce((acc, o) => acc + (o.items || []).filter(item => item && (item.productId === p.id || item.id === p.id)).length, 0),
        image: p.image
      }))
      .sort((a, b) => b.sales - a.sales);
  }, [productsList, conformOrders]);

  const getStatusColor = (status: Order["status"]) => {
    switch (status) {
      case "new": return "bg-blue-500/10 text-blue-500";
      case "pending": return "bg-amber-500/10 text-amber-500";
      case "processing": return "bg-indigo-500/10 text-indigo-500";
      case "shipped": return "bg-purple-500/10 text-purple-500";
      case "delivered": return "bg-emerald-500/10 text-emerald-500";
      case "process_conform": return "bg-green-500/10 text-green-500";
      case "cancelled": return "bg-gray-500/10 text-gray-500";
      case "process_dont_conform": return "bg-rose-500/10 text-rose-500";
      default: return "bg-muted/10 text-muted-foreground";
    }
  };

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
          <p className="text-sm font-medium animate-pulse">Loading dashboard data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-full bg-background" ref={containerRef}>
      <div className="flex flex-col min-w-0 min-h-full">
        <div className="p-4 lg:p-8 max-w-7xl mx-auto space-y-8 w-full">
          {/* Stats Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 gsap-reveal">
            {[
              { label: "Total Revenue", value: formatPrice(totalRevenue), icon: DollarSign, color: "text-emerald-500", trend: "+12.5%", isUp: true, bg: "bg-emerald-500/5" },
              { label: "Total Orders", value: (Array.isArray(orders) ? orders : []).length, icon: ShoppingCart, color: "text-blue-500", trend: "+8.2%", isUp: true, bg: "bg-blue-500/5" },
              { label: "Total Customers", value: (Array.isArray(customers) ? customers : []).length, icon: Users, color: "text-indigo-500", trend: "+5.1%", isUp: true, bg: "bg-indigo-500/5" },
              { label: "Active Repairs", value: activeRepairs, icon: Wrench, color: "text-rose-500", trend: "+3.4%", isUp: true, bg: "bg-rose-500/5" },
              { label: "Pending Orders", value: pendingOrders, icon: Clock, color: "text-amber-500", trend: "-2.4%", isUp: false, bg: "bg-amber-500/5" },
            ].map((stat, i) => (
              <motion.div 
                key={i} 
                whileHover={{ y: -5 }}
                className="bg-card border border-border rounded-[2rem] p-6 shadow-sm hover:shadow-xl transition-all group relative overflow-hidden"
              >
                <div className={`absolute top-0 right-0 w-24 h-24 ${stat.bg} rounded-bl-[4rem] -mr-8 -mt-8 transition-transform group-hover:scale-110`} />
                <div className="relative z-10">
                  <div className="flex items-center justify-between mb-4">
                    <div className={`w-12 h-12 rounded-2xl bg-accent flex items-center justify-center ${stat.color} group-hover:rotate-12 transition-transform`}>
                      <stat.icon size={24} />
                    </div>
                    <div className={`flex items-center gap-1 text-[10px] font-bold px-2 py-1 rounded-full ${stat.isUp ? "bg-emerald-500/10 text-emerald-500" : "bg-rose-500/10 text-rose-500"}`}>
                      {stat.isUp ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
                      {stat.trend}
                    </div>
                  </div>
                  <p className="text-3xl font-display font-bold mb-1 tracking-tight">{stat.value}</p>
                  <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest">{stat.label}</p>
                </div>
              </motion.div>
            ))}
          </div>

          {/* Quick Actions */}
          <div className="gsap-reveal">
            <h3 className="text-lg font-display font-bold mb-4">Quick Actions</h3>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
              {quickActions.map((action, i) => (
                <Link 
                  key={i} 
                  to={action.path}
                  className="bg-card border border-border rounded-3xl p-6 flex flex-col items-center gap-4 hover:shadow-lg transition-all group"
                >
                  <div className={`w-12 h-12 rounded-2xl ${action.color} text-white flex items-center justify-center group-hover:scale-110 transition-transform shadow-lg`}>
                    <action.icon size={24} />
                  </div>
                  <span className="text-sm font-bold text-center">{action.label}</span>
                </Link>
              ))}
            </div>
          </div>

          {/* Charts & Activity Section */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 gsap-reveal">
            {/* Revenue Chart */}
            <div className="lg:col-span-2 bg-card border border-border rounded-3xl p-6 shadow-sm">
              <div className="flex items-center justify-between mb-8">
                <div>
                  <h3 className="text-lg font-display font-bold">Revenue Trend</h3>
                  <p className="text-xs text-muted-foreground">Daily revenue for the last 7 days</p>
                </div>
                <div className="flex items-center gap-2 text-xs font-bold text-emerald-500 bg-emerald-500/10 px-3 py-1.5 rounded-full">
                  <TrendingUp size={14} />
                  Growing
                </div>
              </div>
              
              <div className="h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData}>
                    <defs>
                      <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.1}/>
                        <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                    <XAxis 
                      dataKey="name" 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
                      dy={10}
                    />
                    <YAxis 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
                      tickFormatter={(value) => `Rs.${value/1000}k`}
                    />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: "hsl(var(--card))", 
                        borderColor: "hsl(var(--border))",
                        borderRadius: "12px",
                        fontSize: "12px"
                      }}
                      itemStyle={{ color: "hsl(var(--primary))" }}
                    />
                    <Area 
                      type="monotone" 
                      dataKey="revenue" 
                      stroke="hsl(var(--primary))" 
                      strokeWidth={3}
                      fillOpacity={1} 
                      fill="url(#colorRevenue)" 
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Recent Activity */}
            <div className="bg-card border border-border rounded-3xl p-6 shadow-sm">
              <h3 className="text-lg font-display font-bold mb-6">Recent Activity</h3>
              <div className="space-y-6">
                {recentActivity.map((activity, i) => (
                  <div key={i} className="flex gap-4">
                    <div className={`w-10 h-10 rounded-xl bg-accent flex items-center justify-center shrink-0 ${activity.color}`}>
                      <activity.icon size={18} />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-foreground leading-tight">{activity.message}</p>
                      <p className="text-[10px] text-muted-foreground mt-1 font-bold uppercase tracking-wider">{activity.time}</p>
                    </div>
                  </div>
                ))}
              </div>
              <button className="w-full mt-8 py-3 rounded-xl border border-border text-xs font-bold uppercase tracking-widest hover:bg-accent transition-all">
                View All Activity
              </button>
            </div>
          </div>

          {/* Products & Stock Section */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 gsap-reveal">
            {/* Top Products */}
            <div className="bg-card border border-border rounded-3xl p-6 shadow-sm">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-display font-bold">Top Products</h3>
                <Link to="/admin/products" className="text-xs font-bold text-primary hover:underline">View All</Link>
              </div>
              <div className="space-y-6">
                {topProducts.map((product, i) => (
                  <div key={i} className="flex items-center gap-4 group">
                    <div className="w-12 h-12 rounded-xl bg-muted overflow-hidden border border-border group-hover:scale-105 transition-transform">
                      <SafeImage src={product.image} alt={product.name} className="w-full h-full object-cover" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold truncate">{product.name}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <div className="flex-1 h-1.5 bg-accent rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-primary rounded-full transition-all duration-1000" 
                            style={{ width: `${(product.sales / Math.max(...topProducts.map(p => p.sales || 1))) * 100}%` }}
                          />
                        </div>
                        <span className="text-[10px] font-bold text-muted-foreground">{product.sales} sold</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Stock Alerts */}
            <div className="bg-card border border-border rounded-3xl p-6 shadow-sm">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-display font-bold">Stock Alerts</h3>
                <span className="px-2 py-1 bg-rose-500/10 text-rose-500 text-[10px] font-bold rounded-full uppercase">Low Stock</span>
              </div>
              <div className="space-y-4">
                {lowStockProducts.length > 0 ? (
                  lowStockProducts.map((product, i) => (
                    <div key={i} className="flex items-center justify-between p-3 bg-accent/30 rounded-2xl border border-border/50">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg overflow-hidden border border-border">
                          <SafeImage src={product.image} alt={product.name} className="w-full h-full object-cover" />
                        </div>
                        <div>
                          <p className="text-sm font-bold truncate max-w-[150px]">{product.name}</p>
                          <p className="text-[10px] text-muted-foreground uppercase tracking-wider">{product.category}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-bold text-rose-500">{product.stock} left</p>
                        <Link to={`/admin/products/edit/${product.id}`} className="text-[10px] font-bold text-primary hover:underline">Restock</Link>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="h-40 flex flex-col items-center justify-center text-center opacity-20">
                    <CheckCircle2 size={48} className="mb-2" />
                    <p className="text-sm font-bold uppercase tracking-widest">All stock levels healthy</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Recent Orders Table */}
          <div className="bg-card border border-border rounded-3xl overflow-hidden shadow-sm gsap-reveal">
            <div className="p-6 border-b border-border flex items-center justify-between">
              <h3 className="text-lg font-display font-bold">Recent Orders</h3>
              <Link to="/admin/orders" className="text-xs font-bold text-primary hover:underline flex items-center gap-1">
                View All <ArrowUpRight size={14} />
              </Link>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-accent/30 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                    <th className="px-6 py-4">Order ID</th>
                    <th className="px-6 py-4">Customer</th>
                    <th className="px-6 py-4">Status</th>
                    <th className="px-6 py-4">Amount</th>
                    <th className="px-6 py-4 text-right">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {(Array.isArray(orders) ? orders : []).slice(0, 5).map((order) => (
                    <tr key={order.id} className="hover:bg-accent/20 transition-colors group">
                      <td className="px-6 py-4">
                        <span className="text-xs font-mono font-bold text-primary">#{String(order.id).slice(-6).toUpperCase()}</span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center text-[10px] font-bold">
                            {order.customerName.charAt(0)}
                          </div>
                          <div>
                            <p className="text-sm font-bold">{order.customerName}</p>
                            <p className="text-[10px] text-muted-foreground truncate max-w-[150px]">{order.customerEmail || "POS Customer"}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${getStatusColor(order.status)}`}>
                          {order.status}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm font-bold">{formatPrice(order.totalAmount)}</span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <span className="text-xs text-muted-foreground">
                          {(() => {
                            const date = safeToDate(order.createdAt);
                            return date ? format(date, "MMM dd, yyyy") : "Recently";
                          })()}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;

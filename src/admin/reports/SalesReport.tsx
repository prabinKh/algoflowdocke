import { useState, useEffect, useRef } from "react";
import { useNavigate, useOutletContext } from "react-router-dom";
import { orderService } from "@/api/orderService";
import { type Order } from "@/types/admin";
import { formatPrice, sumAmounts, safeToDate } from "@/lib/utils";
import { 
  Menu,
  Download,
  ChevronRight,
  Filter,
  Search,
  Calendar,
  DollarSign,
  ShoppingCart,
  Package,
  Percent,
  Truck,
  FileText,
  ArrowUpRight
} from "lucide-react";
import { toast } from "sonner";
import { useGSAPReveal } from "@/hooks/useGSAP";
import { format } from "date-fns";

const SalesReport = () => {
  const { setIsSidebarOpen } = useOutletContext<{ setIsSidebarOpen: (open: boolean) => void }>();
  const containerRef = useRef<HTMLDivElement>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [filteredOrders, setFilteredOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  // Filter states
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [paymentStatus, setPaymentStatus] = useState("all");
  const [orderStatus, setOrderStatus] = useState("process_conform");

  useGSAPReveal(containerRef, ".gsap-reveal", { opacity: 0, y: 20, duration: 0.6, stagger: 0.05 });

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const ordersData = await orderService.getAll();
        setOrders(ordersData);
        // Apply initial filter for process_conform
        setFilteredOrders(ordersData.filter(o => o.status === "process_conform"));
        setLoading(false);
      } catch (error) {
        console.error("Error fetching orders:", error);
      }
    };

    fetchOrders();
    const interval = setInterval(fetchOrders, 30000); // Poll every 30 seconds

    return () => clearInterval(interval);
  }, [navigate]);

  const handleFilter = () => {
    let filtered = [...orders];

    if (dateFrom) {
      filtered = filtered.filter(o => {
        const d = safeToDate(o.createdAt);
        return d && d >= new Date(dateFrom);
      });
    }
    if (dateTo) {
      filtered = filtered.filter(o => {
        const d = safeToDate(o.createdAt);
        return d && d <= new Date(dateTo);
      });
    }
    if (orderStatus !== "all") {
      filtered = filtered.filter(o => o.status === orderStatus);
    }

    setFilteredOrders(filtered);
    toast.success(`Filtered ${filtered.length} orders`);
  };

  const totalAmount = sumAmounts(filteredOrders, 'totalAmount');
  const totalItems = filteredOrders.reduce((acc, o) => acc + (o.items?.length || 0), 0);
  const totalDiscount = 0; // Mock
  const totalTax = totalAmount * 0.18; // Mock 18% GST
  const totalShipping = filteredOrders.length * 50; // Mock 50 per order
  const netAmount = totalAmount + totalTax + totalShipping - totalDiscount;

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
          <p className="text-sm font-medium animate-pulse">Loading sales data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 min-h-screen overflow-y-auto no-scrollbar pb-20 lg:pb-0" ref={containerRef}>

        <div className="p-4 lg:p-8 max-w-7xl mx-auto space-y-8">
          {/* Filters */}
          <div className="bg-card border border-border rounded-3xl p-6 shadow-sm gsap-reveal">
            <div className="flex items-center gap-2 mb-6">
              <Filter size={18} className="text-primary" />
              <h3 className="text-lg font-display font-bold">Filter Sales</h3>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Date From</label>
                <input 
                  type="date" 
                  value={dateFrom}
                  onChange={(e) => setDateFrom(e.target.value)}
                  className="w-full bg-accent/50 border border-border rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20" 
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Date To</label>
                <input 
                  type="date" 
                  value={dateTo}
                  onChange={(e) => setDateTo(e.target.value)}
                  className="w-full bg-accent/50 border border-border rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20" 
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Payment Status</label>
                <select 
                  value={paymentStatus}
                  onChange={(e) => setPaymentStatus(e.target.value)}
                  className="w-full bg-accent/50 border border-border rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                >
                  <option value="all">All Status</option>
                  <option value="paid">Paid</option>
                  <option value="unpaid">Unpaid</option>
                </select>
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Order Status</label>
                <select 
                  value={orderStatus}
                  onChange={(e) => setOrderStatus(e.target.value)}
                  className="w-full bg-accent/50 border border-border rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                >
                  <option value="all">All Status</option>
                  <option value="pending">Pending</option>
                  <option value="processing">Processing</option>
                  <option value="shipped">Shipped</option>
                  <option value="delivered">Delivered</option>
                  <option value="process_conform">Process Conform (PC)</option>
                  <option value="process_dont_conform">Process Don't Conform</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>
              <div className="flex items-end">
                <button 
                  onClick={handleFilter}
                  className="w-full btn-primary py-2 rounded-xl text-sm font-bold flex items-center justify-center gap-2"
                >
                  <Search size={16} />
                  Filter
                </button>
              </div>
            </div>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7 gap-4 gsap-reveal">
            {[
              { label: "Total Orders", value: filteredOrders.length, icon: ShoppingCart, color: "text-blue-500" },
              { label: "Total Items", value: totalItems, icon: Package, color: "text-indigo-500" },
              { label: "Total Amount", value: formatPrice(totalAmount), icon: DollarSign, color: "text-emerald-500" },
              { label: "Total Discount", value: formatPrice(totalDiscount), icon: Percent, color: "text-rose-500" },
              { label: "Total Tax", value: formatPrice(totalTax), icon: FileText, color: "text-amber-500" },
              { label: "Total Shipping", value: formatPrice(totalShipping), icon: Truck, color: "text-cyan-500" },
              { label: "Net Amount", value: formatPrice(netAmount), icon: DollarSign, color: "text-emerald-600" },
            ].map((stat, i) => (
              <div key={i} className="bg-card border border-border rounded-2xl p-4 shadow-sm hover:shadow-md transition-all group">
                <div className={`w-10 h-10 rounded-xl bg-accent flex items-center justify-center ${stat.color} mb-3 group-hover:scale-110 transition-transform`}>
                  <stat.icon size={20} />
                </div>
                <p className="text-lg font-display font-bold truncate">{stat.value}</p>
                <p className="text-[9px] text-muted-foreground font-bold uppercase tracking-wider">{stat.label}</p>
              </div>
            ))}
          </div>

          {/* Sales Table */}
          <div className="bg-card border border-border rounded-3xl overflow-hidden shadow-sm gsap-reveal">
            <div className="p-6 border-b border-border flex items-center justify-between">
              <h3 className="text-lg font-display font-bold">Sales Details</h3>
              <span className="text-xs font-bold text-muted-foreground">Showing {filteredOrders.length} results</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-accent/30 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                    <th className="px-6 py-4">Order ID</th>
                    <th className="px-6 py-4">Date</th>
                    <th className="px-6 py-4">Customer</th>
                    <th className="px-6 py-4">Items</th>
                    <th className="px-6 py-4">Status</th>
                    <th className="px-6 py-4 text-right">Total Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {filteredOrders.map((order) => (
                    <tr key={order.id} className="hover:bg-accent/20 transition-colors group">
                      <td className="px-6 py-4">
                        <span className="text-xs font-mono font-bold text-primary">#{String(order.id).slice(-6).toUpperCase()}</span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-xs text-muted-foreground">
                          {(() => {
                            const date = safeToDate(order.createdAt);
                            return date ? format(date, "MMM dd, yyyy") : "Recently";
                          })()}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div>
                          <p className="text-sm font-bold">{order.customerName}</p>
                          <p className="text-[10px] text-muted-foreground">{order.customerEmail}</p>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-xs font-medium">{order.items?.length || 0} items</span>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                          order.status === 'delivered' ? 'bg-emerald-500/10 text-emerald-500' : 
                          order.status === 'pending' ? 'bg-amber-500/10 text-amber-500' : 
                          'bg-blue-500/10 text-blue-500'
                        }`}>
                          {order.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <span className="text-sm font-bold">{formatPrice(order.totalAmount)}</span>
                      </td>
                    </tr>
                  ))}
                  {filteredOrders.length === 0 && (
                    <tr>
                      <td colSpan={6} className="px-6 py-12 text-center text-muted-foreground">
                        No orders found for the selected filters.
                      </td>
                    </tr>
                  )}
                </tbody>
                {filteredOrders.length > 0 && (
                  <tfoot>
                    <tr className="bg-accent/10 font-bold">
                      <td colSpan={5} className="px-6 py-4 text-right text-sm">Total:</td>
                      <td className="px-6 py-4 text-right text-sm text-primary">{formatPrice(totalAmount)}</td>
                    </tr>
                  </tfoot>
                )}
              </table>
            </div>
          </div>
        </div>
      </div>
  );
};

export default SalesReport;

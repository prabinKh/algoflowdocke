import { useState, useEffect, useRef } from "react";
import { useNavigate, useOutletContext } from "react-router-dom";
import { customerService } from "@/api/customerService";
import { orderService } from "@/api/orderService";
import { type Customer, type Order } from "@/types/admin";
import { formatPrice, safeToDate } from "@/lib/utils";
import { 
  Menu,
  Download,
  ChevronRight,
  Users,
  UserCheck,
  UserPlus,
  Star,
  Search,
  Filter,
  ArrowUpRight,
  Mail,
  Calendar
} from "lucide-react";
import { toast } from "sonner";
import { useGSAPReveal } from "@/hooks/useGSAP";
import { format } from "date-fns";

const CustomerReports = () => {
  const { setIsSidebarOpen } = useOutletContext<{ setIsSidebarOpen: (open: boolean) => void }>();
  const containerRef = useRef<HTMLDivElement>(null);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [filteredCustomers, setFilteredCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  // Filter states
  const [searchQuery, setSearchQuery] = useState("");

  useGSAPReveal(containerRef, ".gsap-reveal", { opacity: 0, y: 20, duration: 0.6, stagger: 0.05 });

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [customersData, ordersData] = await Promise.all([
          customerService.getAll(),
          orderService.getAll()
        ]);
        setCustomers(customersData);
        setFilteredCustomers(customersData);
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

  useEffect(() => {
    const filtered = customers.filter(c => 
      c.displayName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.email.toLowerCase().includes(searchQuery.toLowerCase())
    );
    setFilteredCustomers(filtered);
  }, [searchQuery, customers]);

  const getCustomerStats = (customer: Customer) => {
    return {
      orderCount: customer.order_count || 0,
      totalSpent: typeof customer.total_spent === 'string' ? parseFloat(customer.total_spent) : (customer.total_spent || 0)
    };
  };

  const totalCustomers = customers.length;
  const activeCustomers = customers.filter(c => c.visitCount > 5 || (c.order_count || 0) > 2).length;
  const newCustomers = customers.filter(c => {
    const joined = safeToDate(c.createdAt);
    if (!joined) return false;
    const now = new Date();
    const diffDays = Math.ceil(Math.abs(now.getTime() - joined.getTime()) / (1000 * 60 * 60 * 24));
    return diffDays <= 30; // Last 30 days
  }).length;

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
          <p className="text-sm font-medium animate-pulse">Loading customer data...</p>
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
              { label: "Total Customers", value: totalCustomers, icon: Users, color: "text-blue-500" },
              { label: "Active Customers", value: activeCustomers, icon: UserCheck, color: "text-emerald-500" },
              { label: "New (30d)", value: newCustomers, icon: UserPlus, color: "text-indigo-500" },
              { label: "Top Customers", value: customers.filter(c => getCustomerStats(c).totalSpent > 10000).length, icon: Star, color: "text-amber-500" },
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
            <div className="relative w-full">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
              <input 
                type="text" 
                placeholder="Search customers by name or email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-accent/50 border border-border rounded-xl pl-12 pr-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20" 
              />
            </div>
          </div>

          {/* Customer Table */}
          <div className="bg-card border border-border rounded-3xl overflow-hidden shadow-sm gsap-reveal">
            <div className="p-6 border-b border-border flex items-center justify-between">
              <h3 className="text-lg font-display font-bold">Customer Details</h3>
              <span className="text-xs font-bold text-muted-foreground">Showing {filteredCustomers.length} customers</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-accent/30 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                    <th className="px-6 py-4">Customer</th>
                    <th className="px-6 py-4">Contact</th>
                    <th className="px-6 py-4">Joined Date</th>
                    <th className="px-6 py-4">Orders</th>
                    <th className="px-6 py-4">Total Spent</th>
                    <th className="px-6 py-4 text-right">Activity</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {filteredCustomers.map((customer) => {
                    const stats = getCustomerStats(customer);
                    return (
                      <tr key={customer.uid || customer.id} className="hover:bg-accent/20 transition-colors group cursor-pointer" onClick={() => navigate(`/admin/activity/${customer.uid || customer.id}`)}>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center text-sm font-bold">
                              {customer.displayName?.charAt(0) || "U"}
                            </div>
                            <div>
                              <p className="text-sm font-bold truncate max-w-[150px]">{customer.displayName || "Unknown User"}</p>
                              <p className="text-[10px] text-muted-foreground font-mono">UID: {customer.uid?.slice(0, 8)}...</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="space-y-1">
                            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                              <Mail size={12} />
                              {customer.email}
                            </div>
                            {customer.phone && (
                              <div className="text-[10px] text-muted-foreground font-medium">
                                Tel: {customer.phone}
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                            <Calendar size={12} />
                            {customer.createdAt ? format(safeToDate(customer.createdAt) || new Date(), "MMM dd, yyyy") : "Unknown"}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className="px-2 py-1 bg-accent rounded-lg text-[10px] font-bold">{stats.orderCount} orders</span>
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-sm font-bold text-emerald-600">{formatPrice(stats.totalSpent)}</span>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <div className="flex flex-col items-end gap-1">
                              <div className="w-20 h-1.5 bg-accent rounded-full overflow-hidden">
                                <div 
                                  className="h-full bg-primary rounded-full transition-all duration-1000" 
                                  style={{ width: `${Math.min((customer.visitCount / 50) * 100, 100)}%` }}
                                />
                              </div>
                              <span className="text-[10px] font-bold text-muted-foreground">{customer.visitCount} visits</span>
                            </div>
                            <ChevronRight size={14} className="text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                  {filteredCustomers.length === 0 && (
                    <tr>
                      <td colSpan={6} className="px-6 py-12 text-center text-muted-foreground">
                        No customers found matching your search.
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

export default CustomerReports;

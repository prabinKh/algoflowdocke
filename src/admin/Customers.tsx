import { useState, useEffect } from "react";
import { useOutletContext } from "react-router-dom";
import { type Customer } from "@/types/admin";
import { useCustomers } from "@/hooks/useCustomers";
import { User, Search, Mail, Calendar, ShoppingCart, TrendingUp, Eye, Trash2, Menu, Clock, CheckCircle2, XCircle, Truck, History as HistoryIcon, ArrowRight, Package } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { format } from "date-fns";
import { formatPrice } from "@/lib/utils";
import { toast } from "sonner";
import { orderService } from "@/api/orderService";
import { repairService } from "@/api/repairService";
import { userActivityService } from "@/api/userActivityService";
import { safeToDate } from "@/lib/utils";

interface OrderItem {
  name: string;
  quantity: number;
  price: number;
  image: string;
}

interface Order {
  id: string;
  items: OrderItem[];
  totalAmount: number;
  status: string;
  createdAt: string;
}

interface RepairTicket {
  id: string;
  ticketId: string;
  category: string;
  brand: string;
  model: string;
  component: string;
  status: string;
  createdAt: string;
}

interface SearchActivity {
  id: string;
  metadata: {
    query?: string;
  };
  timestamp: string;
}

const AdminCustomers = () => {
  const { setIsSidebarOpen } = useOutletContext<{ setIsSidebarOpen: (open: boolean) => void }>();
  const { customers, loading } = useCustomers();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [customerOrders, setCustomerOrders] = useState<Order[]>([]);
  const [customerTickets, setCustomerTickets] = useState<RepairTicket[]>([]);
  const [customerSearches, setCustomerSearches] = useState<SearchActivity[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [activeHistoryTab, setActiveHistoryTab] = useState<"orders" | "repairs" | "searches">("orders");

  useEffect(() => {
    const fetchHistory = async () => {
      if (selectedCustomer) {
        setHistoryLoading(true);
        try {
          // Fetch Orders
          const fetchedOrders = await orderService.getAll();
          setCustomerOrders(fetchedOrders.filter((o) => o.customerEmail === selectedCustomer.email));

          // Fetch Repair Tickets
          const fetchedTickets = await repairService.getAll();
          setCustomerTickets(fetchedTickets.filter((t) => t.userEmail === selectedCustomer.email));

          // Fetch Search History
          const fetchedActivities = await userActivityService.getAll();
          const fetchedSearches = fetchedActivities.filter((a) => a.uid === selectedCustomer.uid && a.pageType === "search") as SearchActivity[];
          setCustomerSearches(fetchedSearches.filter(s => s.metadata?.query));
        } catch (error) {
          console.error("Error fetching customer history:", error);
        } finally {
          setHistoryLoading(false);
        }
      } else {
        setCustomerOrders([]);
        setCustomerTickets([]);
        setCustomerSearches([]);
      }
    };

    fetchHistory();
  }, [selectedCustomer]);

  const filteredCustomers = customers.filter(customer => 
    customer.displayName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    customer.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    customer.uid.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="flex-1 flex flex-col min-w-0 min-h-screen pb-20 lg:pb-0">
        <main className="flex-1 p-4 md:p-8">
          <div className="max-w-7xl mx-auto space-y-8">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div>
                <h1 className="text-3xl font-bold text-foreground">Customer Analytics</h1>
                <p className="text-muted-foreground">Track customer behavior and cart activity</p>
              </div>
              
              <div className="relative w-full md:w-80">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
                <input 
                  type="text"
                  placeholder="Search customers by name, email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-card border border-border rounded-xl focus:ring-2 focus:ring-blue-500/20 outline-none transition-all"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Customer List */}
              <div className="lg:col-span-2 space-y-4">
                {loading ? (
                  Array(5).fill(0).map((_, i) => (
                    <div key={i} className="h-24 bg-card animate-pulse rounded-2xl border border-border" />
                  ))
                ) : filteredCustomers.length === 0 ? (
                  <div className="text-center py-20 bg-card rounded-3xl border border-dashed border-border">
                    <User size={48} className="mx-auto text-muted-foreground/50 mb-4 opacity-20" />
                    <h3 className="text-lg font-bold text-foreground">No customers found</h3>
                    <p className="text-muted-foreground">Try adjusting your search term</p>
                  </div>
                ) : (
                  filteredCustomers.map((customer) => (
                    <motion.div
                      layoutId={customer.uid}
                      key={customer.uid}
                      onClick={() => setSelectedCustomer(customer)}
                      className={`p-5 bg-card border rounded-2xl cursor-pointer transition-all hover:shadow-md group ${selectedCustomer?.uid === customer.uid ? "border-blue-600 ring-1 ring-blue-600/20" : "border-border"}`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center">
                            <User size={24} />
                          </div>
                          <div>
                            <h3 className="font-bold text-base text-foreground">{customer.displayName}</h3>
                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                              <Mail size={12} />
                              {customer.email}
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-6">
                          <div className="text-right hidden sm:block">
                            <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-1">Visits</p>
                            <div className="flex items-center justify-end gap-1.5 font-bold text-sm text-foreground">
                              <TrendingUp size={14} className="text-emerald-500" />
                              {customer.visitCount}
                            </div>
                          </div>
                          <div className="text-right hidden sm:block">
                            <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-1">Cart Items</p>
                            <div className="flex items-center justify-end gap-1.5 font-bold text-sm text-foreground">
                              <ShoppingCart size={14} className="text-blue-600" />
                              {customer.cartItems?.length || 0}
                            </div>
                          </div>
                          <div className="w-8 h-8 bg-muted rounded-full flex items-center justify-center text-muted-foreground group-hover:text-blue-600 transition-colors">
                            <Eye size={16} />
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  ))
                )}
              </div>

              {/* Customer Details Panel */}
              <div className={`${selectedCustomer ? "fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm lg:relative lg:inset-auto lg:z-0 lg:p-0 lg:bg-transparent lg:block lg:col-span-1" : "hidden lg:block lg:col-span-1"}`}>
                <AnimatePresence mode="wait">
                  {selectedCustomer ? (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.95, y: 20 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95, y: 20 }}
                      className="bg-card border border-border rounded-3xl p-6 lg:sticky lg:top-24 shadow-2xl lg:shadow-sm w-full max-w-lg lg:max-w-none overflow-y-auto max-h-[90vh] lg:max-h-none custom-scrollbar"
                    >
                      <div className="flex items-center justify-between mb-8">
                        <h2 className="text-xl font-bold text-foreground">Customer Profile</h2>
                        <button onClick={() => setSelectedCustomer(null)} className="p-2 hover:bg-accent rounded-full transition-colors">
                          <Trash2 size={18} className="text-muted-foreground hover:text-rose-600" />
                        </button>
                      </div>

                      <div className="space-y-8">
                        {/* Activity Overview */}
                        <div className="grid grid-cols-2 gap-4">
                          <div className="p-4 bg-muted rounded-2xl border border-border">
                            <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-1">Total Visits</p>
                            <p className="text-2xl font-bold text-foreground">{selectedCustomer.visitCount}</p>
                          </div>
                          <div className="p-4 bg-muted rounded-2xl border border-border">
                            <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-1">Cart Items</p>
                            <p className="text-2xl font-bold text-foreground">{selectedCustomer.cartItems?.length || 0}</p>
                          </div>
                        </div>

                        <div className="space-y-4">
                          <div className="flex items-center gap-3 text-sm">
                            <Calendar size={18} className="text-blue-600" />
                            <div>
                              <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Last Visit</p>
                              <p className="font-medium text-foreground">{(() => {
                                const date = safeToDate(selectedCustomer.lastVisit);
                                return date ? format(date, "MMMM dd, yyyy • HH:mm") : "Unknown";
                              })()}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-3 text-sm">
                            <Mail size={18} className="text-blue-600" />
                            <div>
                              <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Contact</p>
                              <p className="font-medium text-foreground">{selectedCustomer.email}</p>
                            </div>
                          </div>
                        </div>

                        <div className="h-px bg-accent" />

                        {/* Customer History Tabs */}
                        <div className="space-y-4">
                          <div className="flex items-center justify-between">
                            <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground block">Customer History</label>
                            <div className="flex bg-accent p-1 rounded-lg">
                              <button
                                onClick={() => setActiveHistoryTab("orders")}
                                className={`px-3 py-1 rounded-md text-[10px] font-bold transition-all ${
                                  activeHistoryTab === "orders" ? "bg-card text-blue-600 shadow-sm" : "text-muted-foreground"
                                }`}
                              >
                                Orders
                              </button>
                              <button
                                onClick={() => setActiveHistoryTab("repairs")}
                                className={`px-3 py-1 rounded-md text-[10px] font-bold transition-all ${
                                  activeHistoryTab === "repairs" ? "bg-card text-blue-600 shadow-sm" : "text-muted-foreground"
                                }`}
                              >
                                Repairs
                              </button>
                              <button
                                onClick={() => setActiveHistoryTab("searches")}
                                className={`px-3 py-1 rounded-md text-[10px] font-bold transition-all ${
                                  activeHistoryTab === "searches" ? "bg-card text-blue-600 shadow-sm" : "text-muted-foreground"
                                }`}
                              >
                                Searches
                              </button>
                            </div>
                          </div>

                          <div className="space-y-3 max-h-80 overflow-y-auto pr-2 no-scrollbar">
                            {historyLoading ? (
                              <div className="flex justify-center py-8">
                                <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
                              </div>
                            ) : activeHistoryTab === "orders" ? (
                              customerOrders.length === 0 ? (
                                <div className="text-center py-8 bg-muted rounded-2xl border border-dashed border-border">
                                  <ShoppingCart size={24} className="mx-auto text-muted-foreground/50 mb-2 opacity-20" />
                                  <p className="text-xs text-muted-foreground">No orders found</p>
                                </div>
                              ) : (
                                customerOrders.map((order) => (
                                  <div key={order.id} className="p-4 bg-muted rounded-2xl border border-border hover:border-blue-600/30 transition-all group">
                                    <div className="flex items-center justify-between mb-2">
                                      <span className="text-[10px] font-bold text-foreground">#{String(order.id).slice(-8).toUpperCase()}</span>
                                      <span className="text-[10px] text-muted-foreground">{(() => {
                                        const date = safeToDate(order.createdAt);
                                        return date ? format(date, "MMM dd, yyyy") : "Unknown";
                                      })()}</span>
                                    </div>
                                    <div className="flex items-center justify-between">
                                      <p className="text-xs font-bold text-foreground">{formatPrice(order.totalAmount)}</p>
                                      <span className={`text-[8px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider ${
                                        order.status === 'delivered' ? 'bg-emerald-50 text-emerald-600' : 'bg-blue-50 text-blue-600'
                                      }`}>
                                        {order.status}
                                      </span>
                                    </div>
                                  </div>
                                ))
                              )
                            ) : activeHistoryTab === "repairs" ? (
                              customerTickets.length === 0 ? (
                                <div className="text-center py-8 bg-muted rounded-2xl border border-dashed border-border">
                                  <HistoryIcon size={24} className="mx-auto text-muted-foreground/50 mb-2 opacity-20" />
                                  <p className="text-xs text-muted-foreground">No repair tickets found</p>
                                </div>
                              ) : (
                                customerTickets.map((ticket) => (
                                  <div key={ticket.id} className="p-4 bg-muted rounded-2xl border border-border hover:border-blue-600/30 transition-all group">
                                    <div className="flex items-center justify-between mb-2">
                                      <span className="text-[10px] font-bold text-foreground">#{ticket.ticketId}</span>
                                      <span className="text-[10px] text-muted-foreground">{(() => {
                                        const date = safeToDate(ticket.createdAt);
                                        return date ? format(date, "MMM dd, yyyy") : "Unknown";
                                      })()}</span>
                                    </div>
                                    <div className="space-y-1">
                                      <p className="text-xs font-bold text-foreground">{ticket.brand} {ticket.model}</p>
                                      <p className="text-[10px] text-muted-foreground">{ticket.component}</p>
                                    </div>
                                    <div className="mt-2 flex items-center justify-between">
                                      <span className={`text-[8px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider ${
                                        ticket.status === 'Completed' ? 'bg-emerald-50 text-emerald-600' : 'bg-blue-50 text-blue-600'
                                      }`}>
                                        {ticket.status}
                                      </span>
                                    </div>
                                  </div>
                                ))
                              )
                            ) : (
                              customerSearches.length === 0 ? (
                                <div className="text-center py-8 bg-muted rounded-2xl border border-dashed border-border">
                                  <Search size={24} className="mx-auto text-muted-foreground/50 mb-2 opacity-20" />
                                  <p className="text-xs text-muted-foreground">No search history found</p>
                                </div>
                              ) : (
                                customerSearches.map((search) => (
                                  <div key={search.id} className="p-4 bg-muted rounded-2xl border border-border hover:border-blue-600/30 transition-all group">
                                    <div className="flex items-center justify-between mb-2">
                                      <span className="text-[10px] font-bold text-foreground">"{search.metadata.query}"</span>
                                      <span className="text-[10px] text-muted-foreground">{(() => {
                                        const date = safeToDate(search.timestamp);
                                        return date ? format(date, "MMM dd, yyyy") : "Unknown";
                                      })()}</span>
                                    </div>
                                  </div>
                                ))
                              )
                            )}
                          </div>
                        </div>

                        <div className="h-px bg-accent" />

                        {/* Cart Activity */}
                        <div className="space-y-4">
                          <div className="flex items-center justify-between">
                            <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground block">Current Cart Activity</label>
                            <span className="text-[10px] px-2 py-0.5 bg-blue-50 text-blue-600 rounded-full font-bold">LIVE</span>
                          </div>
                          
                          <div className="space-y-4 max-h-80 overflow-y-auto pr-2 no-scrollbar">
                            {(!selectedCustomer.cartItems || selectedCustomer.cartItems.length === 0) ? (
                              <div className="text-center py-8 bg-muted rounded-2xl border border-dashed border-border">
                                <ShoppingCart size={24} className="mx-auto text-muted-foreground/50 mb-2 opacity-20" />
                                <p className="text-xs text-muted-foreground">Cart is currently empty</p>
                              </div>
                            ) : (
                              selectedCustomer.cartItems.map((item, i) => (
                                <div key={i} className="flex gap-4 p-3 bg-muted rounded-2xl border border-border group hover:border-blue-600/30 transition-colors">
                                  <div className="w-14 h-14 bg-card rounded-xl overflow-hidden flex-shrink-0 border border-border">
                                    <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <p className="text-xs font-bold truncate group-hover:text-blue-600 transition-colors text-foreground">{item.name}</p>
                                    <p className="text-[10px] text-muted-foreground mt-0.5">Qty: {item.quantity} × {formatPrice(item.price)}</p>
                                    {item.features && item.features.length > 0 && (
                                      <div className="flex flex-wrap gap-1 mt-1.5">
                                        {item.features.slice(0, 2).map((f, fi) => (
                                          <span key={fi} className="text-[8px] px-1.5 py-0.5 bg-card border border-border rounded text-muted-foreground uppercase tracking-wider">{f}</span>
                                        ))}
                                        {item.features.length > 2 && <span className="text-[8px] text-muted-foreground">+{item.features.length - 2} more</span>}
                                      </div>
                                    )}
                                  </div>
                                </div>
                              ))
                            )}
                          </div>
                        </div>

                        <div className="pt-4">
                          <button 
                            onClick={() => toast.success(`Contacting ${selectedCustomer.displayName}...`)}
                            className="w-full py-3 bg-blue-600 text-white rounded-2xl text-xs font-bold hover:bg-blue-700 transition-all shadow-lg shadow-blue-600/20 flex items-center justify-center gap-2"
                          >
                            <Mail size={14} />
                            CONTACT CUSTOMER
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  ) : (
                    <div className="bg-card border border-border border-dashed rounded-3xl p-12 text-center sticky top-24">
                      <User size={48} className="mx-auto text-muted-foreground/50 mb-4 opacity-20" />
                      <p className="text-sm text-muted-foreground">Select a customer to view detailed analytics</p>
                    </div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </div>
        </main>
      </div>
  );
};

export default AdminCustomers;

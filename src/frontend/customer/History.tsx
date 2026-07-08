import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { orderService } from "@/api/orderService";
import { repairService } from "@/api/repairService";
import { userActivityService } from "@/api/userActivityService";
import { Header } from "@/frontend/components/Header";
import { Footer } from "@/frontend/components/Footer";
import { motion, AnimatePresence } from "motion/react";
import { Package, Clock, CheckCircle2, Truck, XCircle, ShoppingBag, ArrowRight, History as HistoryIcon, Search, Filter, Calendar, LucideIcon } from "lucide-react";
import { formatPrice, safeToDate } from "@/lib/utils";
import { format } from "date-fns";
import { Link } from "react-router-dom";

interface OrderItem {
  name: string;
  image: string;
  price: number;
  quantity: number;
  slug?: string;
  productId?: string;
}

interface Order {
  id: string;
  items: OrderItem[];
  totalAmount: number;
  status: string;
  createdAt: string;
  customerName: string;
  customerEmail: string;
}

interface RepairTicket {
  id: string;
  ticketId: string;
  category: string;
  brand: string;
  model: string;
  component: string;
  description: string;
  status: string;
  createdAt: string;
}

const statusColors: Record<string, string> = {
  pending: "bg-amber-100 text-amber-600 border-amber-200",
  shipped: "bg-blue-100 text-blue-600 border-blue-200",
  delivered: "bg-emerald-100 text-emerald-600 border-emerald-200",
  cancelled: "bg-rose-100 text-rose-600 border-rose-200",
  // Repair statuses
  "Received": "bg-blue-100 text-blue-600 border-blue-200",
  "In Progress": "bg-amber-100 text-amber-600 border-amber-200",
  "Completed": "bg-emerald-100 text-emerald-600 border-emerald-200",
  "Cancelled": "bg-rose-100 text-rose-600 border-rose-200",
};

const statusIcons: Record<string, LucideIcon> = {
  pending: Clock,
  shipped: Truck,
  delivered: CheckCircle2,
  cancelled: XCircle,
  "Received": Clock,
  "In Progress": HistoryIcon,
  "Completed": CheckCircle2,
  "Cancelled": XCircle,
};

interface SearchActivity {
  id: string;
  metadata: {
    query?: string;
  };
  timestamp: string;
}

export default function HistoryPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [tickets, setTickets] = useState<RepairTicket[]>([]);
  const [searches, setSearches] = useState<SearchActivity[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"orders" | "shopping" | "repairs" | "searches">("orders");
  const [searchQuery, setSearchQuery] = useState("");
  const { user, loading: authLoading } = useAuth();

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      setLoading(false);
      return;
    }
    setLoading(true);
    const fetchHistory = async () => {
      try {
        const fetchedOrders = await orderService.getByUser(user.id);
        setOrders(fetchedOrders as Order[]);

        const fetchedTickets = await repairService.getByUser(user.id);
        setTickets(fetchedTickets as RepairTicket[]);

        const fetchedActivities = await userActivityService.getByUser(user.id);
        const fetchedSearches = fetchedActivities.filter((a) => a.pageType === "search") as SearchActivity[];
        setSearches(fetchedSearches.filter(s => s.metadata?.query));
      } catch (error) {
        console.error("Error fetching history:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchHistory();
  }, [user, authLoading]);

  const filteredOrders = orders.filter(order => 
    String(order.id).toLowerCase().includes(searchQuery.toLowerCase()) ||
    order.items.some(item => item.name.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const filteredTickets = tickets.filter(ticket => 
    (ticket.ticketId?.toLowerCase() || "").includes(searchQuery.toLowerCase()) ||
    (ticket.brand?.toLowerCase() || "").includes(searchQuery.toLowerCase()) ||
    (ticket.model?.toLowerCase() || "").includes(searchQuery.toLowerCase()) ||
    (ticket.category?.toLowerCase() || "").includes(searchQuery.toLowerCase())
  );

  if (!user && !loading) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <Header />
        <main className="flex-1 flex items-center justify-center p-6">
          <div className="text-center space-y-4">
            <div className="w-20 h-20 bg-accent rounded-full flex items-center justify-center mx-auto">
              <HistoryIcon size={40} className="text-muted-foreground" />
            </div>
            <h1 className="text-2xl font-black tracking-tight">Please Sign In</h1>
            <p className="text-muted-foreground max-w-xs mx-auto">
              You need to be signed in to view your shopping and order history.
            </p>
            <Link to="/signin" className="inline-block px-8 py-3 bg-primary text-primary-foreground rounded-xl font-bold uppercase tracking-wider shadow-lg shadow-primary/20 hover:scale-105 transition-transform">
              Sign In Now
            </Link>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />
      
      <main className="flex-1 py-12">
        <div className="neo-container">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
            <div className="space-y-2">
              <div className="flex items-center gap-3 text-primary">
                <HistoryIcon size={24} />
                <span className="text-xs font-black uppercase tracking-[0.3em]">Account History</span>
              </div>
              <h1 className="text-4xl md:text-5xl font-black tracking-tighter text-foreground">
                Your <span className="text-primary">Journey</span> With Us
              </h1>
              <p className="text-muted-foreground text-lg max-w-xl">
                Track your orders, review your shopping history, and manage your account activity all in one place.
              </p>
            </div>

            <div className="flex bg-card p-1.5 rounded-2xl border border-border shadow-sm">
              <button
                onClick={() => setActiveTab("orders")}
                className={`px-6 py-2.5 rounded-xl text-sm font-bold transition-all ${
                  activeTab === "orders" 
                    ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20" 
                    : "text-muted-foreground hover:bg-accent"
                }`}
              >
                Orders
              </button>
              <button
                onClick={() => setActiveTab("repairs")}
                className={`px-6 py-2.5 rounded-xl text-sm font-bold transition-all ${
                  activeTab === "repairs" 
                    ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20" 
                    : "text-muted-foreground hover:bg-accent"
                }`}
              >
                Repairs
              </button>
              <button
                onClick={() => setActiveTab("shopping")}
                className={`px-6 py-2.5 rounded-xl text-sm font-bold transition-all ${
                  activeTab === "shopping" 
                    ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20" 
                    : "text-muted-foreground hover:bg-accent"
                }`}
              >
                Shopping
              </button>
              <button
                onClick={() => setActiveTab("searches")}
                className={`px-6 py-2.5 rounded-xl text-sm font-bold transition-all ${
                  activeTab === "searches" 
                    ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20" 
                    : "text-muted-foreground hover:bg-accent"
                }`}
              >
                Searches
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
            {/* Sidebar / Filters */}
            <div className="lg:col-span-1 space-y-6">
              <div className="bg-card border border-border rounded-3xl p-6 shadow-sm space-y-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Search History</label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
                    <input 
                      type="text"
                      placeholder="Order ID or product..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full pl-10 pr-4 py-2.5 bg-accent/30 border border-border rounded-xl focus:ring-2 focus:ring-primary/20 outline-none transition-all text-sm"
                    />
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="text-xs font-bold uppercase tracking-widest flex items-center gap-2">
                    <Filter size={14} className="text-primary" />
                    Quick Filters
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {['All', 'Pending', 'Shipped', 'Delivered'].map(f => (
                      <button key={f} className="px-3 py-1.5 bg-accent/50 hover:bg-primary/10 hover:text-primary rounded-lg text-[10px] font-bold uppercase tracking-wider transition-colors">
                        {f}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="pt-6 border-t border-border">
                  <div className="flex items-center gap-3 p-4 bg-primary/5 rounded-2xl border border-primary/10">
                    <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center text-primary-foreground shadow-lg shadow-primary/20">
                      <ShoppingBag size={20} />
                    </div>
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Total Orders</p>
                      <p className="text-xl font-black text-primary">{orders.length}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Main Content */}
            <div className="lg:col-span-3">
              <AnimatePresence mode="wait">
                {loading ? (
                  <motion.div 
                    key="loading"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="flex flex-col items-center justify-center py-20 space-y-4"
                  >
                    <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
                    <p className="text-muted-foreground font-medium">Loading your history...</p>
                  </motion.div>
                ) : activeTab === "orders" ? (
                  <motion.div 
                    key="orders-content"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="space-y-4"
                  >
                    {filteredOrders.length > 0 ? filteredOrders.map((order) => {
                      const StatusIcon = statusIcons[order.status] || Clock;
                      return (
                        <motion.div
                          layout
                          key={order.id}
                          className="bg-card border border-border rounded-3xl overflow-hidden hover:shadow-xl hover:shadow-primary/5 transition-all group"
                        >
                          <div className="p-6">
                            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                              <div className="flex items-center gap-4">
                                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center border ${statusColors[order.status] || "bg-accent text-muted-foreground"}`}>
                                  <StatusIcon size={24} />
                                </div>
                                <div>
                                  <div className="flex items-center gap-2">
                                    <span className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Order</span>
                                    <span className="text-sm font-black text-foreground">#{String(order.id).slice(-8).toUpperCase()}</span>
                                  </div>
                                  <div className="flex items-center gap-2 text-[10px] text-muted-foreground mt-0.5">
                                    <Calendar size={12} />
                                    {(() => {
                                      const date = safeToDate(order.createdAt);
                                      return date ? format(date, "MMM dd, yyyy • hh:mm a") : "Recently";
                                    })()}
                                  </div>
                                </div>
                              </div>

                              <div className="flex items-center gap-3">
                                <div className={`px-4 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-widest border ${statusColors[order.status] || "bg-accent text-muted-foreground"}`}>
                                  {order.status}
                                </div>
                                <div className="text-right">
                                  <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Total Amount</p>
                                  <p className="text-lg font-black text-foreground">{formatPrice(order.totalAmount)}</p>
                                </div>
                              </div>
                            </div>

                            <div className="space-y-3">
                              {order.items.map((item, idx) => (
                                <div key={idx} className="flex items-center gap-4 p-3 bg-accent/30 rounded-2xl border border-border/50 group-hover:bg-accent/50 transition-colors">
                                  <div className="w-12 h-12 rounded-xl overflow-hidden bg-card border border-border shrink-0">
                                    <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <h4 className="text-sm font-bold text-foreground truncate">{item.name}</h4>
                                    <p className="text-[10px] text-muted-foreground font-medium">Qty: {item.quantity} • {formatPrice(item.price)}</p>
                                  </div>
                                  {item.slug || item.productId ? (
                                    <Link 
                                      to={`/product/${item.slug || item.productId}`}
                                      className="w-8 h-8 rounded-full bg-card border border-border flex items-center justify-center text-muted-foreground hover:text-primary hover:border-primary transition-all"
                                    >
                                      <ArrowRight size={14} />
                                    </Link>
                                  ) : (
                                    <div className="w-8 h-8 rounded-full bg-card border border-border flex items-center justify-center text-muted-foreground/50">
                                      <ArrowRight size={14} />
                                    </div>
                                  )}
                                </div>
                              ))}
                            </div>

                            <div className="mt-6 pt-6 border-t border-border flex items-center justify-between">
                              <div className="flex -space-x-2">
                                {order.items.slice(0, 3).map((item, idx) => (
                                  <div key={idx} className="w-8 h-8 rounded-full border-2 border-white overflow-hidden bg-accent">
                                    <img src={item.image} alt="" className="w-full h-full object-cover" />
                                  </div>
                                ))}
                                {order.items.length > 3 && (
                                  <div className="w-8 h-8 rounded-full border-2 border-white bg-accent flex items-center justify-center text-[10px] font-bold text-muted-foreground">
                                    +{order.items.length - 3}
                                  </div>
                                )}
                              </div>
                              <button className="flex items-center gap-2 text-xs font-bold text-primary hover:gap-3 transition-all">
                                View Order Details <ArrowRight size={14} />
                              </button>
                            </div>
                          </div>
                        </motion.div>
                      );
                    }) : (
                      <div className="bg-card border border-border border-dashed rounded-[2.5rem] p-20 text-center space-y-6">
                        <div className="w-24 h-24 bg-accent rounded-full flex items-center justify-center mx-auto">
                          <ShoppingBag size={48} className="text-muted-foreground/40" />
                        </div>
                        <div className="space-y-2">
                          <h3 className="text-xl font-bold">No orders found</h3>
                          <p className="text-muted-foreground max-w-xs mx-auto">
                            {searchQuery 
                              ? `We couldn't find any orders matching "${searchQuery}"`
                              : "You haven't placed any orders yet."}
                          </p>
                        </div>
                      </div>
                    )}
                  </motion.div>
                ) : activeTab === "repairs" ? (
                  <motion.div 
                    key="repairs-content"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="space-y-4"
                  >
                    {filteredTickets.length > 0 ? filteredTickets.map((ticket) => {
                      const StatusIcon = statusIcons[ticket.status] || Clock;
                      return (
                        <motion.div
                          layout
                          key={ticket.id}
                          className="bg-card border border-border rounded-3xl overflow-hidden hover:shadow-xl hover:shadow-primary/5 transition-all group"
                        >
                          <div className="p-6">
                            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                              <div className="flex items-center gap-4">
                                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center border ${statusColors[ticket.status] || "bg-accent text-muted-foreground"}`}>
                                  <StatusIcon size={24} />
                                </div>
                                <div>
                                  <div className="flex items-center gap-2">
                                    <span className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Repair Ticket</span>
                                    <span className="text-sm font-black text-foreground">#{ticket.ticketId}</span>
                                  </div>
                                  <div className="flex items-center gap-2 text-[10px] text-muted-foreground mt-0.5">
                                    <Calendar size={12} />
                                    {(() => {
                                      const date = safeToDate(ticket.createdAt);
                                      return date ? format(date, "MMM dd, yyyy • hh:mm a") : "Recently";
                                    })()}
                                  </div>
                                </div>
                              </div>

                              <div className="flex items-center gap-3">
                                <div className={`px-4 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-widest border ${statusColors[ticket.status] || "bg-accent text-muted-foreground"}`}>
                                  {ticket.status}
                                </div>
                              </div>
                            </div>

                            <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                              <div className="space-y-3">
                                <div>
                                  <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Device Details</p>
                                  <p className="text-sm font-bold">{ticket.brand} {ticket.model}</p>
                                  <p className="text-xs text-muted-foreground">{ticket.category}</p>
                                </div>
                                <div>
                                  <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Issue Component</p>
                                  <p className="text-sm font-medium">{ticket.component}</p>
                                </div>
                              </div>
                              <div>
                                <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Problem Description</p>
                                <p className="text-xs text-muted-foreground leading-relaxed line-clamp-3">
                                  {ticket.description}
                                </p>
                              </div>
                            </div>

                            <div className="mt-6 pt-6 border-t border-border flex items-center justify-end">
                              <Link to="/service-center" className="flex items-center gap-2 text-xs font-bold text-primary hover:gap-3 transition-all">
                                New Repair Request <ArrowRight size={14} />
                              </Link>
                            </div>
                          </div>
                        </motion.div>
                      );
                    }) : (
                      <div className="bg-card border border-border border-dashed rounded-[2.5rem] p-20 text-center space-y-6">
                        <div className="w-24 h-24 bg-accent rounded-full flex items-center justify-center mx-auto">
                          <HistoryIcon size={48} className="text-muted-foreground/40" />
                        </div>
                        <div className="space-y-2">
                          <h3 className="text-xl font-bold">No repair tickets found</h3>
                          <p className="text-muted-foreground max-w-xs mx-auto">
                            {searchQuery 
                              ? `We couldn't find any tickets matching "${searchQuery}"`
                              : "You haven't submitted any repair requests yet."}
                          </p>
                        </div>
                        {!searchQuery && (
                          <Link to="/service-center" className="inline-flex items-center gap-2 px-8 py-3 bg-primary text-primary-foreground rounded-xl font-bold uppercase tracking-wider shadow-lg shadow-primary/20 hover:scale-105 transition-transform">
                            Book a Repair <ArrowRight size={18} />
                          </Link>
                        )}
                      </div>
                    )}
                  </motion.div>
                ) : activeTab === "searches" ? (
                  <motion.div 
                    key="searches-content"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="space-y-4"
                  >
                    {searches.length > 0 ? (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {searches.map((search) => (
                          <motion.div
                            layout
                            key={search.id}
                            className="bg-card border border-border rounded-2xl p-4 flex items-center justify-between group hover:border-primary/50 transition-all"
                          >
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-xl bg-accent flex items-center justify-center text-muted-foreground group-hover:text-primary transition-colors">
                                <Search size={20} />
                              </div>
                              <div>
                                <p className="text-sm font-bold text-foreground">"{search.metadata.query}"</p>
                                <p className="text-[10px] text-muted-foreground">
                                  {(() => {
                                    const date = safeToDate(search.timestamp);
                                    return date ? format(date, "MMM dd, yyyy • hh:mm a") : "Recently";
                                  })()}
                                </p>
                              </div>
                            </div>
                            <Link 
                              to={`/search?q=${encodeURIComponent(search.metadata.query || "")}`}
                              className="w-8 h-8 rounded-full bg-accent flex items-center justify-center text-muted-foreground hover:bg-primary hover:text-primary-foreground transition-all"
                            >
                              <ArrowRight size={14} />
                            </Link>
                          </motion.div>
                        ))}
                      </div>
                    ) : (
                      <div className="bg-card border border-border border-dashed rounded-[2.5rem] p-20 text-center space-y-6">
                        <div className="w-24 h-24 bg-accent rounded-full flex items-center justify-center mx-auto">
                          <Search size={48} className="text-muted-foreground/40" />
                        </div>
                        <div className="space-y-2">
                          <h3 className="text-xl font-bold">No search history</h3>
                          <p className="text-muted-foreground max-w-xs mx-auto">
                            Your recent search queries will appear here.
                          </p>
                        </div>
                      </div>
                    )}
                  </motion.div>
                ) : (
                  <motion.div 
                    key="shopping-content"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="bg-card border border-border border-dashed rounded-[2.5rem] p-20 text-center space-y-6"
                  >
                    <div className="w-24 h-24 bg-accent rounded-full flex items-center justify-center mx-auto">
                      <ShoppingBag size={48} className="text-muted-foreground/40" />
                    </div>
                    <div className="space-y-2">
                      <h3 className="text-xl font-bold">Shopping History coming soon</h3>
                      <p className="text-muted-foreground max-w-xs mx-auto">
                        We're working on a way to show you all the products you've viewed and interacted with.
                      </p>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}

import { useState, useEffect } from "react";
import { useOutletContext } from "react-router-dom";
import { type Order } from "@/types/admin";
import { orderService } from "@/api/orderService";
import { Package, Search, ChevronRight, Clock, CheckCircle2, Truck, XCircle, User, Mail, Phone, MapPin, Menu, ShoppingCart } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { format } from "date-fns";
import { formatPrice } from "@/lib/utils";
import { safeToDate } from "@/lib/utils";

const POSHistory = () => {
  const { setIsSidebarOpen } = useOutletContext<{ setIsSidebarOpen: (open: boolean) => void }>();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const ordersData = await orderService.getAll();
        // Only show POS orders
        const posOrders = (ordersData as (Order & { source?: string })[]).filter(order => 
          order.source === "pos" || 
          order.orderId?.startsWith("POS-") || 
          order.orderId?.startsWith("BILL-")
        );

        setOrders(posOrders);
      } catch (error) {
        console.error("Error fetching POS orders:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();
    const interval = setInterval(fetchOrders, 30000);
    return () => clearInterval(interval);
  }, []);

  const updateOrderStatus = async (orderId: string, newStatus: Order["status"]) => {
    try {
      await orderService.updateStatus(orderId, newStatus);
    } catch (error) {
      console.error("Error updating status:", error);
    }
  };

  const filteredOrders = orders.filter(order => 
    order.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    order.orderId?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    order.customerEmail.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStatusColor = (status: Order["status"]) => {
    switch (status) {
      case "pending": return "bg-amber-100 text-amber-700 border-amber-200";
      case "processing": return "bg-blue-100 text-blue-700 border-blue-200";
      case "shipped": return "bg-indigo-100 text-indigo-700 border-indigo-200";
      case "delivered": return "bg-emerald-100 text-emerald-700 border-emerald-200";
      case "cancelled": return "bg-rose-100 text-rose-700 border-rose-200";
      default: return "bg-accent text-foreground border-border";
    }
  };

  const getStatusIcon = (status: Order["status"]) => {
    switch (status) {
      case "pending": return <Clock size={14} />;
      case "processing": return <Package size={14} />;
      case "shipped": return <Truck size={14} />;
      case "delivered": return <CheckCircle2 size={14} />;
      case "cancelled": return <XCircle size={14} />;
    }
  };

  return (
    <div className="flex-1 flex flex-col min-w-0 min-h-full pb-20 lg:pb-0">
      <main className="flex-1 p-4 md:p-8">
        <div className="max-w-7xl mx-auto space-y-8">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div>
              <h1 className="text-3xl font-bold text-foreground">POS History</h1>
              <p className="text-muted-foreground">View and manage all POS transactions</p>
            </div>
            
            <div className="relative w-full md:w-80">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
              <input 
                type="text"
                placeholder="Search orders, customers..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-card border border-border rounded-xl focus:ring-2 focus:ring-blue-500/20 outline-none transition-all"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Order List */}
            <div className="lg:col-span-2 space-y-4">
              {loading ? (
                Array(5).fill(0).map((_, i) => (
                  <div key={i} className="h-24 bg-card animate-pulse rounded-2xl border border-border" />
                ))
              ) : filteredOrders.length === 0 ? (
                <div className="text-center py-20 bg-card rounded-3xl border border-dashed border-border">
                  <ShoppingCart size={48} className="mx-auto text-muted-foreground mb-4 opacity-20" />
                  <h3 className="text-lg font-bold">No POS orders found</h3>
                  <p className="text-muted-foreground">Transactions from the POS terminal will appear here</p>
                </div>
              ) : (
                filteredOrders.map((order) => (
                  <motion.div
                    layoutId={order.id}
                    key={order.id}
                    onClick={() => setSelectedOrder(order)}
                    className={`p-4 bg-card border rounded-2xl cursor-pointer transition-all hover:shadow-md group ${selectedOrder?.id === order.id ? "border-primary ring-1 ring-primary/20" : "border-border"}`}
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-accent rounded-xl flex items-center justify-center text-primary">
                          <ShoppingCart size={20} />
                        </div>
                        <div>
                          <h3 className="font-bold text-sm">POS Order #{order.orderId || String(order.id).slice(-6).toUpperCase()}</h3>
                          <p className="text-xs text-muted-foreground">{(() => {
                            const date = safeToDate(order.createdAt);
                            return date ? format(date, "MMM dd, yyyy • HH:mm") : "Unknown";
                          })()}</p>
                        </div>
                      </div>
                      <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border ${getStatusColor(order.status)}`}>
                        {getStatusIcon(order.status)}
                        {order.status}
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 bg-blue-50 rounded-full flex items-center justify-center text-blue-600">
                          <User size={12} />
                        </div>
                        <span className="text-xs font-medium">{order.customerName}</span>
                      </div>
                      <div className="flex items-center gap-4">
                        <span className="text-xs font-bold">{formatPrice(order.totalAmount)}</span>
                        <ChevronRight size={16} className="text-muted-foreground group-hover:translate-x-1 transition-transform" />
                      </div>
                    </div>
                  </motion.div>
                ))
              )}
            </div>

            {/* Order Details Panel */}
            <div className="lg:col-span-1">
              <AnimatePresence mode="wait">
                {selectedOrder ? (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 20 }}
                    className="bg-card border border-border rounded-3xl p-6 sticky top-24 shadow-sm"
                  >
                    <div className="flex items-center justify-between mb-6">
                      <h2 className="text-xl font-bold text-foreground">Order Details</h2>
                      <button onClick={() => setSelectedOrder(null)} className="p-2 hover:bg-accent rounded-full transition-colors">
                        <ChevronRight size={20} className="rotate-90 md:rotate-0" />
                      </button>
                    </div>

                    <div className="space-y-6">
                      {/* Status Update */}
                      <div>
                        <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-3 block">Update Status</label>
                        <div className="grid grid-cols-2 gap-2">
                          {(["pending", "processing", "shipped", "delivered", "cancelled"] as const).map((status) => (
                            <button
                              key={status}
                              onClick={() => updateOrderStatus(selectedOrder.id, status)}
                              className={`px-3 py-2 rounded-xl text-[10px] font-bold uppercase tracking-wider transition-all border ${selectedOrder.status === status ? getStatusColor(status) : "bg-muted border-transparent hover:border-border"}`}
                            >
                              {status}
                            </button>
                          ))}
                        </div>
                      </div>

                      <div className="h-px bg-accent" />

                      {/* Customer Info */}
                      <div className="space-y-3">
                        <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground block">Customer Information</label>
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center">
                            <User size={20} />
                          </div>
                          <div>
                            <p className="text-sm font-bold text-foreground">{selectedOrder.customerName}</p>
                            <div className="flex items-center gap-1 text-xs text-muted-foreground">
                              <Mail size={12} />
                              {selectedOrder.customerEmail}
                            </div>
                          </div>
                        </div>
                        <div className="space-y-2 mt-4">
                          <div className="flex items-start gap-2 text-xs text-muted-foreground">
                            <Phone size={14} className="text-muted-foreground mt-0.5" />
                            <span>{selectedOrder.shippingAddress.phone}</span>
                          </div>
                          <div className="flex items-start gap-2 text-xs text-muted-foreground">
                            <MapPin size={14} className="text-muted-foreground mt-0.5" />
                            <span>{selectedOrder.shippingAddress.address}, {selectedOrder.shippingAddress.city}</span>
                          </div>
                        </div>
                      </div>

                      <div className="h-px bg-accent" />

                      {/* Items */}
                      <div className="space-y-3">
                        <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground block">Order Items ({(selectedOrder.items || []).length})</label>
                        <div className="space-y-3 max-h-60 overflow-y-auto pr-2 no-scrollbar">
                          {(selectedOrder.items || []).map((item, i) => (
                            <div key={i} className="flex gap-3">
                              <div className="w-12 h-12 bg-accent rounded-lg overflow-hidden flex-shrink-0">
                                <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-xs font-bold truncate text-foreground">{item.name}</p>
                                <p className="text-[10px] text-muted-foreground">Qty: {item.quantity} × {formatPrice(item.price)}</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="pt-4 border-t border-border mt-6">
                        <div className="flex justify-between items-center">
                          <span className="text-sm font-bold text-foreground">Total Amount</span>
                          <span className="text-xl font-bold text-blue-600">{formatPrice(selectedOrder.totalAmount)}</span>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ) : (
                  <div className="bg-card border border-border border-dashed rounded-3xl p-12 text-center sticky top-24">
                    <ShoppingCart size={48} className="mx-auto text-muted-foreground/50 mb-4 opacity-20" />
                    <p className="text-sm text-muted-foreground">Select a transaction to view details</p>
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

export default POSHistory;

import { useState } from "react";
import { useOutletContext } from "react-router-dom";
import { type Order, type OrderItem } from "@/types/admin";
import { useOrders } from "@/hooks/useOrders";
import { Package, Search, ChevronRight, Clock, CheckCircle2, Truck, XCircle, User, Mail, Phone, MapPin } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { format } from "date-fns";
import { formatPrice } from "@/lib/utils";
import { safeToDate } from "@/lib/utils";
import { toast } from "sonner";
import { orderService } from "@/api/orderService";

interface AdminOrdersProps {
  filterStatus?: Order["status"];
  excludeStatuses?: Order["status"][];
  paymentStatus?: "pending" | "completed" | "failed" | "refunded";
}

const AdminOrders = ({ filterStatus, excludeStatuses, paymentStatus }: AdminOrdersProps) => {
  const { setIsSidebarOpen } = useOutletContext<{ setIsSidebarOpen: (open: boolean) => void }>();
  
  // Use the refined useOrders hook with backend-side filtering and optimistic mutations
  const { orders: allOrders, loading, refresh, updateStatus, isUpdating } = useOrders({ 
    status: filterStatus,
    exclude_status: excludeStatuses?.join(','),
    payment_status: paymentStatus
  });
  
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  const orders = allOrders;

  const handleUpdateStatus = async (orderId: string, newStatus: Order["status"], e?: React.MouseEvent) => {
    if (e) {
      e.stopPropagation();
    }
    
    try {
      await updateStatus({ id: orderId, status: newStatus });
      toast.success(`Order status updated to ${newStatus.replace(/_/g, ' ')}`);
      if (selectedOrder?.id === orderId) {
        setSelectedOrder(prev => prev ? { ...prev, status: newStatus } : null);
      }
    } catch (error) {
      // Error is handled in the hook (toast & rollback)
    }
  };

  const filteredOrders = orders.filter(order => 
    order.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    order.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
    order.customerEmail.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStatusColor = (status: Order["status"]) => {
    switch (status) {
      case "new": return "bg-blue-100 text-blue-700 border-blue-200";
      case "pending": return "bg-amber-100 text-amber-700 border-amber-200";
      case "processing": return "bg-indigo-100 text-indigo-700 border-indigo-200";
      case "shipped": return "bg-purple-100 text-purple-700 border-purple-200";
      case "delivered": return "bg-emerald-100 text-emerald-700 border-emerald-200";
      case "process_conform": return "bg-green-100 text-green-700 border-green-200";
      case "process_dont_conform": return "bg-rose-100 text-rose-700 border-rose-200";
      case "cancelled": return "bg-gray-100 text-gray-700 border-gray-200";
      default: return "bg-accent text-foreground border-border";
    }
  };

  const getStatusIcon = (status: Order["status"]) => {
    switch (status) {
      case "new": return <Package size={14} />;
      case "pending": return <Clock size={14} />;
      case "processing": return <Package size={14} />;
      case "shipped": return <Truck size={14} />;
      case "delivered": return <CheckCircle2 size={14} />;
      case "process_conform": return <CheckCircle2 size={14} />;
      case "process_dont_conform": return <XCircle size={14} />;
      case "cancelled": return <XCircle size={14} />;
    }
  };

  const getStatusLabel = (status: Order["status"]) => {
    switch (status) {
      case "new": return "New Order";
      case "process_conform": return "PC (Confirm)";
      case "process_dont_conform": return "PDC (Reject)";
      default: return status.charAt(0).toUpperCase() + status.slice(1).replace(/_/g, ' ');
    }
  };

  const getPageTitle = () => {
    if (paymentStatus === 'completed') return "Process Conform (PC) Orders";
    if (excludeStatuses) return "New Orders";
    if (!filterStatus) return "Order Management";
    return getStatusLabel(filterStatus);
  };

  return (
    <div className="flex-1 flex flex-col min-w-0 min-h-full pb-20 lg:pb-0">
      <main className="flex-1 p-4 md:p-8">
        <div className="max-w-7xl mx-auto space-y-8">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div>
              <h1 className="text-3xl font-bold text-foreground">{getPageTitle()}</h1>
              <p className="text-muted-foreground flex items-center gap-2">
                Monitor and manage customer orders
                {loading && <span className="inline-block w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />}
              </p>
            </div>
            
            <div className="flex flex-col sm:flex-row items-center gap-3 w-full md:w-auto">
              <button 
                onClick={() => refresh()}
                className="w-full sm:w-auto px-4 py-2 bg-accent hover:bg-accent/80 text-foreground rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition-all"
              >
                <Clock size={16} className={loading ? "animate-spin" : ""} />
                Refresh
              </button>
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
                  <Package size={48} className="mx-auto text-muted-foreground mb-4 opacity-20" />
                  <h3 className="text-lg font-bold">No orders found</h3>
                  <p className="text-muted-foreground">Try adjusting your search term</p>
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
                          <Package size={20} />
                        </div>
                        <div>
                          <h3 className="font-bold text-sm">Order #{String(order.id).slice(-6).toUpperCase()}</h3>
                          <p className="text-xs text-muted-foreground">{(() => {
                            const date = safeToDate(order.createdAt);
                            return date ? format(date, "MMM dd, yyyy • HH:mm") : "Unknown";
                          })()}</p>
                        </div>
                      </div>
                      <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border ${getStatusColor(order.status)}`}>
                        {getStatusIcon(order.status)}
                        {getStatusLabel(order.status)}
                      </div>
                    </div>
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 bg-blue-50 rounded-full flex items-center justify-center text-blue-600">
                          <User size={12} />
                        </div>
                        <span className="text-xs font-medium">{order.customerName}</span>
                      </div>
                      
                      <div className="flex items-center justify-between sm:justify-end gap-3">
                        {/* Quick Action Buttons for Fast Processing */}
                        <div className="flex items-center gap-2">
                          {order.status === "new" && (
                            <button 
                              onClick={(e) => handleUpdateStatus(order.id, "pending", e)}
                              className="px-3 py-1 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all shadow-sm active:scale-95 disabled:opacity-50"
                            >
                              New → Pending
                            </button>
                          )}
                          {order.status === "pending" && (
                            <button 
                              onClick={(e) => handleUpdateStatus(order.id, "processing", e)}
                              className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all shadow-sm active:scale-95 disabled:opacity-50"
                            >
                              Process
                            </button>
                          )}
                          {order.status === "processing" && (
                            <>
                              <button 
                                onClick={(e) => handleUpdateStatus(order.id, "shipped", e)}
                                className="px-3 py-1 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all shadow-sm active:scale-95 disabled:opacity-50"
                              >
                                Ship Order
                              </button>
                            </>
                          )}
                          {order.status === "shipped" && (
                            <button 
                              onClick={(e) => handleUpdateStatus(order.id, "delivered", e)}
                              className="px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all shadow-sm active:scale-95 disabled:opacity-50"
                            >
                              Mark Delivered
                            </button>
                          )}
                          {order.status === "delivered" && (
                            <button 
                              onClick={(e) => handleUpdateStatus(order.id, "process_conform", e)}
                              className="px-3 py-1 bg-green-600 hover:bg-green-700 text-white rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all shadow-sm active:scale-95 disabled:opacity-50"
                            >
                              Conform (PC)
                            </button>
                          )}
                        </div>

                        <div className="flex items-center gap-3">
                          <span className="text-xs font-bold">{formatPrice(order.totalAmount)}</span>
                          <div className={`p-1 rounded-full transition-all ${isUpdating ? "animate-spin" : "group-hover:translate-x-1"}`}>
                            <ChevronRight size={16} className="text-muted-foreground" />
                          </div>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))
              )}
            </div>

            {/* Order Details Panel */}
            <div className={`${selectedOrder ? "fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm lg:relative lg:inset-auto lg:z-0 lg:p-0 lg:bg-transparent lg:block lg:col-span-1" : "hidden lg:block lg:col-span-1"}`}>
              <AnimatePresence mode="wait">
                {selectedOrder ? (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: 20 }}
                    className="bg-card border border-border rounded-3xl p-6 lg:sticky lg:top-24 shadow-2xl lg:shadow-sm w-full max-w-lg lg:max-w-none overflow-y-auto max-h-[90vh] lg:max-h-none custom-scrollbar"
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
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                          {(["new", "pending", "processing", "shipped", "delivered", "process_conform", "process_dont_conform", "cancelled"] as const).map((status) => (
                            <button
                              key={status}
                              onClick={() => handleUpdateStatus(selectedOrder.id, status)}
                              className={`px-3 py-2 rounded-xl text-[10px] font-bold uppercase tracking-wider transition-all border ${selectedOrder.status === status ? getStatusColor(status) : "bg-muted border-transparent hover:border-border"}`}
                            >
                              {getStatusLabel(status)}
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
                                {item.features && item.features.length > 0 && (
                                  <div className="flex flex-wrap gap-1 mt-1">
                                    {item.features.map((f, fi) => (
                                      <span key={fi} className="text-[8px] px-1 bg-accent rounded text-muted-foreground">{f}</span>
                                    ))}
                                  </div>
                                )}
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
                    <Package size={48} className="mx-auto text-muted-foreground/50 mb-4 opacity-20" />
                    <p className="text-sm text-muted-foreground">Select an order to view details</p>
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

export default AdminOrders;

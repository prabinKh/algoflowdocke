import { useState, useEffect } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { motion } from "motion/react";
import { Search, Package, Truck, CheckCircle, Clock, ArrowRight, ChevronRight, MapPin, Calendar, CreditCard, ShoppingBag, Menu, Wrench } from "lucide-react";
import { Header as Navbar } from "@/frontend/components/Header";
import { Footer } from "@/frontend/components/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/context/AuthContext";
import { orderService } from "@/api/orderService";
import { repairService } from "@/api/repairService";
import { format } from "date-fns";
import { Sidebar } from "@/admin/components/Sidebar";
import { Order } from "@/types/admin";
import { RepairRequest } from "@/types/repair";
import { formatPrice } from "@/lib/utils";

export default function TrackOrdersPage() {
  const [searchParams] = useSearchParams();
  const [orderId, setOrderId] = useState(searchParams.get("id") || "");
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [order, setOrder] = useState<Order | null>(null);
  const [ticket, setTicket] = useState<RepairRequest | null>(null);
  const [error, setError] = useState("");
  const [userOrders, setUserOrders] = useState<Order[]>([]);
  const [userTickets, setUserTickets] = useState<RepairRequest[]>([]);
  const [isAuthChecking, setIsAuthChecking] = useState(true);
  const { user, loading: authLoading } = useAuth();

  useEffect(() => {
    if (orderId) {
      handleTrack({ preventDefault: () => {} } as unknown as React.FormEvent);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (authLoading) return;
    const fetchData = async () => {
      if (user) {
        try {
          const [orders, tickets] = await Promise.all([
            orderService.getAll(),
            repairService.getMyTickets()
          ]);
          
          setUserOrders(orders.filter((o) => o.uid === user.id).slice(0, 5));
          setUserTickets(tickets.slice(0, 5));
        } catch (err) {
          console.error("Error fetching user data:", err);
        }
      }
      setIsAuthChecking(false);
    };
    fetchData();
  }, [user, authLoading]);

  const handleTrack = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!orderId) return;

    setLoading(true);
    setError("");
    setOrder(null);
    setTicket(null);

    try {
      // 1. Try tracking as a Service Ticket first if it looks like one
      if (orderId.toUpperCase().startsWith('TKT-') || orderId.length > 10) {
        try {
          const ticketData = await repairService.trackTicket(orderId);
          if (ticketData) {
            setTicket(ticketData);
            setLoading(false);
            return;
          }
        } catch (e) {
          // If ticket track fails, fall back to orders
        }
      }

      // 2. Try tracking as an Order
      const orders = await orderService.getAll();
      const matchingOrder = orders.find(o => o.id === orderId || o.orderId === orderId);
      
      if (!matchingOrder) {
        // Final attempt: check tickets list if not already checked
        const tickets = await repairService.getMyTickets();
        const matchingTicket = tickets.find((t: RepairRequest) => t.ticket_id === orderId || t.ticketId === orderId || t.id === orderId);
        
        if (matchingTicket) {
          setTicket(matchingTicket);
        } else {
          setError("Record not found. Please check your ID and try again.");
        }
      } else {
        const orderData = matchingOrder;
        if (email && orderData.customerEmail && orderData.customerEmail.toLowerCase() !== email.toLowerCase()) {
          setError("Email does not match our records for this order.");
        } else {
          setOrder(orderData);
        }
      }
    } catch (err) {
      console.error("Error tracking:", err);
      setError("An error occurred while tracking. Please try again later.");
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status.toLowerCase()) {
      case "pending": case "submitted": return <Clock className="text-amber-500" />;
      case "processing": case "in_progress": return <Clock className="text-blue-500" />;
      case "shipped": return <Truck className="text-purple-500" />;
      case "delivered": case "completed": return <CheckCircle className="text-emerald-500" />;
      case "cancelled": return <ArrowRight className="text-red-500 rotate-45" />;
      default: return <Package className="text-muted-foreground" />;
    }
  };

  const getStatusStep = (status: string) => {
    const orderSteps = ["pending", "processing", "shipped", "delivered"];
    const ticketSteps = ["submitted", "in_progress", "completed"];
    
    let currentStep = orderSteps.indexOf(status.toLowerCase());
    if (currentStep === -1) {
      currentStep = ticketSteps.indexOf(status.toLowerCase());
      // For ticket display we map to 4 steps as well or handle separately
    }
    return currentStep === -1 ? 0 : currentStep;
  };

  return (
    <div className="min-h-screen bg-muted">
      <Navbar />
      
      <main className="pt-24 pb-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="max-w-3xl mx-auto">
          <header className="text-center mb-12">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <h1 className="text-4xl font-black text-foreground mb-4 tracking-tight">Track Your Order</h1>
              <p className="text-muted-foreground max-w-md mx-auto">
                Enter your order ID and email address to see the current status of your delivery.
              </p>
            </motion.div>
          </header>

          {/* Tracking Form */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="bg-card rounded-[2.5rem] p-8 shadow-xl shadow-black/5 border border-border mb-12"
          >
            <form onSubmit={handleTrack} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground ml-2">ID (Order or Ticket)</label>
                  <div className="relative">
                    <Package className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
                    <Input 
                      placeholder="e.g. ORD-123 or TKT-456"
                      value={orderId}
                      onChange={(e) => setOrderId(e.target.value)}
                      className="pl-12 h-14 bg-muted border-none rounded-2xl focus-visible:ring-2 focus-visible:ring-blue-600 transition-all"
                      required
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground ml-2">Email Address (Optional)</label>
                  <div className="relative">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
                    <Input 
                      type="email"
                      placeholder="your@email.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="pl-12 h-14 bg-muted border-none rounded-2xl focus-visible:ring-2 focus-visible:ring-blue-600 transition-all"
                    />
                  </div>
                </div>
              </div>
              
              <Button 
                type="submit"
                disabled={loading}
                className="w-full h-14 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-bold text-lg shadow-lg shadow-blue-200 transition-all flex items-center justify-center gap-2"
              >
                {loading ? (
                  <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>Track Request <ArrowRight size={20} /></>
                )}
              </Button>
            </form>

            {error && (
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-6 p-4 bg-red-50 border border-red-100 text-red-600 text-sm font-medium rounded-2xl flex items-center gap-3"
              >
                <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <ArrowRight size={16} className="rotate-45" />
                </div>
                {error}
              </motion.div>
            )}
          </motion.div>

          {/* Ticket Result */}
          {ticket && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-8"
            >
              {/* Status Card */}
              <div className="bg-card rounded-[2.5rem] p-8 shadow-xl shadow-black/5 border border-border overflow-hidden relative">
                <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-50 rounded-bl-[5rem] -mr-8 -mt-8 -z-0 opacity-50" />
                
                <div className="relative z-10">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
                    <div>
                      <div className="flex items-center gap-3 mb-2">
                        <div className="w-12 h-12 bg-emerald-50 rounded-2xl flex items-center justify-center">
                          {getStatusIcon(ticket.status || "submitted")}
                        </div>
                        <div>
                          <h2 className="text-2xl font-black text-foreground tracking-tight">Ticket #{ticket.ticket_id}</h2>
                          <p className="text-sm text-muted-foreground">{ticket.brand_name} {ticket.model}</p>
                        </div>
                      </div>
                    </div>
                    <div className="text-left md:text-right">
                      <div className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-1">Service Status</div>
                      <div className="inline-flex items-center px-4 py-1.5 bg-emerald-50 text-emerald-600 rounded-full text-sm font-bold border border-emerald-100">
                        {ticket.status?.toUpperCase().replace('_', ' ')}
                      </div>
                    </div>
                  </div>

                  {/* Progress Bar for Ticket */}
                  <div className="relative mb-12">
                    <div className="absolute top-1/2 left-0 w-full h-1 bg-accent -translate-y-1/2" />
                    <div 
                      className="absolute top-1/2 left-0 h-1 bg-emerald-600 -translate-y-1/2 transition-all duration-1000" 
                      style={{ width: `${(getStatusStep(ticket.status || "submitted") / 2) * 100}%` }}
                    />
                    
                    <div className="relative flex justify-between">
                      {["Submitted", "In Progress", "Completed"].map((step, idx) => {
                        const isCompleted = idx <= getStatusStep(ticket.status || "submitted");
                        
                        return (
                          <div key={step} className="flex flex-col items-center">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center z-10 transition-all duration-500 ${
                              isCompleted ? "bg-emerald-600 text-white scale-110 shadow-lg shadow-emerald-200" : "bg-card border-2 border-border text-muted-foreground/50"
                            }`}>
                              {isCompleted ? <CheckCircle size={16} /> : <div className="w-2 h-2 bg-accent/50 rounded-full" />}
                            </div>
                            <span className={`text-[10px] font-bold uppercase tracking-widest mt-3 ${
                              isCompleted ? "text-emerald-600" : "text-muted-foreground"
                            }`}>
                              {step}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Ticket Details */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-8 border-t border-border">
                    <div>
                      <h3 className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-3">Service Details</h3>
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                           <span className="text-muted-foreground">Category</span>
                           <span className="font-bold">{ticket.category}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                           <span className="text-muted-foreground">Model</span>
                           <span className="font-bold">{ticket.model}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                           <span className="text-muted-foreground">Type</span>
                           <span className="font-bold capitalize">{ticket.delivery_method}</span>
                        </div>
                      </div>
                    </div>
                    <div>
                       <h3 className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-3">Problem Description</h3>
                       <p className="text-sm font-medium italic text-muted-foreground leading-relaxed">
                         "{ticket.description}"
                       </p>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* Order Result */}
          {order && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-8"
            >
              {/* Status Card */}
              <div className="bg-card rounded-[2.5rem] p-8 shadow-xl shadow-black/5 border border-border overflow-hidden relative">
                <div className="absolute top-0 right-0 w-32 h-32 bg-blue-50 rounded-bl-[5rem] -mr-8 -mt-8 -z-0 opacity-50" />
                
                <div className="relative z-10">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
                    <div>
                      <div className="flex items-center gap-3 mb-2">
                        <div className="w-12 h-12 bg-blue-50 rounded-2xl flex items-center justify-center">
                          {getStatusIcon(order.status)}
                        </div>
                        <div>
                          <h2 className="text-2xl font-black text-foreground tracking-tight">Order #{String(order.id).slice(-6).toUpperCase()}</h2>
                          <p className="text-sm text-muted-foreground">Placed on {format(new Date(order.createdAt), "MMMM dd, yyyy")}</p>
                        </div>
                      </div>
                    </div>
                    <div className="text-left md:text-right">
                      <div className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-1">Current Status</div>
                      <div className="inline-flex items-center px-4 py-1.5 bg-blue-50 text-blue-600 rounded-full text-sm font-bold border border-blue-100">
                        {order.status.toUpperCase()}
                      </div>
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div className="relative mb-12">
                    <div className="absolute top-1/2 left-0 w-full h-1 bg-accent -translate-y-1/2" />
                    <div 
                      className="absolute top-1/2 left-0 h-1 bg-blue-600 -translate-y-1/2 transition-all duration-1000" 
                      style={{ width: `${(getStatusStep(order.status) / 3) * 100}%` }}
                    />
                    
                    <div className="relative flex justify-between">
                      {["Pending", "Processing", "Shipped", "Delivered"].map((step, idx) => {
                        const isCompleted = idx <= getStatusStep(order.status);
                        const isCurrent = idx === getStatusStep(order.status);
                        
                        return (
                          <div key={step} className="flex flex-col items-center">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center z-10 transition-all duration-500 ${
                              isCompleted ? "bg-blue-600 text-white scale-110 shadow-lg shadow-blue-200" : "bg-card border-2 border-border text-muted-foreground/50"
                            }`}>
                              {isCompleted ? <CheckCircle size={16} /> : <div className="w-2 h-2 bg-accent/50 rounded-full" />}
                            </div>
                            <span className={`text-[10px] font-bold uppercase tracking-widest mt-3 ${
                              isCompleted ? "text-blue-600" : "text-muted-foreground"
                            }`}>
                              {step}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Order Details Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-8 border-t border-border">
                    <div className="space-y-6">
                      <div>
                        <h3 className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-3 flex items-center gap-2">
                          <MapPin size={12} /> Shipping Address
                        </h3>
                        <div className="text-sm text-muted-foreground leading-relaxed">
                          {order.shippingAddress?.fullName}<br />
                          {order.shippingAddress?.address}<br />
                          {order.shippingAddress?.city}, {order.shippingAddress?.zipCode}<br />
                          {order.shippingAddress?.country}
                        </div>
                      </div>
                      <div>
                        <h3 className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-3 flex items-center gap-2">
                          <Calendar size={12} /> Estimated Delivery
                        </h3>
                        <div className="text-sm font-bold text-foreground">
                          {order.status.toLowerCase() === 'delivered' 
                            ? `Delivered on ${format(new Date(order.createdAt), "MMM dd")}`
                            : `Expected by ${format(new Date(new Date(order.createdAt).getTime() + 5 * 24 * 60 * 60 * 1000), "MMMM dd, yyyy")}`
                          }
                        </div>
                      </div>
                    </div>
                    <div className="space-y-6">
                      <div>
                        <h3 className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-3 flex items-center gap-2">
                          <ShoppingBag size={12} /> Order Summary
                        </h3>
                        <div className="space-y-2">
                          {order.items?.map((item, idx: number) => (
                            <div key={idx} className="flex justify-between text-sm">
                              <span className="text-muted-foreground truncate mr-4">{item.quantity}x {item.name}</span>
                              <span className="font-mono font-bold text-foreground">{formatPrice((item.price || 0) * (item.quantity || 0))}</span>
                            </div>
                          ))}
                          <div className="pt-2 border-t border-border flex justify-between text-base font-black text-blue-600">
                            <span>Total</span>
                            <span className="font-mono">{formatPrice(order.totalAmount || 0)}</span>
                          </div>
                        </div>
                      </div>
                      <div>
                        <h3 className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-3 flex items-center gap-2">
                          <CreditCard size={12} /> Payment Method
                        </h3>
                        <div className="text-sm text-muted-foreground">
                          {order.paymentMethod === 'card' ? 'Credit / Debit Card' : 'Cash on Delivery'}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* Recent Records for Logged In Users */}
          {!isAuthChecking && (userOrders.length > 0 || userTickets.length > 0) && !order && !ticket && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="mt-16 space-y-12"
            >
              {userOrders.length > 0 && (
                <div>
                  <h3 className="text-sm font-bold text-foreground mb-6 flex items-center gap-2">
                    <ShoppingBag size={16} className="text-blue-600" /> Your Recent Orders
                  </h3>
                  <div className="space-y-4">
                    {userOrders.map((userOrder) => (
                      <button
                        key={userOrder.id}
                        onClick={() => {
                          setOrderId(userOrder.id);
                          setOrder(userOrder);
                        }}
                        className="w-full bg-card p-6 rounded-3xl border border-border shadow-sm hover:border-blue-200 hover:shadow-md transition-all flex items-center justify-between group text-left"
                      >
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 bg-muted rounded-2xl flex items-center justify-center group-hover:bg-blue-50 transition-colors">
                            {getStatusIcon(userOrder.status)}
                          </div>
                          <div>
                            <div className="text-sm font-bold text-foreground">Order #{String(userOrder.id).slice(-6).toUpperCase()}</div>
                            <div className="text-[10px] text-muted-foreground">{format(new Date(userOrder.createdAt), "MMM dd, yyyy")}</div>
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
                          <div className="px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-blue-50 text-blue-600">
                            {userOrder.status}
                          </div>
                          <ChevronRight size={18} className="text-muted-foreground/50 group-hover:text-blue-600 transition-colors" />
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {userTickets.length > 0 && (
                <div>
                  <h3 className="text-sm font-bold text-foreground mb-6 flex items-center gap-2">
                    <Wrench size={16} className="text-emerald-600" /> Your Repair Tickets
                  </h3>
                  <div className="space-y-4">
                    {userTickets.map((userTicket) => (
                      <button
                        key={userTicket.id}
                        onClick={() => {
                          setOrderId(userTicket.ticket_id || userTicket.id!);
                          setTicket(userTicket);
                        }}
                        className="w-full bg-card p-6 rounded-3xl border border-border shadow-sm hover:border-emerald-200 hover:shadow-md transition-all flex items-center justify-between group text-left"
                      >
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 bg-muted rounded-2xl flex items-center justify-center group-hover:bg-emerald-50 transition-colors">
                            {getStatusIcon(userTicket.status || "submitted")}
                          </div>
                          <div>
                            <div className="text-sm font-bold text-foreground">Ticket #{userTicket.ticket_id}</div>
                            <div className="text-[10px] text-muted-foreground">{userTicket.brand_name} {userTicket.model}</div>
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
                          <div className="px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-50 text-emerald-600">
                            {userTicket.status?.replace('_', ' ')}
                          </div>
                          <ChevronRight size={18} className="text-muted-foreground/50 group-hover:text-emerald-600 transition-colors" />
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </motion.div>
          )}

          {/* Help Section */}
          <div className="mt-20 text-center">
            <p className="text-sm text-muted-foreground">
              Need help with your order? <Link to="/contact" className="text-blue-600 font-bold hover:underline">Contact our support team</Link>
            </p>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}

import { Header } from "@/frontend/components/Header";
import { Footer } from "@/frontend/components/Footer";
import { MobileBottomNav } from "@/frontend/components/MobileBottomNav";
import { CheckCircle2, ShoppingBag, ArrowRight, Package, Truck, Mail, MapPin, Phone, User, CreditCard } from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import { motion } from "motion/react";
import { toast } from "sonner";
import { orderService } from "@/api/orderService";
import { formatPrice } from "@/lib/utils";

interface OrderItem {
  productId: string;
  name: string;
  price: number;
  quantity: number;
  image: string;
  features: string[];
}

interface Order {
  id: string | number;
  uid: string;
  customerName: string;
  customerEmail: string;
  items: OrderItem[];
  totalAmount: number;
  status: string;
  paymentStatus?: "paid" | "unpaid";
  shippingAddress: {
    address: string;
    city: string;
    phone: string;
  };
  createdAt: string;
}

const OrderSuccessPage = () => {
  const location = useLocation();
  const order = location.state?.order as Order | undefined;

  return (
    <div className="min-h-screen bg-background pb-16 lg:pb-0">
      <Header />
      
      <main className="neo-container py-20 pt-32 flex flex-col items-center">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.5, type: "spring" }}
          className="w-24 h-24 bg-emerald-500/10 text-emerald-500 rounded-full flex items-center justify-center mb-8"
        >
          <CheckCircle2 size={48} className="animate-bounce" />
        </motion.div>

        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2, duration: 0.5 }}
          className="space-y-4 max-w-xl text-center"
        >
          <h1 className="text-4xl md:text-5xl font-display font-bold">Order Placed Successfully!</h1>
          <p className="text-lg text-muted-foreground">
            Thank you for your purchase. Your order has been received and is being processed.
          </p>
          {order && (
            <div className="mt-4 p-2 bg-accent/30 rounded-xl inline-block">
              <span className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Order ID: </span>
              <span className="text-xs font-mono font-bold">#{String(order.id).slice(-8).toUpperCase()}</span>
            </div>
          )}
        </motion.div>

        {order && (
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.3, duration: 0.5 }}
            className="w-full max-w-4xl mt-12 grid grid-cols-1 lg:grid-cols-2 gap-8"
          >
            {/* Order Items */}
            <div className="bg-card border border-border rounded-3xl p-6 shadow-sm">
              <h3 className="text-sm font-bold uppercase tracking-widest mb-6 flex items-center gap-2">
                <Package size={16} className="text-primary" />
                Order Items
              </h3>
              <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2 no-scrollbar">
                {order.items.map((item, i) => (
                  <div key={i} className="flex gap-4 p-3 bg-accent/20 rounded-2xl border border-border">
                    <div className="w-16 h-16 bg-card rounded-xl overflow-hidden flex-shrink-0 border border-border">
                      <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold truncate">{item.name}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">Qty: {item.quantity} × {formatPrice(item.price || 0)}</p>
                      {item.features && item.features.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-2">
                          {item.features.map((f, fi) => (
                            <span key={fi} className="text-[8px] px-1.5 py-0.5 bg-card border border-border rounded text-muted-foreground uppercase tracking-wider">{f}</span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-6 pt-6 border-t border-border flex justify-between items-center">
                <span className="font-bold">Total Amount</span>
                <span className="text-xl font-display font-bold text-primary">{formatPrice(order.totalAmount || 0)}</span>
              </div>
            </div>

            {/* Shipping Info */}
            <div className="space-y-6">
              <div className="bg-card border border-border rounded-3xl p-6 shadow-sm">
                <h3 className="text-sm font-bold uppercase tracking-widest mb-6 flex items-center gap-2">
                  <MapPin size={16} className="text-primary" />
                  Shipping Details
                </h3>
                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <User size={18} className="text-muted-foreground mt-0.5" />
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Recipient</p>
                      <p className="text-sm font-medium">{order.customerName}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <Phone size={18} className="text-muted-foreground mt-0.5" />
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Phone</p>
                      <p className="text-sm font-medium">{order.shippingAddress.phone}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <MapPin size={18} className="text-muted-foreground mt-0.5" />
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Address</p>
                      <p className="text-sm font-medium">{order.shippingAddress.address}, {order.shippingAddress.city}</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-emerald-500/5 border border-emerald-500/20 rounded-3xl p-6">
                <div className="flex items-center gap-3 text-emerald-600 mb-2">
                  <Truck size={20} />
                  <h4 className="font-bold">Estimated Delivery</h4>
                </div>
                <p className="text-xs text-emerald-600/80 leading-relaxed">
                  Your order will be delivered within 3-5 business days. You'll receive a tracking number once it's shipped.
                </p>
              </div>
            </div>
          </motion.div>
        )}

        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.6, duration: 0.5 }}
          className="flex flex-col sm:flex-row gap-4 mt-12"
        >
          {order && order.paymentStatus === "unpaid" && (
            <button 
              onClick={async () => {
                try {
                  await orderService.updateStatus(String(order.id), "processing");
                  toast.success("Payment processed successfully!");
                  // Update local state or just refresh
                  window.location.reload();
                } catch (error) {
                  console.error("Error processing payment:", error);
                  toast.error("Failed to process payment");
                }
              }}
              className="px-8 py-4 bg-emerald-500 text-white rounded-2xl font-bold hover:bg-emerald-600 transition-all shadow-xl shadow-emerald-500/20 flex items-center justify-center gap-2 group"
            >
              <CreditCard size={20} />
              PAY NOW
            </button>
          )}
          <Link 
            to="/" 
            className="px-8 py-4 bg-primary text-primary-foreground rounded-2xl font-bold hover:bg-primary/90 transition-all shadow-xl shadow-primary/20 flex items-center gap-2 group"
          >
            <ShoppingBag size={20} />
            CONTINUE SHOPPING
            <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
          </Link>
          <Link 
            to="/search"
            className="px-8 py-4 bg-accent text-foreground rounded-2xl font-bold hover:bg-accent/80 transition-all flex items-center justify-center"
          >
            BROWSE MORE
          </Link>
        </motion.div>
      </main>

      <Footer />
      <MobileBottomNav />
    </div>
  );
};

export default OrderSuccessPage;

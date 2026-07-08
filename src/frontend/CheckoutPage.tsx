import { useSyncExternalStore, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useGSAPReveal } from "@/hooks/useGSAP";
import { Header } from "@/frontend/components/Header";
import { Footer } from "@/frontend/components/Footer";
import { MobileBottomNav } from "@/frontend/components/MobileBottomNav";
import { SafeImage } from "@/frontend/components/SafeImage";
import { cartStore } from "@/stores/cart";
import { formatPrice } from "@/lib/utils";
import { Minus, Plus, Trash2, ShoppingBag, Shield, Truck, CreditCard, MapPin, Phone, ArrowRight, Loader2, Package } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useStore } from "@/frontend/context/StoreContext";
import { userMatchesActiveTenant, setActiveTenantSlug } from "@/lib/tenant";
import { orderService } from "@/api/orderService";
import { customerService } from "@/api/customerService";
import { toast } from "sonner";

const CheckoutPage = () => {
  const { user } = useAuth();
  const { company } = useStore();
  const containerRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const items = useSyncExternalStore(cartStore.subscribe, cartStore.getSnapshot);
  const total = items.reduce((sum, i) => sum + i.product.price * i.quantity, 0);
  
  const [loading, setLoading] = useState(false);
  const [shippingInfo, setShippingInfo] = useState({
    address: "",
    city: "",
    country: "Nepal",
    phone: "",
    coordinates: ""
  });

  useGSAPReveal(containerRef, ".gsap-reveal", { opacity: 0, y: 20, duration: 0.6, stagger: 0.1 });
  useGSAPReveal(containerRef, ".gsap-reveal-sidebar", { opacity: 0, x: 20, duration: 0.8 });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    if (name === "phone") {
      // Only allow digits and limit to 10
      const onlyNums = value.replace(/[^0-9]/g, '');
      if (onlyNums.length <= 10) {
        setShippingInfo(prev => ({ ...prev, [name]: onlyNums }));
      }
    } else {
      setShippingInfo(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleCaptureLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const coords = `${position.coords.latitude}, ${position.coords.longitude}`;
          setShippingInfo(prev => ({ ...prev, address: `${prev.address}\nLocation: ${coords}`.trim(), coordinates: coords }));
          toast.success("Location captured!");
        },
        (error) => {
          toast.error("Unable to capture location. Please check permissions.");
          console.error(error);
        }
      );
    } else {
      toast.error("Geolocation is not supported by this browser.");
    }
  };

  const handlePlaceOrder = async () => {
    if (!user) {
      toast.error("Please sign in to place an order");
      navigate("/signin");
      return;
    }

    if (!userMatchesActiveTenant(user)) {
      toast.error(
        user?.company
          ? `Your account is for ${user.company.name}. Sign in at ${user.company.slug}.localhost:3000`
          : "Your account cannot checkout on this store."
      );
      navigate("/signin");
      return;
    }

    if (company?.slug) {
      setActiveTenantSlug(company.slug);
    }

    if (!shippingInfo.address || !shippingInfo.city || !shippingInfo.phone) {
      toast.error("Please fill in all shipping details");
      return;
    }

    setLoading(true);
    try {
      const orderData = {
        uid: user.id,
        customerName: user.name || user.email?.split('@')[0] || "Customer",
        customerEmail: user.email,
        items: items.map(item => ({
          productId: item.product.id,
          name: item.product.name,
          price: item.product.price,
          quantity: item.quantity,
          image: item.product.image,
          features: Array.isArray(item.product.specs) ? item.product.specs : [],
          slug: item.product.slug || item.product.id
        })),
        totalAmount: total,
        status: "new" as const,
        paymentStatus: "pending" as const,
        paymentMethod: "cod",
        shippingAddress: shippingInfo,
      };

      const orderDoc = await orderService.create(orderData);

      cartStore.clear();
      try {
        await customerService.clearCart(user.id);
      } catch (cartError) {
        console.warn("Could not clear server cart:", cartError);
      }

      toast.success("Order placed successfully!");
      navigate("/order-success", {
        state: {
          order: {
            ...orderData,
            id: String(orderDoc.id ?? orderDoc.orderId ?? orderDoc.order_id ?? ""),
            orderId: orderDoc.orderId ?? orderDoc.order_id,
          },
        },
      });
    } catch (error) {
      console.error("Error placing order:", error);
      const err = error as { message?: string };
      toast.error(err.message || "Failed to place order. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-background" ref={containerRef}>
        <Header />
        <div className="neo-container py-16 sm:py-24 text-center gsap-reveal">
          <div className="w-20 h-20 rounded-full bg-accent mx-auto mb-6 flex items-center justify-center">
            <ShoppingBag size={40} className="text-muted-foreground/40" strokeWidth={1} />
          </div>
          <h1 className="text-xl sm:text-2xl font-display font-semibold mb-3">Your cart is empty</h1>
          <p className="text-sm text-muted-foreground mb-6">Add some products to get started</p>
          <Link to="/" className="btn-primary">
            Continue Shopping
          </Link>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-16 lg:pb-0" ref={containerRef}>
      <Header />
      <main className="neo-container py-6 sm:py-8">
        <div className="flex items-center gap-3 mb-6 sm:mb-8 gsap-reveal">
          <ShoppingBag className="text-primary" size={24} />
          <h1 className="text-xl sm:text-2xl font-display font-bold">Checkout</h1>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-8">
          <div className="lg:col-span-2 space-y-8">
            {/* Shipping Info */}
            <section className="bg-card border border-border rounded-2xl p-6 shadow-sm gsap-reveal">
              <div className="flex items-center gap-2 mb-6">
                <MapPin size={18} className="text-primary" />
                <h2 className="text-sm font-bold uppercase tracking-widest">Shipping Information</h2>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4 md:col-span-2">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                      Full Address
                      <span className="text-[10px] text-destructive lowercase font-normal italic">(Required)</span>
                    </label>
                    <button 
                      type="button"
                      onClick={handleCaptureLocation}
                      className="w-full sm:w-auto h-14 sm:h-12 text-sm sm:text-xs font-bold uppercase tracking-widest text-primary bg-primary/10 hover:bg-primary/20 flex items-center justify-center gap-3 px-8 rounded-2xl border border-primary/20 transition-all shadow-lg shadow-primary/5 active:scale-95"
                    >
                      <MapPin size={20} className="sm:size-18" /> Capture Precise Location
                    </button>
                  </div>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-3 text-muted-foreground" size={16} />
                    <textarea 
                      name="address"
                      value={shippingInfo.address}
                      onChange={handleInputChange}
                      placeholder="Street address, Apartment, Suite, etc."
                      className="w-full bg-accent/30 border border-border rounded-xl pl-10 pr-4 py-2.5 text-sm focus:ring-2 focus:ring-primary/20 outline-none min-h-[100px]"
                    />
                    {shippingInfo.coordinates && (
                      <div className="absolute right-3 top-3 bg-emerald-500/10 text-emerald-500 text-[10px] font-bold px-2 py-1 rounded-lg border border-emerald-500/20 animate-pulse">
                        📍 COORDS CAPTURED
                      </div>
                    )}
                  </div>
                </div>
                
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                    City
                    <span className="text-[10px] text-destructive lowercase font-normal italic">(Required)</span>
                  </label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
                    <input 
                      name="city"
                      value={shippingInfo.city}
                      onChange={handleInputChange}
                      placeholder="Your City"
                      className="w-full bg-accent/30 border border-border rounded-xl pl-10 pr-4 py-2.5 text-sm focus:ring-2 focus:ring-primary/20 outline-none"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                    Phone Number
                    <span className="text-[10px] text-destructive lowercase font-normal italic">(Required)</span>
                  </label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
                    <input 
                      name="phone"
                      value={shippingInfo.phone}
                      onChange={handleInputChange}
                      placeholder="1234567890"
                      maxLength={10}
                      className="w-full bg-accent/30 border border-border rounded-xl pl-10 pr-4 py-2.5 text-sm focus:ring-2 focus:ring-primary/20 outline-none"
                    />
                  </div>
                </div>
              </div>
            </section>

            {/* Cart Items */}
            <section className="space-y-4">
              <div className="flex items-center gap-2 mb-2 gsap-reveal">
                <Package size={18} className="text-primary" />
                <h2 className="text-sm font-bold uppercase tracking-widest">Order Items ({items.length})</h2>
              </div>
              
              <div className="space-y-3">
                {items.map(item => (
                  <div key={item.product.id} className="flex gap-3 sm:gap-4 p-3 sm:p-4 bg-card border border-border rounded-xl shadow-[var(--shadow-sm)] gsap-reveal">
                    <SafeImage src={item.product.image} alt={item.product.name} className="w-16 sm:w-20 h-16 sm:h-20 object-cover rounded-lg bg-accent" />
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-start gap-2">
                        <Link to={item.product.slug || item.product.id ? `/product/${item.product.slug || item.product.id}` : "#"} className={`text-xs sm:text-sm font-bold hover:text-primary transition-colors line-clamp-1 ${!(item.product.slug || item.product.id) ? "pointer-events-none" : ""}`}>
                          {item.product.name}
                        </Link>
                        <button
                          onClick={() => cartStore.removeItem(item.product.id)}
                          className="p-1 text-muted-foreground hover:text-destructive transition-colors"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                      <p className="text-[10px] sm:text-xs text-muted-foreground mt-0.5">{item.product.brand}</p>
                      
                      <div className="flex items-center justify-between mt-3">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => cartStore.updateQuantity(item.product.id, item.quantity - 1)}
                            className="w-6 h-6 flex items-center justify-center border border-border rounded-md text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
                          >
                            <Minus size={12} />
                          </button>
                          <span className="text-xs font-mono tabular-nums w-6 text-center">{item.quantity}</span>
                          <button
                            onClick={() => cartStore.updateQuantity(item.product.id, item.quantity + 1)}
                            className="w-6 h-6 flex items-center justify-center border border-border rounded-md text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
                          >
                            <Plus size={12} />
                          </button>
                        </div>
                        <span className="font-bold text-sm">{formatPrice((item.product.price || 0) * (item.quantity || 0))}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-1">
            <div className="bg-card border border-border rounded-2xl p-6 h-fit sticky top-24 shadow-[var(--shadow-md)] gsap-reveal-sidebar">
              <h2 className="font-display font-bold text-lg mb-6">Order Summary</h2>
              
              <div className="space-y-4 mb-8">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span className="font-bold">{formatPrice(total || 0)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Shipping</span>
                  <span className="text-emerald-500 font-bold uppercase tracking-widest text-[10px]">Free</span>
                </div>
                <div className="h-px bg-border my-2" />
                <div className="flex justify-between items-center">
                  <span className="font-bold">Total Amount</span>
                  <span className="text-xl font-display font-bold text-primary">{formatPrice(total || 0)}</span>
                </div>
              </div>

              <div className="space-y-4">
                <div className="p-4 bg-accent/30 rounded-xl border border-border flex items-center gap-3">
                  <div className="w-10 h-10 bg-card rounded-lg flex items-center justify-center text-primary shadow-sm">
                    <CreditCard size={20} />
                  </div>
                  <div>
                    <p className="text-xs font-bold">Cash on Delivery</p>
                    <p className="text-[10px] text-muted-foreground">Pay when you receive</p>
                  </div>
                </div>

                <button 
                  onClick={handlePlaceOrder}
                  disabled={loading}
                  className="w-full py-4 bg-primary text-primary-foreground rounded-2xl font-bold hover:bg-primary/90 transition-all shadow-xl shadow-primary/20 flex items-center justify-center gap-2 group disabled:opacity-50"
                >
                  {loading ? (
                    <Loader2 className="animate-spin" size={20} />
                  ) : (
                    <>
                      PLACE ORDER
                      <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
                    </>
                  )}
                </button>
              </div>

              <div className="grid grid-cols-2 gap-4 mt-8 pt-6 border-t border-border">
                <div className="flex flex-col items-center gap-1 text-center">
                  <Shield size={16} className="text-muted-foreground" />
                  <span className="text-[10px] font-bold uppercase tracking-tighter text-muted-foreground">Secure</span>
                </div>
                <div className="flex flex-col items-center gap-1 text-center">
                  <Truck size={16} className="text-muted-foreground" />
                  <span className="text-[10px] font-bold uppercase tracking-tighter text-muted-foreground">Insured</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
      <Footer />
      <MobileBottomNav />
    </div>
  );
};

export default CheckoutPage;

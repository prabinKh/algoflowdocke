import { useState, useEffect, useRef } from "react";
import { useNavigate, useOutletContext } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { productService } from "@/api/productService";
import { customerService } from "@/api/customerService";
import { orderService } from "@/api/orderService";
import { type Product } from "@/lib/types";
import { formatPrice } from "@/lib/utils";
import { type Order, type OrderItem, type Customer } from "@/types/admin";
import { 
  Search, 
  ShoppingCart, 
  Plus, 
  Minus, 
  Trash2, 
  Printer, 
  X,
  User,
  CreditCard,
  Banknote,
  ChevronRight,
  Store,
  Filter,
  Apple,
  Beef,
  Coffee,
  Cookie,
  LayoutGrid,
  Percent,
  Share2,
  Mail as MailIcon,
  Phone as PhoneIcon,
  Check,
  Users as UsersIcon,
  Smartphone,
  Monitor,
  Laptop,
  Headphones,
  Home,
  Cpu,
  MousePointer2 as Mouse,
  Tablet
} from "lucide-react";
import { toast } from "sonner";
import { motion, AnimatePresence } from "motion/react";
import { format } from "date-fns";
import { safeToDate } from "@/lib/utils";
import { getCategoryColor, renderCategoryIcon } from "@/lib/icons";

interface CartItem extends Product {
  quantity: number;
}

import { useProducts } from "@/hooks/useProducts";
import { useCustomers } from "@/hooks/useCustomers";

const POS = () => {
  const { user } = useAuth();
  const { products, loading: productsLoading } = useProducts();
  const { customers: customersList, loading: customersLoading } = useCustomers();
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const loading = productsLoading || customersLoading;
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [showInvoice, setShowInvoice] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [shareSearchQuery, setShareSearchQuery] = useState("");
  const [lastOrder, setLastOrder] = useState<Order | null>(null);
  const [customerType, setCustomerType] = useState("Walk-in-customer");
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [discount, setDiscount] = useState(0);
  const [discountType, setDiscountType] = useState<"flat" | "percent">("flat");
  const [paymentMethod, setPaymentMethod] = useState<"cash" | "card" | "upi">("cash");
  const [activeTab, setActiveTab] = useState<"products" | "cart">("products");
  
  const navigate = useNavigate();
  const invoiceRef = useRef<HTMLDivElement>(null);

  const getCategoryIcon = (name: unknown) => {
    if (!name || typeof name !== 'string') return LayoutGrid;
    const lowerName = name.toLowerCase();
    if (lowerName.includes("monitor")) return Monitor;
    if (lowerName.includes("laptop")) return Laptop;
    if (lowerName.includes("mobile") || lowerName.includes("phone")) return Smartphone;
    if (lowerName.includes("tablet")) return Tablet;
    if (lowerName.includes("audio") || lowerName.includes("headphone")) return Headphones;
    if (lowerName.includes("desktop") || lowerName.includes("computer")) return Cpu;
    if (lowerName.includes("peripheral") || lowerName.includes("mouse") || lowerName.includes("keyboard")) return Mouse;
    if (lowerName.includes("home") || lowerName.includes("kitchen")) return Home;
    if (lowerName.includes("fruit") || lowerName.includes("apple")) return Apple;
    if (lowerName.includes("vegetable") || lowerName.includes("beef")) return Beef;
    if (lowerName.includes("beverage") || lowerName.includes("coffee")) return Coffee;
    if (lowerName.includes("snack") || lowerName.includes("cookie")) return Cookie;
    if (lowerName.includes("grocer") || lowerName.includes("store")) return Store;
    return LayoutGrid;
  };

  const dynamicCategories = [
    { name: "All", icon: LayoutGrid },
    ...Array.from(new Set(products.map(p => p.category)))
      .filter(Boolean)
      .sort()
      .map(cat => ({
        name: cat,
        icon: getCategoryIcon(cat),
        color: getCategoryColor(cat as string)
      }))
  ];

  useEffect(() => {
    setFilteredProducts(products);
  }, [products]);

  useEffect(() => {
    let filtered = products;
    if (selectedCategory !== "All") {
      filtered = filtered.filter(p => p.category === selectedCategory);
    }
    if (searchQuery) {
      const queryLower = searchQuery.toLowerCase();
      filtered = filtered.filter(p => 
        (p.name && p.name.toLowerCase().includes(queryLower)) ||
        (p.id && p.id.toLowerCase().includes(queryLower))
      );
    }
    setFilteredProducts(filtered);
  }, [searchQuery, selectedCategory, products]);

  const addToCart = (product: Product) => {
    setCart(prev => {
      const existing = prev.find(item => item.id === product.id);
      if (existing) {
        return prev.map(item => 
          item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
        );
      }
      return [...prev, { ...product, quantity: 1 }];
    });
    toast.success(`${product.name} added to cart`, { duration: 1000 });
  };

  const updateQuantity = (id: string, delta: number) => {
    setCart(prev => prev.map(item => {
      if (item.id === id) {
        const newQty = Math.max(1, item.quantity + delta);
        return { ...item, quantity: newQty };
      }
      return item;
    }));
  };

  const removeFromCart = (id: string) => {
    setCart(prev => prev.filter(item => item.id !== id));
    toast.error("Item removed from cart");
  };

  const subtotal = cart.reduce((acc, item) => acc + (item.price * item.quantity), 0);
  const tax = subtotal * 0.1; // 10% tax
  const discountAmount = discountType === "flat" ? discount : (subtotal * discount) / 100;
  const total = Math.max(0, subtotal + tax - discountAmount);

  const handleCreateBill = async () => {
    if (cart.length === 0) {
      toast.error("Cart is empty");
      return;
    }

    const orderData = {
      uid: user?.id || "pos-admin",
      items: cart.map(item => ({
        productId: item.id,
        name: item.name,
        price: item.price,
        quantity: item.quantity,
        image: item.image,
        features: []
      })),
      subtotal,
      tax,
      discount: discountAmount,
      totalAmount: total,
      customerType,
      customerName: customerType === "Walk-in-customer" ? "Walk-in Customer" : (selectedCustomer?.name || "Registered Customer"),
      customerEmail: selectedCustomer?.email || "",
      status: "new" as const,
      paymentStatus: "unpaid" as const,
      paymentMethod,
      source: "pos",
      orderId: `BILL-${Math.floor(100000 + Math.random() * 900000)}`,
      shippingAddress: {
        address: "POS Order",
        city: "Store",
        phone: selectedCustomer?.phone || "N/A"
      }
    };

    try {
      const result = await orderService.create(orderData);
      setLastOrder({ ...orderData, id: result.id, createdAt: result.createdAt } as Order);
      setShowInvoice(true);
      setCart([]);
      setDiscount(0);
      setSelectedCustomer(null);
      toast.success("Bill created successfully!");
    } catch (error) {
      console.error("Error creating bill:", error);
      toast.error("Failed to create bill");
    }
  };

  const handlePay = async () => {
    if (cart.length === 0) {
      toast.error("Cart is empty");
      return;
    }

    const orderData = {
      uid: user?.id || "pos-admin",
      items: cart.map(item => ({
        productId: item.id,
        name: item.name,
        price: item.price,
        quantity: item.quantity,
        image: item.image,
        features: []
      })),
      subtotal,
      tax,
      discount: discountAmount,
      totalAmount: total,
      customerType,
      customerName: customerType === "Walk-in-customer" ? "Walk-in Customer" : (selectedCustomer?.name || "Registered Customer"),
      customerEmail: selectedCustomer?.email || "",
      status: "delivered" as const,
      paymentStatus: "paid" as const,
      paymentMethod,
      source: "pos",
      orderId: `POS-${Math.floor(100000 + Math.random() * 900000)}`,
      shippingAddress: {
        address: "POS Order",
        city: "Store",
        phone: selectedCustomer?.phone || "N/A"
      }
    };

    try {
      const result = await orderService.create(orderData);
      setLastOrder({ ...orderData, id: result.id, createdAt: result.createdAt } as Order);
      setShowInvoice(true);
      setCart([]);
      setDiscount(0);
      setSelectedCustomer(null);
      toast.success("Payment successful!");
    } catch (error) {
      console.error("Error processing payment:", error);
      toast.error("Failed to process payment");
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleShareInvoice = (customer: Customer) => {
    if (!lastOrder) return;

    const itemsList = lastOrder.items.map(item => 
      `${item.name} x ${item.quantity} - ${formatPrice(item.price * item.quantity)}`
    ).join('\n');

    const orderDate = safeToDate(lastOrder.createdAt) || new Date();

    const emailBody = `
Invoice Details:
Order ID: ${lastOrder.orderId}
Customer: ${customer.name}
Date: ${format(orderDate, "MMM dd, yyyy")}

Items:
${itemsList}

Subtotal: ${formatPrice(lastOrder.subtotal || 0)}
Tax: ${formatPrice(lastOrder.tax || 0)}
Total: ${formatPrice(lastOrder.totalAmount)}

Thank you for shopping with us!
Greentic
    `.trim();

    const gmailUrl = `https://mail.google.com/mail/?view=cm&fs=1&to=${customer.email}&su=Invoice for Order ${lastOrder.orderId}&body=${encodeURIComponent(emailBody)}`;
    
    window.open(gmailUrl, '_blank');
    setShowShareModal(false);
    toast.success(`Invoice shared with ${customer.name}`);
  };

  const filteredShareCustomers = customersList.filter(c => {
    const queryLower = shareSearchQuery.toLowerCase();
    return (
      (c.name && c.name.toLowerCase().includes(queryLower)) ||
      (c.email && c.email.toLowerCase().includes(queryLower)) ||
      (c.phone && c.phone.includes(shareSearchQuery))
    );
  });

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm font-medium animate-pulse text-muted-foreground">Loading POS...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full bg-background flex flex-col lg:overflow-hidden">
      {/* Mobile Tab Switcher */}
      <div className="lg:hidden flex border-b border-border bg-card shrink-0 z-10">
        <button 
          onClick={() => setActiveTab("products")}
          className={`flex-1 py-4 text-[10px] font-bold uppercase tracking-widest transition-all ${activeTab === "products" ? "text-emerald-500 border-b-2 border-emerald-500 bg-emerald-50/50" : "text-muted-foreground"}`}
        >
          Products
        </button>
        <button 
          onClick={() => setActiveTab("cart")}
          className={`flex-1 py-4 text-[10px] font-bold uppercase tracking-widest transition-all relative ${activeTab === "cart" ? "text-emerald-500 border-b-2 border-emerald-500 bg-emerald-50/50" : "text-muted-foreground"}`}
        >
          Cart ({cart.length})
          {cart.length > 0 && activeTab !== "cart" && (
            <span className="absolute top-3 right-[30%] w-2 h-2 bg-rose-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(244,63,94,0.5)]" />
          )}
        </button>
      </div>

      <div className="flex-1 flex flex-col lg:flex-row lg:overflow-hidden p-4 lg:p-6 gap-4 lg:gap-6">
        {/* Product Section */}
        <div className={`flex-1 flex flex-col min-w-0 gap-4 lg:gap-6 lg:overflow-hidden ${activeTab !== "products" ? "hidden lg:flex" : "flex"}`}>
          <div className="bg-card border border-border rounded-2xl lg:rounded-3xl p-4 lg:p-6 shadow-sm shrink-0">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
              <h2 className="text-lg font-bold text-foreground">Products</h2>
              <div className="relative w-full lg:w-80">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
                <input 
                  type="text"
                  placeholder="Search products..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-muted border border-border rounded-xl focus:ring-2 focus:ring-emerald-500/20 outline-none transition-all text-sm"
                />
              </div>
            </div>

            <div className="flex items-center gap-2 mt-4 lg:mt-6 overflow-x-auto no-scrollbar pb-2">
              {dynamicCategories.map(cat => (
                <button
                  key={cat.name}
                  onClick={() => setSelectedCategory(cat.name)}
                  className={`flex items-center gap-2 px-4 lg:px-6 py-2.5 lg:py-3 rounded-xl lg:rounded-2xl text-[10px] lg:text-xs font-bold uppercase tracking-wider transition-all whitespace-nowrap ${
                    selectedCategory === cat.name 
                      ? "bg-emerald-500 text-white shadow-lg shadow-emerald-500/20" 
                      : "bg-muted text-muted-foreground hover:bg-accent border border-border"
                  }`}
                >
                  <cat.icon size={14} className="lg:w-4 lg:h-4" />
                  {cat.name}
                </button>
              ))}
            </div>
          </div>

          <div className="flex-1 overflow-y-auto custom-scrollbar pr-1">
            <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3 lg:gap-4">
              {filteredProducts.map(product => (
                <motion.div
                  layout
                  key={product.id}
                  whileHover={{ y: -4 }}
                  className="bg-card border border-border rounded-2xl lg:rounded-3xl p-3 lg:p-4 shadow-sm hover:shadow-md transition-all group cursor-pointer flex flex-col"
                  onClick={() => addToCart(product)}
                >
                  <div className="relative aspect-square rounded-xl lg:rounded-2xl overflow-hidden bg-muted mb-3 lg:mb-4 border border-border">
                    <img src={product.image} alt={product.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                    <div className="absolute top-2 right-2 px-2 py-1 bg-card/90 backdrop-blur-sm rounded-lg text-[9px] lg:text-[10px] font-bold text-emerald-600 border border-emerald-100">
                      {product.stock || 0} In Stock
                    </div>
                  </div>
                  <div className="flex-1">
                    <h3 className="font-bold text-xs lg:text-sm text-foreground line-clamp-1">{product.name}</h3>
                    <p className="text-[10px] text-muted-foreground mt-0.5 uppercase tracking-wider font-medium">{product.category}</p>
                  </div>
                  <div className="flex items-center justify-between mt-3 lg:mt-4">
                    <span className="text-sm lg:text-lg font-bold text-emerald-600">{formatPrice(product.price)}</span>
                    <button className="w-7 h-7 lg:w-8 lg:h-8 bg-emerald-50 text-emerald-600 rounded-lg lg:rounded-xl flex items-center justify-center hover:bg-emerald-500 hover:text-white transition-all">
                      <Plus size={16} />
                    </button>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>

          {/* Mobile Floating Cart Button */}
          {cart.length > 0 && activeTab === "products" && (
            <motion.button
              initial={{ scale: 0, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              onClick={() => setActiveTab("cart")}
              className="lg:hidden fixed bottom-28 right-6 z-30 bg-emerald-500 text-white p-4 rounded-full shadow-2xl flex items-center gap-2 font-bold text-xs uppercase tracking-widest"
            >
              <ShoppingCart size={18} />
              <span>Checkout ({cart.length})</span>
            </motion.button>
          )}
        </div>

        {/* Billing Section */}
        <div className={`w-full lg:w-96 bg-card border border-border rounded-2xl lg:rounded-3xl flex flex-col shadow-sm lg:overflow-hidden shrink-0 ${activeTab !== "cart" ? "hidden lg:flex" : "flex"} flex-1 lg:flex-initial lg:h-auto`}>
          <div className="p-6 border-b border-border shrink-0 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-foreground">Billing Section</h2>
              <div className="flex items-center gap-2">
                <UsersIcon size={16} className="text-muted-foreground" />
                <select 
                  value={customerType}
                  onChange={(e) => {
                    setCustomerType(e.target.value);
                    if (e.target.value === "Walk-in-customer") setSelectedCustomer(null);
                  }}
                  className="text-sm font-bold bg-muted border border-border rounded-xl px-4 py-2 focus:outline-none"
                >
                  <option value="Walk-in-customer">Walk-in</option>
                  <option value="Registered">Registered</option>
                </select>
              </div>
            </div>

            {customerType === "Registered" && (
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={14} />
                <select
                  value={selectedCustomer?.email || ""}
                  onChange={(e) => {
                    const cust = customersList.find(c => c.email === e.target.value);
                    setSelectedCustomer(cust || null);
                  }}
                  className="w-full pl-9 pr-4 py-3 bg-muted border border-border rounded-xl text-sm font-bold outline-none appearance-none"
                >
                  <option value="">Select Customer</option>
                  {customersList.map(c => (
                    <option key={c.email} value={c.email}>{c.name}</option>
                  ))}
                </select>
              </div>
            )}

            <div className="grid grid-cols-12 text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-2">
              <div className="col-span-6">Item</div>
              <div className="col-span-3 text-center">Qty</div>
              <div className="col-span-3 text-right">Total</div>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-4">
            {cart.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center opacity-20">
                <ShoppingCart size={48} className="mb-4" />
                <p className="text-sm font-bold uppercase tracking-widest">Cart is empty</p>
              </div>
            ) : (
              cart.map(item => (
                <div key={item.id} className="grid grid-cols-12 items-center gap-3">
                  <div className="col-span-6 flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg overflow-hidden bg-muted border border-border flex-shrink-0">
                      <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-bold truncate text-foreground">{item.name}</p>
                      <p className="text-[10px] text-emerald-600 font-bold">{formatPrice(item.price)}</p>
                    </div>
                  </div>
                  <div className="col-span-3 flex items-center justify-center gap-2">
                    <button 
                      onClick={() => updateQuantity(item.id!, -1)}
                      className="w-5 h-5 bg-accent rounded-md flex items-center justify-center text-muted-foreground hover:bg-accent/50"
                    >
                      <Minus size={10} />
                    </button>
                    <span className="text-xs font-bold w-4 text-center">{item.quantity}</span>
                    <button 
                      onClick={() => updateQuantity(item.id!, 1)}
                      className="w-5 h-5 bg-accent rounded-md flex items-center justify-center text-muted-foreground hover:bg-accent/50"
                    >
                      <Plus size={10} />
                    </button>
                  </div>
                  <div className="col-span-3 text-right flex items-center justify-end gap-2">
                    <span className="text-xs font-bold text-foreground">{formatPrice(item.price * item.quantity)}</span>
                    <button 
                      onClick={() => removeFromCart(item.id!)}
                      className="text-muted-foreground/50 hover:text-rose-500 transition-colors"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="p-6 bg-muted border-t border-border space-y-4 shrink-0">
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Sub Total :</span>
                <span className="font-bold text-foreground">{formatPrice(subtotal)}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Tax (10%) :</span>
                <span className="font-bold text-foreground">{formatPrice(tax)}</span>
              </div>
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Percent size={14} />
                  <span>Discount :</span>
                </div>
                <div className="flex items-center gap-2">
                  <input 
                    type="number"
                    value={discount}
                    onChange={(e) => setDiscount(Number(e.target.value))}
                    className="w-20 px-3 py-2 bg-card border border-border rounded-lg text-sm font-bold outline-none"
                  />
                  <select 
                    value={discountType}
                    onChange={(e) => setDiscountType(e.target.value as "flat" | "percent")}
                    className="bg-card border border-border rounded-lg text-sm font-bold px-2 py-2 outline-none"
                  >
                    <option value="flat">Rs.</option>
                    <option value="percent">%</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-border pb-32 lg:pb-0">
              <div className="flex items-center justify-between mb-4">
                <span className="text-lg font-bold text-foreground">Total :</span>
                <span className="text-lg font-bold text-emerald-600">{formatPrice(total)}</span>
              </div>

              <div className="flex items-center gap-2 mb-4">
                {[
                  { id: "cash", icon: Banknote, label: "Cash" },
                  { id: "card", icon: CreditCard, label: "Card" },
                  { id: "upi", icon: Smartphone, label: "UPI" },
                ].map(method => (
                  <button
                    key={method.id}
                    onClick={() => setPaymentMethod(method.id as Order["paymentMethod"])}
                    className={`flex-1 flex flex-col items-center gap-1 py-2 rounded-xl border transition-all ${
                      paymentMethod === method.id 
                        ? "bg-emerald-50 border-emerald-500 text-emerald-600 shadow-sm" 
                        : "bg-card border-border text-muted-foreground hover:bg-muted"
                    }`}
                  >
                    <method.icon size={16} />
                    <span className="text-[10px] font-bold uppercase">{method.label}</span>
                  </button>
                ))}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <button 
                  onClick={handleCreateBill}
                  className="py-3 bg-card border border-border text-muted-foreground rounded-2xl text-xs font-bold uppercase tracking-widest hover:bg-accent transition-all flex items-center justify-center gap-2"
                >
                  <Printer size={16} />
                  Create Bill
                </button>
                <button 
                  onClick={handlePay}
                  className="py-3 bg-emerald-500 text-white rounded-2xl text-xs font-bold uppercase tracking-widest hover:bg-emerald-600 transition-all shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-2"
                >
                  <CreditCard size={16} />
                  Pay Now
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Invoice Modal */}
      <AnimatePresence>
        {showInvoice && lastOrder && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-2 sm:p-4 bg-black/60 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              className="bg-card rounded-[2rem] shadow-2xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]"
            >
              <div className="p-4 sm:p-6 border-b border-border flex items-center justify-between shrink-0">
                <h2 className="text-lg sm:text-xl font-bold text-foreground">POS Invoice</h2>
                <button onClick={() => setShowInvoice(false)} className="p-2 hover:bg-accent rounded-full transition-colors">
                  <X size={20} className="text-muted-foreground" />
                </button>
              </div>

              <div className="p-6 sm:p-8 overflow-y-auto custom-scrollbar flex-1" ref={invoiceRef}>
                <div className="text-center mb-8">
                  <div className="w-16 h-16 bg-emerald-500 rounded-2xl flex items-center justify-center text-white mx-auto mb-4">
                    <Store size={32} />
                  </div>
                  <h3 className="text-2xl font-bold text-foreground">Greentic</h3>
                  <p className="text-sm text-muted-foreground mt-1">Order #{lastOrder.orderId}</p>
                </div>

                <div className="grid grid-cols-2 gap-8 mb-8 text-sm">
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-1">Billed To</p>
                    <p className="font-bold text-foreground">{lastOrder.customerName}</p>
                    <p className="text-muted-foreground">{lastOrder.customerType}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-1">Order Info</p>
                    <p className="font-bold text-foreground">
                      {(() => {
                        const date = safeToDate(lastOrder.createdAt);
                        return date ? format(date, "MMM dd, yyyy") : format(new Date(), "MMM dd, yyyy");
                      })()}
                    </p>
                    <p className="text-muted-foreground uppercase text-[10px] font-bold">Payment: {lastOrder.paymentMethod}</p>
                  </div>
                </div>

                <div className="space-y-4 mb-8">
                  <div className="grid grid-cols-12 text-[10px] font-bold uppercase tracking-widest text-muted-foreground pb-2 border-b border-border">
                    <div className="col-span-6">Item</div>
                    <div className="col-span-2 text-center">Qty</div>
                    <div className="col-span-4 text-right">Total</div>
                  </div>
                  {lastOrder.items.map((item: OrderItem, i: number) => (
                    <div key={i} className="grid grid-cols-12 text-sm">
                      <div className="col-span-6 font-medium text-foreground">{item.name}</div>
                      <div className="col-span-2 text-center text-muted-foreground">{item.quantity}</div>
                      <div className="col-span-4 text-right font-bold text-foreground">{formatPrice(item.price * item.quantity)}</div>
                    </div>
                  ))}
                </div>

                <div className="space-y-2 pt-4 border-t border-border">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Subtotal</span>
                    <span className="font-bold text-foreground">{formatPrice(lastOrder.subtotal)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Tax (10%)</span>
                    <span className="font-bold text-foreground">{formatPrice(lastOrder.tax)}</span>
                  </div>
                  <div className="flex justify-between text-lg pt-4 border-t border-border">
                    <span className="font-bold text-foreground">Total</span>
                    <span className="font-bold text-emerald-600">{formatPrice(lastOrder.totalAmount)}</span>
                  </div>
                </div>

                <div className="mt-10 text-center">
                  <p className="text-sm font-bold text-foreground">Thank You For Shopping With Us!</p>
                  <p className="text-xs text-muted-foreground mt-1">Please visit again.</p>
                </div>
              </div>

              <div className="p-4 sm:p-6 bg-muted flex flex-wrap sm:flex-nowrap gap-2 sm:gap-3 shrink-0">
                <button 
                  onClick={() => setShowInvoice(false)}
                  className="flex-1 min-w-[80px] py-3 bg-card border border-border text-muted-foreground rounded-2xl text-[10px] sm:text-xs font-bold uppercase tracking-widest hover:bg-accent transition-all"
                >
                  Close
                </button>
                <button 
                  onClick={() => setShowShareModal(true)}
                  className="flex-1 min-w-[80px] py-3 bg-blue-500 text-white rounded-2xl text-[10px] sm:text-xs font-bold uppercase tracking-widest hover:bg-blue-600 transition-all shadow-lg shadow-blue-500/20 flex items-center justify-center gap-2"
                >
                  <Share2 size={16} />
                  Share
                </button>
                {lastOrder.paymentStatus === "unpaid" ? (
                  <button 
                    onClick={async () => {
                      try {
                        await orderService.update(lastOrder.id!, {
                          paymentStatus: "paid",
                          status: "delivered"
                        });
                        setLastOrder({ ...lastOrder, paymentStatus: "paid", status: "delivered" });
                        toast.success("Payment processed successfully!");
                      } catch (error) {
                        toast.error("Failed to process payment");
                      }
                    }}
                    className="flex-1 min-w-[80px] py-3 bg-emerald-500 text-white rounded-2xl text-[10px] sm:text-xs font-bold uppercase tracking-widest hover:bg-emerald-600 transition-all shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-2"
                  >
                    <CreditCard size={16} />
                    Pay Now
                  </button>
                ) : (
                  <button 
                    onClick={handlePrint}
                    className="flex-1 min-w-[80px] py-3 bg-emerald-500 text-white rounded-2xl text-[10px] sm:text-xs font-bold uppercase tracking-widest hover:bg-emerald-600 transition-all shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-2"
                  >
                    <Printer size={16} />
                    Print
                  </button>
                )}
              </div>
            </motion.div>
          </div>
      )}
    </AnimatePresence>

      {/* Share Modal */}
      <AnimatePresence>
        {showShareModal && (
          <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              className="bg-card rounded-[2rem] shadow-2xl w-full max-w-md overflow-hidden"
            >
              <div className="p-6 border-b border-border flex items-center justify-between">
                <h2 className="text-xl font-bold text-foreground">Share Invoice</h2>
                <button onClick={() => setShowShareModal(false)} className="p-2 hover:bg-accent rounded-full transition-colors">
                  <X size={20} className="text-muted-foreground" />
                </button>
              </div>

              <div className="p-6">
                <div className="relative mb-6">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
                  <input 
                    type="text"
                    placeholder="Search by name, email or phone..."
                    value={shareSearchQuery}
                    onChange={(e) => setShareSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 bg-muted border border-border rounded-xl focus:ring-2 focus:ring-blue-500/20 outline-none transition-all text-sm"
                  />
                </div>

                <div className="space-y-2 max-h-80 overflow-y-auto no-scrollbar">
                  {filteredShareCustomers.length === 0 ? (
                    <p className="text-center text-muted-foreground py-8 text-sm">No customers found</p>
                  ) : (
                    filteredShareCustomers.map(customer => (
                      <button
                        key={customer.email}
                        onClick={() => handleShareInvoice(customer)}
                        className="w-full flex items-center justify-between p-4 hover:bg-muted rounded-2xl transition-all border border-transparent hover:border-border group"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center">
                            <User size={20} />
                          </div>
                          <div className="text-left">
                            <p className="text-sm font-bold text-foreground">{customer.name}</p>
                            <p className="text-[10px] text-muted-foreground">{customer.email}</p>
                          </div>
                        </div>
                        <div className="w-8 h-8 bg-muted text-muted-foreground rounded-lg flex items-center justify-center group-hover:bg-blue-500 group-hover:text-white transition-all">
                          <MailIcon size={16} />
                        </div>
                      </button>
                    ))
                  )}
                </div>
              </div>

              <div className="p-6 bg-muted">
                <button 
                  onClick={() => setShowShareModal(false)}
                  className="w-full py-3 bg-card border border-border text-muted-foreground rounded-2xl text-xs font-bold uppercase tracking-widest hover:bg-accent transition-all"
                >
                  Cancel
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
);
};

export default POS;

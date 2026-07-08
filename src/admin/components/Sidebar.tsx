import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { 
  LayoutDashboard, 
  Package, 
  ShoppingCart, 
  Users, 
  Settings, 
  LogOut,
  ChevronRight,
  Store,
  X,
  Activity,
  Palette,
  ChevronDown,
  BarChart3,
  Wrench,
  MessageSquare
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { toast } from "sonner";
import { motion, AnimatePresence } from "motion/react";

interface SidebarProps {
  isOpen?: boolean;
  onClose?: () => void;
}

interface MenuItem {
  label: string;
  path: string;
  icon?: React.ElementType;
  children?: MenuItem[];
}

const SidebarContent = ({ onClose }: { onClose?: () => void }) => {
  const location = useLocation();
  const [openMenus, setOpenMenus] = useState<string[]>([]);

  const toggleMenu = (label: string) => {
    setOpenMenus(prev => 
      prev.includes(label) 
        ? prev.filter(item => item !== label) 
        : [...prev, label]
    );
  };

  const isActive = (path: string) => location.pathname === path;
  const isParentActive = (children: MenuItem[]) => children.some(child => 
    isActive(child.path) || (child.children && isParentActive(child.children))
  );

  const menuItems: MenuItem[] = [
    { icon: LayoutDashboard, label: "Overview", path: "/admin" },
    { 
      icon: ShoppingCart, 
      label: "Orders", 
      path: "/admin/orders",
      children: [
        { label: "New Orders", path: "/admin/orders" },
        { label: "Pending", path: "/admin/orders/pending" },
        { label: "Processing", path: "/admin/orders/processing" },
        { label: "Shipped", path: "/admin/orders/shipped" },
        { label: "Delivered", path: "/admin/orders/delivered" },
        { label: "PC (Process Conform)", path: "/admin/orders/process-conform" },
        { label: "Cancelled", path: "/admin/orders/cancelled" },
        { label: "PDC (Don't Conform)", path: "/admin/orders/process-dont-conform" },
      ]
    },
    { 
      icon: Package, 
      label: "Products", 
      path: "/admin/products",
      children: [
        { label: "All Products", path: "/admin/products" },
        { label: "Add Product", path: "/admin/products/add" },
      ]
    },
    { icon: Users, label: "Customers", path: "/admin/customers" },
    { 
      icon: Wrench, 
      label: "Service Center", 
      path: "/admin/service-submissions",
      children: [
        { label: "All Submissions", path: "/admin/service-submissions" },
        { label: "New Requests", path: "/admin/service-submissions/new" },
        { label: "Repair Process", path: "/admin/service-submissions/active" },
        { label: "Completed", path: "/admin/service-submissions/done" },
        { label: "Rejected", path: "/admin/service-submissions/rejected" },
        { 
          label: "Service Config", 
          path: "/admin/service-config",
          children: [
            { label: "Categories & Brands", path: "/admin/service-categories" },
            { label: "Settings", path: "/admin/service-center-settings" },
          ]
        },
      ]
    },
    { icon: MessageSquare, label: "Messages", path: "/admin/messages" },
    { icon: Settings, label: "Hero Settings", path: "/admin/hero-settings" },
    { icon: LayoutDashboard, label: "Footer Settings", path: "/admin/footer" },
    { icon: Palette, label: "Branding & Settings", path: "/admin/company-settings" },
    { 
      icon: ShoppingCart, 
      label: "POS", 
      path: "/admin/pos",
      children: [
        { label: "POS Terminal", path: "/admin/pos" },
        { label: "POS History", path: "/admin/pos/history" },
      ]
    },
    { 
      icon: Users, 
      label: "Staff", 
      path: "/admin/staff",
      children: [
        { label: "Roles", path: "/admin/staff/roles" },
        { label: "User", path: "/admin/staff/users" },
      ]
    },
    { icon: Activity, label: "User Activity", path: "/admin/activity" },
    { icon: Settings, label: "Features", path: "/admin/category-features" },
    { 
      icon: BarChart3, 
      label: "Reports", 
      path: "/admin/reports",
      children: [
        { label: "Customer Reports", path: "/admin/reports/customers" },
        { 
          label: "Order Reports", 
          path: "/admin/reports/orders",
          children: [
            { label: "Sales Report", path: "/admin/reports/orders/sales" },
            { label: "Sales Product Report", path: "/admin/reports/orders/products" },
            { label: "Sales Category Report", path: "/admin/reports/orders/categories" },
            { label: "Out of Stock Report", path: "/admin/reports/orders/out-of-stock" },
            { label: "Sales Brand Report", path: "/admin/reports/orders/brands" },
            { label: "Country Based Order Report", path: "/admin/reports/orders/countries" },
            { label: "Order Status Reports", path: "/admin/reports/orders/status" },
          ]
        },
        { label: "Top Sales Reports", path: "/admin/reports/top-sales" },
        { label: "Stock Reports", path: "/admin/reports/stock" },
      ]
    },
  ];

  const { logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await logout();
      toast.success("Logged out successfully");
      navigate("/signin");
    } catch (error) {
      toast.error("Failed to logout");
    }
  };

  return (
    <div className="flex flex-col h-full bg-card border-r border-border w-64 lg:w-72">
      <div className="p-6 flex-1 overflow-y-auto custom-scrollbar">
        <div className="flex items-center justify-between mb-8">
          <Link to="/" className="flex items-center gap-3 group" onClick={onClose}>
            <div className="relative flex items-center justify-center w-10 h-10 bg-emerald-500 rounded-xl shadow-lg shadow-emerald-500/20 group-hover:scale-110 transition-transform duration-300">
              <Store size={20} className="text-white" />
            </div>
            <div className="flex flex-col -space-y-1">
              <span className="font-black text-xl tracking-tighter text-foreground">OMS<span className="text-emerald-500">Admin</span></span>
              <span className="text-[8px] font-bold uppercase tracking-[0.2em] text-muted-foreground">Management System</span>
            </div>
          </Link>
          {onClose && (
            <button onClick={onClose} className="lg:hidden p-2 hover:bg-accent rounded-xl text-muted-foreground transition-colors">
              <X size={20} />
            </button>
          )}
        </div>

        <nav className="space-y-1">
          {menuItems.map((item) => (
            <div key={item.label}>
              {item.children ? (
                <div>
                  <button
                    onClick={() => toggleMenu(item.label)}
                    className={`w-full flex items-center justify-between px-4 py-3 rounded-xl transition-all group ${
                      isParentActive(item.children)
                        ? "bg-emerald-500 text-white shadow-lg shadow-emerald-500/20"
                        : "text-muted-foreground hover:bg-accent hover:text-foreground"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <item.icon size={18} />
                      <span className="text-sm font-medium">{item.label}</span>
                    </div>
                    <ChevronDown 
                      size={14} 
                      className={`transition-transform duration-200 ${openMenus.includes(item.label) ? "rotate-180" : ""}`} 
                    />
                  </button>
                  <AnimatePresence>
                    {(openMenus.includes(item.label) || isParentActive(item.children)) && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="overflow-hidden"
                      >
                        <div className="mt-0 ml-0 border-l border-border space-y-1">
                          {item.children.map((child) => (
                            <div key={child.path}>
                              {child.children ? (
                                <div>
                                  <button
                                    onClick={() => toggleMenu(child.label)}
                                    className={`w-full flex items-center justify-between px-4 py-3 rounded-lg text-sm font-medium transition-all ${
                                      isParentActive(child.children)
                                        ? "text-emerald-500 bg-emerald-500/10"
                                        : "text-muted-foreground hover:text-foreground hover:bg-accent"
                                    }`}
                                  >
                                    <span>{child.label}</span>
                                    <ChevronDown 
                                      size={12} 
                                      className={`transition-transform duration-200 ${openMenus.includes(child.label) ? "rotate-180" : ""}`} 
                                    />
                                  </button>
                                  <AnimatePresence>
                                    {(openMenus.includes(child.label) || isParentActive(child.children)) && (
                                      <motion.div
                                        initial={{ height: 0, opacity: 0 }}
                                        animate={{ height: "auto", opacity: 1 }}
                                        exit={{ height: 0, opacity: 0 }}
                                        className="overflow-hidden"
                                      >
                                        <div className="mt-1 ml-0 pl-1 border-l border-border space-y-1">
                                          {child.children.map((subChild: MenuItem) => (
                                            <Link
                                              key={subChild.path}
                                              to={subChild.path}
                                              onClick={onClose}
                                              className={`flex items-center px-4 py-2.5 rounded-lg text-xs font-medium transition-all ${
                                                isActive(subChild.path)
                                                  ? "text-emerald-500 bg-emerald-500/10"
                                                  : "text-muted-foreground hover:text-foreground hover:bg-accent"
                                              }`}
                                            >
                                              {subChild.label}
                                            </Link>
                                          ))}
                                        </div>
                                      </motion.div>
                                    )}
                                  </AnimatePresence>
                                </div>
                              ) : (
                                <Link
                                  to={child.path}
                                  onClick={onClose}
                                  className={`flex items-center px-4 py-3 rounded-lg text-sm font-medium transition-all ${
                                    isActive(child.path)
                                      ? "text-emerald-500 bg-emerald-500/10"
                                      : "text-muted-foreground hover:text-foreground hover:bg-accent"
                                  }`}
                                >
                                  {child.label}
                                </Link>
                              )}
                            </div>
                          ))}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              ) : (
                <Link
                  to={item.path}
                  onClick={onClose}
                  className={`flex items-center justify-between px-4 py-3 rounded-xl transition-all group ${
                    isActive(item.path)
                      ? "bg-emerald-500 text-white shadow-lg shadow-emerald-500/20"
                      : "text-muted-foreground hover:bg-accent hover:text-foreground"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <item.icon size={18} />
                    <span className="text-sm font-medium">{item.label}</span>
                  </div>
                  {isActive(item.path) && <ChevronRight size={14} />}
                </Link>
              )}
            </div>
          ))}
        </nav>
      </div>

      <div className="mt-auto p-6 border-t border-border">
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 px-4 py-3 w-full rounded-xl text-muted-foreground hover:bg-rose-500/10 hover:text-rose-500 transition-all"
        >
          <LogOut size={18} />
          <span className="text-sm font-medium">Logout</span>
        </button>
      </div>
    </div>
  );
};

const Sidebar = ({ isOpen, onClose }: SidebarProps) => {
  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="hidden lg:block h-screen sticky top-0 flex-shrink-0">
        <SidebarContent onClose={onClose} />
      </aside>

      {/* Mobile Sidebar */}
      <AnimatePresence>
        {isOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={onClose}
              className="fixed inset-0 bg-black/50 z-40 lg:hidden backdrop-blur-sm"
            />
            <motion.aside
              initial={{ x: -280 }}
              animate={{ x: 0 }}
              exit={{ x: -280 }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="fixed inset-y-0 left-0 w-64 z-50 lg:hidden shadow-2xl"
            >
              <SidebarContent onClose={onClose} />
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  );
};

export default Sidebar;

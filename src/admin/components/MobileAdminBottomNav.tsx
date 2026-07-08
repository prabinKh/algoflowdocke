import { Link, useLocation } from "react-router-dom";
import { LayoutDashboard, ShoppingCart, Package, MessageSquare, Wrench } from "lucide-react";

export const MobileAdminBottomNav = () => {
  const location = useLocation();

  const navItems = [
    { icon: LayoutDashboard, label: "Dashboard", path: "/admin" },
    { icon: ShoppingCart, label: "Orders", path: "/admin/orders" },
    { icon: Package, label: "Products", path: "/admin/products" },
    { icon: MessageSquare, label: "Messages", path: "/admin/messages" },
    { icon: Wrench, label: "Repairs", path: "/admin/service-submissions" },
  ];

  return (
    <nav className="fixed bottom-4 left-4 right-4 z-[100] bg-card/90 backdrop-blur-xl border border-border/50 shadow-[0_8px_32px_rgba(0,0,0,0.12)] lg:hidden rounded-2xl overflow-hidden">
      <div className="flex items-center justify-around h-16 px-2">
        {navItems.map(item => {
          const isActive = location.pathname === item.path;
          return (
            <Link
              key={item.path}
              to={item.path}
              className={`relative flex flex-col items-center justify-center gap-1 px-1 py-1 min-w-[50px] transition-all duration-300
                ${isActive ? "text-emerald-500 scale-110" : "text-muted-foreground hover:text-muted-foreground"}`}
            >
              <div className="relative">
                <item.icon size={isActive ? 22 : 20} strokeWidth={isActive ? 2.5 : 1.5} />
              </div>
              <span className={`text-[9px] tracking-tight ${isActive ? "font-bold" : "font-medium"}`}>{item.label}</span>
              {isActive && (
                <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 bg-emerald-500 rounded-full shadow-[0_0_10px_rgba(16,185,129,0.5)]" />
              )}
            </Link>
          );
        })}
      </div>
      <div className="h-[env(safe-area-inset-bottom)]" />
    </nav>
  );
};

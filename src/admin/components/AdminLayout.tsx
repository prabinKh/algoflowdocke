import { useState, useEffect } from "react";
import { Outlet, useLocation, useNavigate } from "react-router-dom";
import Sidebar from "./Sidebar";
import { MobileAdminBottomNav } from "./MobileAdminBottomNav";
import { chatService } from "@/api/chatService";
import { toast } from "sonner";
import { ModeToggle } from "@/components/ModeToggle";
import { Menu, User, Store, ChevronRight, Plus, MessageSquare, LogOut } from "lucide-react";
import { Link } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { getActiveTenantSlug, userMatchesActiveTenant } from "@/lib/tenant";

const AdminLayout = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { user, loading, logout } = useAuth();
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [unreadMessages, setUnreadMessages] = useState(0);

  useEffect(() => {
    if (!loading) {
      if (!user) {
        toast.error("Please login to access the admin dashboard");
        navigate("/signin");
      } else if (!user.is_admin && !user.is_staff && !user.is_superuser && !["superadmin", "company_admin", "staff"].includes(user.role)) {
        toast.error("You do not have admin privileges");
        navigate("/");
      } else if (!userMatchesActiveTenant(user)) {
        const tenant = getActiveTenantSlug();
        toast.error(
          user?.company
            ? `You are signed in to ${user.company.name}. Open ${user.company.slug}.localhost:3000/admin`
            : `You do not have access to ${tenant || "this"} store admin.`
        );
        logout();
        navigate("/signin");
      } else {
        setCheckingAuth(false);
      }
    }
  }, [user, loading, navigate, logout]);

  // Close sidebar on mobile when route changes
  useEffect(() => {
    setIsSidebarOpen(false);
  }, [location.pathname]);

  // Listen for unread messages
  useEffect(() => {
    if (!user) return;

    const fetchUnread = async () => {
      try {
        const sessions = await chatService.getSessions();
        const totalUnread = (Array.isArray(sessions) ? sessions : []).reduce((acc, session) => {
          if (session.status === "active") {
            return acc + (session.unreadAdminCount || 0);
          }
          return acc;
        }, 0);
        setUnreadMessages(totalUnread);
      } catch (error) {
        console.error("Error fetching unread messages:", error);
      }
    };

    fetchUnread();
    const interval = setInterval(fetchUnread, 10000); // Poll every 10 seconds
    return () => clearInterval(interval);
  }, [user]);

  const handleLogout = async () => {
    try {
      await logout();
      toast.success("Successfully logged out");
      navigate("/signin");
    } catch (error) {
      toast.error("Error logging out");
    }
  };

  if (loading || checkingAuth) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-muted-foreground font-medium animate-pulse">Verifying access...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex">
      <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />
      
      <div className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden">
        {/* Admin Header */}
        <header className="h-16 bg-card border-b border-border flex items-center justify-between px-4 sm:px-6 shrink-0 z-20">
          <div className="flex items-center gap-3 sm:gap-4">
            <button 
              onClick={() => setIsSidebarOpen(true)}
              className="lg:hidden p-2 hover:bg-accent rounded-xl transition-colors text-muted-foreground"
            >
              <Menu size={22} />
            </button>
            <div className="hidden sm:flex flex-col gap-0.5 text-xs sm:text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <Store size={16} className="text-emerald-500" />
                <ChevronRight size={14} className="opacity-40" />
                <span className="font-bold uppercase tracking-widest text-[10px] sm:text-xs">Admin Panel</span>
              </div>
              {user?.company?.name && (
                <span className="text-[10px] font-semibold text-primary pl-7">
                  {user.company.name} · {user.name}
                </span>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-4">
            <div className="flex items-center gap-1">
              <ModeToggle />
            </div>
            <Link
              to="/admin/messages"
              className="relative p-2 text-muted-foreground hover:bg-accent rounded-xl transition-colors"
            >
              <MessageSquare size={20} />
              {unreadMessages > 0 && (
                <span className="absolute top-1 right-1 w-4 h-4 bg-rose-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center border-2 border-card">
                  {unreadMessages > 9 ? "9+" : unreadMessages}
                </span>
              )}
            </Link>
            <Link
              to="/admin/products/add"
              className="flex items-center gap-2 px-3 sm:px-4 py-2 bg-emerald-500 text-white rounded-xl hover:bg-emerald-600 transition-all shadow-lg shadow-emerald-500/20 text-[10px] sm:text-xs font-bold uppercase tracking-wider"
            >
              <Plus size={16} />
              <span className="hidden xs:inline">Add Product</span>
            </Link>
            <div className="w-8 h-8 sm:w-10 sm:h-10 bg-accent rounded-xl flex items-center justify-center text-muted-foreground border border-border shadow-sm">
              <User size={18} />
            </div>
          </div>
        </header>
        
        <main className="flex-1 overflow-y-auto custom-scrollbar pb-24 lg:pb-0">
          <Outlet context={{ setIsSidebarOpen }} />
        </main>
        <MobileAdminBottomNav />
      </div>
    </div>
  );
};

export default AdminLayout;

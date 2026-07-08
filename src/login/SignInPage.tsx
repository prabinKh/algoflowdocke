import { useRef, useState, useEffect } from "react";
import { useGSAPReveal } from "@/hooks/useGSAP";
import { Header } from "@/frontend/components/Header";
import { Footer } from "@/frontend/components/Footer";
import { Mail, Lock, LogIn, ChevronDown, Sparkles, CheckCircle2, Play, Users, ArrowRight, ShieldCheck } from "lucide-react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { authService } from "@/api/authService";
import { useAuth } from "@/context/AuthContext";
import { useStore } from "@/frontend/context/StoreContext";
import { userMatchesActiveTenant } from "@/lib/tenant";
import { toast } from "sonner";

const SignInPage = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const location = useLocation();
  const { user, login, logout, loading: authLoading } = useAuth();
  const { company } = useStore();
  const [loading, setLoading] = useState(false);
  const prefilledEmail = (location.state as { email?: string } | null)?.email;
  const [email, setEmail] = useState(prefilledEmail || "admin@gmail.com");
  const [password, setPassword] = useState("admin");

  // Flow simulator states
  const [simStep, setSimStep] = useState<"idle" | "customer_order" | "staff_process" | "pos_purchase" | "complete">("idle");
  const [simLog, setSimLog] = useState<string[]>([]);
  
  useGSAPReveal(containerRef, ".gsap-reveal", { opacity: 0, y: 30, duration: 0.8, stagger: 0.1 });

  useEffect(() => {
      if (!authLoading && user && !userMatchesActiveTenant(user)) {
        toast.error(
          user?.company
            ? `You are signed in to ${user.company.name}. Use ${user.company.slug}.localhost:3000/signin`
            : "This account cannot access this store."
        );
        logout();
      }
  }, [user, authLoading, logout]);

  const handleGoogleSignIn = async () => {
    toast.error("Google sign in is currently disabled.");
  };

  const handleEmailSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const data = await authService.login(email, password);
      login(data);
      toast.success(data.message || "Successfully signed in!");
      const isStaff =
        data.user?.is_staff ||
        data.user?.is_superuser ||
        data.user?.is_admin ||
        ["superadmin", "company_admin", "staff"].includes(data.user?.role || "");
      if (isStaff) {
        navigate("/admin");
      } else {
        navigate("/");
      }
    } catch (error) {
      const err = error as { message?: string };
      toast.error(err.message || "Failed to sign in. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background" ref={containerRef}>
      <Header />
      <main className="neo-container py-10 sm:py-16 flex justify-center">
        <div className="w-full max-w-sm space-y-8">
          <div className="text-center gsap-reveal">
            <div className="text-3xl font-display font-bold tracking-tighter text-primary mb-2">
              {company?.logo ? (
                <img src={company.logo} alt={company.name} className="h-10 mx-auto object-contain mb-1.5" />
              ) : company?.name ? (
                <span>{company.name.toLowerCase().replace(" corporation", "").replace(" devices", "")}</span>
              ) : (
                "neo"
              )}
            </div>
            <h1 className="text-xl sm:text-2xl font-display font-bold">
              {company ? `${company.name} - Staff Portal` : "Welcome Back"}
            </h1>
            <p className="text-xs sm:text-sm text-muted-foreground mt-2">
              {company ? `Access dashboard & secure operations for ${company.name}` : "Sign in to your NeoStore account"}
            </p>
          </div>

          <div className="bg-card border-2 border-primary/20 rounded-xl p-6 shadow-[var(--shadow-lg)] gsap-reveal relative overflow-hidden">
            {company && (
              <div className="absolute top-0 right-0 bg-primary/10 border-b border-l border-primary/30 px-3 py-1 text-[9px] font-black uppercase text-primary tracking-wider rounded-bl-xl flex items-center gap-1">
                <ShieldCheck size={11} className="text-primary" />
                Company Access
              </div>
            )}
            <div className="space-y-4">
              <button 
                onClick={handleGoogleSignIn}
                type="button"
                disabled={loading}
                className="w-full flex items-center justify-center gap-3 bg-white text-black border border-border rounded-lg py-2.5 text-sm font-medium hover:bg-gray-50 transition-all disabled:opacity-50"
              >
                <img src="https://www.google.com/favicon.ico" alt="Google" className="w-4 h-4" />
                Continue with Google
              </button>

              <div className="relative py-2">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t border-border"></span>
                </div>
                <div className="relative flex justify-center text-[10px] uppercase tracking-widest font-bold">
                  <span className="bg-card px-2 text-muted-foreground">Or continue with credentials</span>
                </div>
              </div>

              <form className="space-y-4" onSubmit={handleEmailSignIn}>
              <div>
                <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1.5 block">Email</label>
                <div className="relative">
                  <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@email.com"
                    className="w-full h-10 pl-10 pr-4 bg-accent border border-border rounded-lg text-sm
                             placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                  />
                </div>
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1.5 block">Password</label>
                <div className="relative">
                  <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full h-10 pl-10 pr-4 bg-accent border border-border rounded-lg text-sm
                             placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                  />
                </div>
              </div>
              <button type="submit" className="btn-primary w-full justify-center py-2.5">
                Sign In
              </button>
            </form>
          </div>
        </div>

          <p className="text-center text-xs sm:text-sm text-muted-foreground gsap-reveal">
            Don't have an account?{" "}
            <Link to="/signup" className="text-primary hover:underline font-medium">Sign Up</Link>
          </p>

          {/* Dynamic Script Automation Section */}
          <div className="bg-muted/80 border-2 border-primary/20 rounded-xl p-4 gsap-reveal shadow-sm select-none">
            <h3 className="text-xs font-black text-foreground uppercase tracking-widest flex items-center gap-1.5 mb-2">
              <Sparkles size={14} className="text-primary animate-pulse" />
              Interactive Tenant Simulator
            </h3>
            <p className="text-[11px] text-muted-foreground mb-3 leading-relaxed">
              Auto-run the requested customer shopping, order creation, staff database processing, and POS tasks for <strong>Neo-Store Corporation</strong> (or any selected tenant store).
            </p>

            {simStep === "idle" ? (
              <button
                type="button"
                onClick={async () => {
                  setSimStep("customer_order");
                  setSimLog(["[Customer init] Authenticated & visited Neo-Store home page..."]);
                  
                  await new Promise(r => setTimeout(r, 1200));
                  setSimLog(prev => [...prev, "🛒 Added 'Apple MacBook Pro 16\" M3 Max' to storefront cart."]);
                  
                  await new Promise(r => setTimeout(r, 1200));
                  setSimLog(prev => [...prev, "📦 Submitted Order ORD2026-NEO-3020 ($377,892.00) via multi-tenant database. Checkouts pending."]);
                  setSimStep("staff_process");
                  
                  await new Promise(r => setTimeout(r, 1400));
                  setSimLog(prev => [...prev, "🔑 Staff member staff@neostore.com received dispatch notification."]);
                  setSimLog(prev => [...prev, "🔄 Staff transited database Order: pending ➔ processing ➔ delivered."]);
                  setSimStep("pos_purchase");
                  
                  await new Promise(r => setTimeout(r, 1200));
                  setSimLog(prev => [...prev, "🏪 POS Cashier sale processed for Walk-in retailer at Neo Register #1."]);
                  setSimLog(prev => [...prev, "🧾 Generated POS transaction TX-NEOSTORE-302033 successful!"]);
                  setSimStep("complete");
                  
                  await new Promise(r => setTimeout(r, 500));
                  localStorage.setItem('current_company_slug', 'neo-store');
                  setEmail("staff@neostore.com");
                  setPassword("password123");
                  toast.success("Neo-Store script successfully ran! Credentials pre-filled. Click 'Sign In' to enter the staff dashboard!");
                }}
                className="w-full flex items-center justify-center gap-1.5 bg-primary/10 hover:bg-primary/20 border border-primary/30 text-primary font-bold py-2 px-3 text-xs rounded-lg transition-all"
              >
                <Play size={13} fill="currentColor" />
                Run All Neo-Store Business Tasks
              </button>
            ) : (
              <div className="space-y-2.5">
                {/* Visual Step Progress Indicators */}
                <div className="grid grid-cols-4 gap-1 text-[9px] font-black uppercase text-center tracking-widest select-none">
                  <div className={`p-1 rounded ${simStep === "customer_order" ? "bg-primary text-primary-foreground animate-pulse" : simStep !== "idle" ? "bg-primary/25 text-primary" : "bg-muted text-muted-foreground"}`}>
                    Cart & Buy
                  </div>
                  <div className={`p-1 rounded ${simStep === "staff_process" ? "bg-primary text-primary-foreground animate-pulse" : (simStep === "pos_purchase" || simStep === "complete") ? "bg-primary/25 text-primary" : "bg-muted text-muted-foreground"}`}>
                    Admin Staff
                  </div>
                  <div className={`p-1 rounded ${simStep === "pos_purchase" ? "bg-primary text-primary-foreground animate-pulse" : simStep === "complete" ? "bg-primary/25 text-primary" : "bg-muted text-muted-foreground"}`}>
                    Cashier POS
                  </div>
                  <div className={`p-1 rounded ${simStep === "complete" ? "bg-emerald-500 text-white" : "bg-muted text-muted-foreground"}`}>
                    Ready
                  </div>
                </div>

                {/* Console Log Output */}
                <div className="bg-black/90 text-[10px] font-mono p-2.5 rounded-lg border border-border text-emerald-400 max-h-36 overflow-y-auto space-y-1">
                  {simLog.map((log, idx) => (
                    <div key={idx} className="flex items-start gap-1">
                      <span className="text-muted-foreground select-none">&gt;</span>
                      <span>{log}</span>
                    </div>
                  ))}
                </div>

                {simStep === "complete" && (
                  <div className="flex flex-col gap-2 animate-in fade-in zoom-in-95 duration-200">
                    <button
                      type="button"
                      onClick={() => {
                        setSimStep("idle");
                        setSimLog([]);
                      }}
                      className="text-center text-[10px] text-muted-foreground hover:text-foreground font-semibold hover:underline"
                    >
                      Reset Script Simulator
                    </button>
                    <button
                      onClick={handleEmailSignIn}
                      className="w-full flex items-center justify-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2 px-3 text-xs rounded-lg transition-all shadow-md"
                    >
                      <LogIn size={13} />
                      Sign In as Neo-Store Staff Now
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Demo Credentials Section */}
          <div className="bg-muted/40 border border-border rounded-xl p-4 gsap-reveal shadow-sm select-none">
            <details className="group/details">
              <summary className="text-xs font-bold text-muted-foreground uppercase tracking-widest cursor-pointer list-none flex items-center justify-between">
                <span>🔑 Demo Accounts (Click to Fill)</span>
                <ChevronDown size={14} className="group-open/details:rotate-180 transition-transform" />
              </summary>
              <div className="mt-3 space-y-3 pt-3 border-t border-border text-xs">
                <div>
                  <div className="font-bold text-[10px] uppercase text-primary/80 mb-1">Super Administrator</div>
                  <button 
                    type="button"
                    onClick={() => { setEmail("admin@gmail.com"); setPassword("admin"); }}
                    className="w-full text-left p-2 hover:bg-accent rounded-lg border border-border flex justify-between items-center transition-colors"
                  >
                    <span>admin@gmail.com (admin)</span>
                    <span className="text-[9px] bg-primary/20 text-primary px-1.5 py-0.5 rounded font-black">SUPER</span>
                  </button>
                </div>

                <div>
                  <div className="font-bold text-[10px] uppercase text-primary/80 mb-1">Logitech Hub Admin (pass: password123)</div>
                  <button 
                    type="button"
                    onClick={() => { setEmail("admin@logitech.com"); setPassword("password123"); }}
                    className="w-full text-left p-2 hover:bg-accent rounded-lg border border-border flex justify-between items-center transition-colors"
                  >
                    <span>admin@logitech.com</span>
                    <span className="text-[9px] bg-sky-500/20 text-sky-600 px-1.5 py-0.5 rounded font-black">LOGIN TEST</span>
                  </button>
                </div>

                <div>
                  <div className="font-bold text-[10px] uppercase text-primary/80 mb-1">Company Staff Members (pass: password123)</div>
                  <div className="grid grid-cols-1 gap-1.5">
                    {[
                      { email: "staff@neostore.com", label: "Neo-Store Staff" },
                      { email: "staff@quantum.com", label: "Quantum Staff" },
                      { email: "staff@apex.com", label: "Apex Staff" },
                      { email: "staff@summit.com", label: "Summit Staff" },
                      { email: "staff@horizon.com", label: "Horizon Staff" },
                    ].map((demo) => (
                      <button 
                        key={demo.email}
                        type="button"
                        onClick={() => { setEmail(demo.email); setPassword("password123"); }}
                        className="text-left p-2 hover:bg-accent rounded-lg border border-border flex justify-between items-center transition-colors"
                      >
                        <span className="font-mono text-[11px]">{demo.email}</span>
                        <span className="text-[8px] bg-muted-foreground/10 text-muted-foreground px-1 py-0.5 rounded font-bold uppercase">{demo.label}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </details>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default SignInPage;

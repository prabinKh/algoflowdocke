import { useRef, useState } from "react";
import { useGSAPReveal } from "@/hooks/useGSAP";
import { Header } from "@/frontend/components/Header";
import { Footer } from "@/frontend/components/Footer";
import { User, Mail, Lock, UserPlus } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { authService } from "@/api/authService";
import { useStore } from "@/frontend/context/StoreContext";
import { toast } from "sonner";

const SignUpPage = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const { company } = useStore();
  const [loading, setLoading] = useState(false);
  const [name, setName] = useState("");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  useGSAPReveal(containerRef, ".gsap-reveal", { opacity: 0, y: 30, duration: 0.8, stagger: 0.1 });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (password !== confirmPassword) {
      toast.error("Passwords do not match.");
      return;
    }

    if (password.length < 8) {
      toast.error("Password must be at least 8 characters.");
      return;
    }

    setLoading(true);
    try {
      const data = await authService.register({
        name: name.trim(),
        email: email.trim().toLowerCase(),
        username: username.trim() || undefined,
        password,
        password2: confirmPassword,
      });

      toast.success(data.message || "Account created! Please verify your email, then sign in.");
      navigate("/signin", { state: { email: email.trim().toLowerCase() } });
    } catch (error) {
      const err = error as { message?: string };
      toast.error(err.message || "Registration failed. Please try again.");
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
                <span>{company.name}</span>
              ) : (
                "FixItAll"
              )}
            </div>
            <h1 className="text-xl sm:text-2xl font-display font-bold">Create Account</h1>
            <p className="text-xs sm:text-sm text-muted-foreground mt-2">
              Join {company?.name || "FixItAll"} to shop, track orders, and more.
            </p>
          </div>

          <div className="bg-card border-2 border-primary/20 rounded-xl p-6 shadow-[var(--shadow-lg)] gsap-reveal">
            <form className="space-y-4" onSubmit={handleSubmit}>
              <div>
                <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1.5 block">
                  Full name
                </label>
                <div className="relative">
                  <User size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Your name"
                    required
                    minLength={2}
                    className="w-full h-10 pl-10 pr-4 bg-accent border border-border rounded-lg text-sm
                             placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1.5 block">
                  Username <span className="normal-case text-muted-foreground/70">(optional)</span>
                </label>
                <div className="relative">
                  <UserPlus size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="johndoe"
                    autoComplete="username"
                    className="w-full h-10 pl-10 pr-4 bg-accent border border-border rounded-lg text-sm
                             placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1.5 block">
                  Gmail / Email
                </label>
                <div className="relative">
                  <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@gmail.com"
                    required
                    autoComplete="email"
                    className="w-full h-10 pl-10 pr-4 bg-accent border border-border rounded-lg text-sm
                             placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1.5 block">
                  Password
                </label>
                <div className="relative">
                  <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="At least 8 characters"
                    required
                    minLength={8}
                    autoComplete="new-password"
                    className="w-full h-10 pl-10 pr-4 bg-accent border border-border rounded-lg text-sm
                             placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1.5 block">
                  Confirm password
                </label>
                <div className="relative">
                  <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Repeat your password"
                    required
                    minLength={8}
                    autoComplete="new-password"
                    className="w-full h-10 pl-10 pr-4 bg-accent border border-border rounded-lg text-sm
                             placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="btn-primary w-full justify-center py-2.5 disabled:opacity-50"
              >
                {loading ? "Creating account..." : "Sign Up"}
              </button>
            </form>
          </div>

          <p className="text-center text-xs sm:text-sm text-muted-foreground gsap-reveal">
            Already have an account?{" "}
            <Link to="/signin" className="text-primary hover:underline font-medium">
              Sign In
            </Link>
          </p>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default SignUpPage;

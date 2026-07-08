import { useRef, useState } from "react";
import { useGSAPReveal } from "@/hooks/useGSAP";
import { Header } from "@/frontend/components/Header";
import { Footer } from "@/frontend/components/Footer";
import { Mail, Lock, Building, Globe, Palette, Upload, ArrowRight } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import axiosInstance from "@/api/axiosConfig";
import { toast } from "sonner";

const CompanyRegistrationPage = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  
  const [formData, setFormData] = useState({
    name: "",
    slug: "",
    category: "Electronics & Technology",
    email: "",
    password: "",
    username: "", // Will be used for IP if needed, or just identifier
    logo: "https://images.unsplash.com/photo-1614850523296-d8c1af93d400?w=100&h=100&fit=crop",
    theme_color: "#3b82f6"
  });

  useGSAPReveal(containerRef, ".gsap-reveal", { opacity: 0, y: 30, duration: 0.8, stagger: 0.1 });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ 
      ...prev, 
      [name]: value,
      // Auto-generate slug from name
      slug: name === 'name' ? value.toLowerCase().replace(/ /g, '-') : prev.slug
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      // Use the identifier/username if provided, otherwise fallback to slug
      const finalData = {
        ...formData,
        username: formData.username || formData.slug
      };

      await axiosInstance.post("/account/companies/", finalData);
      toast.success("Company registered successfully! You can now sign in.");
      navigate("/signin");
    } catch (error: unknown) {
      console.error("Registration failed", error);
      const err = error as { response?: { data?: { message?: string } } };
      toast.error(err.response?.data?.message || "Failed to register company. Slug or Email might be taken.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background" ref={containerRef}>
      <Header />
      <main className="neo-container py-10 sm:py-16 flex justify-center">
        <div className="w-full max-w-2xl space-y-8">
          <div className="text-center gsap-reveal">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-[10px] font-bold uppercase tracking-widest mb-4">
              <Building size={12} />
              Vendor Onboarding
            </div>
            <h1 className="text-3xl sm:text-4xl font-display font-black tracking-tighter">Register Your Company</h1>
            <p className="text-sm text-muted-foreground mt-2 max-w-md mx-auto">
              Launch your own branded e-commerce storefront on Algoflow-e in minutes.
            </p>
          </div>

          <div className="bg-card border border-border rounded-2xl p-8 shadow-[var(--shadow-lg)] gsap-reveal relative overflow-hidden">
            {/* Decoration */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full -mr-16 -mt-16 blur-3xl" />
            
            <form className="space-y-6 relative" onSubmit={handleSubmit}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Basic Info */}
                <div className="space-y-4">
                  <h3 className="text-xs font-bold uppercase tracking-[0.2em] text-muted-foreground pb-2 border-b border-border">Business Details</h3>
                  
                  <div>
                    <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1.5 block">Company Name</label>
                    <div className="relative">
                      <Building size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                      <input
                        type="text"
                        name="name"
                        required
                        value={formData.name}
                        onChange={handleChange}
                        placeholder="e.g. Neo Electronics"
                        className="w-full h-11 pl-10 pr-4 bg-accent/50 border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1.5 block">Store URL Slug</label>
                    <div className="relative">
                      <Globe size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                      <input
                        type="text"
                        name="slug"
                        required
                        value={formData.slug}
                        onChange={handleChange}
                        placeholder="e.g. neo-store"
                        className="w-full h-11 pl-10 pr-4 bg-accent/50 border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                      />
                    </div>
                    <p className="text-[9px] text-muted-foreground mt-1 ml-1">Your store will be at /store/{formData.slug || '...'}</p>
                  </div>

                  <div>
                    <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1.5 block">Company Category</label>
                    <div className="relative">
                      <select
                        name="category"
                        required
                        value={formData.category}
                        onChange={handleChange}
                        className="w-full h-11 px-3 bg-accent/50 border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all cursor-pointer"
                      >
                        <option value="Electronics & Technology">🔌 Electronics & Technology</option>
                        <option value="Clothing & Fashion">👗 Clothing & Fashion</option>
                        <option value="Cosmetics & Beauty">💄 Cosmetics & Beauty</option>
                        <option value="Home, Furniture & Garden">🏡 Home, Furniture & Garden</option>
                        <option value="Grocery & Food">🛒 Grocery & Food</option>
                        <option value="Cafes & Coffee Shops">☕ Cafes & Coffee Shops</option>
                        <option value="Hotels & Lodging">🏨 Hotels & Lodging</option>
                        <option value="Pet Supplies">🐾 Pet Supplies</option>
                        <option value="Toys & Hobbies">🧸 Toys & Hobbies</option>
                        <option value="Sports & Outdoors">⚽ Sports & Outdoors</option>
                        <option value="Automotive & Motorcycle">🏎️ Automotive & Motorcycle</option>
                        <option value="Health & Wellness">🌿 Health & Wellness</option>
                        <option value="Baby & Maternity">👶 Baby & Maternity</option>
                        <option value="Office & School Supplies">📚 Office & School Supplies</option>
                        <option value="Jewelry & Watches">💎 Jewelry & Watches</option>
                        <option value="Books, Music & Media">🎵 Books, Music & Media</option>
                        <option value="Tools & Home Improvement">🛠️ Tools & Home Improvement</option>
                        <option value="Luggage & Travel Accessories">🧳 Luggage & Travel Accessories</option>
                        <option value="Pharmacy & Medical Supplies">💊 Pharmacy & Medical Supplies</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1.5 block">Internal ID / IP Mapping</label>
                    <div className="relative">
                      <Globe size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                      <input
                        type="text"
                        name="username"
                        value={formData.username}
                        onChange={handleChange}
                        placeholder="e.g. 127.0.0.10"
                        className="w-full h-11 pl-10 pr-4 bg-accent/50 border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                      />
                    </div>
                  </div>
                </div>

                {/* Branding & Auth */}
                <div className="space-y-4">
                  <h3 className="text-xs font-bold uppercase tracking-[0.2em] text-muted-foreground pb-2 border-b border-border">Branding & Security</h3>
                  
                  <div>
                    <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1.5 block">Admin Email</label>
                    <div className="relative">
                      <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                      <input
                        type="email"
                        name="email"
                        required
                        value={formData.email}
                        onChange={handleChange}
                        placeholder="admin@company.com"
                        className="w-full h-11 pl-10 pr-4 bg-accent/50 border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1.5 block">Admin Password</label>
                    <div className="relative">
                      <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                      <input
                        type="password"
                        name="password"
                        required
                        value={formData.password}
                        onChange={handleChange}
                        placeholder="••••••••"
                        className="w-full h-11 pl-10 pr-4 bg-accent/50 border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1.5 block">Theme Color</label>
                      <div className="relative flex items-center gap-2">
                        <input
                          type="color"
                          name="theme_color"
                          value={formData.theme_color}
                          onChange={handleChange}
                          className="w-10 h-10 rounded-lg cursor-pointer bg-transparent border-none"
                        />
                        <span className="text-[10px] font-mono text-muted-foreground uppercase">{formData.theme_color}</span>
                      </div>
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1.5 block">Logo URL</label>
                      <div className="relative">
                        <Upload size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                        <input
                          type="text"
                          name="logo"
                          value={formData.logo}
                          onChange={handleChange}
                          placeholder="https://..."
                          className="w-full h-11 pl-9 pr-4 bg-accent/50 border border-border rounded-xl text-[10px] focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="pt-4 flex flex-col items-center gap-4">
                <button 
                  type="submit" 
                  disabled={loading}
                  className="btn-primary w-full max-w-sm justify-center py-3.5 group"
                >
                  {loading ? "Registering..." : "Create My Storefront"}
                  {!loading && <ArrowRight size={18} className="ml-2 group-hover:translate-x-1 transition-transform" />}
                </button>
                
                <p className="text-center text-xs text-muted-foreground">
                  Already have a store?{" "}
                  <Link to="/signin" className="text-primary hover:underline font-bold">Sign In</Link>
                </p>
              </div>
            </form>
          </div>

          {/* Live Preview Card */}
          <div className="gsap-reveal bg-accent/30 border border-border rounded-2xl p-6 flex flex-col md:flex-row items-center gap-6">
            <div 
              className="w-16 h-16 rounded-2xl flex items-center justify-center text-white font-black text-2xl shadow-xl transition-all duration-500"
              style={{ backgroundColor: formData.theme_color }}
            >
              {formData.logo ? <img src={formData.logo} alt="Logo" className="w-full h-full object-cover rounded-2xl" /> : formData.name.charAt(0) || "A"}
            </div>
            <div className="text-center md:text-left">
              <h4 className="font-display font-bold text-xl">{formData.name || "Your Company Name"}</h4>
              <p className="text-xs text-muted-foreground">Preview of your brand identification on the platform</p>
              <div className="flex gap-2 mt-3 justify-center md:justify-start">
                <div className="px-3 py-1 bg-background border border-border rounded-full text-[10px] font-bold uppercase tracking-wider">
                  {formData.slug || "slug-preview"}
                </div>
                <div className="px-3 py-1 bg-background border border-border rounded-full text-[10px] font-bold uppercase tracking-wider">
                  {formData.theme_color}
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default CompanyRegistrationPage;

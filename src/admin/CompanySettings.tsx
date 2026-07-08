import React, { useState, useEffect } from "react";
import { useStore } from "@/frontend/context/StoreContext";
import { companyService } from "@/api/companyService";
import { toast } from "sonner";
import { 
  Palette, 
  Store, 
  Save, 
  RotateCcw,
  Layout,
  Type,
  ImageIcon,
  Globe,
  Mail,
  Phone,
  MapPin
} from "lucide-react";
import { motion } from "motion/react";

const CATEGORIES = [
  'Electronics & Technology',
  'Clothing & Fashion',
  'Cosmetics & Beauty',
  'Home, Furniture & Garden',
  'Grocery & Food',
  'Cafes & Coffee Shops',
  'Hotels & Lodging',
  'Pet Supplies',
  'Toys & Hobbies',
  'Sports & Outdoors',
  'Automotive & Motorcycle',
  'Health & Wellness',
  'Baby & Maternity',
  'Office & School Supplies',
  'Jewelry & Watches',
  'Books, Music & Media',
  'Tools & Home Improvement',
  'Luggage & Travel Accessories',
  'Pharmacy & Medical Supplies',
];

const INDUSTRY_PRESETS: Record<string, { primary: string, secondary: string }> = {
  'Electronics & Technology': { primary: '#6366f1', secondary: '#4f46e5' },
  'Clothing & Fashion': { primary: '#ec4899', secondary: '#db2777' },
  'Cosmetics & Beauty': { primary: '#f472b6', secondary: '#e879f9' },
  'Home, Furniture & Garden': { primary: '#10b981', secondary: '#059669' },
  'Grocery & Food': { primary: '#f59e0b', secondary: '#d97706' },
  'Cafes & Coffee Shops': { primary: '#78350f', secondary: '#92400e' },
  'Hotels & Lodging': { primary: '#3b82f6', secondary: '#2563eb' },
  'Pet Supplies': { primary: '#f97316', secondary: '#ea580c' },
  'Toys & Hobbies': { primary: '#ef4444', secondary: '#dc2626' },
  'Sports & Outdoors': { primary: '#06b6d4', secondary: '#0891b2' },
  'Automotive & Motorcycle': { primary: '#4b5563', secondary: '#1f2937' },
  'Health & Wellness': { primary: '#14b8a6', secondary: '#0d9488' },
  'Baby & Maternity': { primary: '#38bdf8', secondary: '#0ea5e9' },
  'Office & School Supplies': { primary: '#64748b', secondary: '#475569' },
  'Jewelry & Watches': { primary: '#fbbf24', secondary: '#f59e0b' },
  'Books, Music & Media': { primary: '#8b5cf6', secondary: '#7c3aed' },
  'Tools & Home Improvement': { primary: '#ea580c', secondary: '#c2410c' },
  'Luggage & Travel Accessories': { primary: '#a855f7', secondary: '#9333ea' },
  'Pharmacy & Medical Supplies': { primary: '#0ea5e9', secondary: '#0284c7' },
};

const CompanySettings: React.FC = () => {
  const { company } = useStore();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    category: "",
    description: "",
    theme_color: "#6366f1",
    theme_color_secondary: "#4f46e5",
    email: "",
    phone: "",
    address: "",
    website: "",
    logo: "",
    banner: ""
  });

  const applyPreset = (category: string) => {
    const preset = INDUSTRY_PRESETS[category];
    if (preset) {
      setFormData(prev => ({
        ...prev,
        category,
        theme_color: preset.primary,
        theme_color_secondary: preset.secondary
      }));
      toast.info(`Applied ${category} color theme`);
    } else {
      setFormData(prev => ({ ...prev, category }));
    }
  };

  useEffect(() => {
    if (company) {
      setFormData({
        name: company.name || "",
        category: company.category || "",
        description: company.description || "",
        theme_color: company.theme_color || "#6366f1",
        theme_color_secondary: company.theme_color_secondary || "#4f46e5",
        email: company.email || "",
        phone: company.phone || "",
        address: company.address || "",
        website: company.website || "",
        logo: company.logo || "",
        banner: company.banner || ""
      });
    }
  }, [company]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!company?.slug) return;

    setLoading(true);
    try {
      await companyService.update(company.slug, formData);
      toast.success("Company settings updated successfully!");
      // Reload page to apply new theme colors globally
      window.location.reload();
    } catch (error) {
      toast.error("Failed to update company settings");
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    if (company) {
      setFormData({
        name: company.name || "",
        category: company.category || "",
        description: company.description || "",
        theme_color: company.theme_color || "#6366f1",
        theme_color_secondary: company.theme_color_secondary || "#4f46e5",
        email: company.email || "",
        phone: company.phone || "",
        address: company.address || "",
        website: company.website || "",
        logo: company.logo || "",
        banner: company.banner || ""
      });
    }
  };

  return (
    <div className="p-4 sm:p-8 max-w-5xl mx-auto">
      <div className="mb-8 gsap-reveal">
        <h1 className="text-3xl font-black tracking-tight text-foreground flex items-center gap-3">
          <Store className="text-primary" size={32} />
          Company Branding & Settings
        </h1>
        <p className="text-muted-foreground mt-2">
          Customize your store's identity, visual theme, and business information.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Core Identity */}
        <section className="bg-card border border-border rounded-3xl p-6 shadow-sm gsap-reveal">
          <div className="flex items-center gap-3 mb-6 border-b border-border pb-4">
            <div className="w-8 h-8 rounded-lg bg-blue-500/10 text-blue-500 flex items-center justify-center">
              <Type size={18} />
            </div>
            <h2 className="text-lg font-bold">Core Identity</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Store Name</label>
              <input 
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
                className="w-full px-4 py-3 bg-accent/50 border border-border rounded-xl focus:ring-2 focus:ring-primary/20 outline-none"
                placeholder="Enter store name"
                required
              />
            </div>

            {/* Industry preset logic removed from UI, but category remains in state */}
            {/* Removed Business Type select per user request */}

            <div className="md:col-span-2 space-y-2">
              <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Store Description</label>
              <textarea 
                value={formData.description}
                onChange={(e) => setFormData({...formData, description: e.target.value})}
                className="w-full px-4 py-3 bg-accent/50 border border-border rounded-xl focus:ring-2 focus:ring-primary/20 outline-none min-h-[100px]"
                placeholder="Describe your business..."
              />
            </div>
          </div>
        </section>

        {/* Visual Theme */}
        <section className="bg-card border border-border rounded-3xl p-6 shadow-sm gsap-reveal">
          <div className="flex items-center gap-3 mb-6 border-b border-border pb-4">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-500 flex items-center justify-center">
              <Palette size={18} />
            </div>
            <h2 className="text-lg font-bold">Visual Branding</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Primary Theme Color</label>
                <div className="flex items-center gap-4">
                  <input 
                    type="color"
                    value={formData.theme_color}
                    onChange={(e) => setFormData({...formData, theme_color: e.target.value})}
                    className="w-12 h-12 rounded-xl cursor-pointer border-none p-0 overflow-hidden"
                  />
                  <input 
                    type="text"
                    value={formData.theme_color}
                    onChange={(e) => setFormData({...formData, theme_color: e.target.value})}
                    className="flex-1 px-4 py-3 bg-accent/50 border border-border rounded-xl font-mono text-sm"
                  />
                </div>
                <p className="text-[10px] text-muted-foreground italic">
                  This color will be used for buttons, links, and accented areas.
                </p>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Secondary Color</label>
                <div className="flex items-center gap-4">
                  <input 
                    type="color"
                    value={formData.theme_color_secondary}
                    onChange={(e) => setFormData({...formData, theme_color_secondary: e.target.value})}
                    className="w-12 h-12 rounded-xl cursor-pointer border-none p-0 overflow-hidden"
                  />
                  <input 
                    type="text"
                    value={formData.theme_color_secondary}
                    onChange={(e) => setFormData({...formData, theme_color_secondary: e.target.value})}
                    className="flex-1 px-4 py-3 bg-accent/50 border border-border rounded-xl font-mono text-sm"
                  />
                </div>
              </div>
            </div>

            {/* Theme Preview */}
            <div className="bg-accent/30 rounded-2xl p-6 border border-border flex flex-col justify-center gap-4 text-center">
              <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Theme Preview</p>
              <div className="space-y-3">
                <button 
                  type="button"
                  className="w-full py-3 rounded-xl font-bold transition-all shadow-lg"
                  style={{ backgroundColor: formData.theme_color, color: '#fff' }}
                >
                  Primary Action
                </button>
                <button 
                  type="button"
                  className="w-full py-3 rounded-xl font-bold border-2 transition-all"
                  style={{ borderColor: formData.theme_color_secondary, color: formData.theme_color_secondary }}
                >
                  Secondary Action
                </button>
              </div>
              <div className="flex justify-center gap-2">
                <div className="w-8 h-8 rounded-full shadow-inner" style={{ backgroundColor: formData.theme_color }} />
                <div className="w-8 h-8 rounded-full shadow-inner" style={{ backgroundColor: formData.theme_color_secondary }} />
              </div>
            </div>
          </div>
        </section>

        {/* Media & Assets */}
        <section className="bg-card border border-border rounded-3xl p-6 shadow-sm gsap-reveal">
          <div className="flex items-center gap-3 mb-6 border-b border-border pb-4">
            <div className="w-8 h-8 rounded-lg bg-amber-500/10 text-amber-500 flex items-center justify-center">
              <ImageIcon size={18} />
            </div>
            <h2 className="text-lg font-bold">Media Assets</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Logo URL</label>
              <input 
                type="url"
                value={formData.logo}
                onChange={(e) => setFormData({...formData, logo: e.target.value})}
                className="w-full px-4 py-3 bg-accent/50 border border-border rounded-xl focus:ring-2 focus:ring-primary/20 outline-none"
                placeholder="https://example.com/logo.png"
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Banner URL</label>
              <input 
                type="url"
                value={formData.banner}
                onChange={(e) => setFormData({...formData, banner: e.target.value})}
                className="w-full px-4 py-3 bg-accent/50 border border-border rounded-xl focus:ring-2 focus:ring-primary/20 outline-none"
                placeholder="https://example.com/banner.jpg"
              />
            </div>
          </div>
        </section>

        {/* Contact Info */}
        <section className="bg-card border border-border rounded-3xl p-6 shadow-sm gsap-reveal">
          <div className="flex items-center gap-3 mb-6 border-b border-border pb-4">
            <div className="w-8 h-8 rounded-lg bg-indigo-500/10 text-indigo-500 flex items-center justify-center">
              <Globe size={18} />
            </div>
            <h2 className="text-lg font-bold">Public Contact</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Support Email</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
                <input 
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                  className="w-full pl-10 pr-4 py-3 bg-accent/50 border border-border rounded-xl focus:ring-2 focus:ring-primary/20 outline-none"
                  placeholder="support@store.com"
                />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Contact Phone</label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
                <input 
                  type="text"
                  value={formData.phone}
                  onChange={(e) => setFormData({...formData, phone: e.target.value})}
                  className="w-full pl-10 pr-4 py-3 bg-accent/50 border border-border rounded-xl focus:ring-2 focus:ring-primary/20 outline-none"
                  placeholder="+977 123456789"
                />
              </div>
            </div>
            <div className="space-y-2 md:col-span-2">
              <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Store Website</label>
              <div className="relative">
                <Globe className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
                <input 
                  type="url"
                  value={formData.website}
                  onChange={(e) => setFormData({...formData, website: e.target.value})}
                  className="w-full pl-10 pr-4 py-3 bg-accent/50 border border-border rounded-xl focus:ring-2 focus:ring-primary/20 outline-none"
                  placeholder="https://yourstore.com"
                />
              </div>
            </div>
            <div className="space-y-2 md:col-span-2">
              <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Headquarters Address</label>
              <div className="relative">
                <MapPin className="absolute left-3 top-4 text-muted-foreground" size={16} />
                <textarea 
                  value={formData.address}
                  onChange={(e) => setFormData({...formData, address: e.target.value})}
                  className="w-full pl-10 pr-4 py-3 bg-accent/50 border border-border rounded-xl focus:ring-2 focus:ring-primary/20 outline-none min-h-[80px]"
                  placeholder="Street Address, City, Zip"
                />
              </div>
            </div>
          </div>
        </section>

        {/* Form Actions */}
        <div className="flex flex-col sm:flex-row items-center gap-4 pt-4 gsap-reveal">
          <button 
            type="submit"
            disabled={loading}
            className="w-full sm:w-auto px-8 py-4 bg-primary text-primary-foreground rounded-2xl font-bold flex items-center justify-center gap-2 shadow-lg shadow-primary/20 hover:scale-105 active:scale-95 transition-all disabled:opacity-50"
          >
            {loading ? (
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <Save size={20} />
            )}
            {loading ? "Saving Changes..." : "Save Company Branding"}
          </button>
          
          <button 
            type="button"
            onClick={handleReset}
            disabled={loading}
            className="w-full sm:w-auto px-8 py-4 bg-accent text-foreground rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-accent/80 transition-all active:scale-95 disabled:opacity-50"
          >
            <RotateCcw size={20} />
            Reset Defaults
          </button>
        </div>
      </form>
    </div>
  );
};

export default CompanySettings;

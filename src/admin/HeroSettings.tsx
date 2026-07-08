import { useState, useEffect } from "react";
import { toast } from "sonner";
import { Save, Upload, Loader2, Cpu, Plus, Trash2, GripVertical, ArrowRight } from "lucide-react";
import { motion, Reorder } from "motion/react";
import { heroService, type HeroContent } from "@/api/heroService";
import { uploadService } from "@/api/uploadService";

const defaultHero: HeroContent = {
  title: "Precision Tools for Modern Workflow",
  subtitle: "Powering performance, built for every ambition. Explore our curated collection of premium electronics.",
  description: "Powering performance, built for every ambition. Explore our curated collection of premium electronics.",
  image: "https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=800&h=600&fit=crop",
  link: "/shop",
  buttonText: "Explore Catalog",
  specs: [
    { label: "Processor", value: "Intel® Core™ i5" },
    { label: "RAM", value: "8 GB DDR5" },
    { label: "Storage", value: "512 GB SSD" }
  ]
};

const HeroSettings = () => {
  const [content, setContent] = useState<HeroContent>(defaultHero);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    const fetchHero = async () => {
      try {
        const data = await heroService.getSettings();
        if (data) {
          setContent(data);
        }
      } catch (error) {
        console.error("Failed to load hero settings:", error);
        toast.error("Failed to load hero settings");
      } finally {
        setLoading(false);
      }
    };
    fetchHero();
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      await heroService.updateSettings(content);
      toast.success("Hero settings updated successfully");
    } catch (error) {
      console.error("Failed to update hero settings:", error);
      toast.error("Failed to update hero settings");
    } finally {
      setSaving(false);
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const url = await uploadService.uploadImage(file, 'hero');
      setContent(prev => ({ ...prev, image: url }));
      toast.success("Image uploaded successfully");
    } catch (error) {
      console.error("Error uploading image:", error);
      toast.error("Failed to upload image");
    } finally {
      setUploading(false);
    }
  };

  const addSpec = () => {
    setContent(prev => ({
      ...prev,
      specs: [...prev.specs, { id: crypto.randomUUID(), label: "New Feature", value: "Value" }]
    }));
  };

  const removeSpec = (index: number) => {
    setContent(prev => ({
      ...prev,
      specs: prev.specs.filter((_, i) => i !== index)
    }));
  };

  const updateSpec = (index: number, field: keyof HeroSpec, value: string) => {
    setContent(prev => ({
      ...prev,
      specs: prev.specs.map((s, i) => i === index ? { ...s, [field]: value } : s)
    }));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8 p-4 sm:p-6 lg:p-8">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black tracking-tight">Hero Banner Settings</h1>
          <p className="text-sm text-muted-foreground">Customize the main banner on your home page</p>
        </div>
        <button
          onClick={handleSave}
          disabled={saving}
          className="btn-primary px-6 py-2.5 flex items-center gap-2 shadow-lg shadow-primary/20 w-full sm:w-auto"
        >
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save size={18} />}
          {saving ? "Saving..." : "Save Changes"}
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          {/* Text Content */}
          <div className="bg-card p-6 rounded-2xl border-2 border-border shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] dark:shadow-[4px_4px_0px_0px_rgba(255,255,255,0.1)] space-y-4">
            <h2 className="text-lg font-black flex items-center gap-2">
              <span className="w-2 h-6 bg-primary rounded-sm" />
              Main Messaging
            </h2>
            
            <div className="space-y-2">
              <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground">Main Headline</label>
              <input
                type="text"
                id="hero-title"
                value={content.title}
                onChange={e => setContent(prev => ({ ...prev, title: e.target.value }))}
                className="w-full px-4 py-3 rounded-xl border-2 border-border focus:border-primary outline-none transition-all font-display text-lg font-black bg-accent/20"
                placeholder="Enter main title"
              />
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground">Subtitle / Description</label>
              <textarea
                id="hero-subtitle"
                value={content.subtitle}
                onChange={e => setContent(prev => {
                  const val = e.target.value;
                  return { ...prev, subtitle: val, description: val };
                })}
                className="w-full px-4 py-3 rounded-xl border-2 border-border focus:border-primary outline-none transition-all min-h-[120px] resize-none text-sm leading-relaxed bg-accent/20"
                placeholder="Enter subtitle"
              />
            </div>
          </div>

          {/* Call to Action */}
          <div className="bg-card p-6 rounded-2xl border-2 border-border shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] dark:shadow-[4px_4px_0px_0px_rgba(255,255,255,0.1)] space-y-6">
            <h2 className="text-lg font-black flex items-center gap-2">
              <span className="w-2 h-6 bg-blue-500 rounded-sm" />
              Call to Action
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground">Button Text</label>
                <input
                  type="text"
                  id="hero-button-text"
                  value={content.buttonText || ""}
                  onChange={e => setContent(prev => ({ ...prev, buttonText: e.target.value }))}
                  className="w-full px-4 py-3 rounded-xl border-2 border-border focus:border-primary outline-none transition-all text-sm font-bold bg-accent/20"
                  placeholder="e.g. Explore Catalog"
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground">Button Link (Path)</label>
                <input
                  type="text"
                  id="hero-button-link"
                  value={content.link || ""}
                  onChange={e => setContent(prev => ({ ...prev, link: e.target.value }))}
                  className="w-full px-4 py-3 rounded-xl border-2 border-border focus:border-primary outline-none transition-all text-sm font-mono bg-accent/20"
                  placeholder="/category/all"
                />
              </div>
            </div>
          </div>

          {/* Specifications - FIXED VERSION */}
          <div className="bg-card p-6 rounded-2xl border-2 border-border shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] dark:shadow-[4px_4px_0px_0px_rgba(255,255,255,0.1)] space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-black flex items-center gap-2">
                <span className="w-2 h-6 bg-emerald-500 rounded-sm" />
                Technical Features
              </h2>
              <button
                onClick={addSpec}
                id="add-spec-btn"
                className="flex items-center gap-1.5 text-xs font-bold text-white bg-emerald-600 px-4 py-2 rounded-xl hover:bg-emerald-700 transition-all active:scale-95 shadow-lg shadow-emerald-500/20"
              >
                <Plus size={14} />
                Add Feature
              </button>
            </div>

            <Reorder.Group axis="y" values={content.specs || []} onReorder={(newSpecs) => setContent(prev => ({ ...prev, specs: newSpecs }))} className="space-y-3">
              {(content.specs || []).map((spec, index) => (
                <Reorder.Item
                  key={spec.id || index}
                  value={spec}
                  className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 p-4 bg-accent/10 rounded-xl border-2 border-border group"
                >
                  <div className="flex items-center justify-center sm:justify-start cursor-grab active:cursor-grabbing text-muted-foreground/50 hover:text-muted-foreground">
                    <GripVertical size={18} />
                  </div>
                  
                  <div className="flex-1 flex flex-col sm:flex-row gap-3">
                    {/* Label Input - FIXED: Text wraps properly */}
                    <div className="flex-1 min-w-0">
                      <input
                        type="text"
                        id={`spec-label-${index}`}
                        value={spec.label}
                        onChange={e => updateSpec(index, 'label', e.target.value)}
                        className="w-full px-3 py-2 rounded-lg border-2 border-border text-[10px] font-bold uppercase tracking-widest outline-none focus:border-primary bg-background shadow-sm break-words whitespace-normal"
                        placeholder="Label (e.g. RAM)"
                      />
                    </div>
                    
                    {/* Value Input - FIXED: Text wraps properly */}
                    <div className="flex-1 min-w-0">
                      <input
                        type="text"
                        id={`spec-value-${index}`}
                        value={spec.value}
                        onChange={e => updateSpec(index, 'value', e.target.value)}
                        className="w-full px-3 py-2 rounded-lg border-2 border-border text-xs font-medium outline-none focus:border-primary bg-background shadow-sm break-words whitespace-normal"
                        placeholder="Value (e.g. 16 GB)"
                      />
                    </div>
                  </div>
                  
                  <button
                    onClick={() => removeSpec(index)}
                    className="p-2 text-muted-foreground hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-all self-end sm:self-center"
                  >
                    <Trash2 size={16} />
                  </button>
                </Reorder.Item>
              ))}
            </Reorder.Group>
            
            {(!content.specs || content.specs.length === 0) && (
              <div className="text-center py-12 border-2 border-dashed border-border rounded-2xl bg-accent/5">
                <p className="text-sm font-medium text-muted-foreground">No features added. Highlight your product's best specs here.</p>
              </div>
            )}
          </div>
        </div>

        <div className="space-y-6">
          {/* Image Upload */}
          <div className="bg-card p-6 rounded-2xl border-2 border-border shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] dark:shadow-[4px_4px_0px_0px_rgba(255,255,255,0.1)] space-y-4">
            <h2 className="text-lg font-black flex items-center gap-2">
              <span className="w-2 h-6 bg-amber-500 rounded-sm" />
              Dynamic Image
            </h2>
            
            <div className="relative aspect-square rounded-xl overflow-hidden bg-accent/30 border-2 border-dashed border-border group cursor-pointer hover:border-amber-500/50 transition-colors">
              {content.image ? (
                <img src={content.image} alt="Hero preview" className="w-full h-full object-contain p-4" />
              ) : (
                <div className="absolute inset-0 flex flex-col items-center justify-center text-muted-foreground">
                  <Upload size={32} strokeWidth={1} />
                  <span className="text-[10px] font-bold uppercase tracking-widest mt-2">No image selected</span>
                </div>
              )}
              
              <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                <label className="cursor-pointer bg-card text-foreground px-5 py-2.5 rounded-xl text-xs font-bold shadow-xl hover:scale-105 transition-transform flex items-center gap-2 border-2 border-border">
                  <Upload size={14} />
                  {uploading ? "Uploading..." : "Upload New Image"}
                  <input type="file" className="hidden" onChange={handleImageUpload} accept="image/*" disabled={uploading} />
                </label>
              </div>
              
              {uploading && (
                <div className="absolute inset-0 bg-card/80 backdrop-blur-sm flex items-center justify-center">
                  <Loader2 className="w-6 h-6 animate-spin text-primary" />
                </div>
              )}
            </div>
            <p className="text-[10px] text-muted-foreground text-center">Recommended: 800x600px or larger with transparent background</p>
          </div>

          {/* Preview Card */}
          <div className="bg-gray-900 p-6 rounded-2xl border-2 border-white/20 shadow-2xl space-y-4 overflow-hidden relative">
            <div className="absolute top-0 right-0 p-3">
              <span className="px-2 py-0.5 bg-primary/20 text-primary-foreground rounded text-[8px] font-bold uppercase tracking-widest">Live View</span>
            </div>
            <div className="space-y-4 pt-2">
              <h3 className="text-white font-display font-black text-xl leading-tight tracking-tighter">{content.title}</h3>
              <p className="text-white/50 text-xs line-clamp-2 leading-relaxed">{content.subtitle}</p>
              <div className="flex flex-wrap gap-2">
                {(content.specs || []).slice(0, 3).map((spec, i) => (
                  <div key={i} className="px-2.5 py-1 bg-white/5 border border-white/10 rounded text-[8px] text-white/70 font-bold uppercase tracking-widest truncate max-w-[120px]">
                    {spec.value}
                  </div>
                ))}
              </div>
              <div className="pt-2">
                <div className="px-4 py-2 bg-primary text-primary-foreground rounded-lg inline-flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest">
                  {content.buttonText || "Explore Catalog"}
                  <ArrowRight size={12} />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HeroSettings;
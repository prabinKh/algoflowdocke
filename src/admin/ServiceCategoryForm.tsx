import { useState, useEffect } from "react";
import { 
  ArrowLeft, 
  Save, 
  Plus, 
  Trash2, 
  Upload, 
  Image as ImageIcon,
  Loader2,
  Package,
  Wrench,
  CheckCircle2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";
import { motion } from "motion/react";
import { useNavigate, useParams, Link } from "react-router-dom";
import axiosInstance from "@/api/axiosConfig";
import { ServiceCategory, ServiceBrand } from "@/types/repair";

interface ApiError {
  response?: {
    data?: {
      detail?: string | object;
      error?: string;
    };
  };
  message?: string;
}

const ServiceCategoryForm = () => {
  const { id } = useParams();
  const isEdit = !!id;
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const [category, setCategory] = useState<Partial<ServiceCategory>>({
    name: "",
    description: "",
    logo_url: "",
    is_active: true,
    order: 0,
    brands: []
  });

  const [newBrand, setNewBrand] = useState<Partial<ServiceBrand>>({
    name: "",
    logo_url: "",
    is_popular: false
  });

  useEffect(() => {
    if (isEdit) {
      fetchCategory();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, isEdit]);

  const fetchCategory = async () => {
    try {
      setLoading(true);
      const response = await axiosInstance.get(`/admin/service-categories/${id}/`);
      setCategory(response.data);
    } catch (error) {
      toast.error("Failed to fetch category");
      navigate("/admin/service-categories");
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async (file: File, type: 'category' | 'brand', brandId?: string) => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('path', type === 'category' ? 'service/categories' : 'service/brands');

    try {
      const response = await axiosInstance.post('/admin/upload/', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      
      if (type === 'category') {
        setCategory(prev => ({ ...prev, logo_url: response.data.url }));
      } else {
        setNewBrand(prev => ({ ...prev, logo_url: response.data.url }));
      }
      toast.success("Image uploaded successfully");
    } catch (error) {
      toast.error("Failed to upload image");
    }
  };

  const addBrand = async () => {
    if (!newBrand.name) {
      toast.error("Brand name is required");
      return;
    }

    if (!isEdit) {
      // For new category, just add to local state
      setCategory(prev => ({
        ...prev,
        brands: [...(prev.brands || []), { ...newBrand, id: 'temp-' + Date.now() } as ServiceBrand]
      }));
      setNewBrand({ name: "", logo_url: "", is_popular: false });
      return;
    }

    try {
      const response = await axiosInstance.post('/admin/service-brands/', {
        ...newBrand,
        category: id
      });
      setCategory(prev => ({
        ...prev,
        brands: [...(prev.brands || []), response.data]
      }));
      setNewBrand({ name: "", logo_url: "", is_popular: false });
      toast.success("Brand added successfully");
    } catch (error) {
      toast.error("Failed to add brand");
    }
  };

  const deleteBrand = async (brandId: string) => {
    if (brandId.startsWith('temp-')) {
      setCategory(prev => ({
        ...prev,
        brands: prev.brands?.filter(b => b.id !== brandId)
      }));
      return;
    }

    try {
      await axiosInstance.delete(`/admin/service-brands/${brandId}/`);
      setCategory(prev => ({
        ...prev,
        brands: prev.brands?.filter(b => b.id !== brandId)
      }));
      toast.success("Brand deleted successfully");
    } catch (error) {
      toast.error("Failed to delete brand");
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!category.name) {
      toast.error("Category name is required");
      return;
    }

    try {
      setSaving(true);
      if (isEdit) {
        await axiosInstance.put(`/admin/service-categories/${id}/`, category);
        toast.success("Category updated successfully");
      } else {
        const response = await axiosInstance.post('/admin/service-categories/', category);
        
        // Handle brand creation for new category
        if (category.brands && category.brands.length > 0) {
           for (const b of category.brands) {
             const { id: _, ...brandData } = b; // Strip temp- ID
             await axiosInstance.post('/admin/service-brands/', {
               ...brandData,
               category: response.data.id
             });
           }
        }
        
        toast.success("Category created successfully");
        navigate("/admin/service-categories");
      }
    } catch (error: unknown) {
      console.error("Save error:", error);
      
      const err = error as ApiError;
      let message = "Failed to save category";
      const detail = err.response?.data?.detail;
      message = typeof detail === 'string' ? detail : 
                (typeof detail === 'object' ? JSON.stringify(detail) : 
                (err.response?.data?.error || "Failed to save category"));
      toast.error(message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="h-[60vh] flex items-center justify-center">
        <Loader2 className="w-10 h-10 animate-spin text-emerald-500" />
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto p-6 space-y-8">
      <div className="flex items-center justify-between">
        <Link to="/admin/service-categories">
          <Button variant="ghost" className="rounded-xl">
            <ArrowLeft size={18} className="mr-2" />
            Back to Categories
          </Button>
        </Link>
        <Button 
          onClick={handleSave} 
          disabled={saving}
          className="bg-emerald-500 hover:bg-emerald-600 text-white font-bold rounded-xl shadow-lg shadow-emerald-500/20 px-8"
        >
          {saving ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : <Save size={18} className="mr-2" />}
          {isEdit ? "Update Category" : "Save Category"}
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          {/* Main Category Info */}
          <section className="bg-card border border-border rounded-3xl p-8 space-y-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 bg-emerald-500/10 rounded-xl flex items-center justify-center">
                <Package className="text-emerald-500" size={20} />
              </div>
              <h2 className="text-xl font-bold tracking-tight uppercase">Category <span className="text-emerald-500">Details</span></h2>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-xs font-black uppercase text-muted-foreground ml-1">Category Name</Label>
                  <Input 
                    placeholder="e.g. Mobile Phones, Laptops" 
                    value={category.name}
                    onChange={(e) => setCategory(prev => ({ ...prev, name: e.target.value }))}
                    className="h-12 bg-muted/30 border-none rounded-xl"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs font-black uppercase text-muted-foreground ml-1">Sort Order</Label>
                  <Input 
                    type="number"
                    value={category.order}
                    onChange={(e) => setCategory(prev => ({ ...prev, order: parseInt(e.target.value) }))}
                    className="h-12 bg-muted/30 border-none rounded-xl"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-xs font-black uppercase text-muted-foreground ml-1">Description</Label>
                <Textarea 
                  placeholder="Tell us about the services in this category..." 
                  value={category.description}
                  onChange={(e) => setCategory(prev => ({ ...prev, description: e.target.value }))}
                  className="min-h-[120px] bg-muted/30 border-none rounded-2xl resize-none"
                />
              </div>

              <div className="flex items-center justify-between p-4 bg-muted/30 rounded-2xl">
                <div className="space-y-0.5">
                  <Label className="text-sm font-bold">Category Active</Label>
                  <p className="text-xs text-muted-foreground">Visible to customers in service center</p>
                </div>
                <Switch 
                  checked={category.is_active}
                  onCheckedChange={(checked) => setCategory(prev => ({ ...prev, is_active: checked }))}
                />
              </div>
            </div>
          </section>

          {/* Brands Management */}
          <section className="bg-card border border-border rounded-3xl p-8 space-y-6">
            <div className="flex items-center justify-between">
               <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-emerald-500/10 rounded-xl flex items-center justify-center">
                  <Wrench className="text-emerald-500" size={20} />
                </div>
                <h2 className="text-xl font-bold tracking-tight uppercase">Brand <span className="text-emerald-500">Management</span></h2>
              </div>
              <Badge variant="outline" className="rounded-full bg-emerald-500/5 border-emerald-500/10 text-emerald-600 font-bold">
                {category.brands?.length || 0} Brands Loaded
              </Badge>
            </div>

            {/* Brand Add Form */}
            <div className="p-6 bg-muted/30 rounded-3xl space-y-4 border border-dashed border-border">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-xs font-black uppercase text-muted-foreground ml-1">New Brand Name</Label>
                  <Input 
                    placeholder="e.g. Apple, Samsung" 
                    value={newBrand.name}
                    onChange={(e) => setNewBrand(prev => ({ ...prev, name: e.target.value }))}
                    className="h-10 bg-card border-none rounded-lg"
                  />
                </div>
                <div className="flex items-end gap-3 pb-0.5">
                   <div className="flex items-center gap-2 mb-2 mr-4">
                    <Switch 
                      checked={newBrand.is_popular}
                      onCheckedChange={(checked) => setNewBrand(prev => ({ ...prev, is_popular: checked }))}
                    />
                    <Label className="text-xs font-bold whitespace-nowrap">Popular Brand</Label>
                   </div>
                   <Button onClick={addBrand} className="flex-1 rounded-xl bg-foreground text-background hover:bg-foreground/90 font-bold">
                     <Plus size={16} className="mr-1" /> Add Brand
                   </Button>
                </div>
              </div>
              <div className="flex items-center gap-4">
                 <Label className="relative group cursor-pointer">
                    <input 
                      type="file" 
                      className="hidden" 
                      accept="image/*"
                      onChange={(e) => e.target.files?.[0] && handleFileUpload(e.target.files[0], 'brand')}
                    />
                    <div className="flex items-center gap-2 px-4 py-2 bg-card rounded-lg border border-border group-hover:border-emerald-500 transition-colors">
                      <ImageIcon size={14} className="text-muted-foreground group-hover:text-emerald-500" />
                      <span className="text-[10px] font-black uppercase tracking-wider">
                        {newBrand.logo_url ? "Change Brand Logo" : "Upload Brand Logo"}
                      </span>
                      {newBrand.logo_url && <CheckCircle2 size={12} className="text-emerald-500" />}
                    </div>
                 </Label>
              </div>
            </div>

            {/* Brands List */}
            <div className="space-y-3 pt-2">
              {category.brands?.length === 0 && (
                <div className="text-center py-10 text-muted-foreground text-sm font-medium">
                  No brands added yet. Brands allow users to select specific manufacturers.
                </div>
              )}
              {category.brands?.map((brand) => (
                <div 
                  key={brand.id}
                  className="flex items-center justify-between p-4 bg-muted/20 border border-border/50 rounded-2xl hover:border-emerald-500/30 transition-all group"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-card rounded-xl border border-border flex items-center justify-center overflow-hidden">
                      {brand.logo_url ? (
                        <img src={brand.logo_url} alt={brand.name} className="w-full h-full object-contain p-1" />
                      ) : (
                        <span className="text-lg font-black text-emerald-500">{brand.name[0]}</span>
                      )}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-black tracking-tight">{brand.name}</span>
                        {brand.is_popular && <Badge className="text-[8px] h-4 bg-emerald-500">POPULAR</Badge>}
                      </div>
                      <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold">Supported Model Management Link</p>
                    </div>
                  </div>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    onClick={() => deleteBrand(brand.id)}
                    className="text-muted-foreground hover:text-rose-500 hover:bg-rose-500/10 rounded-full"
                  >
                    <Trash2 size={16} />
                  </Button>
                </div>
              ))}
            </div>
          </section>
        </div>

        <div className="space-y-8">
           {/* Logo Upload Card */}
           <section className="bg-card border border-border rounded-3xl p-8 space-y-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-emerald-500/10 rounded-xl flex items-center justify-center">
                  <ImageIcon className="text-emerald-500" size={20} />
                </div>
                <h2 className="text-xl font-bold tracking-tight uppercase">Category <span className="text-emerald-500">Logo</span></h2>
              </div>

              <div className="space-y-6">
                <div className="aspect-square bg-muted/30 rounded-3xl border-2 border-dashed border-border flex flex-col items-center justify-center overflow-hidden group hover:border-emerald-500/50 transition-colors relative">
                  {category.logo_url ? (
                    <img src={category.logo_url} alt="Logo" className="w-full h-full object-contain p-8 animate-in fade-in zoom-in duration-500" />
                  ) : (
                    <div className="text-center p-6">
                      <div className="w-16 h-16 bg-card rounded-2xl flex items-center justify-center mx-auto mb-4 text-muted-foreground group-hover:text-emerald-500 shadow-sm transition-colors">
                        <Upload size={32} />
                      </div>
                      <p className="text-sm font-bold text-muted-foreground">Upload SVG or PNG</p>
                      <p className="text-[10px] text-muted-foreground uppercase tracking-wider mt-1">Recommended 512x512</p>
                    </div>
                  )}
                  <input 
                    type="file" 
                    className="absolute inset-0 opacity-0 cursor-pointer" 
                    accept="image/*"
                    onChange={(e) => e.target.files?.[0] && handleFileUpload(e.target.files[0], 'category')}
                  />
                </div>

                {category.logo_url && (
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase text-muted-foreground ml-1">Logo URL</Label>
                    <Input 
                      value={category.logo_url}
                      onChange={(e) => setCategory(prev => ({ ...prev, logo_url: e.target.value }))}
                      className="text-xs bg-muted/30 border-none rounded-lg"
                    />
                  </div>
                )}
              </div>
           </section>

           {/* Tips / Info Card */}
           <Card className="bg-emerald-500 rounded-3xl p-8 border-none text-white overflow-hidden relative group">
              <div className="absolute top-0 right-0 -translate-y-4 translate-x-4 opacity-10 group-hover:scale-125 transition-transform duration-700">
                <Wrench size={160} />
              </div>
              <h3 className="text-xl font-black italic tracking-tighter mb-4 flex items-center gap-2 relative z-10">
                PRO-TIP <div className="w-1.5 h-1.5 bg-white rounded-full animate-ping" />
              </h3>
              <ul className="space-y-4 text-emerald-50 relative z-10">
                <li className="text-sm font-medium leading-relaxed">
                  <span className="font-black text-white block uppercase text-[10px] tracking-widest mb-1">Categorization</span>
                  Logical categories help users find the right repair service faster.
                </li>
                <li className="text-sm font-medium leading-relaxed">
                  <span className="font-black text-white block uppercase text-[10px] tracking-widest mb-1">Visuals</span>
                  Categories with high-quality icons or logos convert 40% better.
                </li>
              </ul>
           </Card>
        </div>
      </div>
    </div>
  );
};

export default ServiceCategoryForm;

import { useState, useEffect, useRef } from "react";
import { Link, useNavigate, useOutletContext } from "react-router-dom";

import { type Category as BaseCategory } from "@/lib/types";
import { ChevronLeft, Plus, Trash2, Settings, Filter, Menu, LayoutGrid, Tag, Info, Layers, Briefcase, Edit3, Save, X } from "lucide-react";
import { toast } from "sonner";
import { useGSAPReveal } from "@/hooks/useGSAP";
import { motion, AnimatePresence } from "motion/react";
import { categoryService } from "@/api/categoryService";

interface CategoryFeature {
  id: string;
  categoryName: string;
  categorySlug: string;
  features: string[];
}

interface Category extends BaseCategory {
  id?: string;
  description?: string;
  updatedAt?: string;
}

const CategoryFeatures = () => {
  const { setIsSidebarOpen } = useOutletContext<{ setIsSidebarOpen: (open: boolean) => void }>();
  const containerRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [categoryFeatures, setCategoryFeatures] = useState<CategoryFeature[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategorySlug, setSelectedCategorySlug] = useState<string | null>(null);
  
  // Derived selected category
  const selectedCategory = categories.find(c => c.slug === selectedCategorySlug) || null;
  
  // Form States
  const [isAddingCategory, setIsAddingCategory] = useState(false);
  const [isEditingCategory, setIsEditingCategory] = useState(false);
  const [catName, setCatName] = useState("");
  const [catSlug, setCatSlug] = useState("");
  const [catIcon, setCatIcon] = useState("📦");
  const [catDesc, setCatDesc] = useState("");
  
  const [newFeature, setNewFeature] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState<"features" | "subcategories" | "brands" | "sections">("features");

  // Subcategory States
  const [newSubName, setNewSubName] = useState("");
  const [newSubSlug, setNewSubSlug] = useState("");
  const [editingSubIndex, setEditingSubIndex] = useState<number | null>(null);

  // Brand States
  const [newBrand, setNewBrand] = useState("");
  const [editingBrandIndex, setEditingBrandIndex] = useState<number | null>(null);

  // Section States
  const [newSectionTitle, setNewSectionTitle] = useState("");
  const [editingSectionIndex, setEditingSectionIndex] = useState<number | null>(null);
  const [newSectionItemName, setNewSectionItemName] = useState("");
  const [newSectionItemSlug, setNewSectionItemSlug] = useState("");

  useGSAPReveal(containerRef, ".gsap-reveal", { opacity: 0, y: 20, duration: 0.6, stagger: 0.05 });

  useEffect(() => {
    const fetchData = async () => {
      try {
        const features = await categoryService.getAllFeatures();
        setCategoryFeatures(features as CategoryFeature[]);

        const dynamicCategories = await categoryService.getAll();
        setCategories(dynamicCategories as Category[]);
      } catch (error) {
        console.error("Error fetching category data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, []);

  const handleAddCategory = async () => {
    if (!catName.trim() || !catSlug.trim()) {
      toast.error("Name and Slug are required");
      return;
    }

    try {
      await categoryService.create({
        name: catName,
        slug: catSlug,
        icon: catIcon,
        description: catDesc,
        subcategories: [],
        brands: [],
        sections: []
      });
      toast.success("Category added successfully");
      resetCatForm();
    } catch (error) {
      toast.error("Failed to add category");
    }
  };

  const handleUpdateCategory = async () => {
    if (!selectedCategory || !catName.trim()) return;

    try {
      await categoryService.update(selectedCategory.slug, {
        name: catName,
        icon: catIcon,
        description: catDesc
      });
      toast.success("Category updated successfully");
      setIsEditingCategory(false);
    } catch (error) {
      toast.error("Failed to update category");
    }
  };

  const handleDeleteCategory = async (slug: string) => {
    if (!window.confirm("Are you sure you want to delete this category? This will not delete products but will remove category settings.")) return;

    try {
      await categoryService.delete(slug);
      await categoryService.deleteFeatures(slug);
      toast.success("Category deleted");
      if (selectedCategorySlug === slug) setSelectedCategorySlug(null);
    } catch (error) {
      toast.error("Failed to delete category");
    }
  };

  // Feature Handlers
  const handleAddFeature = async () => {
    if (!selectedCategory || !newFeature.trim()) {
      toast.error("Please enter a feature name");
      return;
    }

    const existing = categoryFeatures.find(cf => cf.categorySlug === selectedCategory.slug);
    const updatedFeatures = existing 
      ? [...new Set([...(existing.features || []), newFeature.trim()])]
      : [newFeature.trim()];

    try {
      await categoryService.updateFeatures(selectedCategory.slug, {
        categoryName: selectedCategory.name,
        categorySlug: selectedCategory.slug,
        features: updatedFeatures
      });
      setNewFeature("");
      toast.success("Feature added");
    } catch (error) {
      toast.error("Failed to add feature");
    }
  };

  const handleRemoveFeature = async (categorySlug: string, featureToRemove: string) => {
    const existing = categoryFeatures.find(cf => cf.categorySlug === categorySlug);
    if (!existing) return;

    const updatedFeatures = (existing.features || []).filter(f => f !== featureToRemove);

    try {
      if (updatedFeatures.length === 0) {
        await categoryService.deleteFeatures(categorySlug);
      } else {
        await categoryService.updateFeatures(categorySlug, {
          features: updatedFeatures
        });
      }
      toast.success("Feature removed");
    } catch (error) {
      toast.error("Failed to remove feature");
    }
  };

  // Subcategory Handlers
  const handleAddSubcategory = async () => {
    if (!selectedCategory || !newSubName.trim() || !newSubSlug.trim()) {
      toast.error("Subcategory name and slug are required");
      return;
    }

    const updatedSubcategories = [...(selectedCategory.subcategories || []), { name: newSubName.trim(), slug: newSubSlug.trim() }];

    try {
      await categoryService.update(selectedCategory.slug, {
        subcategories: updatedSubcategories
      });
      
      setNewSubName("");
      setNewSubSlug("");
      toast.success("Subcategory added");
    } catch (error) {
      toast.error("Failed to add subcategory");
    }
  };

  const handleRemoveSubcategory = async (index: number) => {
    if (!selectedCategory) return;
    const updatedSubcategories = (selectedCategory.subcategories || []).filter((_, i) => i !== index);

    try {
      await categoryService.update(selectedCategory.slug, {
        subcategories: updatedSubcategories
      });
      
      toast.success("Subcategory removed");
    } catch (error) {
      toast.error("Failed to remove subcategory");
    }
  };

  const handleUpdateSubcategory = async (index: number, name: string, slug: string) => {
    if (!selectedCategory) return;
    const updatedSubcategories = [...(selectedCategory.subcategories || [])];
    updatedSubcategories[index] = { name, slug };

    try {
      await categoryService.update(selectedCategory.slug, {
        subcategories: updatedSubcategories
      });
      
      setEditingSubIndex(null);
      toast.success("Subcategory updated");
    } catch (error) {
      toast.error("Failed to update subcategory");
    }
  };

  // Brand Handlers
  const handleAddBrand = async () => {
    if (!selectedCategory || !newBrand.trim()) {
      toast.error("Brand name is required");
      return;
    }

    const updatedBrands = [...new Set([...(selectedCategory.brands || []), newBrand.trim()])];

    try {
      await categoryService.update(selectedCategory.slug, {
        brands: updatedBrands
      });
      
      setNewBrand("");
      toast.success("Brand added");
    } catch (error) {
      toast.error("Failed to add brand");
    }
  };

  const handleRemoveBrand = async (index: number) => {
    if (!selectedCategory) return;
    const updatedBrands = (selectedCategory.brands || []).filter((_, i) => i !== index);

    try {
      await categoryService.update(selectedCategory.slug, {
        brands: updatedBrands
      });
      
      toast.success("Brand removed");
    } catch (error) {
      toast.error("Failed to remove brand");
    }
  };

  const handleUpdateBrand = async (index: number, name: string) => {
    if (!selectedCategory) return;
    const updatedBrands = [...(selectedCategory.brands || [])];
    updatedBrands[index] = name;

    try {
      await categoryService.update(selectedCategory.slug, {
        brands: updatedBrands
      });
      
      setEditingBrandIndex(null);
      toast.success("Brand updated");
    } catch (error) {
      toast.error("Failed to update brand");
    }
  };

  // Section Handlers
  const handleAddSection = async () => {
    if (!selectedCategory || !newSectionTitle.trim()) {
      toast.error("Section title is required");
      return;
    }

    const updatedSections = [...(selectedCategory.sections || []), { title: newSectionTitle.trim(), items: [] }];

    try {
      await categoryService.update(selectedCategory.slug, {
        sections: updatedSections
      });
      
      setNewSectionTitle("");
      toast.success("Section added");
    } catch (error) {
      toast.error("Failed to add section");
    }
  };

  const handleRemoveSection = async (index: number) => {
    if (!selectedCategory) return;
    const updatedSections = (selectedCategory.sections || []).filter((_, i) => i !== index);

    try {
      await categoryService.update(selectedCategory.slug, {
        sections: updatedSections
      });
      
      toast.success("Section removed");
    } catch (error) {
      toast.error("Failed to remove section");
    }
  };

  const handleUpdateSectionTitle = async (index: number, title: string) => {
    if (!selectedCategory) return;
    const updatedSections = [...(selectedCategory.sections || [])];
    updatedSections[index] = { ...updatedSections[index], title };

    try {
      await categoryService.update(selectedCategory.slug, {
        sections: updatedSections
      });
      
      setEditingSectionIndex(null);
      toast.success("Section title updated");
    } catch (error) {
      toast.error("Failed to update section title");
    }
  };

  const handleAddItemToSection = async (sectionIndex: number) => {
    if (!selectedCategory || !newSectionItemName.trim() || !newSectionItemSlug.trim()) {
      toast.error("Item name and slug are required");
      return;
    }

    const updatedSections = [...(selectedCategory.sections || [])];
    updatedSections[sectionIndex].items = [
      ...(updatedSections[sectionIndex].items || []),
      { name: newSectionItemName.trim(), slug: newSectionItemSlug.trim() }
    ];

    try {
      await categoryService.update(selectedCategory.slug, {
        sections: updatedSections
      });
      
      setNewSectionItemName("");
      setNewSectionItemSlug("");
      toast.success("Item added to section");
    } catch (error) {
      toast.error("Failed to add item to section");
    }
  };

  const [editingSectionItem, setEditingSectionItem] = useState<{ sIndex: number, iIndex: number } | null>(null);

  const handleUpdateSectionItem = async (sIndex: number, iIndex: number, name: string, slug: string) => {
    if (!selectedCategory) return;
    const updatedSections = [...(selectedCategory.sections || [])];
    updatedSections[sIndex].items[iIndex] = { name, slug };

    try {
      await categoryService.update(selectedCategory.slug, {
        sections: updatedSections
      });
      
      setEditingSectionItem(null);
      toast.success("Item updated");
    } catch (error) {
      toast.error("Failed to update item");
    }
  };

  const handleAddItemToSectionDirect = async (sectionIndex: number, name: string, slug: string) => {
    if (!selectedCategory || !name.trim() || !slug.trim()) {
      toast.error("Item name and slug are required");
      return;
    }

    const updatedSections = [...(selectedCategory.sections || [])];
    updatedSections[sectionIndex].items = [
      ...(updatedSections[sectionIndex].items || []),
      { name: name.trim(), slug: slug.trim() }
    ];

    try {
      await categoryService.update(selectedCategory.slug, {
        sections: updatedSections
      });
      
      toast.success("Item added to section");
    } catch (error) {
      toast.error("Failed to add item to section");
    }
  };

  const handleRemoveItemFromSection = async (sectionIndex: number, itemIndex: number) => {
    if (!selectedCategory) return;
    const updatedSections = [...(selectedCategory.sections || [])];
    updatedSections[sectionIndex].items = updatedSections[sectionIndex].items.filter((_, i) => i !== itemIndex);

    try {
      await categoryService.update(selectedCategory.slug, {
        sections: updatedSections
      });
      
      toast.success("Item removed from section");
    } catch (error) {
      toast.error("Failed to remove item from section");
    }
  };

  const resetCatForm = () => {
    setCatName("");
    setCatSlug("");
    setCatIcon("📦");
    setCatDesc("");
    setIsAddingCategory(false);
    setIsEditingCategory(false);
  };

  const filteredCategories = categories.filter(c => 
    c.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    c.slug.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-muted flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm font-medium animate-pulse text-muted-foreground">Loading Categories...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col min-w-0 min-h-screen pb-20 lg:pb-0 bg-muted/50" ref={containerRef}>
      <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8 gsap-reveal">
          <div>
            <h2 className="text-2xl sm:text-3xl font-black text-foreground tracking-tight">Category Architecture</h2>
            <p className="text-xs sm:text-sm text-muted-foreground font-medium">Manage taxonomy, subcategories, brands, and specification blueprints</p>
          </div>
          <button 
            onClick={() => { resetCatForm(); setIsAddingCategory(true); }}
            className="flex items-center justify-center gap-2 bg-blue-600 text-white px-5 py-3 sm:py-2.5 rounded-xl font-bold text-sm hover:bg-blue-700 transition-all shadow-lg shadow-blue-600/20 active:scale-95 w-full sm:w-auto"
          >
            <Plus size={18} />
            New Category
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8">
          {/* Categories Sidebar */}
          <div className="lg:col-span-4 space-y-6 gsap-reveal">
            <div className="bg-card border border-border rounded-3xl p-4 sm:p-6 shadow-sm overflow-hidden">
              <div className="relative mb-6">
                <Filter className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
                <input 
                  type="text"
                  placeholder="Search categories..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full bg-muted border border-border rounded-xl pl-10 pr-4 py-2.5 text-sm focus:ring-2 focus:ring-blue-600/10 outline-none transition-all"
                />
              </div>

              <div className="space-y-2 max-h-[300px] lg:max-h-[600px] overflow-y-auto pr-2 custom-scrollbar">
                {filteredCategories.map((cat) => (
                  <div 
                    key={cat.slug}
                    onClick={() => {
                      setSelectedCategorySlug(cat.slug);
                      setIsEditingCategory(false);
                      setIsAddingCategory(false);
                    }}
                    className={`group flex items-center justify-between p-3 rounded-2xl cursor-pointer transition-all border ${
                      selectedCategorySlug === cat.slug 
                        ? "bg-blue-50 border-blue-200 shadow-sm" 
                        : "bg-transparent border-transparent hover:bg-muted hover:border-border"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{cat.icon}</span>
                      <div>
                        <h4 className={`text-sm font-bold ${selectedCategory?.slug === cat.slug ? "text-blue-700" : "text-foreground"}`}>
                          {cat.name}
                        </h4>
                        <p className="text-[10px] text-muted-foreground font-mono uppercase">{cat.slug}</p>
                      </div>
                    </div>
                    <button 
                      onClick={(e) => { e.stopPropagation(); handleDeleteCategory(cat.slug); }}
                      className="p-2 text-muted-foreground/50 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all opacity-0 group-hover:opacity-100"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Main Content Area */}
          <div className="lg:col-span-8 space-y-6 gsap-reveal">
            <AnimatePresence mode="wait">
              {isAddingCategory || isEditingCategory ? (
                <motion.div
                  key="form"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="bg-card border border-border rounded-3xl p-5 sm:p-8 shadow-sm"
                >
                  <div className="flex items-center justify-between mb-6 sm:mb-8">
                    <h3 className="text-lg sm:text-xl font-black text-foreground">
                      {isAddingCategory ? "Create New Category" : `Edit ${selectedCategory?.name}`}
                    </h3>
                    <button onClick={resetCatForm} className="text-muted-foreground hover:text-muted-foreground">
                      <ChevronLeft size={24} />
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                    <div className="space-y-2">
                      <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Category Name</label>
                      <input 
                        value={catName}
                        onChange={(e) => {
                          setCatName(e.target.value);
                          if (isAddingCategory) setCatSlug(e.target.value.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, ''));
                        }}
                        placeholder="e.g. Gaming Consoles"
                        className="w-full bg-muted border border-border rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-blue-600/10 outline-none transition-all"
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Slug (URL ID)</label>
                      <input 
                        value={catSlug}
                        onChange={(e) => setCatSlug(e.target.value)}
                        disabled={isEditingCategory}
                        placeholder="gaming-consoles"
                        className="w-full bg-muted border border-border rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-blue-600/10 outline-none transition-all disabled:opacity-50"
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Icon (Emoji)</label>
                      <input 
                        value={catIcon}
                        onChange={(e) => setCatIcon(e.target.value)}
                        placeholder="🎮"
                        className="w-full bg-muted border border-border rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-blue-600/10 outline-none transition-all"
                      />
                    </div>

                    <div className="space-y-2 sm:col-span-2">
                      <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Description</label>
                      <textarea 
                        value={catDesc}
                        onChange={(e) => setCatDesc(e.target.value)}
                        placeholder="Briefly describe this category..."
                        rows={3}
                        className="w-full bg-muted border border-border rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-blue-600/10 outline-none transition-all resize-none"
                      />
                    </div>
                  </div>

                  <div className="mt-6 sm:mt-8 flex flex-col sm:flex-row gap-3">
                    <button 
                      onClick={isAddingCategory ? handleAddCategory : handleUpdateCategory}
                      className="flex-1 bg-blue-600 text-white py-3.5 sm:py-3 rounded-xl font-bold text-sm hover:bg-blue-700 transition-all shadow-lg shadow-blue-600/20"
                    >
                      {isAddingCategory ? "Create Category" : "Save Changes"}
                    </button>
                    <button 
                      onClick={resetCatForm}
                      className="px-8 py-3.5 sm:py-3 bg-accent text-muted-foreground rounded-xl font-bold text-sm hover:bg-accent/50 transition-all"
                    >
                      Cancel
                    </button>
                  </div>
                </motion.div>
              ) : selectedCategory ? (
                <motion.div
                  key="details"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="space-y-6"
                >
                  {/* Category Header Card */}
                  <div className="bg-card border border-border rounded-3xl p-6 sm:p-8 shadow-sm relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-4 sm:p-8">
                      <span className="text-6xl sm:text-8xl opacity-5 select-none">{selectedCategory.icon}</span>
                    </div>
                    
                    <div className="relative z-10">
                      <div className="flex items-center gap-4 mb-4">
                        <span className="text-4xl sm:text-5xl">{selectedCategory.icon}</span>
                        <div>
                          <h3 className="text-xl sm:text-2xl font-black text-foreground">{selectedCategory.name}</h3>
                          <p className="text-[10px] font-mono text-blue-600 font-bold uppercase tracking-widest">
                            ID: {selectedCategory.slug}
                          </p>
                        </div>
                      </div>
                      <p className="text-sm text-muted-foreground max-w-xl mb-6">
                        {selectedCategory.description || "No description provided for this category."}
                      </p>
                      <div className="flex flex-wrap gap-3">
                        <button 
                          onClick={() => {
                            setCatName(selectedCategory.name);
                            setCatSlug(selectedCategory.slug);
                            setCatIcon(selectedCategory.icon);
                            setCatDesc(selectedCategory.description || "");
                            setIsEditingCategory(true);
                          }}
                          className="flex items-center gap-2 bg-gray-900 text-white px-4 py-2.5 sm:py-2 rounded-xl text-xs font-bold hover:bg-gray-800 transition-all w-full sm:w-auto justify-center"
                        >
                          <Settings size={14} />
                          Edit Details
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Tabs Navigation */}
                  <div className="flex items-center gap-2 bg-card border border-border p-1.5 rounded-2xl shadow-sm w-full overflow-x-auto no-scrollbar">
                    <button 
                      onClick={() => setActiveTab("features")}
                      className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${activeTab === "features" ? "bg-blue-600 text-white shadow-md shadow-blue-600/20" : "text-muted-foreground hover:bg-muted"}`}
                    >
                      <LayoutGrid size={14} />
                      Features
                    </button>
                    <button 
                      onClick={() => setActiveTab("subcategories")}
                      className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${activeTab === "subcategories" ? "bg-blue-600 text-white shadow-md shadow-blue-600/20" : "text-muted-foreground hover:bg-muted"}`}
                    >
                      <Layers size={14} />
                      Subcategories
                    </button>
                    <button 
                      onClick={() => setActiveTab("brands")}
                      className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${activeTab === "brands" ? "bg-blue-600 text-white shadow-md shadow-blue-600/20" : "text-muted-foreground hover:bg-muted"}`}
                    >
                      <Briefcase size={14} />
                      Brands
                    </button>
                    <button 
                      onClick={() => setActiveTab("sections")}
                      className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${activeTab === "sections" ? "bg-blue-600 text-white shadow-md shadow-blue-600/20" : "text-muted-foreground hover:bg-muted"}`}
                    >
                      <LayoutGrid size={14} />
                      Sections
                    </button>
                  </div>

                  {/* Features Management */}
                  {activeTab === "features" && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="bg-card border border-border rounded-3xl p-5 sm:p-8 shadow-sm"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
                        <div>
                          <h4 className="text-lg font-black text-foreground">Specification Blueprint</h4>
                          <p className="text-xs text-muted-foreground font-medium">Define suggested fields for products in this category</p>
                        </div>
                        <div className="flex gap-2">
                          <input 
                            value={newFeature}
                            onChange={(e) => setNewFeature(e.target.value)}
                            placeholder="Add feature..."
                            className="flex-1 bg-muted border border-border rounded-xl px-4 py-2 text-xs focus:ring-2 focus:ring-blue-600/10 outline-none transition-all"
                            onKeyPress={(e) => e.key === 'Enter' && handleAddFeature()}
                          />
                          <button 
                            onClick={handleAddFeature}
                            className="bg-blue-600 text-white p-2.5 rounded-xl hover:bg-blue-700 transition-all"
                          >
                            <Plus size={18} />
                          </button>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                        {categoryFeatures.find(cf => cf.categorySlug === selectedCategory.slug)?.features.map((feature) => (
                          <div 
                            key={feature}
                            className="group flex items-center justify-between bg-muted border border-border p-3 rounded-2xl hover:border-blue-200 transition-all"
                          >
                            <span className="text-xs font-bold text-foreground">{feature}</span>
                            <button 
                              onClick={() => handleRemoveFeature(selectedCategory.slug, feature)}
                              className="p-1.5 text-muted-foreground/50 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all opacity-0 group-hover:opacity-100"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        )) || (
                          <div className="col-span-full py-12 text-center border-2 border-dashed border-border rounded-3xl">
                            <p className="text-sm text-muted-foreground font-medium">No features defined yet.</p>
                          </div>
                        )}
                      </div>
                    </motion.div>
                  )}

                  {/* Subcategories Management */}
                  {activeTab === "subcategories" && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="bg-card border border-border rounded-3xl p-5 sm:p-8 shadow-sm"
                    >
                      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-8">
                        <div>
                          <h4 className="text-lg font-black text-foreground">Sub-Navigation Items</h4>
                          <p className="text-xs text-muted-foreground font-medium">Manage sub-categories for the main menu</p>
                        </div>
                        <div className="flex flex-col sm:flex-row gap-2">
                          <input 
                            value={newSubName}
                            onChange={(e) => {
                              setNewSubName(e.target.value);
                              setNewSubSlug(e.target.value.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, ''));
                            }}
                            placeholder="Name..."
                            className="flex-1 bg-muted border border-border rounded-xl px-4 py-2.5 sm:py-2 text-xs focus:ring-2 focus:ring-blue-600/10 outline-none transition-all"
                          />
                          <input 
                            value={newSubSlug}
                            onChange={(e) => setNewSubSlug(e.target.value)}
                            placeholder="Slug..."
                            className="flex-1 bg-muted border border-border rounded-xl px-4 py-2.5 sm:py-2 text-xs focus:ring-2 focus:ring-blue-600/10 outline-none transition-all"
                          />
                          <button 
                            onClick={handleAddSubcategory}
                            className="bg-blue-600 text-white px-4 py-3 sm:py-2 rounded-xl hover:bg-blue-700 transition-all text-xs font-bold flex items-center justify-center gap-2"
                          >
                            <Plus size={16} /> Add
                          </button>
                        </div>
                      </div>

                      <div className="space-y-3">
                        {selectedCategory.subcategories && selectedCategory.subcategories.length > 0 ? (
                          selectedCategory.subcategories.map((sub, index) => (
                            <div 
                              key={index}
                              className="group flex items-center justify-between bg-muted border border-border p-4 rounded-2xl hover:border-blue-200 transition-all"
                            >
                              {editingSubIndex === index ? (
                                <div className="flex-1 flex flex-col sm:flex-row gap-3">
                                  <input 
                                    defaultValue={sub.name}
                                    id={`sub-name-${index}`}
                                    className="flex-1 bg-card border border-border rounded-lg px-3 py-2 text-xs outline-none"
                                  />
                                  <input 
                                    defaultValue={sub.slug}
                                    id={`sub-slug-${index}`}
                                    className="flex-1 bg-card border border-border rounded-lg px-3 py-2 text-xs outline-none"
                                  />
                                  <div className="flex gap-2">
                                    <button 
                                      onClick={() => {
                                        const name = (document.getElementById(`sub-name-${index}`) as HTMLInputElement).value;
                                        const slug = (document.getElementById(`sub-slug-${index}`) as HTMLInputElement).value;
                                        handleUpdateSubcategory(index, name, slug);
                                      }}
                                      className="flex-1 bg-green-600 text-white p-2 rounded-lg hover:bg-green-700 flex justify-center"
                                    >
                                      <Save size={14} />
                                    </button>
                                    <button onClick={() => setEditingSubIndex(null)} className="flex-1 bg-accent/50 text-muted-foreground p-2 rounded-lg hover:bg-accent flex justify-center">
                                      <X size={14} />
                                    </button>
                                  </div>
                                </div>
                              ) : (
                                <>
                                  <div className="flex items-center gap-4">
                                    <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center text-blue-600 font-bold text-xs">
                                      {index + 1}
                                    </div>
                                    <div>
                                      <h5 className="text-sm font-bold text-foreground">{sub.name}</h5>
                                      <p className="text-[10px] text-muted-foreground font-mono uppercase">{sub.slug}</p>
                                    </div>
                                  </div>
                                  <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-all">
                                    <button 
                                      onClick={() => setEditingSubIndex(index)}
                                      className="p-2 text-muted-foreground hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
                                    >
                                      <Edit3 size={16} />
                                    </button>
                                    <button 
                                      onClick={() => handleRemoveSubcategory(index)}
                                      className="p-2 text-muted-foreground hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all"
                                    >
                                      <Trash2 size={16} />
                                    </button>
                                  </div>
                                </>
                              )}
                            </div>
                          ))
                        ) : (
                          <div className="py-12 text-center border-2 border-dashed border-border rounded-3xl">
                            <p className="text-sm text-muted-foreground font-medium">No subcategories defined yet.</p>
                          </div>
                        )}
                      </div>
                    </motion.div>
                  )}

                  {/* Brands Management */}
                  {activeTab === "brands" && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="bg-card border border-border rounded-3xl p-5 sm:p-8 shadow-sm"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
                        <div>
                          <h4 className="text-lg font-black text-foreground">Associated Brands</h4>
                          <p className="text-xs text-muted-foreground font-medium">Brands commonly found in this category</p>
                        </div>
                        <div className="flex gap-2">
                          <input 
                            value={newBrand}
                            onChange={(e) => setNewBrand(e.target.value)}
                            placeholder="Brand name..."
                            className="flex-1 bg-muted border border-border rounded-xl px-4 py-2 text-xs focus:ring-2 focus:ring-blue-600/10 outline-none transition-all"
                            onKeyPress={(e) => e.key === 'Enter' && handleAddBrand()}
                          />
                          <button 
                            onClick={handleAddBrand}
                            className="bg-blue-600 text-white p-2.5 rounded-xl hover:bg-blue-700 transition-all"
                          >
                            <Plus size={18} />
                          </button>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                        {selectedCategory.brands && selectedCategory.brands.length > 0 ? (
                          selectedCategory.brands.map((brand, index) => (
                            <div 
                              key={index}
                              className="group flex items-center justify-between bg-muted border border-border p-3 rounded-2xl hover:border-blue-200 transition-all"
                            >
                              {editingBrandIndex === index ? (
                                <div className="flex-1 flex gap-2">
                                  <input 
                                    defaultValue={brand}
                                    id={`brand-name-${index}`}
                                    className="flex-1 bg-card border border-border rounded-lg px-3 py-1 text-xs outline-none"
                                  />
                                  <button 
                                    onClick={() => {
                                      const name = (document.getElementById(`brand-name-${index}`) as HTMLInputElement).value;
                                      handleUpdateBrand(index, name);
                                    }}
                                    className="text-green-600 hover:bg-green-50 p-1 rounded"
                                  >
                                    <Save size={14} />
                                  </button>
                                </div>
                              ) : (
                                <>
                                  <span className="text-xs font-bold text-foreground">{brand}</span>
                                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-all">
                                    <button 
                                      onClick={() => setEditingBrandIndex(index)}
                                      className="p-1.5 text-muted-foreground/50 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
                                    >
                                      <Edit3 size={14} />
                                    </button>
                                    <button 
                                      onClick={() => handleRemoveBrand(index)}
                                      className="p-1.5 text-muted-foreground/50 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all"
                                    >
                                      <Trash2 size={14} />
                                    </button>
                                  </div>
                                </>
                              )}
                            </div>
                          ))
                        ) : (
                          <div className="col-span-full py-12 text-center border-2 border-dashed border-border rounded-3xl">
                            <p className="text-sm text-muted-foreground font-medium">No brands defined yet.</p>
                          </div>
                        )}
                      </div>
                    </motion.div>
                  )}

                  {/* Sections Management */}
                  {activeTab === "sections" && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="bg-card border border-border rounded-3xl p-5 sm:p-8 shadow-sm"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
                        <div>
                          <h4 className="text-lg font-black text-foreground">Custom Navigation Sections</h4>
                          <p className="text-xs text-muted-foreground font-medium">Create grouped links (e.g. "All Laptop Brands")</p>
                        </div>
                        <div className="flex gap-2">
                          <input 
                            value={newSectionTitle}
                            onChange={(e) => setNewSectionTitle(e.target.value)}
                            placeholder="Section Title..."
                            className="flex-1 bg-muted border border-border rounded-xl px-4 py-2 text-xs focus:ring-2 focus:ring-blue-600/10 outline-none transition-all"
                            onKeyPress={(e) => e.key === 'Enter' && handleAddSection()}
                          />
                          <button 
                            onClick={handleAddSection}
                            className="bg-blue-600 text-white p-2.5 rounded-xl hover:bg-blue-700 transition-all"
                          >
                            <Plus size={18} />
                          </button>
                        </div>
                      </div>

                      <div className="space-y-6">
                        {selectedCategory.sections && selectedCategory.sections.length > 0 ? (
                          selectedCategory.sections.map((section, sIndex) => (
                            <div key={sIndex} className="bg-muted border border-border rounded-2xl p-6 space-y-4">
                              <div className="flex items-center justify-between">
                                {editingSectionIndex === sIndex ? (
                                  <div className="flex-1 flex gap-2">
                                    <input 
                                      defaultValue={section.title}
                                      id={`section-title-${sIndex}`}
                                      className="flex-1 bg-card border border-border rounded-lg px-3 py-1 text-sm font-bold outline-none"
                                    />
                                    <button 
                                      onClick={() => {
                                        const title = (document.getElementById(`section-title-${sIndex}`) as HTMLInputElement).value;
                                        handleUpdateSectionTitle(sIndex, title);
                                      }}
                                      className="text-green-600 hover:bg-green-50 p-1 rounded"
                                    >
                                      <Save size={16} />
                                    </button>
                                  </div>
                                ) : (
                                  <div className="flex items-center gap-3">
                                    <h5 className="text-sm font-black text-foreground">{section.title}</h5>
                                    <button 
                                      onClick={() => setEditingSectionIndex(sIndex)}
                                      className="p-1 text-muted-foreground hover:text-blue-600 transition-all"
                                    >
                                      <Edit3 size={14} />
                                    </button>
                                  </div>
                                )}
                                <button 
                                  onClick={() => handleRemoveSection(sIndex)}
                                  className="p-1 text-muted-foreground hover:text-rose-600 transition-all"
                                >
                                  <Trash2 size={16} />
                                </button>
                              </div>

                              {/* Section Items */}
                              <div className="space-y-2">
                                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                                  {section.items && section.items.length > 0 ? (
                                    section.items.map((item, iIndex) => (
                                      <div key={iIndex} className="group flex flex-col bg-card border border-border p-3 rounded-xl hover:border-blue-100 transition-all">
                                        {editingSectionItem?.sIndex === sIndex && editingSectionItem?.iIndex === iIndex ? (
                                          <div className="space-y-2">
                                            <input 
                                              defaultValue={item.name}
                                              id={`edit-item-name-${sIndex}-${iIndex}`}
                                              className="w-full bg-muted border border-border rounded px-2 py-1 text-[10px] outline-none"
                                            />
                                            <input 
                                              defaultValue={item.slug}
                                              id={`edit-item-slug-${sIndex}-${iIndex}`}
                                              className="w-full bg-muted border border-border rounded px-2 py-1 text-[10px] outline-none"
                                            />
                                            <div className="flex gap-1">
                                              <button 
                                                onClick={() => {
                                                  const name = (document.getElementById(`edit-item-name-${sIndex}-${iIndex}`) as HTMLInputElement).value;
                                                  const slug = (document.getElementById(`edit-item-slug-${sIndex}-${iIndex}`) as HTMLInputElement).value;
                                                  handleUpdateSectionItem(sIndex, iIndex, name, slug);
                                                }}
                                                className="flex-1 bg-green-600 text-white py-1 rounded text-[10px] font-bold"
                                              >
                                                Save
                                              </button>
                                              <button 
                                                onClick={() => setEditingSectionItem(null)}
                                                className="flex-1 bg-accent text-muted-foreground py-1 rounded text-[10px] font-bold"
                                              >
                                                Cancel
                                              </button>
                                            </div>
                                          </div>
                                        ) : (
                                          <>
                                            <div className="flex items-center justify-between mb-1">
                                              <span className="text-xs font-bold text-foreground">{item.name}</span>
                                              <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-all">
                                                <button 
                                                  onClick={() => setEditingSectionItem({ sIndex, iIndex })}
                                                  className="p-1 text-muted-foreground hover:text-blue-600"
                                                >
                                                  <Edit3 size={10} />
                                                </button>
                                                <button 
                                                  onClick={() => handleRemoveItemFromSection(sIndex, iIndex)}
                                                  className="p-1 text-muted-foreground hover:text-rose-600"
                                                >
                                                  <Trash2 size={10} />
                                                </button>
                                              </div>
                                            </div>
                                            <span className="text-[10px] text-muted-foreground font-mono truncate">{item.slug}</span>
                                          </>
                                        )}
                                      </div>
                                    ))
                                  ) : (
                                    <p className="text-[10px] text-muted-foreground italic">No items in this section.</p>
                                  )}
                                </div>

                                {/* Add Item to Section Form */}
                                <div className="space-y-3 pt-4 border-t border-border">
                                  <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                                    <span className="text-[10px] font-black text-muted-foreground uppercase tracking-wider">Quick Add:</span>
                                    <select 
                                      className="w-full sm:w-auto bg-card border border-border rounded-lg px-2 py-1 text-[10px] outline-none focus:ring-2 focus:ring-blue-600/10"
                                      onChange={(e) => {
                                        const val = e.target.value;
                                        if (!val) return;
                                        const [name, slug] = val.split('|');
                                        const nameInput = document.getElementById(`new-item-name-${sIndex}`) as HTMLInputElement;
                                        const slugInput = document.getElementById(`new-item-slug-${sIndex}`) as HTMLInputElement;
                                        nameInput.value = name;
                                        slugInput.value = slug;
                                        e.target.value = "";
                                      }}
                                    >
                                      <option value="">Select from existing...</option>
                                      <optgroup label="Subcategories">
                                        {selectedCategory.subcategories?.map(sub => (
                                          <option key={sub.slug} value={`${sub.name}|${sub.slug}`}>{sub.name}</option>
                                        ))}
                                      </optgroup>
                                      <optgroup label="Brands">
                                        {selectedCategory.brands?.map(brand => (
                                          <option key={brand} value={`${brand}|${brand.toLowerCase().replace(/\s+/g, '-')}`}>{brand}</option>
                                        ))}
                                      </optgroup>
                                    </select>
                                  </div>

                                  <div className="flex flex-col sm:flex-row gap-2">
                                    <input 
                                      placeholder="Item Name..."
                                      className="flex-1 bg-card border border-border rounded-lg px-3 py-2 sm:py-1.5 text-[10px] outline-none focus:ring-2 focus:ring-blue-600/10"
                                      id={`new-item-name-${sIndex}`}
                                    />
                                    <input 
                                      placeholder="Item Slug..."
                                      className="flex-1 bg-card border border-border rounded-lg px-3 py-2 sm:py-1.5 text-[10px] outline-none focus:ring-2 focus:ring-blue-600/10"
                                      id={`new-item-slug-${sIndex}`}
                                    />
                                    <button 
                                      onClick={() => {
                                        const nameInput = document.getElementById(`new-item-name-${sIndex}`) as HTMLInputElement;
                                        const slugInput = document.getElementById(`new-item-slug-${sIndex}`) as HTMLInputElement;
                                        handleAddItemToSectionDirect(sIndex, nameInput.value, slugInput.value);
                                        nameInput.value = "";
                                        slugInput.value = "";
                                      }}
                                      className="bg-blue-600 text-white px-4 py-2 sm:py-1.5 rounded-lg text-[10px] font-bold hover:bg-blue-700 transition-all shadow-sm"
                                    >
                                      Add Item
                                    </button>
                                  </div>
                                </div>
                              </div>
                            </div>
                          ))
                        ) : (
                          <div className="py-12 text-center border-2 border-dashed border-border rounded-3xl">
                            <p className="text-sm text-muted-foreground font-medium">No custom sections defined yet.</p>
                          </div>
                        )}
                      </div>
                    </motion.div>
                  )}
                </motion.div>
              ) : (
                <motion.div
                  key="empty"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="h-full flex flex-col items-center justify-center py-32 text-center space-y-4"
                >
                  <div className="w-24 h-24 bg-accent rounded-full flex items-center justify-center text-muted-foreground/50">
                    <Menu size={48} />
                  </div>
                  <div>
                    <h3 className="text-xl font-black text-foreground">Select a Category</h3>
                    <p className="text-sm text-muted-foreground max-w-xs mx-auto">
                      Choose a category from the sidebar to manage its details, subcategories, brands, and specification blueprints.
                    </p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CategoryFeatures;


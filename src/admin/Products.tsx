import { useState, useMemo, useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useOutletContext } from "react-router-dom";

import { Package, Search, Plus, Edit2, Trash2, ExternalLink, Filter, Upload, X, Check, CloudUpload, FileSpreadsheet, PlayCircle, Loader2 } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { Link } from "react-router-dom";
import { type Product } from "@/lib/types";
import { formatPrice } from "@/lib/utils";
import { toast } from "sonner";
import { useProducts } from "@/hooks/useProducts";
import { SafeImage } from "@/frontend/components/SafeImage";

import { productService } from "@/api/productService";

interface ParsedProduct {
  name: string;
  brand_name: string;
  category: string;
  price: number;
  description: string;
  slug: string;
}

const truncateProductName = (name: string) => {
  const words = name.split(" ");
  return words.length > 15 ? words.slice(0, 15).join(" ") + "..." : name;
};

const AdminProducts = () => {
  const { setIsSidebarOpen } = useOutletContext<{ setIsSidebarOpen: (open: boolean) => void }>();
  const { products, loading } = useProducts();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("All");

  // Bulk Upload states
  const [isBulkOpen, setIsBulkOpen] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [bulkInput, setBulkInput] = useState("");
  const [parsedProducts, setParsedProducts] = useState<ParsedProduct[]>([]);
  const [uploadingBulk, setUploadingBulk] = useState(false);
  const [bulkProgress, setBulkProgress] = useState({ current: 0, total: 0 });

  const fileInputRef = useRef<HTMLInputElement>(null);
  const queryClient = useQueryClient();

  const handleDelete = async (id: string) => {
    if (window.confirm("Are you sure you want to delete this product?")) {
      try {
        await productService.delete(id);
        await queryClient.invalidateQueries({ queryKey: ['products'] });
        toast.success("Product deleted successfully");
      } catch (error) {
        toast.error("Failed to delete product");
      }
    }
  };

  const categories = useMemo(() => ["All", ...new Set(products.map(p => p.category))], [products]);

  const filteredProducts = useMemo(() => products.filter(product => {
    const matchesSearch = (product.name?.toLowerCase() || "").includes(searchTerm.toLowerCase()) ||
                         (product.description?.toLowerCase() || "").includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === "All" || product.category === selectedCategory;
    return matchesSearch && matchesCategory;
  }), [products, searchTerm, selectedCategory]);

  // Handle Drag Events
  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  // Convert text values to parsed array of products safely
  const parseCSVText = (text: string) => {
    try {
      const lines = text.split("\n");
      const list: ParsedProduct[] = [];
      
      lines.forEach((line) => {
        const trimmed = line.trim();
        if (!trimmed || trimmed.startsWith("Name,Price")) return; // skip header or blank
        
        // Simple comma split
        const parts = trimmed.split(",");
        if (parts.length >= 3) {
          const name = parts[0]?.trim() || "New Product";
          const price = parseFloat(parts[1]?.trim() || "0") || 0;
          const category = parts[2]?.trim() || "Computers";
          const brand_name = parts[3]?.trim() || "NeoStore";
          const desc = parts[4]?.trim() || "Bulk uploaded product description";
          const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");

          list.push({
            name,
            price,
            category,
            brand_name,
            description: desc,
            slug
          });
        }
      });
      return list;
    } catch (err) {
      toast.error("Error parsing product spreadsheet formatting.");
      return [];
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      const reader = new FileReader();
      reader.onload = (event) => {
        const text = event.target?.result as string;
        setBulkInput(text);
        const parsed = parseCSVText(text);
        setParsedProducts(parsed);
        if (parsed.length > 0) {
          toast.success(`Successfully parsed ${parsed.length} products!`);
        }
      };
      reader.readAsText(file);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.onload = (event) => {
        const text = event.target?.result as string;
        setBulkInput(text);
        const parsed = parseCSVText(text);
        setParsedProducts(parsed);
        if (parsed.length > 0) {
          toast.success(`Successfully parsed ${parsed.length} products!`);
        }
      };
      reader.readAsText(file);
    }
  };

  // Run the batch product creation script live
  const handleBulkUploadSubmit = async () => {
    if (parsedProducts.length === 0) {
      toast.error("Please add or select some valid products to upload first.");
      return;
    }

    setUploadingBulk(true);
    setBulkProgress({ current: 0, total: parsedProducts.length });

    let successCount = 0;
    for (let i = 0; i < parsedProducts.length; i++) {
      const item = parsedProducts[i];
      try {
        await productService.create({
          name: item.name,
          slug: `${item.slug}-${Math.floor(Math.random() * 10000)}`,
          price: item.price,
          description: item.description,
          brand_name: item.brand_name,
          category_id: 1, // Assume default or try/catch fallback mapping
          type: "hardware",
        });
        successCount++;
      } catch (err) {
        console.warn(`Could not upload ${item.name}`, err);
      }
      setBulkProgress(prev => ({ ...prev, current: i + 1 }));
    }

    toast.success(`Successfully uploaded ${successCount} products to multi-tenant store!`);
    setIsBulkOpen(false);
    setParsedProducts([]);
    setBulkInput("");
    setUploadingBulk(false);
    await queryClient.invalidateQueries({ queryKey: ['products'] });
  };

  const loadExampleData = () => {
    const demo = `Name,Price,Category,Brand,Description
Neo UltraWorkstation Monolith,3999.00,Workstations,NeoStore,Ultimate Intel Core i9 dual GPU beast
Quantum Pro Studio Monitors,549.00,Audio,Quantum,Flat-response studio monitor speakers
Horizon Home Hub Smart OLED,299.00,Smart Home,Horizon,Ambient smart display with full HomeAssistant hookup
Apex FitBand Ultra X,189.00,Fitness,Apex,Advanced AMOLED heart rate monitor
Summit Fold5 DualPad Tablet,899.00,Phones,Summit,Folding multi-screen mobile workspace`;
    setBulkInput(demo);
    const parsed = parseCSVText(demo);
    setParsedProducts(parsed);
    toast.success("Loaded 5 premium multi-tenant example products!");
  };

  return (
    <div className="flex-1 flex flex-col min-w-0 min-h-full pb-20 lg:pb-0">
      <main className="flex-1 p-4 md:p-8">
        <div className="max-w-7xl mx-auto space-y-8">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div>
              <h1 className="text-3xl font-bold text-foreground">Product Management</h1>
              <p className="text-muted-foreground">Manage your store's product catalog</p>
            </div>
            
            <div className="flex items-center gap-3">
              <button
                onClick={() => setIsBulkOpen(true)}
                className="inline-flex items-center gap-2 px-4 py-2 bg-accent/90 text-foreground border border-border hover:bg-accent rounded-xl transition-all shadow-sm font-semibold text-xs"
              >
                <Upload size={14} />
                <span>Bulk Upload CSV</span>
              </button>

              <Link
                to="/admin/products/add"
                className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors shadow-sm font-semibold text-xs"
              >
                <Plus size={14} />
                <span>Add Product</span>
              </Link>
            </div>
          </div>


          <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
            <div className="relative w-full md:w-80">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
              <input 
                type="text"
                placeholder="Search products..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-card border border-border rounded-xl focus:ring-2 focus:ring-blue-500/20 outline-none transition-all"
              />
            </div>

            <div className="flex items-center gap-2 w-full md:w-auto overflow-x-auto pb-2 md:pb-0 no-scrollbar">
              <Filter size={18} className="text-muted-foreground flex-shrink-0" />
              {categories.map(category => (
                <button
                  key={category}
                  onClick={() => setSelectedCategory(category)}
                  className={`px-4 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-all ${
                    selectedCategory === category
                      ? "bg-blue-600 text-white shadow-sm"
                      : "bg-card text-muted-foreground border border-border hover:border-blue-500"
                  }`}
                >
                  {category}
                </button>
              ))}
            </div>
          </div>

          <div className="bg-card rounded-2xl border border-border overflow-hidden shadow-sm">
            {/* Desktop Table View */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-muted border-b border-border">
                  <tr>
                    <th className="px-6 py-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Product</th>
                    <th className="px-6 py-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Category</th>
                    <th className="px-6 py-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Price</th>
                    <th className="px-6 py-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Status</th>
                    <th className="px-6 py-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {loading ? (
                    Array(5).fill(0).map((_, i) => (
                      <tr key={i} className="animate-pulse">
                        <td className="px-6 py-4"><div className="h-10 w-40 bg-accent rounded" /></td>
                        <td className="px-6 py-4"><div className="h-6 w-20 bg-accent rounded" /></td>
                        <td className="px-6 py-4"><div className="h-6 w-16 bg-accent rounded" /></td>
                        <td className="px-6 py-4"><div className="h-6 w-16 bg-accent rounded" /></td>
                        <td className="px-6 py-4"><div className="h-6 w-24 bg-accent ml-auto rounded" /></td>
                      </tr>
                    ))
                  ) : filteredProducts.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-6 py-12 text-center text-muted-foreground">
                        No products found matching your criteria.
                      </td>
                    </tr>
                  ) : (
                    filteredProducts.map((product) => (
                      <tr key={product.id} className="hover:bg-muted transition-colors">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-12 h-12 rounded-lg overflow-hidden bg-accent flex-shrink-0">
                              <SafeImage src={product.image} alt={product.name} className="w-full h-full object-cover" />
                            </div>
                            <div className="min-w-0">
                              <div className="text-sm font-bold text-foreground truncate" title={product.name}>{truncateProductName(product.name)}</div>
                              <div className="text-xs text-muted-foreground truncate max-w-[200px]">{product.description}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-accent text-muted-foreground border border-border">
                            {product.category}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm font-bold text-foreground">
                          {formatPrice(product.price)}
                        </td>
                        <td className="px-6 py-4">
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-100">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                            Active
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Link
                              to={product.slug || product.id ? `/product/${product.slug || product.id}` : "#"}
                              target="_blank"
                              className={`p-2 text-muted-foreground hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all ${!(product.slug || product.id) ? "pointer-events-none" : ""}`}
                              title="View on store"
                            >
                              <ExternalLink size={18} />
                            </Link>
                            <Link
                              to={`/admin/products/edit/${product.id}`}
                              className="p-2 text-muted-foreground hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-all"
                              title="Edit product"
                            >
                              <Edit2 size={18} />
                            </Link>
                            <button
                              onClick={() => handleDelete(product.id)}
                              className="p-2 text-muted-foreground hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all"
                              title="Delete product"
                            >
                              <Trash2 size={18} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Mobile Card View */}
            <div className="md:hidden divide-y divide-gray-200">
              {loading ? (
                Array(3).fill(0).map((_, i) => (
                  <div key={i} className="p-4 animate-pulse space-y-3">
                    <div className="flex gap-3">
                      <div className="w-16 h-16 bg-accent rounded-lg" />
                      <div className="flex-1 space-y-2">
                        <div className="h-4 bg-accent rounded w-3/4" />
                        <div className="h-3 bg-accent rounded w-1/2" />
                      </div>
                    </div>
                    <div className="flex justify-between items-center">
                      <div className="h-4 bg-accent rounded w-20" />
                      <div className="h-8 bg-accent rounded w-24" />
                    </div>
                  </div>
                ))
              ) : filteredProducts.length === 0 ? (
                <div className="p-8 text-center text-muted-foreground">
                  No products found matching your criteria.
                </div>
              ) : (
                filteredProducts.map((product) => (
                  <div key={product.id} className="p-4 space-y-4">
                    <div className="flex gap-4">
                      <div className="w-20 h-20 rounded-xl overflow-hidden bg-accent flex-shrink-0">
                        <SafeImage src={product.image} alt={product.name} className="w-full h-full object-cover" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-start justify-between gap-2">
                          <h3 className="text-sm font-bold text-foreground line-clamp-2" title={product.name}>{truncateProductName(product.name)}</h3>
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-accent text-muted-foreground border border-border whitespace-nowrap">
                            {product.category}
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground mt-1 line-clamp-1">{product.description}</p>
                        <p className="text-sm font-black text-blue-600 mt-2">{formatPrice(product.price)}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between pt-2">
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-50 text-emerald-700 border border-emerald-100">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                        Active
                      </span>
                      
                      <div className="flex items-center gap-1">
                        <Link
                          to={product.slug || product.id ? `/product/${product.slug || product.id}` : "#"}
                          target="_blank"
                          className={`p-2 text-muted-foreground hover:bg-accent rounded-lg transition-all ${!(product.slug || product.id) ? "pointer-events-none" : ""}`}
                        >
                          <ExternalLink size={18} />
                        </Link>
                        <Link
                          to={`/admin/products/edit/${product.id}`}
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
                        >
                          <Edit2 size={18} />
                        </Link>
                        <button
                          onClick={() => handleDelete(product.id)}
                          className="p-2 text-rose-600 hover:bg-rose-50 rounded-lg transition-all"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </main>

      {/* Bulk Upload Custom Dialog */}
      <AnimatePresence>
        {isBulkOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm animate-in fade-in duration-200">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-card w-full max-w-2xl rounded-2xl border-2 border-primary shadow-[var(--shadow-lg)] flex flex-col max-h-[90vh] overflow-hidden"
            >
              {/* Header */}
              <div className="p-5 border-b border-border flex items-center justify-between bg-muted/50">
                <div className="flex items-center gap-2">
                  <FileSpreadsheet className="text-blue-500" size={22} />
                  <div>
                    <h2 className="text-lg font-bold text-foreground">Bulk Upload Spreadsheet Catalog</h2>
                    <p className="text-[11px] text-muted-foreground">Import multiple products at once for Neo-Store & other tenants</p>
                  </div>
                </div>
                <button
                  onClick={() => {
                    setIsBulkOpen(false);
                    setParsedProducts([]);
                    setBulkInput("");
                  }}
                  className="p-1 px-2 text-xs bg-muted hover:bg-accent rounded-lg border border-border"
                >
                  <X size={16} />
                </button>
              </div>

              {/* Body */}
              <div className="p-6 overflow-y-auto space-y-5">
                {/* Drag zone */}
                <div
                  onDragEnter={handleDrag}
                  onDragOver={handleDrag}
                  onDragLeave={handleDrag}
                  onDrop={handleDrop}
                  className={`border-2 border-dashed rounded-xl p-6 text-center select-none cursor-pointer transition-all ${
                    dragActive 
                      ? "border-primary bg-primary/5 scale-[0.99]" 
                      : "border-border hover:border-primary/40 hover:bg-muted/30"
                  }`}
                  onClick={() => fileInputRef.current?.click()}
                >
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileSelect}
                    accept=".csv,.txt"
                    className="hidden"
                  />
                  <CloudUpload className="mx-auto text-muted-foreground mb-2 animate-bounce" size={32} />
                  <p className="text-xs font-bold text-foreground">Drag and Drop CSV File Here</p>
                  <p className="text-[10px] text-muted-foreground mt-1">or click to manually browse your storage</p>
                </div>

                <div className="flex justify-between items-center text-xs">
                  <span className="text-muted-foreground font-semibold">Or paste standard spreadsheet CSV formatting below:</span>
                  <button
                    type="button"
                    onClick={loadExampleData}
                    className="flex items-center gap-1.5 px-2.5 py-1 text-[10px] uppercase tracking-wider font-extrabold text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg border border-blue-200 transition-all"
                  >
                    <PlayCircle size={12} />
                    Load Neo-Store Demo Setup
                  </button>
                </div>

                <textarea
                  placeholder="Name,Price,Category,Brand,Description"
                  value={bulkInput}
                  onChange={(e) => {
                    setBulkInput(e.target.value);
                    const parsed = parseCSVText(e.target.value);
                    setParsedProducts(parsed);
                  }}
                  rows={4}
                  className="w-full p-3 font-mono text-xs bg-black/90 text-emerald-400 rounded-xl border border-border focus:outline-none focus:ring-2 focus:ring-primary/20"
                />

                {/* Parsed Output list */}
                {parsedProducts.length > 0 && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-extrabold text-foreground uppercase tracking-wider flex items-center gap-1.5">
                        <Check size={14} className="text-emerald-500 font-bold" />
                        Parsed Products Preview ({parsedProducts.length})
                      </span>
                    </div>

                    <div className="bg-muted/80 rounded-xl border border-border overflow-x-auto text-[11px] max-h-48">
                      <table className="w-full text-left">
                        <thead className="bg-accent/40 border-b border-border sticky top-0 text-[10px] uppercase font-bold text-muted-foreground">
                          <tr>
                            <th className="p-2 pl-3">Product Name</th>
                            <th className="p-2">Price</th>
                            <th className="p-2">Category</th>
                            <th className="p-2 pr-3">Brand</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-border">
                          {parsedProducts.map((p, index) => (
                            <tr key={index} className="hover:bg-accent/10">
                              <td className="p-2 pl-3 font-medium text-foreground">{p.name}</td>
                              <td className="p-2 font-bold text-blue-600">${p.price.toFixed(2)}</td>
                              <td className="p-2 text-muted-foreground">{p.category}</td>
                              <td className="p-2 pr-3 text-muted-foreground">{p.brand_name}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="p-5 border-t border-border flex items-center justify-between bg-muted/30">
                <button
                  type="button"
                  onClick={() => {
                    setIsBulkOpen(false);
                    setParsedProducts([]);
                    setBulkInput("");
                  }}
                  className="px-4 py-2 border border-border bg-white text-muted-foreground hover:bg-accent hover:text-foreground rounded-xl transition-all font-semibold text-xs text-center"
                >
                  Cancel
                </button>
                <button
                  onClick={handleBulkUploadSubmit}
                  disabled={uploadingBulk || parsedProducts.length === 0}
                  className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-xl transition-all font-bold text-xs flex items-center gap-1.5 shadow-sm"
                >
                  {uploadingBulk ? (
                    <>
                      <Loader2 size={13} className="animate-spin" />
                      Uploading ({bulkProgress.current}/{bulkProgress.total})...
                    </>
                  ) : (
                    <>
                      <Check size={13} />
                      Commit Upload to Catalog
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default AdminProducts;

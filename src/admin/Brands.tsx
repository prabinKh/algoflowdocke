import { useState, useEffect, useRef, useCallback } from "react";
import { useAuth } from "@/context/AuthContext";
import { brandService, type Brand } from "@/api/brandService";
import { categoryService } from "@/api/categoryService";
import { type Category } from "@/lib/types";
import { toast } from "sonner";
import { Plus, Edit2, Trash2, Search, Loader, Tag, CheckSquare, Square } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { useGSAPReveal } from "@/hooks/useGSAP";

interface ApiError {
  response?: {
    data?: {
      detail?: string | object;
      error?: string;
    };
  };
  message?: string;
}

export default function Brands() {
  const { user } = useAuth();
  const isAdmin = user?.is_staff || user?.is_superuser;
  const containerRef = useRef<HTMLDivElement>(null);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingBrand, setEditingBrand] = useState<Brand | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [categories, setCategories] = useState<Category[]>([]);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    logo: "",
    category_ids: [] as string[],
  });

  useGSAPReveal(containerRef);

  useEffect(() => {
    fetchBrands();
    fetchCategories();
  }, [fetchBrands, fetchCategories]);

  const fetchCategories = useCallback(async () => {
    try {
      const data = await categoryService.getAll();
      setCategories(data);
    } catch (error) {
      console.error("Failed to load categories:", error);
    }
  }, []);

  const fetchBrands = useCallback(async () => {
    setLoading(true);
    try {
      const data = await brandService.getAllAdmin(searchTerm);
      setBrands(data);
    } catch (error) {
      toast.error("Failed to load brands");
    } finally {
      setLoading(false);
    }
  }, [searchTerm]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      toast.error("Brand name is required");
      return;
    }

    try {
      if (editingBrand) {
        await brandService.updateBrand(editingBrand.slug, formData);
        toast.success("Brand updated successfully");
      } else {
        await brandService.createBrand(formData);
        toast.success("Brand created successfully");
      }
      setFormData({ name: "", description: "", logo: "" });
      setEditingBrand(null);
      setShowForm(false);
      await fetchBrands();
    } catch (error: unknown) {
      console.error("Save error:", error);
      const err = error as ApiError;
      let message = "Failed to save brand";
      const detail = err.response?.data?.detail;
      message = typeof detail === 'string' ? detail : 
                (typeof detail === 'object' ? JSON.stringify(detail) : 
                (err.response?.data?.error || err.message || "Failed to save brand"));
      toast.error(message);
    }
  };

  const handleEdit = (brand: Brand) => {
    setEditingBrand(brand);
    // @ts-expect-error - backend returns categories as objects in this context
    const catIds = brand.categories?.map((c: { slug?: string; id?: string }) => c.slug || c.id) || [];
    setFormData({
      name: brand.name,
      description: brand.description || "",
      logo: brand.logo || "",
      category_ids: catIds,
    });
    setShowForm(true);
  };

  const handleDelete = async (slug: string) => {
    if (!confirm("Are you sure you want to delete this brand?")) return;

    try {
      await brandService.deleteBrand(slug);
      toast.success("Brand deleted successfully");
      await fetchBrands();
    } catch (error) {
      const err = error as Error;
      toast.error(err.message || "Failed to delete brand");
    }
  };

  const handleCancel = () => {
    setShowForm(false);
    setEditingBrand(null);
    setFormData({ name: "", description: "", logo: "", category_ids: [] });
  };

  const toggleCategory = (slug: string) => {
    setFormData(prev => ({
      ...prev,
      category_ids: prev.category_ids.includes(slug)
        ? prev.category_ids.filter(id => id !== slug)
        : [...prev.category_ids, slug]
    }));
  };

  const filteredBrands = brands.filter((brand) =>
    brand.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (!isAdmin) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-red-600">Access Denied</h2>
          <p className="text-gray-600">You need admin privileges to access this page</p>
        </div>
      </div>
    );
  }

  return (
    <div ref={containerRef} className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h1 className="text-4xl font-bold text-slate-900 mb-2">Brand Management</h1>
              <p className="text-slate-600">Create, edit, and manage product brands</p>
            </div>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setShowForm(!showForm)}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg flex items-center gap-2 transition"
            >
              <Plus size={20} />
              Add Brand
            </motion.button>
          </div>

          {/* Search */}
          <div className="relative">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-400" size={20} />
            <input
              type="text"
              placeholder="Search brands..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                if (e.target.value.trim()) {
                  fetchBrands();
                }
              }}
              className="w-full pl-12 pr-4 py-3 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        {/* Form */}
        <AnimatePresence>
          {showForm && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="bg-white rounded-lg shadow-lg p-6 mb-8 border-l-4 border-blue-600"
            >
              <h2 className="text-2xl font-bold mb-6">
                {editingBrand ? "Edit Brand" : "Create New Brand"}
              </h2>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Brand Name *
                    </label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) =>
                        setFormData({ ...formData, name: e.target.value })
                      }
                      className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="e.g., Dell, Apple, HP"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Logo URL
                    </label>
                    <input
                      type="url"
                      value={formData.logo}
                      onChange={(e) =>
                        setFormData({ ...formData, logo: e.target.value })
                      }
                      className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="https://example.com/logo.png"
                    />
                  </div>
                </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Description
                    </label>
                    <textarea
                      value={formData.description}
                      onChange={(e) =>
                        setFormData({ ...formData, description: e.target.value })
                      }
                      className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                      rows={3}
                      placeholder="Brand description"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Related Categories
                    </label>
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                      {categories.map((cat) => (
                        <button
                          key={cat.id}
                          type="button"
                          onClick={() => toggleCategory(cat.slug)}
                          className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-xs font-medium transition-all ${
                            formData.category_ids.includes(cat.slug)
                              ? "bg-blue-50 border-blue-200 text-blue-700"
                              : "bg-slate-50 border-slate-200 text-slate-600 hover:border-slate-300"
                          }`}
                        >
                          {formData.category_ids.includes(cat.slug) ? (
                            <CheckSquare size={14} className="text-blue-600" />
                          ) : (
                            <Square size={14} />
                          )}
                          <span className="truncate">{cat.name}</span>
                        </button>
                      ))}
                    </div>
                    {categories.length === 0 && (
                      <p className="text-xs text-slate-400 italic">No categories available to associate.</p>
                    )}
                  </div>

                <div className="flex gap-4 justify-end">
                  <button
                    type="button"
                    onClick={handleCancel}
                    className="px-6 py-2 border border-slate-300 rounded-lg text-slate-700 hover:bg-slate-50 transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition"
                  >
                    {editingBrand ? "Update" : "Create"}
                  </button>
                </div>
              </form>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Brands List */}
        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <Loader className="animate-spin text-blue-600" size={32} />
            </div>
          ) : filteredBrands.length === 0 ? (
            <div className="p-8 text-center">
              <p className="text-slate-500 text-lg">
                {brands.length === 0 ? "No brands yet. Create one to get started!" : "No brands match your search."}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-50 border-b border-slate-200">
                  <tr>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-slate-700">Name</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-slate-700">Categories</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-slate-700">Logo</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-slate-700">Status</th>
                    <th className="px-6 py-4 text-right text-sm font-semibold text-slate-700">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {filteredBrands.map((brand) => (
                    <motion.tr
                      key={brand.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="hover:bg-slate-50 transition"
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          {brand.logo && (
                            <img
                              src={brand.logo}
                              alt={brand.name}
                              className="w-8 h-8 rounded object-cover"
                            />
                          )}
                          <span className="font-medium text-slate-900">{brand.name}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-wrap gap-1 max-w-[200px]">
                          {brand.categories?.length ? (
                            // @ts-expect-error - backend returns categories as objects in this context
                            brand.categories.map((cat: { slug?: string; id?: string; name: string }) => (
                              <span 
                                key={cat.slug || cat.id}
                                className="inline-flex items-center gap-1 bg-slate-100 text-slate-600 text-[10px] px-2 py-0.5 rounded-md border border-slate-200"
                              >
                                <Tag size={10} />
                                {cat.name}
                              </span>
                            ))
                          ) : (
                            <span className="text-xs text-slate-400 italic">No categories</span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        {brand.logo ? (
                          <span className="text-sm text-green-600">✓ Has logo</span>
                        ) : (
                          <span className="text-sm text-slate-400">No logo</span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${
                            brand.is_active
                              ? "bg-green-100 text-green-700"
                              : "bg-slate-100 text-slate-700"
                          }`}
                        >
                          {brand.is_active ? "Active" : "Inactive"}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex justify-end gap-2">
                          <motion.button
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                            onClick={() => handleEdit(brand)}
                            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition"
                            title="Edit brand"
                          >
                            <Edit2 size={18} />
                          </motion.button>
                          <motion.button
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                            onClick={() => handleDelete(brand.slug)}
                            className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition"
                            title="Delete brand"
                          >
                            <Trash2 size={18} />
                          </motion.button>
                        </div>
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Footer */}
          <div className="bg-slate-50 px-6 py-4 border-t border-slate-200">
            <p className="text-sm text-slate-600">
              Showing <span className="font-semibold">{filteredBrands.length}</span> of{" "}
              <span className="font-semibold">{brands.length}</span> brands
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

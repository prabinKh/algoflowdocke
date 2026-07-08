import { useState, useEffect } from "react";
import { 
  Plus, 
  Search, 
  MoreVertical, 
  Edit2, 
  Trash2, 
  ExternalLink,
  Tool,
  Wrench,
  Smartphone,
  Laptop,
  Monitor,
  Video,
  Speaker,
  Printer,
  ChevronRight,
  Filter
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { motion, AnimatePresence } from "motion/react";
import { adminServiceCategoryService } from "@/api/serviceCenterSettingsService";
import { ServiceCategory } from "@/types/repair";
import { Link } from "react-router-dom";

const ServiceCategories = () => {
  const [categories, setCategories] = useState<ServiceCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  const fetchCategories = async () => {
    try {
      setLoading(true);
      const data = await adminServiceCategoryService.getAll();
      setCategories(data);
    } catch (error) {
      toast.error("Failed to fetch service categories");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  const filteredCategories = categories.filter(cat => 
    cat.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-8 p-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black tracking-tighter text-foreground uppercase">
            Service <span className="text-emerald-500">Categories</span>
          </h1>
          <p className="text-muted-foreground mt-1">Manage repair service categories and their brands</p>
        </div>
        <Link to="/admin/service-categories/add">
          <Button className="bg-emerald-500 hover:bg-emerald-600 text-white font-bold rounded-xl shadow-lg shadow-emerald-500/20">
            <Plus size={18} className="mr-2" />
            Add Category
          </Button>
        </Link>
      </div>

      <div className="flex items-center gap-4 bg-card p-4 rounded-2xl border border-border shadow-sm">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
          <Input 
            placeholder="Search categories..." 
            className="pl-10 h-11 bg-muted/50 border-none rounded-xl"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <Button variant="outline" className="h-11 rounded-xl">
          <Filter size={18} className="mr-2" />
          More Filters
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <AnimatePresence mode="popLayout">
          {filteredCategories.map((category, index) => (
            <motion.div
              key={category.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ delay: index * 0.05 }}
              className="group bg-card border border-border rounded-3xl overflow-hidden shadow-sm hover:shadow-xl hover:shadow-emerald-500/5 hover:-translate-y-1 transition-all duration-300"
            >
              <div className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="w-14 h-14 bg-emerald-500/10 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                    {category.logo_url ? (
                      <img src={category.logo_url} alt={category.name} className="w-8 h-8 object-contain" />
                    ) : (
                      <Wrench className="text-emerald-500" size={28} />
                    )}
                  </div>
                  <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Link to={`/admin/service-categories/${category.id}/edit`}>
                      <Button size="icon" variant="ghost" className="h-9 w-9 rounded-full bg-muted/50">
                        <Edit2 size={16} />
                      </Button>
                    </Link>
                  </div>
                </div>

                <div>
                  <h3 className="text-xl font-bold tracking-tight text-foreground group-hover:text-emerald-500 transition-colors">
                    {category.name}
                  </h3>
                  <p className="text-sm text-muted-foreground mt-2 line-clamp-2 min-h-[40px]">
                    {category.description || "Expert repair services for all " + category.name + " models."}
                  </p>
                </div>

                <div className="mt-6 pt-6 border-t border-border flex items-center justify-between">
                  <div className="flex -space-x-2">
                    {category.brands?.slice(0, 4).map((brand, bIndex) => (
                      <div 
                        key={brand.id}
                        className="w-8 h-8 rounded-full bg-muted border-2 border-card flex items-center justify-center overflow-hidden"
                        title={brand.name}
                      >
                       {brand.logo_url ? (
                         <img src={brand.logo_url} alt={brand.name} className="w-full h-full object-cover" />
                       ) : (
                         <span className="text-[10px] font-bold">{brand.name[0]}</span>
                       )}
                      </div>
                    ))}
                    {category.brands && category.brands.length > 4 && (
                      <div className="w-8 h-8 rounded-full bg-muted border-2 border-card flex items-center justify-center text-[10px] font-black">
                        +{category.brands.length - 4}
                      </div>
                    )}
                  </div>
                  <Badge variant="outline" className="rounded-full bg-emerald-500/5 text-emerald-600 border-emerald-500/10 font-bold px-3">
                    {category.brands?.length || 0} Brands
                  </Badge>
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {!loading && filteredCategories.length === 0 && (
        <div className="text-center py-20 bg-card rounded-3xl border border-dashed border-border shadow-inner">
          <div className="w-20 h-20 bg-muted/50 rounded-full flex items-center justify-center mx-auto mb-4">
            <Search size={32} className="text-muted-foreground" />
          </div>
          <h3 className="text-xl font-bold text-foreground">No categories found</h3>
          <p className="text-muted-foreground mt-2">Try adjusting your search or add a new category.</p>
          <Button 
            variant="link" 
            className="mt-4 text-emerald-500 font-bold"
            onClick={() => setSearchQuery("")}
          >
            Clear search
          </Button>
        </div>
      )}
    </div>
  );
};

export default ServiceCategories;

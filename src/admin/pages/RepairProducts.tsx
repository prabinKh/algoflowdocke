import React, { useState, useEffect } from 'react';
import { Card } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { Input } from '../../components/ui/input';
import { 
  Plus, Search, Filter, Edit2, Trash2, 
  ToggleLeft as Toggle, Wrench, MoreVertical,
  CheckCircle2, XCircle, Clock
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { repairProductService } from '../../api/serviceCenterSettingsService';
import { RepairProduct } from '../../types/repair';
import { toast } from 'sonner';

const RepairProducts: React.FC = () => {
  const [products, setProducts] = useState<RepairProduct[]>([]);
  const [stats, setStats] = useState({
    total_products: 0,
    active_products: 0,
    inactive_products: 0,
    total_brands: 0
  });
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All');

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const data = await repairProductService.getAll({ 
        search: searchTerm, 
        category: categoryFilter !== 'All' ? categoryFilter : undefined 
      });
      setProducts(data);
      
      const statsData = await repairProductService.getStats();
      setStats(statsData);
    } catch (error) {
      toast.error("Failed to load repair products");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, [searchTerm, categoryFilter]);

  const toggleStatus = async (id: string, currentStatus: string) => {
    try {
      const newStatus = currentStatus === 'active' ? 'inactive' : 'active';
      await repairProductService.patchStatus(id, newStatus);
      toast.success(`Product ${newStatus === 'active' ? 'activated' : 'deactivated'}`);
      fetchProducts();
    } catch (error) {
      toast.error("Failed to update status");
    }
  };

  const deleteProduct = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this repair product? This will also delete all associated brands and common issues.")) return;
    
    try {
      await repairProductService.delete(id);
      toast.success("Product deleted successfully");
      fetchProducts();
    } catch (error) {
      toast.error("Failed to delete product");
    }
  };

  const categories = [
    'All',
    'Laptop & Computer',
    'Mobile & Tablet',
    'TV & Display',
    'CCTV & Security',
    'Audio & Speaker',
    'Printer & Scanner',
    'Gaming Console',
    'Other Electronics'
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Repair Products</h1>
          <p className="text-muted-foreground">Manage products repairable in the service center.</p>
        </div>
        <Button asChild>
          <Link to="/admin/repair-products/add">
            <Plus className="mr-2 h-4 w-4" /> Add New Product
          </Link>
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-4 flex items-center space-x-4">
          <div className="p-2 bg-blue-500/10 rounded-full">
            <Wrench className="h-5 w-5 text-blue-500" />
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Total Products</p>
            <p className="text-2xl font-bold">{stats.total_products}</p>
          </div>
        </Card>
        <Card className="p-4 flex items-center space-x-4">
          <div className="p-2 bg-green-500/10 rounded-full">
            <CheckCircle2 className="h-5 w-5 text-green-500" />
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Active</p>
            <p className="text-2xl font-bold">{stats.active_products}</p>
          </div>
        </Card>
        <Card className="p-4 flex items-center space-x-4">
          <div className="p-2 bg-gray-500/10 rounded-full">
            <XCircle className="h-5 w-5 text-gray-500" />
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Inactive</p>
            <p className="text-2xl font-bold">{stats.inactive_products}</p>
          </div>
        </Card>
        <Card className="p-4 flex items-center space-x-4">
          <div className="p-2 bg-purple-500/10 rounded-full">
            <Plus className="h-5 w-5 text-purple-500" />
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Total Brands</p>
            <p className="text-2xl font-bold">{stats.total_brands}</p>
          </div>
        </Card>
      </div>

      <Card className="p-4">
        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input 
              placeholder="Search by name or brand..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9"
            />
          </div>
          <div className="flex items-center space-x-2">
            <Filter className="h-4 w-4 text-muted-foreground" />
            <select 
              className="bg-background border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
            >
              {categories.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="rounded-md border overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 border-b">
              <tr>
                <th className="px-4 py-3 text-left font-medium">Product</th>
                <th className="px-4 py-3 text-left font-medium">Category</th>
                <th className="px-4 py-3 text-left font-medium">Status</th>
                <th className="px-4 py-3 text-left font-medium">Starting Price</th>
                <th className="px-4 py-3 text-left font-medium">SLA</th>
                <th className="px-4 py-3 text-left font-medium">Brands</th>
                <th className="px-4 py-3 text-right font-medium">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    <td colSpan={7} className="px-4 py-8 text-center bg-muted/20">Loading...</td>
                  </tr>
                ))
              ) : products.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-muted-foreground">
                    No repair products found.
                  </td>
                </tr>
              ) : (
                products.map((product) => (
                  <tr key={product.id} className="hover:bg-muted/30 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center space-x-3">
                        {product.image_url ? (
                          <img src={product.image_url} alt={product.name} className="h-10 w-10 rounded object-cover border" />
                        ) : (
                          <div className="h-10 w-10 rounded bg-muted flex items-center justify-center">
                            <Wrench className="h-5 w-5 text-muted-foreground" />
                          </div>
                        )}
                        <span className="font-medium">{product.name}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant="outline">{product.category}</Badge>
                    </td>
                    <td className="px-4 py-3">
                      <Badge className={product.status === 'active' ? 'bg-green-500 hover:bg-green-600' : 'bg-gray-500 hover:bg-gray-600'}>
                        {product.status}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 font-mono">NPR {Number(product.starting_price).toLocaleString()}</td>
                    <td className="px-4 py-3 text-muted-foreground">
                      <div className="flex items-center">
                        <Clock className="h-3 w-3 mr-1" />
                        {product.sla_days}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant="secondary">{product.brands?.length || 0} Brands</Badge>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex justify-end space-x-1">
                        <Button variant="ghost" size="icon" asChild>
                          <Link to={`/admin/repair-products/${product.id}/edit`}>
                            <Edit2 className="h-4 w-4" />
                          </Link>
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="icon"
                          onClick={() => toggleStatus(product.id, product.status)}
                          title={product.status === 'active' ? 'Deactivate' : 'Activate'}
                        >
                          <Toggle className={`h-4 w-4 ${product.status === 'active' ? 'text-green-500' : 'text-gray-400'}`} />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="text-destructive hover:text-destructive hover:bg-destructive/10"
                          onClick={() => deleteProduct(product.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
};

export default RepairProducts;

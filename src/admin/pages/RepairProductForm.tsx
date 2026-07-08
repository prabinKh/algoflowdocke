import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { Card } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Textarea } from '../../components/ui/textarea';
import { Switch } from '../../components/ui/switch';
import { 
  ChevronLeft, Save, Plus, Trash2, 
  Wrench, ShieldCheck, Clock, Truck, 
  Smartphone, Monitor, Tv, Camera, Speaker, Printer, Gamepad, HelpCircle
} from 'lucide-react';
import { repairProductService } from '../../api/serviceCenterSettingsService';
import { RepairProduct, RepairBrand, RepairIssue, RepairCategory } from '../../types/repair';
import { toast } from 'sonner';

const RepairProductForm: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const isEdit = !!id;

  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);
  
  const [formData, setFormData] = useState<Partial<RepairProduct>>({
    name: '',
    category: 'Laptop & Computer',
    description: '',
    image_url: '',
    status: 'inactive',
    sla_days: '3-5 working days',
    starting_price: 0,
    repair_warranty: '30 days',
    home_pickup: 'no',
    express_available: false,
    technician_type: 'General electronics technician',
    priority: 'normal'
  });

  const [brands, setBrands] = useState<RepairBrand[]>([]);
  const [issues, setIssues] = useState<RepairIssue[]>([]);
  
  const [newBrand, setNewBrand] = useState({ brand_name: '', brand_logo_url: '', is_popular: false });
  const [newIssue, setNewIssue] = useState({ issue_name: '', base_price: '' });

  const fetchProductData = async () => {
    if (!id) return;
    try {
      const data = await repairProductService.getById(id);
      setFormData(data);
      setBrands(data.brands || []);
      setIssues(data.issues || []);
    } catch (error) {
      toast.error("Failed to load product details");
      navigate('/admin/repair-products');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isEdit) {
      fetchProductData();
    }
  }, [id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.category) {
      toast.error("Product name and category are required");
      return;
    }

    setSaving(true);
    try {
      if (isEdit && id) {
        await repairProductService.update(id, formData);
        toast.success("Product updated successfully");
      } else {
        const created = await repairProductService.create(formData);
        toast.success("Product created successfully");
        navigate(`/admin/repair-products/${created.id}/edit`);
      }
    } catch (error) {
      toast.error(isEdit ? "Failed to update product" : "Failed to create product");
    } finally {
      setSaving(false);
    }
  };

  const handleAddBrand = async () => {
    if (!newBrand.brand_name) {
      toast.error("Brand name is required");
      return;
    }
    if (!isEdit) {
      toast.error("Please save the product first before adding brands");
      return;
    }

    try {
      await repairProductService.addBrand(id!, newBrand);
      toast.success("Brand added");
      setNewBrand({ brand_name: '', brand_logo_url: '', is_popular: false });
      fetchProductData();
    } catch (error) {
      toast.error("Failed to add brand");
    }
  };

  const handleDeleteBrand = async (brandId: string) => {
    if (!window.confirm("Are you sure you want to delete this brand?")) return;
    try {
      await repairProductService.deleteBrand(brandId);
      toast.success("Brand removed");
      fetchProductData();
    } catch (error) {
      toast.error("Failed to delete brand");
    }
  };

  const handleAddIssue = async () => {
    if (!newIssue.issue_name) {
      toast.error("Issue name is required");
      return;
    }
    if (!isEdit) {
      toast.error("Please save the product first before adding issues");
      return;
    }

    try {
      await repairProductService.addIssue(id!, {
        issue_name: newIssue.issue_name,
        base_price: newIssue.base_price === '' ? null : Number(newIssue.base_price)
      });
      toast.success("Issue added");
      setNewIssue({ issue_name: '', base_price: '' });
      fetchProductData();
    } catch (error) {
      toast.error("Failed to add issue");
    }
  };

  const handleDeleteIssue = async (issueId: string) => {
    if (!window.confirm("Are you sure you want to delete this issue?")) return;
    try {
      await repairProductService.deleteIssue(issueId);
      toast.success("Issue removed");
      fetchProductData();
    } catch (error) {
      toast.error("Failed to delete issue");
    }
  };

  if (loading) return <div className="p-8 text-center">Loading product data...</div>;

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-20">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button variant="ghost" size="icon" asChild>
            <Link to="/admin/repair-products">
              <ChevronLeft className="h-4 w-4" />
            </Link>
          </Button>
          <h1 className="text-2xl font-bold tracking-tight">
            {isEdit ? `Edit ${formData.name}` : 'Add New Repair Product'}
          </h1>
        </div>
        <Button onClick={handleSubmit} disabled={saving}>
          {saving ? <div className="h-4 w-4 border-2 border-white border-t-transparent animate-spin rounded-full mr-2" /> : <Save className="mr-2 h-4 w-4" />}
          {isEdit ? 'Save Changes' : 'Create Product'}
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2 space-y-6">
          {/* Section 1: Basic Information */}
          <Card className="p-6">
            <div className="flex items-center space-x-2 mb-6 border-b pb-4">
              <div className="p-2 bg-blue-500/10 rounded">
                <Wrench className="h-5 w-5 text-blue-500" />
              </div>
              <h2 className="text-lg font-semibold">Basic Information</h2>
            </div>
            
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Product Name (e.g. Laptop, Mobile Phone)</Label>
                  <Input 
                    id="name" 
                    value={formData.name} 
                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Enter product name"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="category">Category</Label>
                  <select 
                    id="category"
                    className="w-full bg-background border rounded-md px-3 py-2 text-sm"
                    value={formData.category}
                    onChange={e => setFormData({ ...formData, category: e.target.value as RepairCategory })}
                  >
                    <option value="Laptop & Computer">Laptop & Computer</option>
                    <option value="Mobile & Tablet">Mobile & Tablet</option>
                    <option value="TV & Display">TV & Display</option>
                    <option value="CCTV & Security">CCTV & Security</option>
                    <option value="Audio & Speaker">Audio & Speaker</option>
                    <option value="Printer & Scanner">Printer & Scanner</option>
                    <option value="Gaming Console">Gaming Console</option>
                    <option value="Other Electronics">Other Electronics</option>
                  </select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Short Description (Customer facing)</Label>
                <Textarea 
                  id="description" 
                  value={formData.description}
                  onChange={e => setFormData({ ...formData, description: e.target.value })}
                  placeholder="A brief explanation of repair services offered for this product"
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="image_url">Image URL</Label>
                  <Input 
                    id="image_url" 
                    value={formData.image_url}
                    onChange={e => setFormData({ ...formData, image_url: e.target.value })}
                    placeholder="https://example.com/image.jpg"
                  />
                </div>
                <div className="flex items-center justify-between p-3 border rounded-md bg-muted/30">
                  <div>
                    <Label htmlFor="status">Frontend Visibility</Label>
                    <p className="text-xs text-muted-foreground">Toggle to show/hide in service center</p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Label className="text-xs font-normal">{formData.status === 'active' ? 'Active' : 'Inactive'}</Label>
                    <Switch 
                      id="status"
                      checked={formData.status === 'active'}
                      onCheckedChange={checked => setFormData({ ...formData, status: checked ? 'active' : 'inactive' })}
                    />
                  </div>
                </div>
              </div>
            </div>
          </Card>

          {/* Section 2: Repair Details */}
          <Card className="p-6">
            <div className="flex items-center space-x-2 mb-6 border-b pb-4">
              <div className="p-2 bg-amber-500/10 rounded">
                <ShieldCheck className="h-5 w-5 text-amber-500" />
              </div>
              <h2 className="text-lg font-semibold">Repair & Service Details</h2>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="sla_days">SLA / Turnaround Time</Label>
                  <div className="relative">
                    <Clock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input 
                      id="sla_days" 
                      value={formData.sla_days}
                      onChange={e => setFormData({ ...formData, sla_days: e.target.value })}
                      placeholder="e.g. 3-5 working days"
                      className="pl-9"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="starting_price">Starting Price (NPR)</Label>
                  <Input 
                    id="starting_price" 
                    type="number"
                    value={formData.starting_price}
                    onChange={e => setFormData({ ...formData, starting_price: Number(e.target.value) })}
                    placeholder="0.00"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="warranty">Repair Warranty</Label>
                  <Input 
                    id="warranty" 
                    value={formData.repair_warranty}
                    onChange={e => setFormData({ ...formData, repair_warranty: e.target.value })}
                    placeholder="e.g. 30 days"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="home_pickup">Home Pickup Availability</Label>
                  <select 
                    id="home_pickup"
                    className="w-full bg-background border rounded-md px-3 py-2 text-sm"
                    value={formData.home_pickup}
                    onChange={e => setFormData({ ...formData, home_pickup: e.target.value as 'yes' | 'no' | 'partial' })}
                  >
                    <option value="yes">Available Everywhere</option>
                    <option value="no">Not Available</option>
                    <option value="partial">Selected Areas Only</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center justify-between p-3 border rounded-md bg-muted/30">
                  <div className="flex items-center space-x-2">
                    <Truck className="h-4 w-4 text-muted-foreground" />
                    <Label htmlFor="express">Express Repair Available</Label>
                  </div>
                  <Switch 
                    id="express"
                    checked={formData.express_available}
                    onCheckedChange={checked => setFormData({ ...formData, express_available: checked })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="technician">Technician Type</Label>
                  <select 
                    id="technician"
                    className="w-full bg-background border rounded-md px-3 py-2 text-sm"
                    value={formData.technician_type}
                    onChange={e => setFormData({ ...formData, technician_type: e.target.value })}
                  >
                    <option value="Laptop technician">Laptop technician</option>
                    <option value="Mobile technician">Mobile technician</option>
                    <option value="TV technician">TV technician</option>
                    <option value="CCTV technician">CCTV technician</option>
                    <option value="Printer technician">Printer technician</option>
                    <option value="General electronics technician">General electronics technician</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="priority">Service Priority Level</Label>
                  <select 
                    id="priority"
                    className="w-full bg-background border rounded-md px-3 py-2 text-sm"
                    value={formData.priority}
                    onChange={e => setFormData({ ...formData, priority: e.target.value as RepairProduct['priority'] })}
                  >
                    <option value="normal">Normal Priority</option>
                    <option value="high">High Priority</option>
                    <option value="express">Express Only</option>
                  </select>
                </div>
              </div>
            </div>
          </Card>
        </div>

        <div className="space-y-6">
          {/* Section 3: Brands */}
          <Card className="p-6">
            <div className="flex items-center space-x-2 mb-4 border-b pb-2">
            <Smartphone className="h-5 w-5 text-purple-500" />
              <h2 className="text-lg font-semibold">Supported Brands</h2>
            </div>
            
            <div className="space-y-3 mb-6 max-h-[300px] overflow-y-auto pr-2">
              {brands.length === 0 ? (
                <p className="text-sm text-muted-foreground italic text-center py-4">No brands added yet.</p>
              ) : (
                brands.map(brand => (
                  <div key={brand.id} className="flex items-center justify-between p-2 border rounded-md bg-muted/20">
                    <div className="flex items-center overflow-hidden">
                      {brand.brand_logo_url && <img src={brand.brand_logo_url} className="h-6 w-6 object-contain mr-2" />}
                      <span className="text-sm truncate font-medium">{brand.brand_name}</span>
                      {brand.is_popular && <Badge variant="secondary" className="ml-2 py-0 h-4 text-[10px]">Pop</Badge>}
                    </div>
                    <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => handleDeleteBrand(brand.id)}>
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                ))
              )}
            </div>

            <div className="space-y-2 p-3 bg-muted/30 rounded-md border border-dashed">
              <Label className="text-xs uppercase text-muted-foreground font-bold">Add Brand</Label>
              <Input 
                className="h-8 text-sm" 
                placeholder="Brand Name" 
                value={newBrand.brand_name}
                onChange={e => setNewBrand({ ...newBrand, brand_name: e.target.value })}
              />
              <Input 
                className="h-8 text-sm" 
                placeholder="Logo URL (Optional)" 
                value={newBrand.brand_logo_url}
                onChange={e => setNewBrand({ ...newBrand, brand_logo_url: e.target.value })}
              />
              <div className="flex items-center space-x-2">
                <input 
                  type="checkbox" 
                  id="pop" 
                  checked={newBrand.is_popular}
                  onChange={e => setNewBrand({ ...newBrand, is_popular: e.target.checked })}
                />
                <Label htmlFor="pop" className="text-xs font-normal">Mark as Popular</Label>
              </div>
              <Button size="sm" variant="secondary" className="w-full h-8" onClick={handleAddBrand} disabled={!isEdit}>
                <Plus className="h-3 w-3 mr-1" /> Add Brand
              </Button>
              {!isEdit && <p className="text-[10px] text-amber-600 text-center">Save product first</p>}
            </div>
          </Card>

          {/* Section 4: Common Issues */}
          <Card className="p-6">
            <div className="flex items-center space-x-2 mb-4 border-b pb-2">
              <HelpCircle className="h-5 w-5 text-indigo-500" />
              <h2 className="text-lg font-semibold">Common Issues</h2>
            </div>
            
            <div className="space-y-3 mb-6 max-h-[300px] overflow-y-auto pr-2">
              {issues.length === 0 ? (
                <p className="text-sm text-muted-foreground italic text-center py-4">No issues added yet.</p>
              ) : (
                issues.map(issue => (
                  <div key={issue.id} className="flex items-center justify-between p-2 border rounded-md bg-muted/20">
                    <div className="flex flex-col min-w-0">
                      <span className="text-sm truncate font-medium">{issue.issue_name}</span>
                      {issue.base_price && <span className="text-[10px] text-muted-foreground">Est: NPR {issue.base_price}</span>}
                    </div>
                    <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => handleDeleteIssue(issue.id)}>
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                ))
              )}
            </div>

            <div className="space-y-2 p-3 bg-muted/30 rounded-md border border-dashed">
              <Label className="text-xs uppercase text-muted-foreground font-bold">Add Issue</Label>
              <Input 
                className="h-8 text-sm" 
                placeholder="Issue Name (e.g. Screen crack)" 
                value={newIssue.issue_name}
                onChange={e => setNewIssue({ ...newIssue, issue_name: e.target.value })}
              />
              <Input 
                className="h-8 text-sm" 
                placeholder="Base Price (Optional)" 
                type="number"
                value={newIssue.base_price}
                onChange={e => setNewIssue({ ...newIssue, base_price: e.target.value })}
              />
              <Button size="sm" variant="secondary" className="w-full h-8" onClick={handleAddIssue} disabled={!isEdit}>
                <Plus className="h-3 w-3 mr-1" /> Add Issue
              </Button>
              {!isEdit && <p className="text-[10px] text-amber-600 text-center">Save product first</p>}
            </div>
          </Card>
        </div>
      </div>

      <div className="flex justify-end space-x-4 pt-6 border-t">
        <Button variant="outline" asChild>
          <Link to="/admin/repair-products">Cancel</Link>
        </Button>
        <Button onClick={handleSubmit} disabled={saving}>
          {saving ? <div className="h-4 w-4 border-2 border-white border-t-transparent animate-spin rounded-full mr-2" /> : <Save className="mr-2 h-4 w-4" />}
          {isEdit ? 'Update Product' : 'Create Product'}
        </Button>
      </div>
    </div>
  );
};

export default RepairProductForm;

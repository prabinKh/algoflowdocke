import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { companyService } from "@/api/companyService";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Store, ArrowLeft } from "lucide-react";

export default function CreateCompany() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [submitting, setSubmitting] = useState(false);
  
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    category: "Electronics & Technology",
    email: "",
    phone: "",
    website: "",
    address: "",
    logo: "",
    banner: "",
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const company = await companyService.create(formData);
      toast({
        title: "Company Created Successfully",
        description: `Your company ${company.name} has been created.`,
      });
      // Redirect to the new company profile
      navigate(`/companies/${company.slug}`);
    } catch (error: unknown) {
      const err = error as Error;
      toast({
        title: "Error creating company",
        description: err.message || "Please check your inputs and try again.",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <div className="p-8 text-center">Loading...</div>;

  if (!user) {
    return (
      <div className="p-8 max-w-md mx-auto text-center mt-20">
        <h1 className="text-2xl font-bold mb-4">Access Denied</h1>
        <p className="mb-6">You must be logged in to create a company.</p>
        <Button asChild><Link to="/signin">Sign In</Link></Button>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 mt-16 max-w-3xl mb-20">
      <div className="flex items-center mb-6">
        <Button variant="ghost" size="icon" asChild className="mr-4">
          <Link to="/vendor/dashboard"><ArrowLeft className="h-5 w-5" /></Link>
        </Button>
        <div>
          <h1 className="text-3xl font-bold flex items-center">
            <Store className="mr-3 h-8 w-8 text-primary" /> Create New Company
          </h1>
          <p className="text-muted-foreground mt-1">Setup your storefront details to start selling.</p>
        </div>
      </div>

      <div className="bg-card border rounded-xl p-8 shadow-sm">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="name">Company Name *</Label>
              <Input 
                id="name" 
                name="name" 
                required 
                value={formData.name} 
                onChange={handleChange} 
                placeholder="e.g. Acme Electronics" 
              />
            </div>

            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="category">Company Category *</Label>
              <select
                id="category"
                name="category"
                required
                value={formData.category}
                onChange={handleChange}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
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
            
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="description">Description</Label>
              <Textarea 
                id="description" 
                name="description" 
                rows={4} 
                value={formData.description} 
                onChange={handleChange} 
                placeholder="Tell customers about your company and what you sell..."
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Business Email</Label>
              <Input 
                id="email" 
                name="email" 
                type="email" 
                value={formData.email} 
                onChange={handleChange} 
                placeholder="contact@acme.com" 
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">Phone Number</Label>
              <Input 
                id="phone" 
                name="phone" 
                value={formData.phone} 
                onChange={handleChange} 
                placeholder="+1 234 567 890" 
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="website">Website</Label>
              <Input 
                id="website" 
                name="website" 
                type="url" 
                value={formData.website} 
                onChange={handleChange} 
                placeholder="https://acme.com" 
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="logo">Logo URL</Label>
              <Input 
                id="logo" 
                name="logo" 
                type="url" 
                value={formData.logo} 
                onChange={handleChange} 
                placeholder="https://example.com/logo.png" 
              />
            </div>

            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="address">Business Address</Label>
              <Input 
                id="address" 
                name="address" 
                value={formData.address} 
                onChange={handleChange} 
                placeholder="123 Tech Lane, Silicon Valley, CA" 
              />
            </div>

            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="banner">Banner Image URL</Label>
              <Input 
                id="banner" 
                name="banner" 
                type="url" 
                value={formData.banner} 
                onChange={handleChange} 
                placeholder="https://example.com/banner.jpg" 
              />
              <p className="text-xs text-muted-foreground mt-1">Recommended size: 1200x300px</p>
            </div>
          </div>

          <div className="pt-6 border-t mt-8 flex justify-end gap-4">
            <Button type="button" variant="outline" asChild>
              <Link to="/vendor/dashboard">Cancel</Link>
            </Button>
            <Button type="submit" disabled={submitting} className="min-w-32">
              {submitting ? "Creating..." : "Create Company"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

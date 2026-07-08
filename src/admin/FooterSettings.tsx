import React, { useState, useEffect } from "react";
import { 
  Building2, 
  Mail, 
  Phone, 
  Clock, 
  MapPin, 
  Save, 
  Plus, 
  Trash2, 
  Eye, 
  EyeOff,
  Facebook,
  Twitter,
  Instagram,
  Linkedin,
  Youtube
} from "lucide-react";
import axiosInstance from "@/api/axiosConfig";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";

interface FooterSettingsData {
  id?: number;
  company_name: string;
  email: string;
  phone: string;
  opening_hours_weekday: string;
  opening_hours_weekend: string;
  show_store_locations: boolean;
  show_information: boolean;
  show_policies: boolean;
  show_customer_service: boolean;
  location_title: string;
  facebook_url: string;
  twitter_url: string;
  instagram_url: string;
  linkedin_url: string;
  youtube_url: string;
}

interface StoreLocation {
  id?: number;
  name: string;
  address: string;
  phone: string;
  is_active: boolean;
  order: number;
}

interface ApiError {
  response?: {
    data?: {
      detail?: string | object;
      error?: string;
    };
  };
  message?: string;
}

const FooterSettings = () => {
  const [settings, setSettings] = useState<FooterSettingsData>({
    company_name: "",
    email: "",
    phone: "",
    opening_hours_weekday: "",
    opening_hours_weekend: "",
    show_store_locations: true,
    show_information: true,
    show_policies: true,
    show_customer_service: true,
    location_title: "Our Store Locations",
    facebook_url: "",
    twitter_url: "",
    instagram_url: "",
    linkedin_url: "",
    youtube_url: ""
  });

  const [locations, setLocations] = useState<StoreLocation[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [settingsRes, locationsRes] = await Promise.all([
          axiosInstance.get("/companies/footer/current/"),
          axiosInstance.get("/companies/locations/")
        ]);
        
        setSettings(settingsRes.data);
        setLocations(locationsRes.data);
      } catch (error) {
        console.error("Error fetching data:", error);
        toast.error("Failed to load settings");
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, []);

  const handleSaveSettings = async () => {
    setSaving(true);
    try {
      await axiosInstance.patch("/companies/footer/current/", settings);
      toast.success("Footer settings saved successfully");
    } catch (error: unknown) {
      console.error("Error saving settings:", error);
      const err = error as ApiError;
      let message = "Failed to save settings";
      const detail = err.response?.data?.detail;
      message = typeof detail === 'string' ? detail : 
                (typeof detail === 'object' ? JSON.stringify(detail) : 
                (err.response?.data?.error || "Failed to save settings"));
      toast.error(message);
    } finally {
      setSaving(false);
    }
  };

  const handleAddLocation = () => {
    const newLoc: StoreLocation = {
      name: "",
      address: "",
      phone: "",
      is_active: true,
      order: locations.length + 1
    };
    setLocations([...locations, newLoc]);
  };

  const handleUpdateLocationField = (index: number, field: keyof StoreLocation, value: string | number | boolean) => {
    const newLocations = [...locations];
    newLocations[index] = { ...newLocations[index], [field]: value };
    setLocations(newLocations);
  };

  const handleRemoveLocation = async (index: number) => {
    const location = locations[index];
    if (location.id) {
      try {
        await axiosInstance.delete(`/companies/locations/${location.id}/`);
        toast.success("Location removed");
      } catch (error) {
        toast.error("Failed to remove location");
        return;
      }
    }
    setLocations(locations.filter((_, i) => i !== index));
  };

  const handleSaveLocations = async () => {
    setSaving(true);
    try {
      const promises = locations.map(loc => {
        if (loc.id) {
          return axiosInstance.put(`/companies/locations/${loc.id}/`, loc);
        } else {
          return axiosInstance.post("/companies/locations/", loc);
        }
      });
      
      const results = await Promise.all(promises);
      setLocations(results.map(res => res.data));
      toast.success("Locations saved successfully");
    } catch (error) {
      console.error("Error saving locations:", error);
      toast.error("Failed to save some locations");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="p-8 flex justify-center"><div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" /></div>;
  }

  return (
    <div className="p-4 lg:p-8 max-w-5xl mx-auto space-y-8 pb-20">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Footer Settings</h1>
          <p className="text-sm text-muted-foreground">Manage your storefront contact info and locations</p>
        </div>
        <Button onClick={handleSaveSettings} disabled={saving} className="gap-2">
          {saving ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <Save size={16} />}
          Save Footer Settings
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Contact Info */}
        <div className="space-y-6 bg-card border rounded-3xl p-6">
          <div className="flex items-center gap-2 font-bold mb-4">
            <Building2 size={18} className="text-primary" />
            Basic Information
          </div>
          
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Company Display Name</Label>
              <Input 
                value={settings.company_name} 
                onChange={e => setSettings({...settings, company_name: e.target.value})}
                placeholder="e.g. Algoflow-E"
              />
            </div>
            
            <div className="space-y-2">
              <Label>Support Email</Label>
              <Input 
                value={settings.email} 
                onChange={e => setSettings({...settings, email: e.target.value})}
                placeholder="contact@example.com"
              />
            </div>
            
            <div className="space-y-2">
              <Label>Phone Number</Label>
              <Input 
                value={settings.phone} 
                onChange={e => setSettings({...settings, phone: e.target.value})}
                placeholder="9801200..."
              />
            </div>
          </div>

          <Separator className="my-6" />

          <div className="flex items-center gap-2 font-bold mb-4">
            <Clock size={18} className="text-primary" />
            Opening Hours
          </div>
          
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Weekday Hours</Label>
              <Input 
                value={settings.opening_hours_weekday} 
                onChange={e => setSettings({...settings, opening_hours_weekday: e.target.value})}
                placeholder="Sun - Fri: 10AM - 7:30PM"
              />
            </div>
            
            <div className="space-y-2">
              <Label>Weekend Hours</Label>
              <Input 
                value={settings.opening_hours_weekend} 
                onChange={e => setSettings({...settings, opening_hours_weekend: e.target.value})}
                placeholder="Saturday: 11AM - 6PM"
              />
            </div>
          </div>
        </div>

        {/* Social & Config */}
        <div className="space-y-6 bg-card border rounded-3xl p-6">
          <div className="flex items-center gap-2 font-bold mb-4">
            <MapPin size={18} className="text-primary" />
            General Settings
          </div>
          
          <div className="flex items-center justify-between p-4 bg-muted/50 rounded-2xl">
            <div className="space-y-0.5">
              <Label>Show Store Locations</Label>
              <p className="text-xs text-muted-foreground">Toggle visibility of locations in footer</p>
            </div>
            <Switch 
              checked={settings.show_store_locations}
              onCheckedChange={checked => setSettings({...settings, show_store_locations: checked})}
            />
          </div>

          <div className="flex items-center justify-between p-4 bg-muted/50 rounded-2xl">
            <div className="space-y-0.5">
              <Label>Show Information</Label>
              <p className="text-xs text-muted-foreground">Toggle Blog, About Us, Contact Us</p>
            </div>
            <Switch 
              checked={settings.show_information}
              onCheckedChange={checked => setSettings({...settings, show_information: checked})}
            />
          </div>

          <div className="flex items-center justify-between p-4 bg-muted/50 rounded-2xl">
            <div className="space-y-0.5">
              <Label>Show Policies</Label>
              <p className="text-xs text-muted-foreground">Toggle Privacy, Returns, Terms</p>
            </div>
            <Switch 
              checked={settings.show_policies}
              onCheckedChange={checked => setSettings({...settings, show_policies: checked})}
            />
          </div>

          <div className="flex items-center justify-between p-4 bg-muted/50 rounded-2xl">
            <div className="space-y-0.5">
              <Label>Show Customer Service</Label>
              <p className="text-xs text-muted-foreground">Toggle Store, Service, Orders</p>
            </div>
            <Switch 
              checked={settings.show_customer_service}
              onCheckedChange={checked => setSettings({...settings, show_customer_service: checked})}
            />
          </div>

          <div className="space-y-2">
            <Label>Locations Section Title</Label>
            <Input 
              value={settings.location_title} 
              onChange={e => setSettings({...settings, location_title: e.target.value})}
              placeholder="Our Store Locations"
            />
          </div>

          <Separator className="my-6" />

          <div className="font-bold mb-4">Social Media Links</div>
          
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-blue-600/10 flex items-center justify-center text-blue-600">
                <Facebook size={16} />
              </div>
              <Input 
                value={settings.facebook_url} 
                onChange={e => setSettings({...settings, facebook_url: e.target.value})}
                placeholder="Facebook URL"
              />
            </div>
            
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-sky-500/10 flex items-center justify-center text-sky-500">
                <Twitter size={16} />
              </div>
              <Input 
                value={settings.twitter_url} 
                onChange={e => setSettings({...settings, twitter_url: e.target.value})}
                placeholder="Twitter URL"
              />
            </div>

            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-pink-600/10 flex items-center justify-center text-pink-600">
                <Instagram size={16} />
              </div>
              <Input 
                value={settings.instagram_url} 
                onChange={e => setSettings({...settings, instagram_url: e.target.value})}
                placeholder="Instagram URL"
              />
            </div>

            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-red-600/10 flex items-center justify-center text-red-600">
                <Youtube size={16} />
              </div>
              <Input 
                value={settings.youtube_url} 
                onChange={e => setSettings({...settings, youtube_url: e.target.value})}
                placeholder="YouTube URL"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Store Locations List */}
      <div className="bg-card border rounded-3xl p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2 font-bold">
            <MapPin size={18} className="text-primary" />
            Manage Store Locations
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={handleAddLocation} className="gap-2">
              <Plus size={14} /> Add Location
            </Button>
            <Button size="sm" onClick={handleSaveLocations} disabled={saving} className="gap-2">
              {saving ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <Save size={14} />}
              Save Locations
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {locations.map((loc, index) => (
            <div key={index} className="relative group border rounded-2xl p-4 bg-muted/20 hover:border-primary/50 transition-colors">
              <button 
                onClick={() => handleRemoveLocation(index)}
                className="absolute top-2 right-2 p-1.5 text-muted-foreground hover:text-red-500 bg-card rounded-lg opacity-0 group-hover:opacity-100 transition-opacity border"
              >
                <Trash2 size={12} />
              </button>
              
              <div className="space-y-3">
                <div className="space-y-1">
                  <Label className="text-[10px] uppercase text-muted-foreground">Location Name</Label>
                  <Input 
                    value={loc.name} 
                    onChange={e => handleUpdateLocationField(index, "name", e.target.value)}
                    placeholder="e.g. Kathmandu"
                    className="h-8 text-sm"
                  />
                </div>
                
                <div className="space-y-1">
                  <Label className="text-[10px] uppercase text-muted-foreground">Full Address</Label>
                  <textarea 
                    value={loc.address} 
                    onChange={e => handleUpdateLocationField(index, "address", e.target.value)}
                    placeholder="Street, City, Near..."
                    className="w-full bg-background border rounded-lg p-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary min-h-[60px]"
                  />
                </div>
                
                <div className="space-y-1">
                  <Label className="text-[10px] uppercase text-muted-foreground">Contact Number</Label>
                  <Input 
                    value={loc.phone} 
                    onChange={e => handleUpdateLocationField(index, "phone", e.target.value)}
                    placeholder="Phone"
                    className="h-8 text-sm"
                  />
                </div>

                <div className="flex items-center justify-between pt-2">
                  <div className="flex items-center gap-2">
                    <Label className="text-[10px] uppercase text-muted-foreground">Active</Label>
                    <Switch 
                      checked={loc.is_active}
                      onCheckedChange={checked => handleUpdateLocationField(index, "is_active", checked)}
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <Label className="text-[10px] uppercase text-muted-foreground">Order</Label>
                    <Input 
                      type="number"
                      value={loc.order} 
                      onChange={e => handleUpdateLocationField(index, "order", parseInt(e.target.value))}
                      className="h-7 w-12 text-center"
                    />
                  </div>
                </div>
              </div>
            </div>
          ))}
          
          {locations.length === 0 && (
            <div className="col-span-full py-12 flex flex-col items-center justify-center text-muted-foreground bg-muted/10 border border-dashed rounded-3xl">
              <MapPin size={32} className="mb-2 opacity-20" />
              <p>No locations added yet.</p>
              <Button variant="link" onClick={handleAddLocation}>Click here to add your first location</Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default FooterSettings;

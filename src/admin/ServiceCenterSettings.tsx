import { useState, useEffect, useCallback } from "react";
import { toast } from "sonner";
import { Plus, Trash2, Loader2, Wrench } from "lucide-react";
import { serviceCenterSettingsService, type ServiceableItem } from "@/api/serviceCenterSettingsService";
import { useStore } from "@/frontend/context/StoreContext";

export default function ServiceCenterSettings() {
  const { companySlug } = useStore();
  const [items, setItems] = useState<ServiceableItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [newItem, setNewItem] = useState<{ type: 'category' | 'brand'; name: string }>({ type: 'category', name: '' });

  const fetchData = useCallback(async () => {
    if (!companySlug) return;
    setLoading(true);
    const data = await serviceCenterSettingsService.getAll(companySlug);
    setItems(data);
    setLoading(false);
  }, [companySlug]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const seedData = async () => {
    if (!companySlug) return;
    const itemsToSeed = [
      { type: 'category', name: 'Laptop' },
      { type: 'category', name: 'Smartphone' },
      { type: 'category', name: 'Tablet' },
      { type: 'category', name: 'Smartwatch' },
      { type: 'category', name: 'Camera' },
      { type: 'brand', name: 'Apple' },
      { type: 'brand', name: 'Samsung' },
      { type: 'brand', name: 'Logitech' },
      { type: 'brand', name: 'Sony' },
      { type: 'brand', name: 'Dell' },
    ];
    setAdding(true);
    for (let i = 0; i < itemsToSeed.length; i++) {
        const item: Omit<ServiceableItem, 'id'> = itemsToSeed[i] as Omit<ServiceableItem, 'id'>;
      try {
        await serviceCenterSettingsService.create(companySlug, item);
      } catch (e) {
        console.error(`Failed to seed ${item.name}`, e);
      }
    }
    toast.success("Seeding completed");
    setAdding(false);
    fetchData();
  };

  const handleCreate = async () => {
    if (!newItem.name || !companySlug) return;
    setAdding(true);
    try {
      await serviceCenterSettingsService.create(companySlug, newItem);
      toast.success("Item added successfully");
      setNewItem({ type: 'category', name: '' });
      fetchData();
    } catch (e: unknown) {
      const error = e as { response?: { data?: { error: string } }; message: string };
      toast.error(`Failed to add item: ${error.response?.data?.error || error.message}`);
    } finally {
      setAdding(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!companySlug) return;
    try {
      await serviceCenterSettingsService.delete(companySlug, id);
      toast.success("Item deleted");
      fetchData();
    } catch (e) {
      toast.error("Failed to delete item");
    }
  };

  if (loading) return <div className="p-8"><Loader2 className="animate-spin" /></div>;

  return (
    <div className="p-8 space-y-8">
      <h1 className="text-2xl font-bold">Service Center Settings</h1>
      
      <div className="bg-gradient-to-br from-card to-accent/50 p-6 rounded-xl border space-y-4 shadow-sm">
        <h2 className="font-bold">Add New Serviceable Item</h2>
        <div className="flex gap-4">
          <select value={newItem.type} onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setNewItem({...newItem, type: e.target.value as 'category' | 'brand'})} className="border p-2 rounded bg-background">
            <option value="category">Category</option>
            <option value="brand">Brand</option>
          </select>
          <input 
            value={newItem.name} 
            onChange={e => setNewItem({...newItem, name: e.target.value})} 
            placeholder="Name" 
            className="border p-2 rounded flex-1 bg-background"
          />
          <button onClick={handleCreate} disabled={adding} className="bg-primary text-primary-foreground px-4 py-2 rounded font-bold hover:opacity-90">
            {adding ? "Adding..." : <Plus size={20} />}
          </button>
          <button onClick={seedData} disabled={adding} className="bg-secondary text-secondary-foreground px-4 py-2 rounded font-bold hover:opacity-90">
            Seed Defaults
          </button>
        </div>
      </div>

      <div className="bg-card p-6 rounded-xl border">
        <h2 className="font-bold mb-4">Current Serviceable Items</h2>
        <div className="space-y-2">
          {items.map(item => (
            <div key={item.id} className="flex justify-between items-center border-b p-2">
              <span>{item.name} <span className="text-xs bg-accent px-2 py-1 rounded ml-2">{item.type}</span></span>
              <button onClick={() => handleDelete(item.id)} className="text-destructive"><Trash2 size={16} /></button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

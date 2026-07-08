import { useState, useRef, useEffect } from "react";
import { Link, useNavigate, useOutletContext } from "react-router-dom";
import { useQueryClient, useQuery } from "@tanstack/react-query";
import { Product3DShowcase } from "@/frontend/components/Product3DShowcase";
import Stack from "@/frontend/components/Stack";
import { useAuth } from "@/context/AuthContext";
import { productService } from "@/api/productService";
import { categoryService } from "@/api/categoryService";
import { uploadService } from "@/api/uploadService";
import { brandService } from "@/api/brandService";
import { collectionService, type Collection } from "@/api/collectionService";
import { toast } from "sonner";
import { useGSAPReveal } from "@/hooks/useGSAP";
import { motion, AnimatePresence } from "motion/react";
import {
  ChevronLeft, Save, X, Image as ImageIcon, Plus, Trash2, Package,
  LayoutDashboard, CheckCircle2, TrendingUp, Upload, Box, Eye, Check,
  Settings, Truck, Star, Tag, Menu,
  Smartphone, Laptop, Tv, Headphones, Speaker, Watch, Camera, Cpu,
  Mouse, Keyboard, HardDrive, Tablet, Monitor, Printer, Wifi, Battery,
  Mic, Gamepad, Radio, Zap, Usb, Bluetooth, Power, Headset, Projector,
  Router, Server, Disc, Video, Music, Phone, Mail, Globe, Cloud, Database,
  Code, Terminal, CircuitBoard, EyeOff
} from "lucide-react";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, 
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useCategories } from "@/hooks/useCategories";
import { renderCategoryIcon, getCategoryColor } from "@/lib/icons";

const COLORS = [
  { name: "Red", hex: "#EF4444" },
  { name: "Blue", hex: "#3B82F6" },
  { name: "Black", hex: "#000000" },
  { name: "White", hex: "#FFFFFF" },
  { name: "Silver", hex: "#C0C0C0" },
];


const CATEGORY_ICONS_MAP: Record<string, string[]> = {
  "Electronics & Technology": [
    "Laptop", "Smartphone", "Headphones", "Camera", "Monitor", 
    "Cpu", "Mouse", "Keyboard", "Speaker", "Watch", 
    "Tv", "Tablet", "Gamepad", "Printer", "Wifi", 
    "Battery", "Zap", "Usb", "Bluetooth", "Router",
    "Server", "HardDrive", "Projector", "Mic", "Radio",
    "Video", "Disc", "CircuitBoard", "Power", "Headset"
  ],
  "Clothing & Fashion": [
    "Shirt", "ShoppingBag", "Briefcase", "Crown", "Gem", "Sparkles", "Smile", "Heart", 
    "Watch", "Percent", "Tag", "Gift", "User", "Wallet"
  ],
  "Cosmetics & Beauty": [
    "Sparkles", "Flower", "Flower2", "Droplet", "Heart", "Smile", "Sun", "Sprout", "Eye", 
    "GlassWater", "Wind", "Scissors", "Gift", "Percent", "Moon"
  ],
  "Home, Furniture & Garden": [
    "Home", "Armchair", "Bed", "Lamp", "Table", "Trees", "Flower", "Flower2", 
    "Sprout", "Fence", "Hammer", "Wrench", "Paintbrush", "Shovel", "Droplet"
  ],
  "Grocery & Food": [
    "Apple", "Citrus", "Banana", "Grape", "Carrot", "Egg", "Milk", "Croissant", "IceCream", 
    "Pizza", "Cookie", "GlassWater", "Cherry", "Beef", "Fish", "Soup", "Cake", "Salad", "Store", "ShoppingBasket"
  ],
  "Cafes & Coffee Shops": [
    "Coffee", "CupSoda", "GlassWater", "Cake", "Croissant", "Cookie", "IceCream", "Flame", 
    "Soup", "Utensils", "UtensilsCrossed", "Table", "Store"
  ],
  "Hotels & Lodging": [
    "Hotel", "Bed", "Home", "Key", "Calendar", "MapPin", "Map", "Compass", "ShieldCheck", 
    "Coffee", "Luggage", "ConciergeBell", "Wifi", "Tv", "Waves"
  ],
  "Pet Supplies": [
    "Dog", "Cat", "Fish", "Bird", "Bone", "Heart", "ShieldCheck", "Package", "Stethoscope"
  ],
  "Toys & Hobbies": [
    "Gamepad2", "Puzzle", "ToyBrick", "Castle", "PartyPopper", "Dribbble", "Trophy", "Ghost", "Rocket"
  ],
  "Sports & Outdoors": [
    "Dumbbell", "Trophy", "Activity", "Footprints", "Bike", "Mountain", "Tent", "Compass", "Waves"
  ],
  "Automotive & Motorcycle": [
    "Car", "Fuel", "Gauge", "Settings", "Settings2", "Wrench", "ShieldCheck", "Zap"
  ],
  "Health & Wellness": [
    "Activity", "Heart", "Stethoscope", "Pill", "Medal", "Sprout", "Leaf", "Sun"
  ],
  "Baby & Maternity": [
    "Baby", "Heart", "Sparkles", "Smile", "Gift", "Moon", "Stroller"
  ],
  "Office & School Supplies": [
    "Pencil", "Pen", "Notebook", "Bookmark", "Briefcase", "Printer", "Calculator", "Lightbulb"
  ],
  "Jewelry & Watches": [
    "Gem", "Watch", "Crown", "Sparkles", "Heart", "Gift", "Scale"
  ],
  "Books, Music & Media": [
    "Book", "Music", "Play", "Headphones", "Speaker", "Mic", "Library", "Newspaper"
  ],
  "Tools & Home Improvement": [
    "Hammer", "Wrench", "Drill", "Construction", "HardHat", "Lightbulb", "Flashlight", "Ruler"
  ],
  "Luggage & Travel Accessories": [
    "Luggage", "Briefcase", "Map", "Plane", "Train", "Bus", "Backpack", "Passport"
  ],
  "Pharmacy & Medical Supplies": [
    "Pill", "Stethoscope", "Thermometer", "FirstAid", "Activity", "ShieldCheck", "Cross"
  ]
};


const AddProduct = () => {
  const { setIsSidebarOpen } = useOutletContext<{ setIsSidebarOpen: (open: boolean) => void }>();
  const { user } = useAuth();
  const companyCategory = user?.company?.category || "Electronics & Technology";
  const presetIcons = CATEGORY_ICONS_MAP[companyCategory] || CATEGORY_ICONS_MAP["Electronics & Technology"];

  const isAdmin = user?.is_staff || user?.is_superuser;
  const containerRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [showPreview, setShowPreview] = useState(false);

  const [formData, setFormData] = useState({
    name: "",
    slug: "",
    category: "",
    categorySlug: "",
    brand: "",
    type: "",
    description: "",
    price: "",
    originalPrice: "",
    discount: "",
    stockCount: "10",
    rating: "0",
    reviews: "0",
    inStock: true,
    isNew: false,
    isBestSeller: false,
    isPopular: false,
    isOffer: false,
    freeShipping: false,
    image: "",
    images: [] as string[],
    model3D: "",
    colors: [] as { name: string; hex: string }[],
    collections: [] as string[],
    details: "",
    specs: [{ key: "", value: "" }],
    keySpecifications: [] as string[],
    features: [] as string[],
  });

  const { categories, loading: categoriesLoading } = useCategories();

  // Fetch all brands from the Brand model
  const { data: dbBrands = [], isLoading: brandsLoading } = useQuery({
    queryKey: ['brands'],
    queryFn: () => brandService.getAll(),
  });

  const { data: availableCollections = [], isLoading: collectionsLoading } = useQuery({
    queryKey: ['collections'],
    queryFn: () => collectionService.getAll(),
  });

  const [newCategory, setNewCategory] = useState("");
  const [newCategoryIcon, setNewCategoryIcon] = useState("📦");
  const [iconSearch, setIconSearch] = useState("");
  const [newCategoryIconFile, setNewCategoryIconFile] = useState<File | null>(null);
  const [mainImageFile, setMainImageFile] = useState<File | null>(null);
  const [bulkImageFiles, setBulkImageFiles] = useState<File[]>([]);
  const [model3DFile, setModel3DFile] = useState<File | null>(null);
  const [showDeleteCategoryConfirm, setShowDeleteCategoryConfirm] = useState(false);
  const [showDeleteBrandConfirm, setShowDeleteBrandConfirm] = useState(false);
  const [showDeleteTypeConfirm, setShowDeleteTypeConfirm] = useState(false);
  const [categoryArchitecture, setCategoryArchitecture] = useState<{
    subcategories: { name: string; slug: string }[];
    brands: string[];
    features: string[];
  }>({ subcategories: [], brands: [], features: [] });

  const [activeSection, setActiveSection] = useState("general");

  const [isAddingNewBrand, setIsAddingNewBrand] = useState(false);
  const [isAddingNewType, setIsAddingNewType] = useState(false);
  const [newBrandInput, setNewBrandInput] = useState("");
  const [newTypeInput, setNewTypeInput] = useState("");
  const [newTypeSlugInput, setNewTypeSlugInput] = useState("");
  const [newCollectionInput, setNewCollectionInput] = useState("");
  const [pendingDeleteCollection, setPendingDeleteCollection] = useState<{id: string, name: string} | null>(null);
  const [allBrands, setAllBrands] = useState<string[]>([]);
  const [newGlobalBrand, setNewGlobalBrand] = useState("");
  const [allocCategorySlugs, setAllocCategorySlugs] = useState<string[]>([]);

  const sections = [
    { id: "general", label: "Basic Info" },
    { id: "pricing", label: "Pricing & Stock" },
    { id: "media", label: "Media" },
    { id: "specs", label: "Specifications" },
    { id: "features", label: "Features" },
    { id: "collections", label: "Collections & Colors" }
  ];

  const scrollToSection = (id: string) => {
    setActiveSection(id);
    const element = document.getElementById(id);
    if (element) {
      const offset = 140; // Adjust based on header + subnav height
      const bodyRect = document.body.getBoundingClientRect().top;
      const elementRect = element.getBoundingClientRect().top;
      const elementPosition = elementRect - bodyRect;
      const offsetPosition = elementPosition - offset;

      window.scrollTo({
        top: offsetPosition,
        behavior: "smooth"
      });
    }
  };

  const revealOptions = useRef({ opacity: 0, y: 20, duration: 0.6, stagger: 0.05 });
  useGSAPReveal(containerRef, ".gsap-reveal", revealOptions.current);

  useEffect(() => {
    if (showPreview) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [showPreview]);

  useEffect(() => {
    // compute aggregated brands from categories and the Brand model
    const gatherBrands = () => {
      const fromCategories = categories.flatMap(c => c.brands || []);
      const fromModel = dbBrands.map(b => b.name);
      const unique = Array.from(new Set([...fromCategories, ...fromModel])).sort((a, b) => a.localeCompare(b));
      setAllBrands(unique);
    };
    gatherBrands();
  }, [categories, dbBrands]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    const val = type === "checkbox" ? (e.target as HTMLInputElement).checked : value;

    setFormData(prev => ({
      ...prev,
      [name]: val,
      // Auto-generate slug if name changes and slug is empty or matches previous auto-gen
      ...(name === "name" ? { slug: value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "") } : {})
    }));
  };

  const handleCategoryChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    const categoryName = e.target.value;
    const selectedCategory = categories.find(c => c.name === categoryName);
    const categorySlug = selectedCategory?.slug || "";

    setFormData(prev => ({
      ...prev,
      category: categoryName,
      categorySlug: categorySlug,
      brand: "", // Reset brand and type when category changes
      type: ""
    }));

    if (categorySlug) {
      try {
        const featuresData = await categoryService.getFeatures(categorySlug);
        const features = featuresData?.features || [];

        setCategoryArchitecture({
          subcategories: selectedCategory?.subcategories || [],
          brands: selectedCategory?.brands || [],
          features: features
        });

        // Auto-suggest features if available
        if (features.length > 0) {
          suggestFeatures(features);
        }
      } catch (error) {
        console.error("Error fetching category architecture:", error);
      }
    } else {
      setCategoryArchitecture({ subcategories: [], brands: [], features: [] });
    }
  };

  const handleAddNewBrand = async () => {
    if (!formData.categorySlug || !newBrandInput.trim()) return;

    try {
      const categoryData = await categoryService.getBySlug(formData.categorySlug);

      if (categoryData) {
        const currentBrands = categoryData.brands || [];
        if (!currentBrands.includes(newBrandInput.trim())) {
          const updatedBrands = [...currentBrands, newBrandInput.trim()];
          await categoryService.update(formData.categorySlug, { brands: updatedBrands });
          await queryClient.invalidateQueries({ queryKey: ['categories'] });

          setCategoryArchitecture(prev => ({ ...prev, brands: updatedBrands }));
          setFormData(prev => ({ ...prev, brand: newBrandInput.trim() }));
          setNewBrandInput("");
          setIsAddingNewBrand(false);
          toast.success(`Brand "${newBrandInput}" added to ${formData.category}`);
        } else {
          toast.error("Brand already exists in this category");
        }
      }
    } catch (error) {
      const err = error as Error;
      console.error("Error adding brand:", err);
      toast.error(err.message || "Failed to add new brand");
    }
  };

  const toggleAllocCategory = (slug: string) => {
    setAllocCategorySlugs(prev => prev.includes(slug) ? prev.filter(s => s !== slug) : [...prev, slug]);
  };

  const handleCreateGlobalBrand = async () => {
    if (!newGlobalBrand.trim()) { toast.error('Brand name required'); return; }
    try {
      const targetSlugs = allocCategorySlugs.length > 0 ? allocCategorySlugs : (formData.categorySlug ? [formData.categorySlug] : []);

      if (targetSlugs.length > 0) {
        for (const slug of targetSlugs) {
          const cat = await categoryService.getBySlug(slug);
          if (!cat) continue;
          const current = cat.brands || [];
          if (!current.includes(newGlobalBrand.trim())) {
            const updated = [...current, newGlobalBrand.trim()];
            await categoryService.update(slug, { brands: updated });
          }
        }

        await queryClient.invalidateQueries({ queryKey: ['categories'] });
        const cats = await categoryService.getAll();
        const fromCategories = cats.flatMap((c: Category) => c.brands || []);
        const unique = Array.from(new Set([...fromCategories]));
        setAllBrands(unique);
        toast.success(`Brand "${newGlobalBrand}" created and allocated`);
      } else {
        // No category selected - create brand locally so it appears in dropdown
        setAllBrands(prev => Array.from(new Set([...(prev || []), newGlobalBrand.trim()])));
        toast.success(`Brand "${newGlobalBrand}" created`);
      }

      setFormData(prev => ({ ...prev, brand: newGlobalBrand.trim() }));
      setNewGlobalBrand("");
      setAllocCategorySlugs([]);
    } catch (error) {
      const err = error as Error;
      console.error('Error creating global brand:', err);
      toast.error(err.message || 'Failed to create global brand');
    }
  };

  const handleAddNewType = async () => {
    if (!formData.categorySlug || !newTypeInput.trim() || !newTypeSlugInput.trim()) return;

    try {
      const categoryData = await categoryService.getBySlug(formData.categorySlug);

      if (categoryData) {
        const currentSubs = categoryData.subcategories || [];
        if (!currentSubs.some((s: { name: string; slug: string }) => s.slug === newTypeSlugInput.trim())) {
          const updatedSubs = [...currentSubs, { name: newTypeInput.trim(), slug: newTypeSlugInput.trim() }];
          await categoryService.update(formData.categorySlug, { subcategories: updatedSubs });

          setCategoryArchitecture(prev => ({ ...prev, subcategories: updatedSubs }));
          setFormData(prev => ({ ...prev, type: newTypeInput.trim() }));
          setNewTypeInput("");
          setNewTypeSlugInput("");
          setIsAddingNewType(false);
          toast.success(`Subcategory "${newTypeInput}" added to ${formData.category}`);
        } else {
          toast.error("Subcategory already exists in this category");
        }
      }
    } catch (error) {
      const err = error as Error;
      console.error("Error adding subcategory:", err);
      toast.error(err.message || "Failed to add new subcategory");
    }
  };

  const suggestFeatures = (features: string[]) => {
    if (!features || features.length === 0) return;
    setFormData(prev => {
      const currentKeys = prev.specs.map(s => s.key.toLowerCase());
      const newSpecs = [...prev.specs];

      features.forEach(f => {
        if (!currentKeys.includes(f.toLowerCase())) {
          if (newSpecs.length === 1 && !newSpecs[0].key && !newSpecs[0].value) {
            newSpecs[0] = { key: f, value: "" };
          } else {
            newSpecs.push({ key: f, value: "" });
          }
        }
      });

      return { ...prev, specs: newSpecs };
    });
    toast.info(`Suggested features added to specifications`);
  };

  const handleTypeChange = async (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement> | string) => {
    const newType = typeof e === 'string' ? e : e.target.value;
    setFormData(prev => ({ ...prev, type: newType }));

    if (formData.categorySlug && newType) {
      try {
        const data = await categoryService.getFeatures(formData.categorySlug);
        if (data && data.typeFeatures && data.typeFeatures[newType]) {
          suggestFeatures(data.typeFeatures[newType]);
        }
      } catch (error) {
        console.error("Error fetching type features:", error);
      }
    }
  };

  const handleAddCategory = async () => {
    if (!isAdmin) {
      toast.error("You do not have permission to add categories.");
      return;
    }
    if (!newCategory.trim()) return;
    const slug = newCategory.toLowerCase().replace(/[^a-z0-9]+/g, "-");
    if (categories.some(c => c.slug === slug)) {
      toast.error("Category already exists");
      return;
    }

    setLoading(true);
    try {
      let iconUrl = newCategoryIcon || "📦";
      if (newCategoryIconFile) {
        iconUrl = await uploadService.uploadImage(newCategoryIconFile, "categories/icons");
      }

      await categoryService.create({ name: newCategory, slug, icon: iconUrl });
      await queryClient.invalidateQueries({ queryKey: ['categories'] });

      setNewCategory("");
      setNewCategoryIcon("📦");
      setNewCategoryIconFile(null);
      toast.success("Category added and saved");
    } catch (error) {
      toast.error("Failed to add category");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteCategory = async () => {
    const selectedCategory = categories.find(c => c.name === formData.category);
    if (!selectedCategory) {
      toast.error("Please select a category to delete");
      return;
    }

    setLoading(true);
    try {
      await categoryService.delete(selectedCategory.slug);
      await categoryService.deleteFeatures(selectedCategory.slug);

      toast.success(`Category "${selectedCategory.name}" and all related products deleted`);
      setFormData(prev => ({ ...prev, category: "", categorySlug: "" }));
      setShowDeleteCategoryConfirm(false);
    } catch (error) {
      toast.error("Failed to delete category");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteBrandFromCategory = async () => {
    if (!formData.categorySlug || !formData.brand) {
      toast.error("Please select a category and brand to delete");
      return;
    }

    try {
      const categoryData = await categoryService.getBySlug(formData.categorySlug);

      if (categoryData) {
        const currentBrands = categoryData.brands || [];
        const updatedBrands = currentBrands.filter((b: string) => b !== formData.brand);

        await categoryService.update(formData.categorySlug, { brands: updatedBrands });

        setCategoryArchitecture(prev => ({ ...prev, brands: updatedBrands }));
        setFormData(prev => ({ ...prev, brand: updatedBrands.length > 0 ? updatedBrands[0] : "" }));
        setShowDeleteBrandConfirm(false);
        toast.success(`Brand "${formData.brand}" deleted from category`);
      }
    } catch (error: unknown) {
      console.error("Error deleting brand:", error);
      toast.error((error as Error).message || "Failed to delete brand");
    }
  };

  const handleAddBrandToCategory = async () => {
    if (!formData.categorySlug || !formData.brand.trim()) {
      toast.error("Please select a category and enter a brand name");
      return;
    }

    try {
      const categoryData = await categoryService.getBySlug(formData.categorySlug);
      if (!categoryData) {
        toast.error("Category not found");
        return;
      }

      const currentBrands = categoryData.brands || [];
      if (currentBrands.includes(formData.brand.trim())) {
        toast.error("Brand already exists in this category");
        return;
      }

      const newBrands = [...currentBrands, formData.brand.trim()];
      await categoryService.update(formData.categorySlug, { brands: newBrands });

      // Also try to create a global brand record if it doesn't exist
      try {
        await brandService.createBrand({
          name: formData.brand.trim(),
          slug: formData.brand.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-"),
          is_active: true
        });
        await queryClient.invalidateQueries({ queryKey: ['brands'] });
      } catch (e) {
        // Ignore if brand already exists globally
        console.log("Brand might already exist globally:", e);
      }

      setCategoryArchitecture(prev => ({ ...prev, brands: newBrands }));
      toast.success(`Brand "${formData.brand}" added to category`);
    } catch (error: unknown) {
      console.error("Error adding brand to category:", error);
      toast.error((error as Error).message || "Failed to add brand to category");
    }
  };

  const handleDeleteType = async () => {
    if (!formData.categorySlug || !formData.type) {
      toast.error("Please select a category and type to delete");
      return;
    }

    try {
      const categoryData = await categoryService.getBySlug(formData.categorySlug);

      if (categoryData) {
        const currentTypes = categoryData.subcategories || [];
        const newTypes = currentTypes.filter((t: { name: string; slug: string }) => t.name !== formData.type && t.slug !== formData.type);

        await categoryService.update(formData.categorySlug, { subcategories: newTypes });

        setCategoryArchitecture(prev => ({ ...prev, subcategories: prev.subcategories.filter(s => s.name !== formData.type) }));
        setFormData(prev => ({ ...prev, type: newTypes.length > 0 ? newTypes[0].name : "" }));
        setShowDeleteTypeConfirm(false);
        toast.success(`Product type "${formData.type}" deleted from category`);
      }
    } catch (error: unknown) {
      console.error("Error deleting type:", error);
      toast.error((error as Error).message || "Failed to delete type");
    }
  };

  const handleAddType = async () => {
    if (!formData.categorySlug || !formData.type.trim()) {
      toast.error("Please select a category and enter a type name");
      return;
    }

    try {
      const categoryData = await categoryService.getBySlug(formData.categorySlug);
      if (!categoryData) {
        toast.error("Category not found");
        return;
      }

      const currentTypes = categoryData.subcategories || [];
      if (currentTypes.some((t: { name: string }) => t.name === formData.type.trim())) {
        toast.error("Type already exists in this category");
        return;
      }

      const newTypeObj = { name: formData.type.trim(), slug: formData.type.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-") };
      const newTypes = [...currentTypes, newTypeObj];

      await categoryService.update(formData.categorySlug, { subcategories: newTypes });

      setCategoryArchitecture(prev => ({ ...prev, subcategories: newTypes }));
      toast.success(`Product type "${formData.type}" added to category`);
    } catch (error: unknown) {
      console.error("Error adding type:", error);
      toast.error((error as Error).message || "Failed to add type");
    }
  };



  const handleColorToggle = (color: { name: string; hex: string }) => {
    setFormData(prev => {
      const exists = prev.colors.find(c => c.name === color.name);
      if (exists) {
        return { ...prev, colors: prev.colors.filter(c => c.name !== color.name) };
      } else {
        return { ...prev, colors: [...prev.colors, color] };
      }
    });
  };

  const handleCollectionToggle = (collection: string) => {
    setFormData(prev => {
      const exists = prev.collections.includes(collection);
      if (exists) {
        return { ...prev, collections: prev.collections.filter(c => c !== collection) };
      } else {
        return { ...prev, collections: [...prev.collections, collection] };
      }
    });
  };

  const handleAddCollection = async () => {
    if (!newCollectionInput.trim()) return;
    try {
      await collectionService.create(newCollectionInput.trim());
      await queryClient.invalidateQueries({ queryKey: ['collections'] });
      setNewCollectionInput("");
      toast.success(`Collection "${newCollectionInput}" added`);
    } catch (error) {
      toast.error("Failed to add collection");
    }
  };

  const handleDeleteCollection = async (id: string, name: string) => {
    setPendingDeleteCollection({ id, name });
  };

  const executeDeleteCollection = async () => {
    if (!pendingDeleteCollection) return;
    const { id, name } = pendingDeleteCollection;
    
    try {
      await collectionService.delete(id);
      await queryClient.invalidateQueries({ queryKey: ["collections"] });
      await queryClient.invalidateQueries({ queryKey: ["collections", "public"] });
      
      setFormData((prev) => ({ ...prev, collections: prev.collections.filter((c) => c !== name) }));
      toast.success(`Collection "${name}" deleted`);
      setPendingDeleteCollection(null);
    } catch (error) {
      toast.error("Failed to delete collection");
    }
  };

  const handleCategoryIconUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setNewCategoryIconFile(e.target.files[0]);
      setNewCategoryIcon(URL.createObjectURL(e.target.files[0]));
    }
  };

  const handleMainImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setMainImageFile(e.target.files[0]);
      setFormData(prev => ({ ...prev, image: URL.createObjectURL(e.target.files![0]) }));
    }
  };

  const handleBulkImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files);
      if (formData.images.length + files.length > 8) {
        toast.error("You can only upload up to 8 images in total.");
        return;
      }
      setBulkImageFiles(prev => [...prev, ...files]);
      const urls = files.map(f => URL.createObjectURL(f));
      setFormData(prev => ({ ...prev, images: [...prev.images, ...urls] }));
    }
  };

  const handleSingleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      if (formData.images.length >= 8) {
        toast.error("You can only upload up to 8 images.");
        return;
      }
      const file = e.target.files[0];
      setBulkImageFiles(prev => [...prev, file]);
      const url = URL.createObjectURL(file);
      setFormData(prev => ({ ...prev, images: [...prev.images, url] }));
    }
  };

  const handle3DModelUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setModel3DFile(e.target.files[0]);
      toast.success("3D Model selected");
    }
  };

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();

    if (!user || !isAdmin) {
      toast.error("You do not have permission to add products.");
      return;
    }

    if (!formData.name.trim() || !formData.slug.trim()) {
      toast.error("Product name and slug are required.");
      return;
    }

    if (!formData.brand?.trim()) {
      toast.error("Product brand is required.");
      return;
    }

    setLoading(true);

    try {
      // Upload files
      let mainImageUrl = formData.image;
      if (mainImageFile) {
        mainImageUrl = await uploadService.uploadImage(mainImageFile, "products/main");
      }

      const bulkImageUrls: string[] = [];
      const existingBulkImages = formData.images.filter(img => !img.startsWith("blob:"));
      bulkImageUrls.push(...existingBulkImages);
      
      for (const file of bulkImageFiles) {
        const url = await uploadService.uploadImage(file, "products/gallery");
        bulkImageUrls.push(url);
      }

      let model3DUrl = formData.model3D;
      if (model3DFile) {
        model3DUrl = await uploadService.uploadModel(model3DFile);
      }

      // Preparation
      const detailedSpecs: Record<string, string> = {};
      formData.specs.forEach(spec => {
        if (spec.key.trim() && spec.value.trim()) {
          detailedSpecs[spec.key.trim()] = spec.value.trim();
        }
      });
      
      const keySpecifications = formData.keySpecifications.filter(s => s.trim() !== "");

      // === CRITICAL FIX: Resolve Category and Brand IDs ===
      const catObj = categories.find(c => c.slug === formData.categorySlug || c.name === formData.category);
      const categoryId = catObj?.id || formData.categorySlug || formData.category;

      let brandId: number | string | null = null;
      const brandObj = dbBrands.find((b: { name: string; id?: number | string }) => 
        b.name.toLowerCase() === formData.brand.toLowerCase()
      );

      if (brandObj?.id) {
        brandId = brandObj.id;
      } else {
        // Auto-create brand if not found
        try {
          const newBrandResponse = await brandService.createBrand({
            name: formData.brand.trim(),
            slug: formData.brand.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
            is_active: true,
          });
          brandId = newBrandResponse.id;
          await queryClient.invalidateQueries({ queryKey: ['brands'] });
          toast.success(`New brand "${formData.brand}" created`);
        } catch (brandErr) {
          console.error("Brand creation failed:", brandErr);
          // Fallback: send the string name if creation fails (backend will handle it)
          brandId = formData.brand as unknown as number;
        }
      }

      const productData = {
        ...formData,
        name: formData.name,
        slug: formData.slug,
        category: categoryId,
        categorySlug: (formData.categorySlug || formData.category).toLowerCase(),
        brand: brandId,
        image: mainImageUrl,
        images: bulkImageUrls,
        model3D: model3DUrl,
        price: Number(formData.price.toString().replace(/,/g, '')),
        originalPrice: formData.originalPrice ? Number(formData.originalPrice.toString().replace(/,/g, '')) : null,
        discount: Number(formData.discount || 0),
        stockCount: Number(formData.stockCount || 0),
        rating: Number(formData.rating || 0),
        reviews: Number(formData.reviews || 0),
        specs: formData.specs.map(s => `${s.key}: ${s.value}`).filter(s => s.trim() !== ": "),
        detailedSpecs,
        details: formData.details,
        keySpecifications,
      };

      console.log("✅ Final data being sent to backend:", productData);

      await productService.create(productData);
      await queryClient.invalidateQueries({ queryKey: ['products'] });

      toast.success("Product added successfully!");
      setSuccess(true);

      setTimeout(() => {
        navigate("/admin/products");
      }, 1800);

    } catch (error: unknown) {
      console.error("Error adding product:", error);
      const axiosError = error as { response?: { data?: { brand?: string[]; detail?: string } }; message?: string };
      const errorMsg = axiosError?.response?.data?.brand?.[0] || 
                      axiosError?.response?.data?.detail || 
                      axiosError.message || 
                      "Failed to add product";
      toast.error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const handleArrayChange = (index: number, value: string, type: "specs" | "images", field?: "key" | "value") => {
    if (type === "specs" && field) {
      const newSpecs = [...formData.specs];
      newSpecs[index] = { ...newSpecs[index], [field]: value };
      setFormData(prev => ({ ...prev, specs: newSpecs }));
    } else if (type === "images") {
      const newImages = [...formData.images];
      newImages[index] = value;
      setFormData(prev => ({ ...prev, images: newImages }));
    }
  };

  const addArrayItem = (type: "specs" | "images") => {
    const newItem = type === "specs" ? { key: "", value: "" } : "";
    setFormData(prev => ({ ...prev, [type]: [...prev[type], newItem] }));
  };

  const removeArrayItem = (index: number, type: "specs" | "images") => {
    if (type === "images") {
      // If it's a blob URL, we might want to remove it from bulkImageFiles too
      // but for simplicity we'll just filter the display array
    }
    const newArray = formData[type].filter((_, i) => i !== index);
    setFormData(prev => ({ ...prev, [type]: newArray }));
  };

  const getBusinessIcon = (category?: string) => {
    switch (category) {
      case "Electronics & Technology": return "🔌";
      case "Clothing & Fashion": return "👗";
      case "Cosmetics & Beauty": return "💄";
      case "Grocery & Food": return "🛒";
      case "Home, Furniture & Garden": return "🏡";
      case "Cafes & Coffee Shops": return "☕";
      case "Hotels & Lodging": return "🏨";
      case "Pet Supplies": return "🐾";
      case "Toys & Hobbies": return "🧸";
      case "Sports & Outdoors": return "⚽";
      case "Automotive & Motorcycle": return "🏎️";
      case "Health & Wellness": return "🌿";
      case "Baby & Maternity": return "👶";
      case "Office & School Supplies": return "📚";
      case "Jewelry & Watches": return "💎";
      case "Books, Music & Media": return "🎵";
      case "Tools & Home Improvement": return "🛠️";
      case "Luggage & Travel Accessories": return "🧳";
      case "Pharmacy & Medical Supplies": return "💊";
      default: return "🏢";
    }
  };

  if (success) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background p-6">
        <div className="text-center space-y-4 animate-in fade-in zoom-in duration-500">
          <div className="w-20 h-20 bg-emerald-500/10 text-emerald-500 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle2 size={40} className="animate-bounce" />
          </div>
          <h1 className="text-3xl font-display font-bold">Product Created!</h1>
          <p className="text-muted-foreground">Redirecting you back to the dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col min-w-0 min-h-full pb-20 lg:pb-0" ref={containerRef}>
      {!showPreview && (
        <div className="sticky top-0 lg:top-0 z-40 bg-card/80 backdrop-blur-md border-b border-border shadow-sm">
          <div className="neo-container flex items-center justify-between h-12 overflow-x-auto no-scrollbar">
            <div className="flex items-center gap-4 sm:gap-8">
              {sections.map(section => (
                <button
                  key={section.id}
                  type="button"
                  onClick={() => scrollToSection(section.id)}
                  className={`text-[10px] sm:text-xs font-bold uppercase tracking-widest whitespace-nowrap transition-all relative py-4
                    ${activeSection === section.id ? "text-primary" : "text-muted-foreground hover:text-foreground"}`}
                >
                  {section.label}
                  {activeSection === section.id && (
                    <motion.div
                      layoutId="activeSection"
                      className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary rounded-full"
                    />
                  )}
                </button>
              ))}
            </div>
            <div className="flex items-center gap-2 ml-4">
              <button
                type="button"
                onClick={handleSubmit}
                disabled={loading}
                className="flex items-center gap-2 px-4 py-1.5 bg-primary text-primary-foreground rounded-lg text-xs font-bold hover:bg-primary/90 transition-all shadow-lg shadow-primary/20 disabled:opacity-50"
              >
                <Save size={14} />
                <span className="hidden sm:inline">Save Product</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {!showPreview ? (
        <main className="neo-container py-8 max-w-4xl mx-auto">
          <div className="flex items-center justify-between mb-8 gsap-reveal">
            <div className="flex items-center gap-4">
              <button
                onClick={() => navigate("/admin")}
                className="p-2 hover:bg-accent rounded-full transition-colors"
              >
                <ChevronLeft size={24} />
              </button>
              <div>
                <div className="flex items-center gap-2 text-primary mb-1">
                  <LayoutDashboard size={14} />
                  <span className="text-[10px] font-bold uppercase tracking-widest">Admin</span>
                </div>
                <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
                  <h1 className="text-2xl font-display font-bold">Add New Product</h1>
                  {user?.company?.category && (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/10 text-primary text-[11px] font-bold uppercase tracking-wider border border-primary/20 shadow-sm self-start sm:self-auto">
                      <span>{getBusinessIcon(user?.company?.category)}</span>
                      <span>{user?.company?.category}</span>
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-8">
            {/* Basic Info */}
            <section id="general" className="bg-card border border-border rounded-2xl p-6 shadow-sm gsap-reveal">
              <div className="flex items-center gap-2 mb-6">
                <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                  <Package size={18} />
                </div>
                <h2 className="text-sm font-bold uppercase tracking-widest">Basic Information</h2>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground ml-1">Product Name</label>
                  <textarea
                    required
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    placeholder="e.g. Dell XPS 13"
                    className="w-full bg-accent/30 border border-border rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-primary/20 outline-none transition-all resize-none h-10 min-h-[40px]"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground ml-1">URL Slug</label>
                  <input
                    required
                    name="slug"
                    value={formData.slug}
                    onChange={handleInputChange}
                    placeholder="e.g. dell-xps-13"
                    className="w-full bg-accent/30 border border-border rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                  />
                </div>

                <div className="md:col-span-2 space-y-2">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground ml-1">Summary Description</label>
                  <textarea
                    required
                    name="description"
                    value={formData.description}
                    onChange={handleInputChange}
                    placeholder="Short description for cards and search results..."
                    className="w-full bg-accent/30 border border-border rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-primary/20 outline-none transition-all resize-none h-24"
                  />
                </div>

                <div className="md:col-span-2 space-y-2">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground ml-1">Detailed Highlights (Details)</label>
                  <textarea
                    name="details"
                    value={formData.details}
                    onChange={handleInputChange}
                    placeholder="Comprehensive details, features, and selling points..."
                    className="w-full bg-accent/30 border border-border rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-primary/20 outline-none transition-all resize-none min-h-[160px]"
                  />
                </div>

                <div className="space-y-4">
                  <div className="flex flex-col gap-4">
                    <div className="flex items-center justify-between">
                      <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground ml-1">Category Selection</label>
                      <div className="flex gap-2">
                        {formData.category && (
                          <button
                            type="button"
                            onClick={() => setShowDeleteCategoryConfirm(true)}
                            className="text-destructive hover:text-destructive/80 transition-colors"
                          >
                            <Trash2 size={14} />
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Dynamic Category Quick Select */}
                    <div className="bg-accent/10 border border-border/50 rounded-2xl p-4">
                      <h4 className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-3">Quick Select Category</h4>
                      {categoriesLoading ? (
                        <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
                          {[1, 2, 3, 4, 5, 6].map(i => (
                            <div key={i} className="h-20 bg-muted/20 animate-pulse rounded-xl" />
                          ))}
                        </div>
                      ) : (
                        <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
                          {categories.map((cat) => {
                            const isSelected = formData.categorySlug === cat.slug;
                            const catColor = getCategoryColor(cat.name);
                            return (
                              <button
                                key={cat.slug}
                                type="button"
                                onClick={() => handleCategoryChange({ target: { value: cat.name } } as React.ChangeEvent<HTMLSelectElement>)}
                                className={`flex flex-col items-center justify-center p-4 rounded-2xl border transition-all gap-3 group relative overflow-hidden
                                ${isSelected
                                    ? "border-transparent text-white shadow-lg"
                                    : "bg-background border-border/50 text-muted-foreground hover:border-primary/30"}`}
                                style={{
                                  backgroundColor: isSelected ? catColor : undefined,
                                  boxShadow: isSelected ? `0 10px 20px -5px ${catColor}40` : undefined
                                }}
                              >
                                <div
                                  className={`text-3xl transition-transform duration-300 ${isSelected ? "scale-110" : "group-hover:scale-110"}`}
                                  style={{ color: isSelected ? "white" : catColor }}
                                >
                                  {renderCategoryIcon(cat.icon)}
                                </div>
                                <span className={`text-[10px] font-bold text-center leading-tight truncate w-full ${isSelected ? "text-white" : "text-foreground/70"}`}>
                                  {cat.name}
                                </span>

                                {/* Selection Indicator */}
                                {isSelected && (
                                  <motion.div
                                    layoutId="selection-glow"
                                    className="absolute inset-0 bg-white/10 pointer-events-none"
                                  />
                                )}
                              </button>
                            );
                          })}
                        </div>
                      )}
                    </div>

                    <div className="flex gap-3 items-end">
                      <div className="flex-1 space-y-3">
                        <div className="space-y-1.5">
                          <label className="text-[10px] font-bold text-muted-foreground ml-1">New Category Name</label>
                          <input
                            value={newCategory}
                            onChange={(e) => setNewCategory(e.target.value)}
                            placeholder="Enter category name"
                            className="w-full bg-accent/20 border border-border rounded-xl px-3 py-2 text-xs outline-none focus:border-primary/50"
                          />
                        </div>

                        <div className="space-y-2">
                          <label className="text-[10px] font-bold text-muted-foreground ml-1 flex items-center gap-2">
                            Select Icon <span className="text-[9px] font-normal opacity-60">(Selected: {newCategoryIcon || "None"})</span>
                          </label>
                          <input
                            type="text"
                            value={iconSearch}
                            onChange={(e) => setIconSearch(e.target.value)}
                            placeholder="🔍 Search icons by name..."
                            className="w-full bg-accent/20 border border-border rounded-xl px-3 py-1.5 text-xs outline-none focus:border-primary/50"
                          />
                          <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-6 gap-2 bg-accent/10 p-3 rounded-xl border border-border/50 max-h-60 overflow-y-auto no-scrollbar">
                            {presetIcons.filter(icon => icon.toLowerCase().includes(iconSearch.toLowerCase())).map(icon => {
                              const iconColor = getCategoryColor(icon);
                              const isSelected = newCategoryIcon === icon;
                              return (
                                <button
                                  key={icon}
                                  type="button"
                                  onClick={() => {
                                    setNewCategoryIcon(icon);
                                    if (!newCategory || presetIcons.includes(newCategory)) {
                                      setNewCategory(icon);
                                    }
                                  }}
                                  className={`flex flex-col items-center justify-center p-2 rounded-xl border transition-all gap-1.5 group relative overflow-hidden
                                  ${isSelected 
                                      ? "border-transparent text-white shadow-md" 
                                      : "bg-background border-border/50 text-muted-foreground hover:border-primary/30"}`}
                                  style={{
                                    backgroundColor: isSelected ? iconColor : undefined,
                                    boxShadow: isSelected ? `0 4px 10px -2px ${iconColor}40` : undefined
                                  }}
                                  title={icon}
                                >
                                  <div
                                    className={`transition-transform duration-300 ${isSelected ? "scale-110" : "group-hover:scale-110"}`}
                                    style={{ color: isSelected ? "white" : iconColor }}
                                  >
                                    {renderCategoryIcon(icon, 18)}
                                  </div>
                                  <span className={`text-[8px] font-bold text-center leading-tight truncate w-full ${isSelected ? "text-white" : "text-foreground/70"}`}>
                                    {icon}
                                  </span>
                                </button>
                              );
                            })}
                            <label className="flex flex-col items-center justify-center p-2 rounded-xl text-muted-foreground bg-background hover:border-primary/30 cursor-pointer border border-dashed border-border/50 transition-all gap-1.5 hover:text-primary">
                              <Upload size={18} />
                              <span className="text-[8px] font-bold text-center leading-tight truncate w-full">Upload</span>
                              <input type="file" accept="image/*" className="hidden" onChange={handleCategoryIconUpload} />
                            </label>
                          </div>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={handleAddCategory}
                        className="h-10 px-6 bg-primary text-white rounded-xl font-bold text-xs hover:bg-primary/90 transition-all flex items-center gap-2 shadow-lg shadow-primary/20"
                        disabled={loading || !newCategory || !newCategoryIcon}
                      >
                        <Plus size={14} /> Add Category
                      </button>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-muted-foreground ml-1">Select Existing Category</label>
                    <select
                      required
                      name="category"
                      value={formData.category}
                      onChange={handleCategoryChange}
                      className="w-full bg-accent/30 border border-border rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-primary/20 outline-none"
                    >
                      <option value="">Select Category</option>
                      {categories.map(c => (
                        <option key={c.slug} value={c.name}>{c.name}</option>
                      ))}
                    </select>
                  </div>

                  <AnimatePresence>
                    {showDeleteCategoryConfirm && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        className="mt-2 p-3 bg-destructive/10 border border-destructive/20 rounded-xl overflow-hidden"
                      >
                        <p className="text-[10px] text-destructive font-bold mb-2">Delete category "{formData.category}" and ALL its products?</p>
                        <div className="flex gap-2">
                          <button
                            type="button"
                            onClick={handleDeleteCategory}
                            className="px-3 py-1 bg-destructive text-white text-[10px] font-bold rounded-lg hover:bg-destructive/90"
                          >
                            Confirm Delete
                          </button>
                          <button
                            type="button"
                            onClick={() => setShowDeleteCategoryConfirm(false)}
                            className="px-3 py-1 bg-accent text-foreground text-[10px] font-bold rounded-lg hover:bg-accent/80"
                          >
                            Cancel
                          </button>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {formData.category && (
                    <div className="mt-4 bg-muted/30 p-4 rounded-xl border border-border/50">
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-2">
                          <Settings size={14} className="text-primary" />
                          <h3 className="text-xs font-bold uppercase tracking-wider">Category Settings: {formData.category}</h3>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground ml-1">Brand</label>
                    <button
                      type="button"
                      onClick={() => setIsAddingNewBrand(!isAddingNewBrand)}
                      className="text-[10px] font-bold text-primary hover:underline"
                    >
                      {isAddingNewBrand ? "Cancel" : "+ Add New"}
                    </button>
                  </div>

                  {!isAddingNewBrand ? (
                    <div className="space-y-2">
                      <div className="flex gap-2">
                        <select
                          name="brand"
                          value={formData.brand}
                          onChange={handleInputChange}
                          className="flex-1 bg-accent/30 border border-border rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-primary/20 outline-none"
                        >
                          <option value="">Select Brand</option>
                          {Array.from(new Set(allBrands || [])).sort().map(brand => (
                            <option key={brand} value={brand}>{brand}</option>
                          ))}
                        </select>
                        <button type="button" onClick={() => setFormData(prev => ({ ...prev, brand: "" }))} className="px-3 py-2 bg-accent rounded-xl border border-border text-xs">Clear</button>
                      </div>

                      {/* Show category specific brands as quick-select badges */}
                      {categoryArchitecture.brands.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 mt-2">
                          <span className="text-[8px] font-bold uppercase text-muted-foreground/60 w-full mb-1 ml-1">Category Brands:</span>
                          {categoryArchitecture.brands.map(brand => (
                            <div
                              key={brand}
                              onClick={() => setFormData(prev => ({ ...prev, brand }))}
                              className={`group flex items-center gap-1 px-2 py-1 rounded-lg border text-[10px] font-medium cursor-pointer transition-all ${formData.brand === brand
                                  ? "bg-primary/10 border-primary text-primary"
                                  : "bg-accent/20 border-border hover:border-primary/30 text-muted-foreground"
                                }`}
                            >
                              <span>{brand}</span>
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setFormData(prev => ({ ...prev, brand }));
                                  setShowDeleteBrandConfirm(true);
                                }}
                                className={`hover:text-destructive transition-colors ${formData.brand === brand ? "text-primary/70" : "text-muted-foreground opacity-0 group-hover:opacity-100"}`}
                              >
                                <X size={10} />
                              </button>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* All existing brands across categories */}
                      {allBrands.length > 0 && (
                        <div className="mt-3">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-[10px] font-bold uppercase text-muted-foreground ml-1">All Brands</span>
                            <span className="text-[10px] text-muted-foreground">Click to select</span>
                          </div>
                          <div className="flex flex-wrap gap-2">
                            {allBrands.map(b => (
                              <button
                                key={b}
                                type="button"
                                onClick={() => setFormData(prev => ({ ...prev, brand: b }))}
                                className={`px-3 py-1 rounded-full text-xs font-medium border ${formData.brand === b ? 'bg-primary/10 border-primary text-primary' : 'bg-accent/20 border-border text-muted-foreground hover:border-primary'}`}
                              >
                                {b}
                              </button>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Create & allocate brand globally */}
                      <div className="mt-3 p-3 bg-accent/10 border border-border rounded-xl">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-[10px] font-bold uppercase text-muted-foreground">Create & Allocate Brand</span>
                          <span className="text-[10px] text-muted-foreground">Allocate to categories</span>
                        </div>
                        <div className="flex gap-2 items-center mb-2">
                          <input
                            value={newGlobalBrand}
                            onChange={(e) => setNewGlobalBrand(e.target.value)}
                            placeholder="Brand name e.g. Sony"
                            className="flex-1 bg-accent/20 border border-border rounded-xl px-3 py-2 text-xs outline-none"
                          />
                          <button type="button" onClick={handleCreateGlobalBrand} className="px-3 py-2 bg-primary text-white rounded-xl text-xs font-bold">Create</button>
                        </div>
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-36 overflow-y-auto">
                          {categories.map(c => (
                            <label key={c.slug} className="flex items-center gap-2 text-xs">
                              <input type="checkbox" checked={allocCategorySlugs.includes(c.slug)} onChange={() => toggleAllocCategory(c.slug)} className="w-4 h-4" />
                              <span className="truncate">{c.name}</span>
                            </label>
                          ))}
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="flex gap-2 animate-in fade-in slide-in-from-top-2 duration-300">
                      <input
                        value={newBrandInput}
                        onChange={(e) => setNewBrandInput(e.target.value)}
                        placeholder="Brand Name"
                        className="w-full bg-accent/30 border border-border rounded-xl px-3 py-2 text-xs outline-none focus:border-primary/50"
                      />
                      <button
                        type="button"
                        onClick={handleAddNewBrand}
                        className="bg-primary text-primary-foreground px-4 rounded-xl hover:bg-primary/90 transition-all flex items-center justify-center"
                      >
                        <Plus size={16} />
                      </button>
                    </div>
                  )}

                  <AnimatePresence>
                    {showDeleteBrandConfirm && (
                      <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="p-3 bg-destructive/10 border border-destructive/20 rounded-xl mb-3"
                      >
                        <p className="text-[10px] text-destructive font-bold mb-2">Delete brand "{formData.brand}" from {formData.category}?</p>
                        <div className="flex gap-2">
                          <button
                            type="button"
                            onClick={handleDeleteBrandFromCategory}
                            className="px-3 py-1 bg-destructive text-white text-[10px] font-bold rounded-lg hover:bg-destructive/90"
                          >
                            Confirm Delete
                          </button>
                          <button
                            type="button"
                            onClick={() => setShowDeleteBrandConfirm(false)}
                            className="px-3 py-1 bg-accent border border-border text-[10px] font-bold rounded-lg hover:bg-accent/80"
                          >
                            Cancel
                          </button>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground ml-1">Subcategory / Type</label>
                    <button
                      type="button"
                      onClick={() => setIsAddingNewType(!isAddingNewType)}
                      className="text-[10px] font-bold text-primary hover:underline"
                    >
                      {isAddingNewType ? "Cancel" : "+ Add New"}
                    </button>
                  </div>

                  {/* Type Selection / Badges */}
                  <div className="flex flex-wrap gap-2 mb-2">
                    {categoryArchitecture.subcategories.map(type => (
                      <div
                        key={type.slug}
                        onClick={() => setFormData(prev => ({ ...prev, type: type.name }))}
                        className={`group flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs font-medium cursor-pointer transition-all ${formData.type === type.name
                            ? "bg-primary border-primary text-primary-foreground shadow-sm shadow-primary/20"
                            : "bg-accent/30 border-border hover:border-primary/50 text-foreground"
                          }`}
                      >
                        <span>{type.name}</span>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setFormData(prev => ({ ...prev, type: type.name }));
                            setShowDeleteTypeConfirm(true);
                          }}
                          className={`hover:text-destructive transition-colors ${formData.type === type.name ? "text-primary-foreground/70" : "text-muted-foreground opacity-0 group-hover:opacity-100"}`}
                        >
                          <X size={12} />
                        </button>
                      </div>
                    ))}
                    {categoryArchitecture.subcategories.length === 0 && !isAddingNewType && (
                      <p className="text-[10px] text-muted-foreground italic ml-1">No types added yet.</p>
                    )}
                  </div>

                  <AnimatePresence>
                    {showDeleteTypeConfirm && (
                      <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="p-3 bg-destructive/10 border border-destructive/20 rounded-xl mb-3"
                      >
                        <p className="text-[10px] text-destructive font-bold mb-2">Delete type "{formData.type}" from {formData.category}?</p>
                        <div className="flex gap-2">
                          <button
                            type="button"
                            onClick={handleDeleteType}
                            className="px-3 py-1 bg-destructive text-white text-[10px] font-bold rounded-lg hover:bg-destructive/90"
                          >
                            Confirm Delete
                          </button>
                          <button
                            type="button"
                            onClick={() => setShowDeleteTypeConfirm(false)}
                            className="px-3 py-1 bg-accent border border-border text-[10px] font-bold rounded-lg hover:bg-accent/80"
                          >
                            Cancel
                          </button>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {isAddingNewType && (
                    <div className="space-y-2 p-3 bg-accent/20 rounded-xl border border-border/50 animate-in fade-in slide-in-from-top-2 duration-300">
                      <div className="flex gap-2">
                        <div className="flex-1 space-y-1">
                          <label className="text-[8px] font-bold uppercase text-muted-foreground ml-1">Name</label>
                          <input
                            value={newTypeInput}
                            onChange={(e) => {
                              setNewTypeInput(e.target.value);
                              setNewTypeSlugInput(e.target.value.toLowerCase().replace(/[^a-z0-9]+/g, "-"));
                            }}
                            placeholder="e.g. Gaming Laptops"
                            className="w-full bg-accent/30 border border-border rounded-xl px-3 py-2 text-xs outline-none focus:border-primary/50"
                          />
                        </div>
                        <div className="flex-1 space-y-1">
                          <label className="text-[8px] font-bold uppercase text-muted-foreground ml-1">Slug</label>
                          <input
                            value={newTypeSlugInput}
                            onChange={(e) => setNewTypeSlugInput(e.target.value)}
                            placeholder="e.g. gaming-laptops"
                            className="w-full bg-accent/30 border border-border rounded-xl px-3 py-2 text-xs outline-none focus:border-primary/50"
                          />
                        </div>
                      </div>
                      <div className="flex justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => setIsAddingNewType(false)}
                          className="px-3 py-1.5 text-[10px] font-bold text-muted-foreground hover:text-foreground transition-colors"
                        >
                          Cancel
                        </button>
                        <button
                          type="button"
                          onClick={handleAddNewType}
                          className="px-4 py-1.5 bg-primary text-primary-foreground rounded-lg text-[10px] font-bold hover:bg-primary/90 transition-all flex items-center gap-1.5"
                        >
                          <Plus size={12} /> Add Type
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                <div className="space-y-2 md:col-span-2">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground ml-1">Short Description</label>
                  <textarea
                    name="description"
                    value={formData.description}
                    onChange={handleInputChange}
                    placeholder="Brief overview of the product..."
                    rows={3}
                    className="w-full bg-accent/30 border border-border rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-primary/20 outline-none transition-all resize-none"
                  />
                </div>
              </div>
            </section>

            {/* Pricing & Inventory */}
            <section id="pricing" className="bg-card border border-border rounded-2xl p-6 shadow-sm gsap-reveal">
              <div className="flex items-center gap-2 mb-6">
                <Package size={18} className="text-primary" />
                <h2 className="text-sm font-bold uppercase tracking-widest">Pricing & Inventory</h2>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Price (PKR)</label>
                  <input
                    required
                    type="number"
                    name="price"
                    value={formData.price}
                    onChange={handleInputChange}
                    placeholder="0.00"
                    className="w-full bg-accent/30 border border-border rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-primary/20 outline-none"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Original Price</label>
                  <input
                    type="number"
                    name="originalPrice"
                    value={formData.originalPrice}
                    onChange={handleInputChange}
                    placeholder="Optional"
                    className="w-full bg-accent/30 border border-border rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-primary/20 outline-none"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Discount (%)</label>
                  <input
                    type="number"
                    name="discount"
                    value={formData.discount}
                    onChange={handleInputChange}
                    placeholder="Optional"
                    className="w-full bg-accent/30 border border-border rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-primary/20 outline-none"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Stock Count</label>
                  <input
                    type="number"
                    name="stockCount"
                    value={formData.stockCount}
                    onChange={handleInputChange}
                    placeholder="0"
                    className="w-full bg-accent/30 border border-border rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-primary/20 outline-none"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Rating (0-5)</label>
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    max="5"
                    name="rating"
                    value={formData.rating}
                    onChange={handleInputChange}
                    placeholder="4.5"
                    className="w-full bg-accent/30 border border-border rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-primary/20 outline-none"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Reviews Count</label>
                  <input
                    type="number"
                    name="reviews"
                    value={formData.reviews}
                    onChange={handleInputChange}
                    placeholder="0"
                    className="w-full bg-accent/30 border border-border rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-primary/20 outline-none"
                  />
                </div>

                <div className="flex flex-wrap items-center gap-6 pt-6">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      name="inStock"
                      checked={formData.inStock}
                      onChange={handleInputChange}
                      className="w-4 h-4 rounded border-border text-primary focus:ring-primary accent-primary"
                    />
                    <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">In Stock</span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      name="isNew"
                      checked={formData.isNew}
                      onChange={handleInputChange}
                      className="w-4 h-4 rounded border-border text-primary focus:ring-primary accent-primary"
                    />
                    <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1">
                      <Star size={12} className="text-yellow-500" />
                      New Arrival
                    </span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      name="isBestSeller"
                      checked={formData.isBestSeller}
                      onChange={handleInputChange}
                      className="w-4 h-4 rounded border-border text-primary focus:ring-primary accent-primary"
                    />
                    <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1">
                      <CheckCircle2 size={12} className="text-blue-500" />
                      Best Seller
                    </span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      name="isPopular"
                      checked={formData.isPopular}
                      onChange={handleInputChange}
                      className="w-4 h-4 rounded border-border text-primary focus:ring-primary accent-primary"
                    />
                    <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1">
                      <TrendingUp size={12} className="text-orange-500" />
                      Popular
                    </span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      name="isOffer"
                      checked={formData.isOffer}
                      onChange={handleInputChange}
                      className="w-4 h-4 rounded border-border text-primary focus:ring-primary accent-primary"
                    />
                    <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1">
                      <Tag size={12} className="text-emerald-500" />
                      Offer
                    </span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      name="freeShipping"
                      checked={formData.freeShipping}
                      onChange={handleInputChange}
                      className="w-4 h-4 rounded border-border text-primary focus:ring-primary accent-primary"
                    />
                    <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1">
                      <Truck size={12} className="text-primary" />
                      Free Shipping
                    </span>
                  </label>
                </div>
              </div>
            </section>

            {/* Features */}
            <section id="features" className="bg-card border border-border rounded-2xl p-6 shadow-sm gsap-reveal">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-2">
                  <Star size={18} className="text-primary" />
                  <h2 className="text-sm font-bold uppercase tracking-widest">Product Features</h2>
                </div>
                <button
                  type="button"
                  onClick={() => setFormData(prev => ({ ...prev, features: [...prev.features, ""] }))}
                  className="flex items-center gap-2 px-4 py-2 bg-primary/10 text-primary rounded-xl text-xs font-bold hover:bg-primary/20 transition-colors"
                >
                  <Plus size={14} /> Add Feature
                </button>
              </div>

              <div className="space-y-4">
                {formData.features.map((feature, index) => (
                  <div key={index} className="flex gap-4 animate-in slide-in-from-left-2 duration-300">
                    <div className="flex-1">
                      <input
                        value={feature}
                        onChange={(e) => {
                          const newFeatures = [...formData.features];
                          newFeatures[index] = e.target.value;
                          setFormData(prev => ({ ...prev, features: newFeatures }));
                        }}
                        placeholder="e.g. Noise Cancellation, 12-hour Battery Life"
                        className="w-full bg-accent/30 border border-border rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-primary/20 outline-none"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() => setFormData(prev => ({
                        ...prev,
                        features: prev.features.filter((_, i) => i !== index)
                      }))}
                      className="p-2.5 text-rose-500 hover:bg-rose-500/10 rounded-xl transition-colors"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                ))}
                {formData.features.length === 0 && (
                  <div className="text-center py-8 border-2 border-dashed border-border rounded-2xl">
                    <p className="text-sm text-muted-foreground">No features added yet. Click "Add Feature" to start.</p>
                  </div>
                )}
              </div>
            </section>

            {/* Product Collections */}
            <section id="collections" className="bg-card border border-border rounded-2xl p-6 shadow-sm gsap-reveal">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-2">
                  <Plus size={18} className="text-primary" />
                  <h2 className="text-sm font-bold uppercase tracking-widest">Product Collections</h2>
                </div>
              </div>

              <div className="space-y-6">
                <div className="flex gap-3 items-end">
                  <div className="flex-1 space-y-1.5">
                    <label className="text-[10px] font-bold text-muted-foreground ml-1">Add New Collection</label>
                    <input
                      value={newCollectionInput}
                      onChange={(e) => setNewCollectionInput(e.target.value)}
                      placeholder="e.g. Summer Sale, Back to School"
                      className="w-full bg-accent/20 border border-border rounded-xl px-4 py-2 text-xs outline-none focus:border-primary/50"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={handleAddCollection}
                    disabled={!newCollectionInput.trim()}
                    className="h-9 px-4 bg-primary/10 text-primary rounded-xl font-bold text-[10px] uppercase tracking-wider hover:bg-primary/20 transition-all flex items-center gap-2 disabled:opacity-50"
                  >
                    <Plus size={14} /> Add
                  </button>
                </div>

                <div className="flex flex-wrap gap-3">
                  {collectionsLoading ? (
                    <div className="flex gap-2">
                      {[1, 2, 3].map(i => <div key={i} className="w-24 h-8 bg-muted animate-pulse rounded-xl" />)}
                    </div>
                  ) : (
                    availableCollections.map((coll: Collection) => {
                      const isSelected = formData.collections.includes(coll.name);
                      return (
                        <div key={coll.id} className="relative group/coll">
                          <button
                            type="button"
                            onClick={() => handleCollectionToggle(coll.name)}
                            className={`px-4 py-2 rounded-xl border text-xs font-bold uppercase tracking-widest transition-all ${isSelected
                                ? "border-primary bg-primary/5 text-primary ring-1 ring-primary"
                                : "border-border bg-accent/30 text-muted-foreground hover:bg-accent/50"
                              }`}
                          >
                            {coll.name}
                          </button>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteCollection(coll.id, coll.name);
                            }}
                            className="absolute -top-2 -right-2 w-5 h-5 bg-rose-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover/coll:opacity-100 transition-opacity shadow-lg"
                          >
                            <X size={10} />
                          </button>
                        </div>
                      );
                    })
                  )}
                  {!collectionsLoading && availableCollections.length === 0 && (
                    <p className="text-xs text-muted-foreground italic">No custom collections created yet.</p>
                  )}
                </div>
              </div>
            </section>

            {/* Media & Appearance */}
            <section id="media" className="bg-card border border-border rounded-2xl p-6 shadow-sm gsap-reveal">
              <div className="flex items-center gap-2 mb-6">
                <ImageIcon size={18} className="text-primary" />
                <h2 className="text-sm font-bold uppercase tracking-widest">Media & Appearance</h2>
              </div>

              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Main Image</label>
                    <div className="flex flex-col gap-4">
                      <div className="flex gap-2">
                        <input
                          name="image"
                          value={formData.image}
                          onChange={handleInputChange}
                          placeholder="URL or Upload ->"
                          className="flex-1 bg-accent/30 border border-border rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-primary/20 outline-none"
                        />
                        <label className="cursor-pointer bg-primary/10 text-primary p-2.5 rounded-xl hover:bg-primary/20 transition-colors">
                          <Upload size={18} />
                          <input type="file" accept="image/*" className="hidden" onChange={handleMainImageUpload} />
                        </label>
                      </div>
                      {formData.image && (
                        <div className="relative w-24 h-24 rounded-xl overflow-hidden border border-border">
                          <img src={formData.image} alt="Preview" className="w-full h-full object-cover" />
                          <button
                            type="button"
                            onClick={() => { setFormData(prev => ({ ...prev, image: "" })); setMainImageFile(null); }}
                            className="absolute top-1 right-1 p-1 bg-black/50 text-white rounded-full hover:bg-black/70"
                          >
                            <X size={12} />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">3D Model (.glb/.gltf)</label>
                    <div className="flex gap-2">
                      <input
                        name="model3D"
                        value={formData.model3D}
                        onChange={handleInputChange}
                        placeholder="URL or Upload ->"
                        className="flex-1 bg-accent/30 border border-border rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-primary/20 outline-none"
                      />
                      <label className="cursor-pointer bg-primary/10 text-primary p-2.5 rounded-xl hover:bg-primary/20 transition-colors">
                        <Box size={18} />
                        <input type="file" accept=".glb,.gltf" className="hidden" onChange={handle3DModelUpload} />
                      </label>
                    </div>
                    {model3DFile && <p className="text-[10px] text-emerald-500 font-medium">Selected: {model3DFile.name}</p>}
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Available Colors</label>
                  <div className="flex flex-wrap gap-3">
                    {COLORS.map(color => {
                      const isSelected = formData.colors.some(c => c.name === color.name);
                      return (
                        <button
                          key={color.name}
                          type="button"
                          onClick={() => handleColorToggle(color)}
                          className={`flex items-center gap-2 px-3 py-2 rounded-xl border transition-all ${isSelected ? "border-primary bg-primary/5 ring-1 ring-primary" : "border-border bg-accent/30 hover:bg-accent/50"
                            }`}
                        >
                          <div
                            className="w-4 h-4 rounded-full border border-border"
                            style={{ backgroundColor: color.hex }}
                          />
                          <span className="text-xs font-medium">{color.name}</span>
                          {isSelected && <Check size={12} className="text-primary" />}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Gallery Images</label>
                    <div className="flex gap-4">
                      <label className="cursor-pointer text-[10px] font-bold uppercase tracking-widest text-primary hover:underline flex items-center gap-1">
                        <Upload size={12} /> Add Image
                        <input type="file" accept="image/*" className="hidden" onChange={handleSingleImageUpload} />
                      </label>
                      <label className="cursor-pointer text-[10px] font-bold uppercase tracking-widest text-primary hover:underline flex items-center gap-1">
                        <Upload size={12} /> Bulk Upload
                        <input type="file" multiple accept="image/*" className="hidden" onChange={handleBulkImageUpload} />
                      </label>
                      <label className="cursor-pointer text-[10px] font-bold uppercase tracking-widest text-primary hover:underline flex items-center gap-1">
                        <Upload size={12} /> Folder Upload
                        <input
                          type="file"
                          multiple
                          accept="image/*"
                          className="hidden"
                          onChange={handleBulkImageUpload}
                          // @ts-expect-error: webkitdirectory and directory are not standard HTML attributes but are needed for folder upload
                          webkitdirectory="true"
                          directory="true"
                        />
                      </label>
                      <button
                        type="button"
                        onClick={() => addArrayItem("images")}
                        className="text-[10px] font-bold uppercase tracking-widest text-primary hover:underline flex items-center gap-1"
                      >
                        <Plus size={12} /> Add URL
                      </button>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                    {formData.images.map((img, i) => (
                      <div key={i} className="relative group aspect-square rounded-xl overflow-hidden border border-border bg-accent/20">
                        {img ? (
                          <img src={img} alt={`Gallery ${i}`} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                            <ImageIcon size={24} />
                          </div>
                        )}
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                          <button
                            type="button"
                            onClick={() => removeArrayItem(i, "images")}
                            className="p-2 bg-rose-500 text-white rounded-lg hover:bg-rose-600 transition-colors"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </div>
                    ))}
                    {formData.images.length === 0 && (
                      <div className="col-span-full py-8 border-2 border-dashed border-border rounded-xl flex flex-col items-center justify-center text-muted-foreground">
                        <ImageIcon size={32} className="mb-2 opacity-20" />
                        <p className="text-xs">No gallery images added</p>
                      </div>
                    )}
                  </div>
                  {formData.images.length > 0 && (
                    <div className="h-64 w-64 mx-auto mt-8">
                      <Stack
                        cards={formData.images.map((img, i) => (
                          <img key={i} src={img} alt={`Gallery ${i}`} className="w-full h-full object-cover" />
                        ))}
                      />
                    </div>
                  )}
                </div>
              </div>
            </section>

            {/* Specifications */}
            <section id="specs" className="bg-card border border-border rounded-2xl p-6 shadow-sm gsap-reveal">
              <div className="flex items-center gap-2 mb-6">
                <Package size={18} className="text-primary" />
                <h2 className="text-sm font-bold uppercase tracking-widest">Key Specifications & Technical Data</h2>
              </div>

              <div className="space-y-8">
                {/* Key Specifications (Bullet points) */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">General Key Specifications</label>
                    <button
                      type="button"
                      onClick={() => setFormData(prev => ({ ...prev, keySpecifications: [...prev.keySpecifications, ""] }))}
                      className="text-[10px] font-bold uppercase tracking-widest text-primary hover:underline flex items-center gap-1"
                    >
                      <Plus size={12} /> Add Key Spec
                    </button>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {formData.keySpecifications.map((spec, i) => (
                      <div key={i} className="flex gap-2">
                        <input
                          value={spec}
                          onChange={(e) => {
                            const newSpecs = [...formData.keySpecifications];
                            newSpecs[i] = e.target.value;
                            setFormData(prev => ({ ...prev, keySpecifications: newSpecs }));
                          }}
                          placeholder="e.g. 1 Year Official Warranty"
                          className="flex-1 bg-accent/30 border border-border rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-primary/20 outline-none"
                        />
                        <button
                          type="button"
                          onClick={() => setFormData(prev => ({ ...prev, keySpecifications: prev.keySpecifications.filter((_, idx) => idx !== i) }))}
                          className="p-2.5 text-muted-foreground hover:text-rose-500 hover:bg-rose-500/5 rounded-xl transition-all"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="h-px bg-border/50" />

                {/* Technical Specs (Table data) */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Detailed Technical Specifications</label>
                    <button
                      type="button"
                      onClick={() => addArrayItem("specs")}
                      className="text-[10px] font-bold uppercase tracking-widest text-primary hover:underline flex items-center gap-1"
                    >
                      <Plus size={12} /> Add Tech Prop
                    </button>
                  </div>
                  <div className="space-y-3">
                    {formData.specs.map((spec, i) => (
                      <div key={i} className="flex flex-col sm:flex-row gap-3">
                        <input
                          value={spec.key}
                          onChange={(e) => handleArrayChange(i, e.target.value, "specs", "key")}
                          placeholder="Property (e.g. RAM)"
                          className="flex-1 bg-accent/30 border border-border rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-primary/20 outline-none"
                        />
                        <input
                          value={spec.value}
                          onChange={(e) => handleArrayChange(i, e.target.value, "specs", "value")}
                          placeholder="Value (e.g. 16GB)"
                          className="flex-1 bg-accent/30 border border-border rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-primary/20 outline-none"
                        />
                        <button
                          type="button"
                          onClick={() => removeArrayItem(i, "specs")}
                          className="p-2.5 text-muted-foreground hover:text-rose-500 hover:bg-rose-500/5 rounded-xl transition-all self-end sm:self-auto"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </section>

            <div className="flex gap-4 pt-4 gsap-reveal">
              <button
                type="button"
                onClick={() => setShowPreview(true)}
                className="flex-1 btn-outline py-4 rounded-2xl font-bold uppercase tracking-widest flex items-center justify-center gap-2"
              >
                <Eye size={18} />
                Preview
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex-1 btn-primary py-4 rounded-2xl font-bold uppercase tracking-widest shadow-lg shadow-primary/20 flex items-center justify-center gap-2"
              >
                {loading ? (
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <Save size={18} />
                    Save Product
                  </>
                )}
              </button>
            </div>
          </form>
        </main>
      ) : (
        <main className="neo-container py-8 pt-24 max-w-5xl mx-auto">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-4">
              <button
                onClick={() => setShowPreview(false)}
                className="p-2 hover:bg-accent rounded-full transition-colors"
              >
                <ChevronLeft size={24} />
              </button>
              <div>
                <div className="flex items-center gap-2 text-primary mb-1">
                  <Eye size={14} />
                  <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Preview Mode</span>
                </div>
                <h1 className="text-2xl font-display font-bold">Product Preview</h1>
              </div>
            </div>
            <div className="hidden sm:flex items-center gap-3">
              <button
                onClick={() => setShowPreview(false)}
                className="btn-outline px-6 py-2.5 rounded-xl text-xs font-bold uppercase tracking-widest"
              >
                Back to Edit
              </button>
              <button
                onClick={() => { setShowPreview(false); handleSubmit(); }}
                disabled={loading}
                className="btn-primary px-6 py-2.5 rounded-xl text-xs font-bold uppercase tracking-widest flex items-center gap-2"
              >
                {loading ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <Save size={16} />}
                Publish Product
              </button>
            </div>
          </div>

          <div className="bg-card border border-border rounded-[2.5rem] overflow-hidden shadow-sm mb-20">
            <div className="p-6 sm:p-12 space-y-12">
              {/* Main Product Section (Mimicking Detail Page) */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-16">
                {/* Left: Image/3D Showcase */}
                <div className="space-y-6">
                  <div className="aspect-[4/5] sm:aspect-square rounded-3xl overflow-hidden border border-border bg-accent/20 relative group">
                    {formData.image ? (
                      <img src={formData.image} alt="Preview" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                    ) : (
                      <div className="w-full h-full flex flex-col items-center justify-center text-muted-foreground gap-3">
                        <ImageIcon size={48} className="opacity-20" />
                        <span className="text-xs font-bold uppercase tracking-widest">No Main Image</span>
                      </div>
                    )}

                    {formData.discount && (
                      <div className="absolute top-4 left-4 bg-primary text-white text-[10px] font-bold px-3 py-1.5 rounded-full shadow-lg">
                        {formData.discount}% OFF
                      </div>
                    )}
                  </div>

                  {/* Gallery Strip */}
                  <div className="flex gap-3 overflow-x-auto pb-2 no-scrollbar">
                    {formData.images.map((img, i) => (
                      <div key={i} className="w-20 h-20 flex-shrink-0 rounded-xl border border-border overflow-hidden bg-accent/20">
                        <img src={img} alt={`Gallery ${i}`} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                      </div>
                    ))}
                  </div>
                </div>

                {/* Right: Info */}
                <div className="space-y-8">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-primary">{formData.brand || "Brand Name"}</span>
                      <div className="w-1 h-1 rounded-full bg-border" />
                      <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground">{formData.category || "Category"}</span>
                    </div>
                    <h4 className="text-3xl sm:text-4xl font-display font-bold tracking-tight leading-tight">{formData.name || "Product Name"}</h4>
                  </div>

                  <div className="flex items-baseline gap-3">
                    <span className="text-3xl font-bold tracking-tight">PKR {formData.price || "0"}</span>
                    {formData.originalPrice && (
                      <span className="text-lg text-muted-foreground line-through decoration-primary/40">PKR {formData.originalPrice}</span>
                    )}
                  </div>

                  <div className="space-y-4">
                    <h5 className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Available Colors</h5>
                    <div className="flex flex-wrap gap-3">
                      {formData.colors.map(c => (
                        <div key={c.name} className="group relative">
                          <div className="w-8 h-8 rounded-full border-2 border-border p-0.5 transition-transform group-hover:scale-110">
                            <div className="w-full h-full rounded-full shadow-inner" style={{ backgroundColor: c.hex }} />
                          </div>
                          <span className="absolute -bottom-6 left-1/2 -translate-x-1/2 text-[8px] font-bold uppercase opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">{c.name}</span>
                        </div>
                      ))}
                      {formData.colors.length === 0 && <span className="text-xs text-muted-foreground italic">No colors selected</span>}
                    </div>
                  </div>

                  <div className="space-y-4 pt-4 border-t border-border">
                    <h5 className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Quick Specs</h5>
                    <div className="grid grid-cols-2 gap-3">
                      {formData.specs.slice(0, 4).map((s, i) => (
                        <div key={i} className="flex items-center gap-2 text-xs">
                          <div className="w-1.5 h-1.5 rounded-full bg-primary/40" />
                          <span className="font-medium text-muted-foreground">{s.key}:</span>
                          <span className="font-bold">{s.value}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2 pt-4">
                    {formData.collections.map(c => (
                      <span key={c} className="px-3 py-1.5 bg-accent/50 text-[9px] font-bold uppercase tracking-widest rounded-full border border-border">
                        {c}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {/* 3D Showcase Section */}
              {(formData.image || formData.model3D) && (
                <div className="pt-12 border-t border-border">
                  <Product3DShowcase
                    mainImage={formData.image}
                    additionalImages={formData.images}
                    model3D={formData.model3D}
                  />
                </div>
              )}

              {/* Tabs Section */}
              <div className="space-y-6 pt-12 border-t border-border">
                <div className="flex gap-8 border-b border-border">
                  {(["description", "specs"] as const).map(tab => (
                    <button
                      key={tab}
                      onClick={() => setActiveTab(tab)}
                      className={`pb-4 text-xs font-bold uppercase tracking-widest transition-all border-b-2 ${activeTab === tab ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"
                        }`}
                    >
                      {tab === "specs" ? "Specifications" : "Description"}
                    </button>
                  ))}
                </div>

                <div className="min-h-[200px]">
                  {activeTab === "description" ? (
                    <p className="text-sm text-muted-foreground leading-relaxed max-w-2xl">
                      {formData.description || "No description provided for this product."}
                    </p>
                  ) : (
                    <div className="max-w-2xl grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {formData.specs.filter(s => s.key && s.value).map((s, i) => (
                        <div key={i} className="flex items-center justify-between p-4 bg-accent/30 rounded-2xl border border-border">
                          <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">{s.key}</span>
                          <span className="text-sm font-bold">{s.value}</span>
                        </div>
                      ))}
                      {formData.specs.filter(s => s.key && s.value).length === 0 && (
                        <p className="text-xs text-muted-foreground italic col-span-full">No detailed specifications added.</p>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Footer Actions */}
            <div className="p-6 sm:p-12 border-t border-border flex flex-col sm:flex-row gap-4 bg-accent/10">
              <button
                onClick={() => setShowPreview(false)}
                className="flex-1 btn-outline py-4 rounded-2xl font-bold uppercase tracking-widest text-xs"
              >
                Back to Edit
              </button>
              <button
                onClick={() => { setShowPreview(false); handleSubmit(); }}
                disabled={loading}
                className="flex-1 btn-primary py-4 rounded-2xl font-bold uppercase tracking-widest text-xs flex items-center justify-center gap-2 shadow-xl shadow-primary/20"
              >
                {loading ? (
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <CheckCircle2 size={18} />
                    Publish Product
                  </>
                )}
              </button>
            </div>
          </div>
        </main>
      )}
      {/* Confirmation Modal */}
      {pendingDeleteCollection && (
        <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-card border border-border rounded-lg shadow-lg max-w-sm w-full p-6 space-y-4">
            <h2 className="text-lg font-bold">Are you sure?</h2>
            <p className="text-sm text-muted-foreground">
              Are you sure you want to delete "{pendingDeleteCollection.name}"? This action cannot be undone and will remove the collection from all products and the storefront.
            </p>
            <div className="flex justify-end gap-2">
              <button 
                onClick={() => setPendingDeleteCollection(null)}
                className="px-4 py-2 bg-secondary text-secondary-foreground rounded-lg text-sm font-semibold hover:bg-secondary/80"
              >
                Cancel
              </button>
              <button 
                onClick={executeDeleteCollection}
                className="px-4 py-2 bg-rose-500 text-white rounded-lg text-sm font-semibold hover:bg-rose-600"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AddProduct;

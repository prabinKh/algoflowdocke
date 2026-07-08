import { useState, useRef, useEffect } from "react";
import { Link, useNavigate, useParams, useOutletContext } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { Product3DShowcase } from "@/frontend/components/Product3DShowcase";
import { useAuth } from "@/context/AuthContext";
import { productService } from "@/api/productService";
import { categoryService } from "@/api/categoryService";
import { uploadService } from "@/api/uploadService";
import { type Category, type Brand } from "@/lib/types";
import { 
  ChevronLeft, Save, X, Image as ImageIcon, Plus, Trash2, Package, 
  LayoutDashboard, CheckCircle2, TrendingUp, Upload, Box, Eye, Check, 
  Settings, Truck, Star, Tag, Menu,
  Smartphone, Laptop, Tv, Headphones, Speaker, Watch, Camera, Cpu, 
  Mouse, Keyboard, HardDrive, Tablet, Monitor, Printer, Wifi, Battery, 
  Mic, Gamepad, Radio, Zap, Usb, Bluetooth, Power, Headset, Projector,
  Router, Server, Disc, Video, Music, Phone, Mail, Globe, Cloud, Database, 
  Code, Terminal, CircuitBoard
} from "lucide-react";
import { toast } from "sonner";
import { useGSAPReveal } from "@/hooks/useGSAP";
import { useCategories } from "@/hooks/useCategories";
import { brandService } from "@/api/brandService";
import { collectionService, type Collection } from "@/api/collectionService";
import { useQuery } from "@tanstack/react-query";
import { motion, AnimatePresence } from "motion/react";
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


const EditProduct = () => {
  const { setIsSidebarOpen } = useOutletContext<{ setIsSidebarOpen: (open: boolean) => void }>();
  const { user } = useAuth();
  const companyCategory = user?.company?.category || "Electronics & Technology";
  const presetIcons = CATEGORY_ICONS_MAP[companyCategory] || CATEGORY_ICONS_MAP["Electronics & Technology"];

  const isAdmin = user?.is_staff || user?.is_superuser;
  const containerRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { id } = useParams<{ id: string }>();
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [success, setSuccess] = useState(false);
  const [showPreview, setShowPreview] = useState(false);

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
  const [newCategoryIconFile, setNewCategoryIconFile] = useState<File | null>(null);
  const [showDeleteCategoryConfirm, setShowDeleteCategoryConfirm] = useState(false);
  const [showDeleteBrandConfirm, setShowDeleteBrandConfirm] = useState(false);
  const [showDeleteTypeConfirm, setShowDeleteTypeConfirm] = useState(false);
  const [activeTab, setActiveTab] = useState<"description" | "specs">("description");

  const [categorySuggestions, setCategorySuggestions] = useState({ types: [] as string[], brands: [] as string[] });
  const [allBrands, setAllBrands] = useState<string[]>([]);

  const [mainImageFile, setMainImageFile] = useState<File | null>(null);
  const [bulkImageFiles, setBulkImageFiles] = useState<File[]>([]);
  const [model3DFile, setModel3DFile] = useState<File | null>(null);
  const [newCollectionInput, setNewCollectionInput] = useState("");

  const [formData, setFormData] = useState({
    name: "",
    slug: "",
    category: "",
    categorySlug: "",
    brand: "",
    price: "",
    originalPrice: "",
    discount: "",
    image: "",
    description: "",
    inStock: true,
    stockCount: "",
    isNew: true,
    isOffer: false,
    isBestSeller: false,
    isPopular: false,
    freeShipping: false,
    collections: [] as string[],
    colors: [] as { name: string; hex: string }[],
    details: "",
    specs: [{ key: "", value: "" }] as { key: string; value: string }[],
    keySpecifications: [] as string[],
    images: [] as string[],
    model3D: "",
    rating: "",
    reviews: "",
    type: "",
    features: [] as string[],
  });

  const [activeSection, setActiveSection] = useState("general");

  const sections = [
    { id: "general", label: "General Info" },
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
    const fetchProduct = async () => {
      if (!id) return;
      try {
        const data = await productService.getById(id);
        
        if (data) {
          // Parse specs back to key-value pairs
          const parsedSpecs = data.specs?.map((s: string) => {
            const [key, ...rest] = s.split(": ");
            return { key, value: rest.join(": ") };
          }) || [{ key: "", value: "" }];

          setFormData({
            name: data.name || "",
            slug: data.slug || "",
            category: data.category || "",
            categorySlug: data.categorySlug || "",
            brand: data.brand || "",
            price: data.price?.toString() || "",
            originalPrice: data.originalPrice?.toString() || "",
            discount: data.discount?.toString() || "",
            image: data.image || "",
            description: data.description || "",
            inStock: data.inStock ?? true,
            stockCount: data.stockCount?.toString() || "",
            isNew: data.isNew ?? true,
            isOffer: data.isOffer ?? false,
            isBestSeller: data.isBestSeller ?? false,
            isPopular: data.isPopular ?? false,
            freeShipping: data.freeShipping ?? false,
            collections: data.collections || [],
            colors: data.colors || [],
            specs: parsedSpecs,
            images: data.images || [],
            model3D: data.model3D || "",
            rating: data.rating?.toString() || "",
            reviews: data.reviews?.toString() || "",
            type: data.type || "",
            features: data.features || [],
            keySpecifications: data.keySpecifications || [],
          });
        } else {
          toast.error("Product not found");
          navigate("/admin");
        }
      } catch (error) {
        console.error("Error fetching product:", error);
        toast.error("Failed to load product data");
      } finally {
        setFetching(false);
      }
    };

    if (isAdmin) {
      fetchProduct();
    }
  }, [id, isAdmin, navigate]);

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
      const unique = Array.from(new Set([...fromCategories, ...fromModel])).sort((a,b)=>a.localeCompare(b));
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
    }));
  };

  const handleCategoryChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedCategory = categories.find(c => c.name === e.target.value);
    const categorySlug = selectedCategory?.slug || "";
    
    setFormData(prev => ({
      ...prev,
      category: e.target.value,
      categorySlug: categorySlug
    }));

    if (categorySlug) {
      try {
        const data = await categoryService.getFeatures(categorySlug);
        if (data) {
          const types = data.types as string[] || [];
          const brands = data.brands as string[] || [];
          const features = data.features as string[] || [];
          
          setCategorySuggestions({ types, brands });
          
          if (features.length > 0) {
            setFormData(prev => {
              const currentKeys = (prev.specs || []).map(s => s.key.toLowerCase());
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
            toast.info(`Suggested features for ${e.target.value} added to specifications`);
          }
        } else {
          setCategorySuggestions({ types: [], brands: [] });
        }
      } catch (error) {
        console.error("Error fetching category suggestions:", error);
      }
    }
  };

  const handleTypeChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement> | string) => {
    const value = typeof e === "string" ? e : e.target.value;
    setFormData(prev => ({ ...prev, type: value }));
    
    // If type is from suggestions, load its features
    if (formData.categorySlug) {
      const fetchFeatures = async () => {
        const data = await categoryService.getFeatures(formData.categorySlug);
        if (data) {
          const typeFeatures = data.typeFeatures || {};
          if (typeFeatures[value]) {
            setFormData(prev => ({ ...prev, features: typeFeatures[value] }));
          }
        }
      };
      fetchFeatures();
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

  const handleDeleteBrandFromCategory = async () => {
    if (!formData.categorySlug || !formData.brand) {
      toast.error("Please select a category and brand to delete");
      return;
    }

    try {
      const categoryData = await categoryService.getBySlug(formData.categorySlug);
      
      if (categoryData) {
        const brands = (categoryData.brands as string[] || []).filter(b => b !== formData.brand);
        await categoryService.update(formData.categorySlug, { brands });
        await queryClient.invalidateQueries({ queryKey: ['categories'] });
        
        setCategorySuggestions(prev => ({ ...prev, brands }));
        setShowDeleteBrandConfirm(false);
        toast.success(`Brand "${formData.brand}" deleted from category`);
      }
    } catch (error) {
      toast.error("Failed to delete brand");
    }
  };

  const handleAddBrandToCategory = async () => {
    if (!formData.categorySlug || !formData.brand.trim()) {
      toast.error("Please select a category and enter a brand name");
      return;
    }

    try {
      const categoryData = await categoryService.getBySlug(formData.categorySlug);
      const currentBrands = categoryData?.brands || [];
      
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

      await queryClient.invalidateQueries({ queryKey: ['categories'] });
      
      setCategorySuggestions(prev => ({ ...prev, brands: newBrands }));
      toast.success(`Brand "${formData.brand}" added to category`);
    } catch (error) {
      console.error("Error adding brand:", error);
      toast.error("Failed to add brand");
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

  const handleDeleteBrand = async () => {
    if (!formData.brand) {
      toast.error("Please select a brand to delete");
      return;
    }

    setLoading(true);
    try {
      // Assuming brands are managed via a service or just categories
      toast.info("Brand deletion not fully implemented in API yet");
      setShowDeleteBrandConfirm(false);
    } catch (error) {
      toast.error("Failed to delete brand");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteType = async () => {
    if (!formData.categorySlug || !formData.type) {
      toast.error("Please select a category and type to delete");
      return;
    }

    try {
      const data = await categoryService.getFeatures(formData.categorySlug);
      
      if (data) {
        const types = (data.types as string[] || []).filter(t => t !== formData.type);
        const typeFeatures = { ...(data.typeFeatures || {}) };
        delete typeFeatures[formData.type];

        await categoryService.updateFeatures(formData.categorySlug, { types, typeFeatures });
        await queryClient.invalidateQueries({ queryKey: ['categories'] });
        
        setCategorySuggestions(prev => ({ ...prev, types }));
        setFormData(prev => ({ ...prev, type: types[0] || "" }));
        setShowDeleteTypeConfirm(false);
        toast.success(`Product type "${formData.type}" deleted from category`);
      }
    } catch (error) {
      toast.error("Failed to delete type");
    }
  };

  const handleAddType = async () => {
    if (!formData.categorySlug || !formData.type.trim()) {
      toast.error("Please select a category and enter a type name");
      return;
    }

    try {
      const data = await categoryService.getFeatures(formData.categorySlug) || { types: [] as string[], brands: [] as string[], typeFeatures: {} as Record<string, string[]> };
      
      if (data.types.includes(formData.type.trim())) {
        toast.error("Type already exists in this category");
        return;
      }

      const newTypes = [...data.types, formData.type.trim()];
      const newTypeFeatures = { ...(data.typeFeatures || {}) };
      if (!newTypeFeatures[formData.type.trim()]) {
        newTypeFeatures[formData.type.trim()] = [];
      }
      await categoryService.updateFeatures(formData.categorySlug, {
        types: newTypes,
        typeFeatures: newTypeFeatures
      });
      await queryClient.invalidateQueries({ queryKey: ['categories'] });
      
      setCategorySuggestions(prev => ({ ...prev, types: newTypes }));
      toast.success(`Product type "${formData.type}" added to category`);
    } catch (error) {
      toast.error("Failed to add product type to category");
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
    const confirmed = await new Promise((resolve) => {
      const result = window.confirm(`Are you sure you want to delete "${name}"? This will remove the collection from all products and the storefront.`);
      resolve(result);
    });
    
    if (!confirmed) {
      return;
    }
    try {
      await collectionService.delete(id);
      await queryClient.invalidateQueries({ queryKey: ['collections'] });
      // Explicitly invalidate public collections too
      await queryClient.invalidateQueries({ queryKey: ['collections', 'public'] });
      
      setFormData(prev => ({ ...prev, collections: prev.collections.filter(c => c !== name) }));
      toast.success(`Collection "${name}" deleted`);
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
      setBulkImageFiles(prev => [...prev, ...files]);
      const urls = files.map(f => URL.createObjectURL(f));
      setFormData(prev => ({ ...prev, images: [...prev.images, ...urls] }));
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
    
    console.log("Submitting product update:", formData);

    if (!user || !isAdmin) {
      toast.error("Unauthorized action");
      return;
    }

    if (!formData.name.trim() || !formData.slug.trim()) {
      toast.error("Product name and slug are required.");
      return;
    }

    if (!formData.brand.trim()) {
      if (isAddingNewBrand && newBrandInput.trim()) {
        // Auto-handle brand if user typed it but forgot to click '+'
        formData.brand = newBrandInput.trim();
        toast.info("Using typed brand: " + formData.brand);
      } else {
        toast.error("Product brand is required.");
        return;
      }
    }

    if (!id) return;

    setLoading(true);
    try {
      let mainImageUrl = formData.image;
      if (mainImageFile) {
        mainImageUrl = await uploadService.uploadImage(mainImageFile, "products/main");
      }

      const bulkImageUrls = [...formData.images.filter(img => !img.startsWith("blob:"))];
      for (const file of bulkImageFiles) {
        const url = await uploadService.uploadImage(file, "products/gallery");
        bulkImageUrls.push(url);
      }

      let model3DUrl = formData.model3D;
      if (model3DFile) {
        model3DUrl = await uploadService.uploadModel(model3DFile);
      }

      const detailedSpecs: Record<string, string> = {};
      formData.specs.forEach(spec => {
        if (spec.key.trim() && spec.value.trim()) {
          detailedSpecs[spec.key.trim()] = spec.value.trim();
        }
      });

      const keySpecifications = formData.keySpecifications.filter(s => s.trim() !== "");

      // Find brand ID if it exists in our brands model
      const brandObj = dbBrands.find(b => b.name.toLowerCase() === formData.brand.toLowerCase());
      const brandValue = brandObj ? brandObj.id : formData.brand;

      const productData = {
        ...formData,
        category: formData.categorySlug || formData.category,
        brand: brandValue, // Send ID if found, otherwise send name string (handled by backend fix)
        image: mainImageUrl,
        images: bulkImageUrls,
        model3D: model3DUrl,
        price: Number(formData.price.toString().replace(/,/g, '')),
        originalPrice: formData.originalPrice ? Number(formData.originalPrice.toString().replace(/,/g, '')) : null,
        discount: Number(formData.discount || 0),
        stockCount: Number(formData.stockCount || 0),
        specs: (formData.specs || []).map(s => `${s.key}: ${s.value}`).filter(s => s.trim() !== ": "),
        detailedSpecs,
        keySpecifications,
        details: formData.details,
        rating: formData.rating ? Number(formData.rating) : 0,
        reviews: formData.reviews ? Number(formData.reviews) : 0,
        type: formData.type,
        features: formData.features,
      };

      await productService.update(id, productData);
      await queryClient.invalidateQueries({ queryKey: ['products'] });
      await queryClient.invalidateQueries({ queryKey: ['categories'] });
      
      setSuccess(true);
      toast.success("Product updated successfully!");
      
      setTimeout(() => {
        window.location.href = "/admin/products";
      }, 2000);
    } catch (error: unknown) {
      console.error("Error updating product:", error);
      toast.error((error as Error).message || "Failed to update product.");
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
    const newArray = formData[type].filter((_, i) => i !== index);
    setFormData(prev => ({ ...prev, [type]: newArray }));
  };

  if (success) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background p-6">
        <div className="text-center space-y-4 animate-in fade-in zoom-in duration-500">
          <div className="w-20 h-20 bg-emerald-500/10 text-emerald-500 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle2 size={40} className="animate-bounce" />
          </div>
          <h1 className="text-3xl font-display font-bold">Product Updated!</h1>
          <p className="text-muted-foreground">Redirecting you back to the dashboard...</p>
        </div>
      </div>
    );
  }

  if (fetching) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
          <p className="text-sm font-medium animate-pulse">
            Loading product data...
          </p>
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
                <span className="hidden sm:inline">Save Changes</span>
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
              <h1 className="text-2xl font-display font-bold">Edit Product</h1>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Basic Info */}
          <section id="general" className="bg-card border border-border rounded-2xl p-6 shadow-sm gsap-reveal">
            <div className="flex items-center gap-2 mb-6">
              <Package size={18} className="text-primary" />
              <h2 className="text-sm font-bold uppercase tracking-widest">Basic Information</h2>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Product Name</label>
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
                <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">URL Slug</label>
                <input 
                  required
                  name="slug"
                  value={formData.slug}
                  onChange={handleInputChange}
                  placeholder="e.g. dell-xps-13"
                  className="w-full bg-accent/30 border border-border rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-primary/20 outline-none"
                />
              </div>

                <div className="md:col-span-2 space-y-2">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground ml-1">Summary Description</label>
                  <textarea
                    required
                    name="description"
                    value={formData.description}
                    onChange={handleInputChange}
                    placeholder="Short description for card views..."
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
                    <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Category Selection</label>
                    <div className="flex gap-2">
                      <Link 
                        to="/admin/category-features" 
                        className="text-[10px] font-bold uppercase tracking-wider text-primary hover:underline flex items-center gap-1"
                      >
                        <Settings size={10} />
                        Manage Features
                      </Link>
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
                  <div className="bg-accent/10 border border-border/50 rounded-2xl p-6">
                    <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest ml-1 mb-4 block">Quick Select Category</label>
                    <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3">
                      {(categories || []).map(cat => {
                        const isSelected = formData.category === cat.name;
                        const catColor = getCategoryColor(cat.name);
                        return (
                          <button
                            key={cat.slug}
                            type="button"
                            onClick={() => handleCategoryChange({ target: { value: cat.name } } as React.ChangeEvent<HTMLSelectElement>)}
                            className={`flex flex-col items-center justify-center p-4 rounded-2xl border transition-all gap-3 group relative overflow-hidden
                              ${isSelected 
                                ? "border-transparent text-white shadow-xl" 
                                : "bg-card border-border/50 text-muted-foreground hover:border-primary/30 hover:bg-accent/50"}`}
                            style={{ 
                              backgroundColor: isSelected ? catColor : undefined,
                              boxShadow: isSelected ? `0 12px 24px -8px ${catColor}60` : undefined
                            }}
                          >
                            <div 
                              className={`text-3xl transition-transform duration-300 ${isSelected ? "scale-110" : "group-hover:scale-110"}`}
                              style={{ color: isSelected ? "white" : catColor }}
                            >
                              {renderCategoryIcon(cat.icon)}
                            </div>
                            <span className={`text-[10px] font-bold text-center leading-tight truncate w-full ${isSelected ? "text-white" : "text-foreground/80"}`}>
                              {cat.name}
                            </span>
                            
                            {isSelected && (
                              <div className="absolute inset-0 bg-white/10 pointer-events-none" />
                            )}
                          </button>
                        );
                      })}
                    </div>
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
                        <div className="grid grid-cols-10 gap-1 bg-accent/10 p-2 rounded-xl border border-border/50">
                          {presetIcons.map(icon => (
                            <button
                              key={icon}
                              type="button"
                              onClick={() => setNewCategoryIcon(icon)}
                              className={`flex items-center justify-center p-1.5 rounded-lg transition-all hover:bg-primary/10 hover:text-primary
                                ${newCategoryIcon === icon ? "bg-primary text-white scale-110 shadow-sm" : "text-muted-foreground"}`}
                              title={icon}
                            >
                              {renderCategoryIcon(icon, 14)}
                            </button>
                          ))}
                          <label className="flex items-center justify-center p-1.5 rounded-lg text-muted-foreground hover:bg-primary/10 hover:text-primary cursor-pointer border border-dashed border-border/50">
                            <Upload size={14} />
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
                    {(categories || []).map(c => (
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
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Brand</label>
                  <div className="flex gap-2">
                    <button 
                      type="button" 
                      onClick={handleAddBrandToCategory} 
                      className="text-primary hover:text-primary/80 transition-colors"
                      title="Add current brand to category suggestions"
                    >
                      <Plus size={14} />
                    </button>
                    {formData.brand && categorySuggestions.brands.includes(formData.brand) && (
                      <button 
                        type="button" 
                        onClick={() => setShowDeleteBrandConfirm(true)} 
                        className="text-destructive hover:text-destructive/80 transition-colors"
                        title="Delete current brand from category suggestions"
                      >
                        <Trash2 size={14} />
                      </button>
                    )}
                  </div>
                </div>

                <AnimatePresence>
                  {showDeleteBrandConfirm && (
                    <motion.div 
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      className="mt-2 p-3 bg-destructive/10 border border-destructive/20 rounded-xl overflow-hidden"
                    >
                      <p className="text-[10px] text-destructive font-bold mb-2">
                        Are you sure you want to delete "{formData.brand}" from this category's suggestions?
                      </p>
                      <div className="flex gap-2">
                        <button 
                          type="button"
                          onClick={handleDeleteBrandFromCategory}
                          className="px-3 py-1 bg-destructive text-white text-[10px] font-bold rounded-lg hover:bg-destructive/90"
                        >
                          Yes, Delete
                        </button>
                        <button 
                          type="button"
                          onClick={() => setShowDeleteBrandConfirm(false)}
                          className="px-3 py-1 bg-accent text-foreground text-[10px] font-bold rounded-lg hover:bg-accent/80"
                        >
                          Cancel
                        </button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <select 
                    value={allBrands.includes(formData.brand) ? formData.brand : "custom"}
                    onChange={(e) => {
                      if (e.target.value !== "custom") {
                        setFormData(prev => ({ ...prev, brand: e.target.value }));
                      }
                    }}
                    className="bg-accent/30 border border-border rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-primary/20 outline-none"
                  >
                    <option value="custom">Custom Brand...</option>
                    {(allBrands || []).map(b => (
                      <option key={b} value={b}>{b}</option>
                    ))}
                  </select>
                  <input 
                    required
                    name="brand"
                    value={formData.brand}
                    onChange={handleInputChange}
                    placeholder="e.g. Sony, Apple, Samsung"
                    className="bg-accent/30 border border-border rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-primary/20 outline-none"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Product Type</label>
                  <div className="flex gap-2">
                    <button 
                      type="button" 
                      onClick={handleAddType} 
                      className="text-primary hover:text-primary/80 transition-colors"
                      title="Add current type to category suggestions"
                    >
                      <Plus size={14} />
                    </button>
                    {formData.type && categorySuggestions.types.includes(formData.type) && (
                      <button 
                        type="button" 
                        onClick={() => setShowDeleteTypeConfirm(true)} 
                        className="text-destructive hover:text-destructive/80 transition-colors"
                        title="Delete current type from category suggestions"
                      >
                        <Trash2 size={14} />
                      </button>
                    )}
                  </div>
                </div>

                <AnimatePresence>
                  {showDeleteTypeConfirm && (
                    <motion.div 
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      className="mt-2 p-3 bg-destructive/10 border border-destructive/20 rounded-xl overflow-hidden"
                    >
                      <p className="text-[10px] text-destructive font-bold mb-2">
                        Are you sure you want to delete "{formData.type}" from this category's suggestions?
                      </p>
                      <div className="flex gap-2">
                        <button 
                          type="button"
                          onClick={handleDeleteType}
                          className="px-3 py-1 bg-destructive text-white text-[10px] font-bold rounded-lg hover:bg-destructive/90"
                        >
                          Yes, Delete
                        </button>
                        <button 
                          type="button"
                          onClick={() => setShowDeleteTypeConfirm(false)}
                          className="px-3 py-1 bg-accent text-foreground text-[10px] font-bold rounded-lg hover:bg-accent/80"
                        >
                          Cancel
                        </button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <select 
                    value={categorySuggestions.types.includes(formData.type) ? formData.type : "custom"}
                    onChange={(e) => {
                      if (e.target.value !== "custom") {
                        handleTypeChange(e.target.value);
                      }
                    }}
                    className="bg-accent/30 border border-border rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-primary/20 outline-none"
                  >
                    <option value="custom">Custom Type...</option>
                    {(categorySuggestions?.types || []).map(t => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                  <input 
                    required
                    name="type"
                    value={formData.type}
                    onChange={(e) => handleTypeChange(e.target.value)}
                    placeholder="e.g. Gaming Laptop, Wireless Earbuds"
                    className="bg-accent/30 border border-border rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-primary/20 outline-none"
                  />
                </div>
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
              {(formData.features || []).length === 0 && (
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
                  (availableCollections || []).map((coll: Collection) => {
                    const isSelected = formData.collections.includes(coll.name);
                    return (
                      <div key={coll.id} className="relative group/coll">
                        <button
                          type="button"
                          onClick={() => handleCollectionToggle(coll.name)}
                          className={`px-4 py-2 rounded-xl border text-xs font-bold uppercase tracking-widest transition-all ${isSelected 
                            ? "border-primary bg-primary/5 text-primary ring-1 ring-primary" 
                            : "border-border bg-accent/30 text-muted-foreground hover:bg-accent/50"}`}
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
                        className={`flex items-center gap-2 px-3 py-2 rounded-xl border transition-all ${
                          isSelected ? "border-primary bg-primary/5 ring-1 ring-primary" : "border-border bg-accent/30 hover:bg-accent/50"
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
                      <Upload size={12} /> Bulk Upload
                      <input type="file" multiple accept="image/*" className="hidden" onChange={handleBulkImageUpload} />
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
                  {(formData.images || []).map((img, i) => (
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
                </div>
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
                  {(formData.keySpecifications || []).map((spec, i) => (
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
                  {(formData.keySpecifications || []).length === 0 && (
                    <div className="md:col-span-2 text-center py-6 border border-dashed border-border rounded-2xl text-muted-foreground text-xs italic">
                      No key specifications added yet.
                    </div>
                  )}
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
                  {(formData.specs || []).map((spec, i) => (
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
                  Update Product
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
              Save Changes
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
                    {(formData.colors || []).map(c => (
                      <div key={c.name} className="group relative">
                        <div className="w-8 h-8 rounded-full border-2 border-border p-0.5 transition-transform group-hover:scale-110">
                          <div className="w-full h-full rounded-full shadow-inner" style={{ backgroundColor: c.hex }} />
                        </div>
                        <span className="absolute -bottom-6 left-1/2 -translate-x-1/2 text-[8px] font-bold uppercase opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">{c.name}</span>
                      </div>
                    ))}
                    {(formData.colors || []).length === 0 && <span className="text-xs text-muted-foreground italic">No colors selected</span>}
                  </div>
                </div>

                <div className="space-y-4 pt-4 border-t border-border">
                  <h5 className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Quick Specs</h5>
                  <div className="grid grid-cols-2 gap-3">
                    {(formData.specs?.slice(0, 4) || []).map((s, i) => (
                      <div key={i} className="flex items-center gap-2 text-xs">
                        <div className="w-1.5 h-1.5 rounded-full bg-primary/40" />
                        <span className="font-medium text-muted-foreground">{s.key}:</span>
                        <span className="font-bold">{s.value}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex flex-wrap gap-2 pt-4">
                  {(formData.collections || []).map(c => (
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
                    className={`pb-4 text-xs font-bold uppercase tracking-widest transition-all border-b-2 ${
                      activeTab === tab ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"
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
                    {(formData.specs?.filter(s => s.key && s.value) || []).length === 0 && (
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
                  Save Changes
                </>
              )}
            </button>
          </div>
        </div>
      </main>
    )}
    </div>
  );
};

export default EditProduct;

export type Product = {
  id: string;
  name: string;
  slug: string;
  category: string;
  categorySlug: string;
  brand: string;
  price: number;
  originalPrice?: number;
  discount?: number;
  image: string;
  specs: string[];
  description: string;
  inStock: boolean;
  stockCount?: number;
  isNew?: boolean;
  isOffer?: boolean;
  isBestSeller?: boolean;
  isPopular?: boolean;
  freeShipping?: boolean;
  isLimitedStock?: boolean;
  rating: number;
  reviews: number;
  detailedSpecs?: Record<string, string>;
  images?: string[];

  // Laptop specific fields
  laptopSeries?: string;
  displaySize?: string;
  processor?: string;
  ram?: string;
  storage?: string;
  graphicCard?: string;
  generation?: string;

  // Monitor specific fields
  screenSize?: string;
  refreshRate?: string;
  panelType?: string;

  // Mobile specific fields
  mobileProcessor?: string;
  mobileRam?: string;
  mobileStorage?: string;
  
  color?: string;
  colorHex?: string;
  colors?: { name: string; hex: string }[];

  model3D?: string;
  type?: string;
  features?: string[];
  created_at?: string;
};

export type CategorySection = {
  title: string;
  items: { name: string; slug: string }[];
};

export type Category = {
  name: string;
  slug: string;
  icon: string;
  subcategories?: { name: string; slug: string }[];
  brands?: string[];
  sections?: CategorySection[];
};

// Empty data arrays - populated exclusively via API
export const categories: Category[] = [];
export const brands: { name: string; logo: string }[] = [];
export const products: Product[] = [];

// Helper Functions
export const getProductBySlug = (slug: string) =>
  products.find(p => p.slug === slug);

export const getProductsByCategory = (categorySlug: string) =>
  products.filter(p => p.categorySlug === categorySlug);

export const getNewArrivals = () =>
  products.filter(p => p.isNew);

export const getBestPrice = () =>
  products
    .filter(p => p.discount && p.discount > 0)
    .sort((a, b) => (b.discount || 0) - (a.discount || 0));

export const getPopular = () =>
  [...products].sort((a, b) => b.reviews - a.reviews).slice(0, 8);

export const getDealOfTheWeek = () =>
  products.filter(p => p.discount && p.discount >= 10).slice(0, 6);

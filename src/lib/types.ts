/**
 * Shared TypeScript types for products, categories, and brands.
 * All data is fetched from the Django REST API — no static arrays here.
 */

export type CompanyGalleryImage = {
  id: number;
  image: string;
  created_at: string;
};

export type FooterSettings = {
  id: number;
  company_name: string;
  email: string;
  phone: string;
  opening_hours_weekday: string;
  opening_hours_weekend: string;
  show_store_locations: boolean;
  location_title: string;
  show_information: boolean;
  show_policies: boolean;
  show_customer_service: boolean;
  facebook_url?: string;
  twitter_url?: string;
  instagram_url?: string;
  linkedin_url?: string;
  youtube_url?: string;
};

export type StoreLocationData = {
  id: number;
  name: string;
  address: string;
  phone: string;
  is_active: boolean;
  order: number;
};

export type Company = {
  id: number;
  name: string;
  slug: string;
  category?: string;
  description?: string;
  logo?: string;
  banner?: string;
  email?: string;
  phone?: string;
  address?: string;
  website?: string;
  owner?: string;
  owner_name?: string;
  created_at?: string;
  updated_at?: string;
  gallery_images?: CompanyGalleryImage[];
  footer_settings?: FooterSettings;
  store_locations?: StoreLocationData[];
  products?: Product[];
};

export type Product = {
  id: string;
  company?: number;
  name: string;
  slug: string;
  category: string;
  categorySlug: string;
  category_name?: string;
  brand: string;
  brand_name?: string;
  price: number;
  originalPrice?: number;
  discount?: number;
  image: string;
  specs: string[];
  description: string;
  details?: string;
  inStock: boolean;
  stock: number;
  stockCount: number;
  isEndStock?: boolean;
  outOfStockSince?: string | null;
  isNew?: boolean;
  isOffer?: boolean;
  isBestSeller?: boolean;
  isPopular?: boolean;
  freeShipping?: boolean;
  isLimitedStock?: boolean;
  rating: number;
  reviews: number;
  detailedSpecs?: Record<string, string>;
  keySpecifications?: string[];
  images?: string[];
  // Laptop specific
  laptopSeries?: string;
  displaySize?: string;
  processor?: string;
  ram?: string;
  storage?: string;
  graphicCard?: string;
  generation?: string;
  // Monitor specific
  screenSize?: string;
  refreshRate?: string;
  panelType?: string;
  // Mobile specific
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

export type Brand = {
  name: string;
  slug?: string;
  logo?: string;
  description?: string;
  is_active?: boolean;
}

export interface MegaMenuItem {
  title: string;
  href: string;
  columns: {
    type: 'brands' | 'categories' | 'products';
    title?: string;
    items: {
      name: string;
      href: string;
      image?: string;
      price?: number;
      badge?: string;
      type?: string;
      features?: string[];
    }[];
  }[];
  banner?: {
    text: string;
    buttonText: string;
    buttonHref: string;
    backgroundColor?: string;
    discount?: number;
  };
}

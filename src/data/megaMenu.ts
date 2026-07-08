export interface MegaMenuColumnItem {
  name: string;
  href: string;
  image?: string;
  price?: number;
  badge?: string;
  type?: string;
  features?: string[];
}

export interface MegaMenuColumn {
  type: 'brands' | 'categories' | 'products';
  title?: string;
  items: MegaMenuColumnItem[];
}

export interface MegaMenuBanner {
  text: string;
  buttonText: string;
  buttonHref: string;
  backgroundColor?: string;
  discount?: number;
}

export interface MegaMenuItem {
  title: string;
  href: string;
  columns: MegaMenuColumn[];
  banner?: MegaMenuBanner;
}

// Clean & Empty Mega Menu Data (populated dynamically by hooks)
export const megaMenuData: Record<string, MegaMenuItem> = {};

// Helper function to get mega menu for a specific category
export const getMegaMenu = (slug: string): MegaMenuItem | undefined => {
  return megaMenuData[slug];
};

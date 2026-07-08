export type RepairCategory = 
  | 'Laptop & Computer'
  | 'Mobile & Tablet'
  | 'TV & Display'
  | 'CCTV & Security'
  | 'Audio & Speaker'
  | 'Printer & Scanner'
  | 'Gaming Console'
  | 'Other Electronics';

export type PickupType = 'yes' | 'no' | 'partial';
export type RepairPriority = 'normal' | 'high' | 'express';
export type RepairStatus = 'active' | 'inactive';

export interface RepairBrand {
  id: string;
  product: string;
  brand_name: string;
  brand_logo_url: string;
  is_popular: boolean;
  created_at: string;
}

export interface RepairIssue {
  id: string;
  product: string;
  issue_name: string;
  base_price: string | number | null;
  created_at: string;
}

export interface RepairProduct {
  id: string;
  company: string;
  name: string;
  category: RepairCategory;
  description: string;
  image_url: string;
  status: RepairStatus;
  sla_days: string;
  starting_price: string | number;
  repair_warranty: string;
  home_pickup: PickupType;
  express_available: boolean;
  technician_type: string;
  priority: RepairPriority;
  brands: RepairBrand[];
  issues: RepairIssue[];
  brand_count?: number;
  created_at: string;
  updated_at: string;
}

export interface ServiceBrand {
  id: string;
  category: string;
  name: string;
  logo_url: string;
  supported_models: string[];
  is_popular: boolean;
  is_active: boolean;
  created_at: string;
}

export interface ServiceCategory {
  id: string;
  company: string;
  name: string;
  description: string;
  logo_url: string;
  is_active: boolean;
  order: number;
  brands: ServiceBrand[];
  created_at: string;
}

export type TicketStatus = 'submitted' | 'in_progress' | 'completed' | 'cancelled';

export interface RepairRequest {
  id?: string;
  ticketId?: string;
  ticket_id?: string;
  service_category?: string;
  service_brand?: string;
  category?: string; // Legacy/Display
  brand_name?: string;
  model: string;
  serial_number?: string;
  description: string;
  media?: {
    images: string[];
    video?: string;
  };
  delivery_method: 'pickup' | 'drop_off' | 'walk_in';
  pickup_date?: string;
  pickup_time?: string;
  pickup_address?: string;
  customer_name: string;
  phone: string;
  email?: string;
  service_type: 'standard' | 'express';
  status?: TicketStatus;
  status_history?: {
    status: TicketStatus;
    timestamp: string;
    note: string;
  }[];
  createdAt?: string;
}

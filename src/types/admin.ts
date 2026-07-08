export interface OrderItem {
  productId: string;
  name: string;
  price: number;
  quantity: number;
  image: string;
  features: string[];
}

export interface Order {
  id: string;
  orderId?: string;
  uid: string;
  customerName: string;
  customerEmail: string;
  items: OrderItem[];
  totalAmount: number;
  status: "new" | "pending" | "processing" | "shipped" | "delivered" | "process_conform" | "process_dont_conform" | "cancelled";
  shippingAddress: {
    address: string;
    city: string;
    phone: string;
  };
  createdAt: string;
  paymentMethod?: string;
  paymentStatus?: "paid" | "unpaid";
  discount?: number;
  subtotal?: number;
}

export interface Customer {
  id: string;
  uid: string;
  email: string;
  displayName: string;
  phone?: string;
  lastVisit: string;
  visitCount: number;
  createdAt: string;
  order_count?: number;
  total_spent?: number;
  cartItems?: OrderItem[];
  wishlistItems?: OrderItem[];
}

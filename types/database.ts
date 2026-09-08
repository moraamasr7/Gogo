// types/database.ts

export type CategoryKey = 'trays' | 'coasters' | 'planters' | 'candle_holders' | 'decor';

export interface Product {
  id: string;
  name_ar: string;
  name_en: string | null;
  slug: string;
  description_ar: string | null;
  description_en: string | null;
  price: number;
  image_url: string | null;
  category: CategoryKey;
  stock: number;
  is_active: boolean;
  colors: string[];
  dimensions: string | null;
  weight_approx: string | null;
  created_at: string;
  updated_at: string;
}

export type OrderStatus = 'pending' | 'confirmed' | 'processing' | 'ready_for_shipping' | 'completed' | 'cancelled';

export interface Order {
  id: string;
  order_number: string;
  customer_name: string;
  customer_phone: string;
  customer_email: string | null;
  customer_address: string;
  subtotal: number;
  total_amount: number;
  deposit_percentage: number;
  deposit_amount: number;
  remaining_amount: number;
  payment_screenshot_path: string | null;
  status: OrderStatus;
  customer_notes: string | null;
  admin_notes: string | null;
  whatsapp_sent: boolean;
  telegram_sent: boolean;
  created_at: string;
  updated_at: string;
  order_items?: OrderItem[];
}

export interface OrderItem {
  id: string;
  order_id: string;
  product_id: string | null;
  product_name_ar: string;
  quantity: number;
  unit_price: number;
  total_price: number;
  selected_color: string | null;
  created_at: string;
  product?: Product;
}

export interface Offer {
  id: string;
  title: string;
  description: string | null;
  badge_text: string | null;
  image_url: string | null;
  discount_percentage: number | null;
  is_active: boolean;
  sort_order: number;
  start_at: string | null;
  end_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface SettingItem {
  id: string;
  key: string;
  value: string;
  is_public: boolean;
  description: string | null;
  updated_at: string;
}

export interface DashboardStats {
  newOrders: number;
  processingOrders: number;
  readyOrders: number;
  completedOrders: number;
  totalSales: number;
  collectedDeposits: number;
  outstandingBalance: number;
}

export type StockStatus = "available" | "low_stock" | "out_of_stock";
export type FulfillmentMethod = "delivery" | "pickup";
export type PaymentMethod = "card" | "bank_transfer" | "cash_on_delivery";
export type PaymentStatus = "pending" | "paid" | "failed";
export type OrderStatus =
  | "placed"
  | "pharmacy_review"
  | "accepted"
  | "preparing"
  | "ready_for_pickup"
  | "out_for_delivery"
  | "completed"
  | "cancelled";

export interface Pharmacy {
  id: string;
  name: string;
  verified: boolean;
  rating: number;
  reviewCount: number;
  address: string;
  area: string;
  distanceKm: number;
  phone: string;
  hours: string;
  supportsDelivery: boolean;
  supportsPickup: boolean;
  deliveryFee: number;
  description: string;
}

export interface ProductOffer {
  id: string;
  pharmacyId: string;
  price: number;
  stockCount: number;
  stockStatus: StockStatus;
  preorderSupported: boolean;
  estimatedRestockDate?: string;
}

export interface Product {
  id: string;
  name: string;
  genericName: string;
  brand: string;
  category: string;
  form: string;
  strength: string;
  packSize: string;
  description: string;
  requiresPrescription: boolean;
  requiresPharmacistReview: boolean;
  offers: ProductOffer[];
}

export interface MarketplaceFilters {
  search?: string;
  category?: string;
  availability?: "all" | "available" | "preorder";
}

export interface CartItem {
  product: Product;
  offer: ProductOffer;
  pharmacy: Pharmacy;
  quantity: number;
}

export interface CheckoutInput {
  items: CartItem[];
  fulfillmentMethod: FulfillmentMethod;
  paymentMethod: PaymentMethod;
  recipientName: string;
  phone: string;
  deliveryAddress?: string;
  prescriptionFileName?: string;
  notes?: string;
}

export interface OrderItem {
  id: string;
  productId: string;
  name: string;
  strength: string;
  quantity: number;
  unitPrice: number;
  requiresPrescription: boolean;
}

export interface OrderTimelineEvent {
  id: string;
  status: OrderStatus;
  label: string;
  occurredAt?: string;
  complete: boolean;
}

export interface Order {
  id: string;
  reference: string;
  pharmacy: Pharmacy;
  items: OrderItem[];
  status: OrderStatus;
  paymentStatus: PaymentStatus;
  paymentMethod: PaymentMethod;
  fulfillmentMethod: FulfillmentMethod;
  recipientName: string;
  phone: string;
  deliveryAddress?: string;
  prescriptionFileName?: string;
  subtotal: number;
  deliveryFee: number;
  total: number;
  createdAt: string;
  timeline: OrderTimelineEvent[];
}

export interface PreOrderRequest {
  id: string;
  productId: string;
  productName: string;
  pharmacyId: string;
  pharmacyName: string;
  quantity: number;
  status: "requested" | "accepted" | "declined" | "available";
  requestedAt: string;
  estimatedRestockDate?: string;
}

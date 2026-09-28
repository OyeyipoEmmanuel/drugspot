import type {
  FulfillmentMethod,
  OrderStatus,
  PaymentStatus,
} from "@/types/marketplace";

export type InventoryStatus = "in_stock" | "low_stock" | "out_of_stock";

export interface InventoryItem {
  id: string;
  productName: string;
  strength: string;
  sku: string;
  category: string;
  imageUrl?: string;
  stockCount: number;
  reorderLevel: number;
  unitPrice: number;
  requiresPrescription: boolean;
  nafdacNumber?: string;
  nafdacVerified?: boolean;
  nafdacProductName?: string;
  nafdacManufacturer?: string;
  nafdacExpiryDate?: string;
  status: InventoryStatus;
  updatedAt: string;
}

export interface PharmacyOrderItem {
  id: string;
  name: string;
  quantity: number;
  unitPrice: number;
  requiresPrescription: boolean;
}

export interface PharmacyOrder {
  id: string;
  reference: string;
  patientName: string;
  patientPhone: string;
  items: PharmacyOrderItem[];
  status: OrderStatus;
  paymentStatus: PaymentStatus;
  fulfillmentMethod: FulfillmentMethod;
  total: number;
  createdAt: string;
  prescriptionFileName?: string;
}

export interface PharmacyCustomer {
  id: string;
  name: string;
  phone: string;
  email: string;
  orderCount: number;
  totalSpent: number;
  lastOrderAt: string;
}

export interface RefillRequest {
  id: string;
  patientName: string;
  medicationName: string;
  strength: string;
  quantity: number;
  status: "requested" | "accepted" | "declined" | "ready";
  requestedAt: string;
  notes?: string;
}

export interface PharmacyDashboardSummary {
  pharmacyName: string;
  openOrders: number;
  lowStockItems: number;
  refillRequests: number;
  todaySales: number;
  weekSales: number;
  fulfilledThisWeek: number;
  recentOrders: PharmacyOrder[];
  lowStock: InventoryItem[];
}

export interface InventoryUpdateInput {
  stockCount: number;
  reorderLevel: number;
  unitPrice: number;
}

export interface ProductCreateInput extends InventoryUpdateInput {
  name: string;
  genericName?: string;
  brand?: string;
  category: string;
  form?: string;
  strength?: string;
  packSize?: string;
  description?: string;
  sku: string;
  imageUrl: string;
  nafdacNumber: string;
  requiresPrescription: boolean;
  requiresPharmacistReview: boolean;
  preorderSupported: boolean;
}

export interface NafdacVerificationInput {
  nafdacNumber: string;
  productName: string;
  strength?: string;
}

export interface NafdacVerificationResult {
  verified: boolean;
  reason: string;
  nafdacNumber: string;
  nafdacProductId?: number;
  officialName: string;
  strength: string;
  packSize: string;
  description: string;
  composition: string;
  ingredient: string;
  manufacturer: string;
  approvalDate?: string;
  expiryDate?: string;
  nameMatches: boolean;
}

export interface ProductImageUploadResult {
  imageUrl: string;
}

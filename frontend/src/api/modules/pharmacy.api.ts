import { api } from "@/api/API";
import { endpoints } from "@/api/endpoints";
import type { OrderStatus } from "@/types/marketplace";
import type {
  InventoryItem,
  InventoryUpdateInput,
  NafdacVerificationInput,
  NafdacVerificationResult,
  PharmacyCustomer,
  PharmacyDashboardSummary,
  PharmacyOrder,
  ProductCreateInput,
  ProductImageUploadResult,
  RefillRequest,
} from "@/types/pharmacy";

export const pharmacyApi = {
  workspaceAccess: () =>
    api.get<{
      approved: boolean;
      pharmacyId: string;
      pharmacyName: string;
      verificationStatus: string;
    }>(endpoints.pharmacyWorkspace.access),
  dashboard: () =>
    api.get<PharmacyDashboardSummary>(endpoints.pharmacyWorkspace.dashboard),
  orders: () => api.get<PharmacyOrder[]>(endpoints.pharmacyWorkspace.orders),
  updateOrderStatus: (id: string, status: OrderStatus) =>
    api.patch<PharmacyOrder, { status: OrderStatus }>(
      endpoints.pharmacyWorkspace.orderStatus(id),
      { status },
    ),
  inventory: () =>
    api.get<InventoryItem[]>(endpoints.pharmacyWorkspace.inventory),
  verifyNafdac: (input: NafdacVerificationInput) =>
    api.post<NafdacVerificationResult, NafdacVerificationInput>(
      endpoints.pharmacyWorkspace.verifyNafdac,
      input,
    ),
  uploadProductImage: (image: File) => {
    const body = new FormData();
    body.append("image", image);
    return api.post<ProductImageUploadResult, FormData>(
      endpoints.pharmacyWorkspace.productImage,
      body,
      { timeoutMs: 30_000 },
    );
  },
  createInventory: (input: ProductCreateInput) =>
    api.post<InventoryItem, ProductCreateInput>(
      endpoints.pharmacyWorkspace.inventory,
      input,
    ),
  updateInventory: (id: string, input: InventoryUpdateInput) =>
    api.patch<InventoryItem, InventoryUpdateInput>(
      endpoints.pharmacyWorkspace.inventoryItem(id),
      input,
    ),
  customers: () =>
    api.get<PharmacyCustomer[]>(endpoints.pharmacyWorkspace.customers),
  refills: () => api.get<RefillRequest[]>(endpoints.pharmacyWorkspace.refills),
  updateRefillStatus: (id: string, status: RefillRequest["status"]) =>
    api.patch<RefillRequest, { status: RefillRequest["status"] }>(
      endpoints.pharmacyWorkspace.refillStatus(id),
      { status },
    ),
};

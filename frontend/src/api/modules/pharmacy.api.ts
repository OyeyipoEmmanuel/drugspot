import { api } from "@/api/API";
import { endpoints } from "@/api/endpoints";
import { mockPharmacy } from "@/mocks/mock-pharmacy";
import type { OrderStatus } from "@/types/marketplace";
import type { InventoryItem, InventoryUpdateInput, PharmacyCustomer, PharmacyDashboardSummary, PharmacyOrder, RefillRequest } from "@/types/pharmacy";

const useMocks = import.meta.env.VITE_USE_MOCK_API !== "false";

export const pharmacyApi = {
  dashboard: () => useMocks ? mockPharmacy.dashboard() : api.get<PharmacyDashboardSummary>(endpoints.pharmacyWorkspace.dashboard),
  orders: () => useMocks ? mockPharmacy.orders() : api.get<PharmacyOrder[]>(endpoints.pharmacyWorkspace.orders),
  updateOrderStatus: (id: string, status: OrderStatus) => useMocks ? mockPharmacy.updateOrderStatus(id, status) : api.patch<PharmacyOrder, { status: OrderStatus }>(endpoints.pharmacyWorkspace.orderStatus(id), { status }),
  inventory: () => useMocks ? mockPharmacy.inventory() : api.get<InventoryItem[]>(endpoints.pharmacyWorkspace.inventory),
  updateInventory: (id: string, input: InventoryUpdateInput) => useMocks ? mockPharmacy.updateInventory(id, input) : api.patch<InventoryItem, InventoryUpdateInput>(endpoints.pharmacyWorkspace.inventoryItem(id), input),
  customers: () => useMocks ? mockPharmacy.customers() : api.get<PharmacyCustomer[]>(endpoints.pharmacyWorkspace.customers),
  refills: () => useMocks ? mockPharmacy.refills() : api.get<RefillRequest[]>(endpoints.pharmacyWorkspace.refills),
  updateRefillStatus: (id: string, status: RefillRequest["status"]) => useMocks ? mockPharmacy.updateRefillStatus(id, status) : api.patch<RefillRequest, { status: RefillRequest["status"] }>(endpoints.pharmacyWorkspace.refillStatus(id), { status }),
};

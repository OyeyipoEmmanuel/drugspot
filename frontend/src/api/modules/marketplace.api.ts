import { api } from "@/api/API";
import { endpoints } from "@/api/endpoints";
import { mockMarketplace } from "@/mocks/mock-marketplace";
import type { MarketplaceFilters, Pharmacy, Product } from "@/types/marketplace";

const useMocks = import.meta.env.VITE_USE_MOCK_API !== "false";

export const marketplaceApi = {
  listProducts(filters: MarketplaceFilters = {}) {
    const query: Record<string, string | undefined> = { ...filters };
    return useMocks
      ? mockMarketplace.listProducts(filters)
      : api.get<Product[]>(endpoints.products.list, { query });
  },
  product(id: string) {
    return useMocks ? mockMarketplace.product(id) : api.get<Product>(endpoints.products.detail(id));
  },
  listPharmacies() {
    return useMocks ? mockMarketplace.listPharmacies() : api.get<Pharmacy[]>(endpoints.pharmacies.list);
  },
  pharmacy(id: string) {
    return useMocks
      ? mockMarketplace.pharmacy(id)
      : api.get<{ pharmacy: Pharmacy; products: Product[] }>(endpoints.pharmacies.detail(id));
  },
};

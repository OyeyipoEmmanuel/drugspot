import { api } from "@/api/API";
import { endpoints } from "@/api/endpoints";
import { useMockMode } from "@/api/mode";
import { mockMarketplace } from "@/mocks/mock-marketplace";
import type { MarketplaceFilters, Pharmacy, Product } from "@/types/marketplace";

const useMocks = useMockMode;

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
    if (useMocks) return mockMarketplace.listPharmacies();
    return api.get<Pharmacy[]>(endpoints.pharmacies.list);
  },
  async pharmacy(id: string) {
    if (useMocks) return mockMarketplace.pharmacy(id);
    const [pharmacy, products] = await Promise.all([
      api.get<Pharmacy>(endpoints.pharmacies.detail(id)),
      api.get<Product[]>(endpoints.products.list),
    ]);
    return { pharmacy, products: products.filter((product) => product.offers.some((offer) => offer.pharmacyId === id)) };
  },
};

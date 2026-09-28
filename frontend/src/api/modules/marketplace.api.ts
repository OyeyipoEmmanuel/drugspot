import { api } from "@/api/API";
import { endpoints } from "@/api/endpoints";
import type {
  MarketplaceFilters,
  Pharmacy,
  Product,
} from "@/types/marketplace";

export const marketplaceApi = {
  listProducts(filters: MarketplaceFilters = {}) {
    const query: Record<string, string | undefined> = { ...filters };
    return api.get<Product[]>(endpoints.products.list, { query });
  },
  product(id: string) {
    return api.get<Product>(endpoints.products.detail(id));
  },
  listPharmacies() {
    return api.get<Pharmacy[]>(endpoints.pharmacies.list);
  },
  async pharmacy(id: string) {
    const [pharmacy, products] = await Promise.all([
      api.get<Pharmacy>(endpoints.pharmacies.detail(id)),
      api.get<Product[]>(endpoints.products.list),
    ]);
    return {
      pharmacy,
      products: products.filter((product) =>
        product.offers.some((offer) => offer.pharmacyId === id),
      ),
    };
  },
};

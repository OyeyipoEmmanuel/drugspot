import { api } from "@/api/API";
import { endpoints } from "@/api/endpoints";
import { mockMarketplace } from "@/mocks/mock-marketplace";
import type { CheckoutInput, Order, PreOrderRequest } from "@/types/marketplace";

const useMocks = import.meta.env.VITE_USE_MOCK_API !== "false";

export const ordersApi = {
  list() {
    return useMocks ? mockMarketplace.listOrders() : api.get<Order[]>(endpoints.orders.list);
  },
  detail(id: string) {
    return useMocks ? mockMarketplace.order(id) : api.get<Order>(endpoints.orders.detail(id));
  },
  checkout(input: CheckoutInput) {
    return useMocks
      ? mockMarketplace.checkout(input)
      : api.post<Order, CheckoutInput>(endpoints.orders.checkout, input);
  },
  preorder(productId: string, pharmacyId: string, quantity: number) {
    const input = { productId, pharmacyId, quantity };
    return useMocks
      ? mockMarketplace.preorder(productId, pharmacyId, quantity)
      : api.post<PreOrderRequest, typeof input>(endpoints.preorders.list, input);
  },
};

import { api } from "@/api/API";
import { endpoints } from "@/api/endpoints";
import type {
  CheckoutInput,
  Order,
  PreOrderRequest,
} from "@/types/marketplace";

export const ordersApi = {
  list() {
    return api.get<Order[]>(endpoints.orders.list);
  },
  detail(id: string) {
    return api.get<Order>(endpoints.orders.detail(id));
  },
  checkout(input: CheckoutInput) {
    return api.post<Order, CheckoutInput>(endpoints.orders.checkout, input);
  },
  preorder(productId: string, pharmacyId: string, quantity: number) {
    const input = { productId, pharmacyId, quantity };
    return api.post<PreOrderRequest, typeof input>(
      endpoints.preorders.list,
      input,
    );
  },
};

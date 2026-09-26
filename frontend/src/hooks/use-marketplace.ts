import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { marketplaceApi } from "@/api/modules/marketplace.api";
import { ordersApi } from "@/api/modules/orders.api";
import { queryKeys } from "@/api/queryKeys";
import type { CheckoutInput, MarketplaceFilters } from "@/types/marketplace";

export function useProducts(filters: MarketplaceFilters = {}) {
  return useQuery({ queryKey: queryKeys.products({ ...filters }), queryFn: () => marketplaceApi.listProducts(filters) });
}

export function useProduct(id?: string) {
  return useQuery({ queryKey: queryKeys.product(id ?? ""), queryFn: () => marketplaceApi.product(id!), enabled: Boolean(id) });
}

export function usePharmacies() {
  return useQuery({ queryKey: queryKeys.pharmacies(), queryFn: marketplaceApi.listPharmacies });
}

export function usePharmacy(id?: string) {
  return useQuery({ queryKey: queryKeys.pharmacy(id ?? ""), queryFn: () => marketplaceApi.pharmacy(id!), enabled: Boolean(id) });
}

export function useOrders() {
  return useQuery({ queryKey: queryKeys.orders.all, queryFn: ordersApi.list });
}

export function useOrder(id?: string) {
  return useQuery({ queryKey: queryKeys.orders.detail(id ?? ""), queryFn: () => ordersApi.detail(id!), enabled: Boolean(id) });
}

export function useCheckout() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CheckoutInput) => ordersApi.checkout(input),
    onSuccess: (order) => {
      queryClient.setQueryData(queryKeys.orders.detail(order.id), order);
      void queryClient.invalidateQueries({ queryKey: queryKeys.orders.all });
    },
  });
}

export function usePreorder() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ productId, pharmacyId, quantity }: { productId: string; pharmacyId: string; quantity: number }) => ordersApi.preorder(productId, pharmacyId, quantity),
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: queryKeys.preorders }),
  });
}

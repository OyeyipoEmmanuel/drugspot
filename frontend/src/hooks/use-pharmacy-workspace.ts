import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { pharmacyApi } from "@/api/modules/pharmacy.api";
import { queryKeys } from "@/api/queryKeys";
import type { OrderStatus } from "@/types/marketplace";
import type { InventoryUpdateInput, RefillRequest } from "@/types/pharmacy";

export const usePharmacyDashboard = () => useQuery({ queryKey: queryKeys.pharmacyWorkspace.dashboard, queryFn: pharmacyApi.dashboard });
export const usePharmacyOrders = () => useQuery({ queryKey: queryKeys.pharmacyWorkspace.orders, queryFn: pharmacyApi.orders });
export const useInventory = () => useQuery({ queryKey: queryKeys.pharmacyWorkspace.inventory, queryFn: pharmacyApi.inventory });
export const useCustomers = () => useQuery({ queryKey: queryKeys.pharmacyWorkspace.customers, queryFn: pharmacyApi.customers });
export const useRefillRequests = () => useQuery({ queryKey: queryKeys.pharmacyWorkspace.refills, queryFn: pharmacyApi.refills });

function useWorkspaceMutation<TVariables>(mutationFn: (input: TVariables) => Promise<unknown>, keys: readonly (readonly unknown[])[]) {
  const client = useQueryClient();
  return useMutation({ mutationFn, onSuccess: () => keys.forEach((key) => void client.invalidateQueries({ queryKey: key })) });
}

export const useUpdateOrderStatus = () => useWorkspaceMutation(({ id, status }: { id: string; status: OrderStatus }) => pharmacyApi.updateOrderStatus(id, status), [queryKeys.pharmacyWorkspace.orders, queryKeys.pharmacyWorkspace.dashboard]);
export const useUpdateInventory = () => useWorkspaceMutation(({ id, input }: { id: string; input: InventoryUpdateInput }) => pharmacyApi.updateInventory(id, input), [queryKeys.pharmacyWorkspace.inventory, queryKeys.pharmacyWorkspace.dashboard]);
export const useUpdateRefillStatus = () => useWorkspaceMutation(({ id, status }: { id: string; status: RefillRequest["status"] }) => pharmacyApi.updateRefillStatus(id, status), [queryKeys.pharmacyWorkspace.refills, queryKeys.pharmacyWorkspace.dashboard]);

import { Badge } from "@/components/ui/badge";
import type { OrderStatus } from "@/types/marketplace";

const styles: Record<OrderStatus, string> = {
  placed: "bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-200",
  pharmacy_review: "bg-amber-100 text-amber-900 dark:bg-amber-950 dark:text-amber-200",
  accepted: "bg-cyan-100 text-cyan-900 dark:bg-cyan-950 dark:text-cyan-200",
  preparing: "bg-violet-100 text-violet-900 dark:bg-violet-950 dark:text-violet-200",
  ready_for_pickup: "bg-emerald-100 text-emerald-900 dark:bg-emerald-950 dark:text-emerald-200",
  out_for_delivery: "bg-indigo-100 text-indigo-900 dark:bg-indigo-950 dark:text-indigo-200",
  completed: "bg-emerald-100 text-emerald-900 dark:bg-emerald-950 dark:text-emerald-200",
  cancelled: "bg-red-100 text-red-900 dark:bg-red-950 dark:text-red-200",
};

export function OrderStatusBadge({ status }: { status: OrderStatus }) {
  return <Badge className={styles[status]}>{status.replaceAll("_", " ")}</Badge>;
}

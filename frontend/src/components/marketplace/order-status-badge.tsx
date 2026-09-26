import { Badge } from "@/components/ui/badge";
import type { OrderStatus } from "@/types/marketplace";

const styles: Record<OrderStatus, string> = {
  placed: "bg-blue-100 text-blue-800",
  pharmacy_review: "bg-amber-100 text-amber-900",
  accepted: "bg-cyan-100 text-cyan-900",
  preparing: "bg-violet-100 text-violet-900",
  ready_for_pickup: "bg-emerald-100 text-emerald-900",
  out_for_delivery: "bg-indigo-100 text-indigo-900",
  completed: "bg-emerald-100 text-emerald-900",
  cancelled: "bg-red-100 text-red-900",
};

export function OrderStatusBadge({ status }: { status: OrderStatus }) {
  return <Badge className={styles[status]}>{status.replaceAll("_", " ")}</Badge>;
}

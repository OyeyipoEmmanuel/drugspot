import { FileCheck2, Search, Truck } from "lucide-react";
import { useMemo, useState } from "react";

import { ErrorState, LoadingState } from "@/components/feedback-states";
import { OrderStatusBadge } from "@/components/marketplace/order-status-badge";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { usePharmacyOrders, useUpdateOrderStatus } from "@/hooks/use-pharmacy-workspace";
import { formatDate, formatNaira } from "@/lib/format";
import type { OrderStatus } from "@/types/marketplace";

const nextActions: Partial<Record<OrderStatus, { label: string; status: OrderStatus }>> = { placed: { label: "Accept order", status: "accepted" }, pharmacy_review: { label: "Approve prescription", status: "accepted" }, accepted: { label: "Start preparing", status: "preparing" }, preparing: { label: "Mark ready", status: "ready_for_pickup" }, ready_for_pickup: { label: "Complete pickup", status: "completed" }, out_for_delivery: { label: "Mark delivered", status: "completed" } };

export function PharmacyOrdersPage() {
  const { data = [], isLoading, error, refetch } = usePharmacyOrders();
  const update = useUpdateOrderStatus();
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("open");
  const filtered = useMemo(() => data.filter((order) => { const matchesSearch = `${order.reference} ${order.patientName}`.toLowerCase().includes(search.toLowerCase()); const matchesFilter = filter === "all" || (filter === "open" ? !["completed", "cancelled"].includes(order.status) : order.status === filter); return matchesSearch && matchesFilter; }), [data, filter, search]);
  if (isLoading) return <LoadingState label="Loading pharmacy orders…" />;
  if (error) return <ErrorState message="We could not load pharmacy orders." onRetry={() => void refetch()} />;
  return <div className="space-y-6"><section><p className="text-sm font-semibold text-primary">Fulfilment queue</p><h1 className="mt-1 text-3xl font-bold">Orders</h1><p className="mt-2 text-muted-foreground">Review prescriptions, accept orders, and update fulfilment status.</p></section><div className="flex flex-col gap-3 sm:flex-row"><label className="relative flex-1"><Search className="absolute left-3 top-3 size-4 text-muted-foreground" /><Input className="pl-10" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search order or patient" /></label><select className="h-11 rounded-xl border bg-background px-3 text-sm" value={filter} onChange={(event) => setFilter(event.target.value)}><option value="open">Open orders</option><option value="all">All orders</option><option value="pharmacy_review">Needs review</option><option value="preparing">Preparing</option><option value="completed">Completed</option></select></div><div className="space-y-4">{filtered.map((order) => { const action = nextActions[order.status]; return <article key={order.id} className="rounded-3xl border bg-card p-5 shadow-sm sm:p-6"><div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start"><div><div className="flex flex-wrap items-center gap-2"><h2 className="text-lg font-bold">#{order.reference}</h2><OrderStatusBadge status={order.status} />{order.prescriptionFileName && <Badge className="bg-amber-100 text-amber-900"><FileCheck2 className="mr-1 size-3.5" />Prescription</Badge>}</div><p className="mt-2 font-semibold">{order.patientName}</p><p className="text-sm text-muted-foreground">{order.patientPhone} · {formatDate(order.createdAt, { dateStyle: "medium", timeStyle: "short" })}</p></div><div className="sm:text-right"><p className="text-xl font-bold">{formatNaira(order.total)}</p><p className="mt-1 flex items-center gap-1 text-xs capitalize text-muted-foreground sm:justify-end"><Truck className="size-3.5" />{order.fulfillmentMethod}</p></div></div><div className="mt-5 border-t pt-4">{order.items.map((item) => <p key={item.id} className="text-sm"><span className="font-semibold">{item.quantity}× {item.name}</span>{item.requiresPrescription && <span className="ml-2 text-amber-700">Rx</span>}</p>)}</div><div className="mt-5 flex flex-wrap justify-end gap-2">{!["completed", "cancelled"].includes(order.status) && <Button variant="outline" onClick={() => update.mutate({ id: order.id, status: "cancelled" })}>Cancel</Button>}{action && <Button disabled={update.isPending} onClick={() => update.mutate({ id: order.id, status: action.status })}>{action.label}</Button>}</div></article>; })}{!filtered.length && <p className="rounded-2xl border bg-card p-8 text-center text-muted-foreground">No orders match these filters.</p>}</div></div>;
}

import { CalendarClock, Check, PackageCheck, X } from "lucide-react";

import { ErrorState, LoadingState } from "@/components/feedback-states";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useRefillRequests, useUpdateRefillStatus } from "@/hooks/use-pharmacy-workspace";
import { formatDate } from "@/lib/format";

export function RefillRequestsPage() {
  const { data = [], isLoading, error, refetch } = useRefillRequests();
  const update = useUpdateRefillStatus();
  if (isLoading) return <LoadingState label="Loading refill requests…" />;
  if (error) return <ErrorState message="We could not load refill requests." onRetry={() => void refetch()} />;
  return <div className="space-y-6"><section><p className="text-sm font-semibold text-primary">Continuity of care</p><h1 className="mt-1 text-3xl font-bold">Refill requests</h1><p className="mt-2 text-muted-foreground">Confirm stock and coordinate refills before patients run out.</p></section><div className="grid gap-4">{data.map((request) => <article key={request.id} className="rounded-3xl border bg-card p-5 shadow-sm sm:p-6"><div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start"><div className="flex gap-4"><div className="grid size-12 shrink-0 place-items-center rounded-2xl bg-secondary text-primary"><CalendarClock /></div><div><div className="flex flex-wrap items-center gap-2"><h2 className="text-lg font-bold">{request.medicationName} {request.strength}</h2><Badge className="capitalize">{request.status}</Badge></div><p className="mt-2 font-semibold">{request.patientName}</p><p className="mt-1 text-sm text-muted-foreground">Quantity {request.quantity} · Requested {formatDate(request.requestedAt, { dateStyle: "medium", timeStyle: "short" })}</p>{request.notes && <p className="mt-3 rounded-xl bg-muted px-3 py-2 text-sm">{request.notes}</p>}</div></div>{request.status === "requested" && <div className="flex gap-2"><Button variant="outline" onClick={() => update.mutate({ id: request.id, status: "declined" })}><X />Decline</Button><Button onClick={() => update.mutate({ id: request.id, status: "accepted" })}><Check />Accept</Button></div>}{request.status === "accepted" && <Button onClick={() => update.mutate({ id: request.id, status: "ready" })}><PackageCheck />Mark ready</Button>}</div></article>)}</div></div>;
}

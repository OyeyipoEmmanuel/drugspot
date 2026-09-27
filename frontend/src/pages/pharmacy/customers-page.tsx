import { Mail, Phone, Search, Users } from "lucide-react";
import { useMemo, useState } from "react";

import { ErrorState, LoadingState } from "@/components/feedback-states";
import { Input } from "@/components/ui/input";
import { useCustomers } from "@/hooks/use-pharmacy-workspace";
import { formatDate, formatNaira } from "@/lib/format";

export function CustomersPage() {
  const { data = [], isLoading, error, refetch } = useCustomers();
  const [search, setSearch] = useState("");
  const filtered = useMemo(() => data.filter((item) => `${item.name} ${item.phone} ${item.email}`.toLowerCase().includes(search.toLowerCase())), [data, search]);
  if (isLoading) return <LoadingState label="Loading customers…" />;
  if (error) return <ErrorState message="We could not load customers." onRetry={() => void refetch()} />;
  return <div className="space-y-6"><section><p className="text-sm font-semibold text-primary">Customer directory</p><h1 className="mt-1 text-3xl font-bold">Customers</h1><p className="mt-2 text-muted-foreground">Order-derived customer summaries for pharmacy fulfilment and support.</p></section><label className="relative block"><Search className="absolute left-3 top-3 size-4 text-muted-foreground" /><Input className="pl-10" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search name, email, or phone" /></label><section className="overflow-hidden rounded-3xl border bg-card shadow-sm"><div className="divide-y">{filtered.map((customer) => <article key={customer.id} className="grid gap-4 p-5 md:grid-cols-[1.2fr_1fr_0.7fr_0.8fr] md:items-center"><div className="flex items-center gap-3"><div className="grid size-11 shrink-0 place-items-center rounded-xl bg-secondary font-bold text-primary">{customer.name.split(" ").map((part) => part[0]).join("")}</div><div><p className="font-bold">{customer.name}</p><p className="mt-1 flex items-center gap-1 text-xs text-muted-foreground"><Mail className="size-3" />{customer.email}</p></div></div><p className="flex items-center gap-2 text-sm"><Phone className="size-4 text-muted-foreground" />{customer.phone}</p><div><p className="text-xs text-muted-foreground">Orders</p><p className="font-bold">{customer.orderCount}</p></div><div><p className="text-xs text-muted-foreground">Total spent</p><p className="font-bold">{formatNaira(customer.totalSpent)}</p><p className="mt-1 text-xs text-muted-foreground">Last {formatDate(customer.lastOrderAt)}</p></div></article>)}{!filtered.length && <div className="grid place-items-center p-10 text-muted-foreground"><Users /><p className="mt-2">No matching customers.</p></div>}</div></section></div>;
}

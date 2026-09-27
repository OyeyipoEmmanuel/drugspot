import { Boxes, Pencil, Search } from "lucide-react";
import { useMemo, useState } from "react";

import { ErrorState, LoadingState } from "@/components/feedback-states";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useInventory, useUpdateInventory } from "@/hooks/use-pharmacy-workspace";
import { formatNaira } from "@/lib/format";
import type { InventoryItem } from "@/types/pharmacy";

function InventoryRow({ item }: { item: InventoryItem }) {
  const update = useUpdateInventory();
  const [editing, setEditing] = useState(false);
  const [stock, setStock] = useState(String(item.stockCount));
  const [level, setLevel] = useState(String(item.reorderLevel));
  const [price, setPrice] = useState(String(item.unitPrice));
  const save = async () => { await update.mutateAsync({ id: item.id, input: { stockCount: Number(stock), reorderLevel: Number(level), unitPrice: Number(price) } }); setEditing(false); };
  return <article className="rounded-2xl border bg-card p-5 shadow-sm"><div className="flex items-start justify-between gap-3"><div><div className="flex flex-wrap items-center gap-2"><h2 className="font-bold">{item.productName} {item.strength}</h2><Badge className={item.status === "in_stock" ? "bg-emerald-100 text-emerald-800" : item.status === "low_stock" ? "bg-amber-100 text-amber-900" : "bg-red-100 text-red-800"}>{item.status.replaceAll("_", " ")}</Badge></div><p className="mt-1 text-xs text-muted-foreground">{item.sku} · {item.category}{item.requiresPrescription ? " · Prescription" : ""}</p></div><Button variant="ghost" size="icon" aria-label={`Edit ${item.productName}`} onClick={() => setEditing(!editing)}><Pencil /></Button></div>{editing ? <div className="mt-5 grid gap-4 border-t pt-4 sm:grid-cols-3"><label className="text-xs font-semibold">Stock<Input type="number" min="0" className="mt-2" value={stock} onChange={(event) => setStock(event.target.value)} /></label><label className="text-xs font-semibold">Reorder level<Input type="number" min="0" className="mt-2" value={level} onChange={(event) => setLevel(event.target.value)} /></label><label className="text-xs font-semibold">Price (NGN)<Input type="number" min="0" className="mt-2" value={price} onChange={(event) => setPrice(event.target.value)} /></label><div className="flex gap-2 sm:col-span-3"><Button onClick={() => void save()} disabled={update.isPending}>Save changes</Button><Button variant="outline" onClick={() => setEditing(false)}>Cancel</Button></div></div> : <div className="mt-5 grid grid-cols-3 gap-3 border-t pt-4 text-sm"><div><p className="text-xs text-muted-foreground">Stock</p><p className="mt-1 font-bold">{item.stockCount}</p></div><div><p className="text-xs text-muted-foreground">Reorder at</p><p className="mt-1 font-bold">{item.reorderLevel}</p></div><div><p className="text-xs text-muted-foreground">Price</p><p className="mt-1 font-bold">{formatNaira(item.unitPrice)}</p></div></div>}</article>;
}

export function InventoryPage() {
  const { data = [], isLoading, error, refetch } = useInventory();
  const [search, setSearch] = useState("");
  const filtered = useMemo(() => data.filter((item) => `${item.productName} ${item.sku} ${item.category}`.toLowerCase().includes(search.toLowerCase())), [data, search]);
  if (isLoading) return <LoadingState label="Loading inventory…" />;
  if (error) return <ErrorState message="We could not load inventory." onRetry={() => void refetch()} />;
  return <div className="space-y-6"><section className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end"><div><p className="text-sm font-semibold text-primary">Stock control</p><h1 className="mt-1 text-3xl font-bold">Inventory</h1><p className="mt-2 text-muted-foreground">Update stock, reorder levels, and marketplace prices.</p></div><div className="flex items-center gap-2 rounded-xl bg-secondary px-4 py-3 text-sm font-semibold text-primary"><Boxes />{data.length} products</div></section><label className="relative block"><Search className="absolute left-3 top-3 size-4 text-muted-foreground" /><Input className="pl-10" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search product, SKU, or category" /></label><section className="grid gap-4 xl:grid-cols-2">{filtered.map((item) => <InventoryRow key={item.id} item={item} />)}</section></div>;
}

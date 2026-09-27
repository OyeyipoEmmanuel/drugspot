import { Boxes, Pencil, Plus } from "lucide-react";
import { useMemo, useState } from "react";

import { ErrorState, LoadingState } from "@/components/feedback-states";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useCreateInventory, useInventory, useUpdateInventory } from "@/hooks/use-pharmacy-workspace";
import { formatNaira } from "@/lib/format";
import type { InventoryItem, ProductCreateInput } from "@/types/pharmacy";

const emptyProduct: ProductCreateInput = {
  name: "",
  strength: "",
  sku: "",
  category: "",
  stockCount: 0,
  reorderLevel: 5,
  unitPrice: 0,
  requiresPrescription: false,
  requiresPharmacistReview: false,
  preorderSupported: false,
};

function AddInventoryForm({ onClose }: { onClose: () => void }) {
  const create = useCreateInventory();
  const [product, setProduct] = useState<ProductCreateInput>(emptyProduct);
  const set = <K extends keyof ProductCreateInput>(key: K, value: ProductCreateInput[K]) => setProduct((current) => ({ ...current, [key]: value }));
  const save = async () => { await create.mutateAsync(product); setProduct(emptyProduct); onClose(); };
  return <section className="rounded-3xl border bg-card p-5 shadow-sm sm:p-7"><div><h2 className="text-xl font-bold">Add catalogue product</h2><p className="mt-1 text-sm text-muted-foreground">This product becomes visible in the marketplace after it has stock.</p></div><div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3"><label className="text-xs font-semibold">Product name<Input className="mt-2" value={product.name} onChange={(event) => set("name", event.target.value)} /></label><label className="text-xs font-semibold">Strength<Input className="mt-2" value={product.strength} onChange={(event) => set("strength", event.target.value)} placeholder="e.g. 500 mg" /></label><label className="text-xs font-semibold">SKU<Input className="mt-2" value={product.sku} onChange={(event) => set("sku", event.target.value)} /></label><label className="text-xs font-semibold">Category<Input className="mt-2" value={product.category} onChange={(event) => set("category", event.target.value)} /></label><label className="text-xs font-semibold">Stock<Input className="mt-2" type="number" min="0" value={product.stockCount} onChange={(event) => set("stockCount", Number(event.target.value))} /></label><label className="text-xs font-semibold">Reorder level<Input className="mt-2" type="number" min="0" value={product.reorderLevel} onChange={(event) => set("reorderLevel", Number(event.target.value))} /></label><label className="text-xs font-semibold">Price (NGN)<Input className="mt-2" type="number" min="1" value={product.unitPrice} onChange={(event) => set("unitPrice", Number(event.target.value))} /></label></div><div className="mt-5 flex flex-wrap gap-5 text-sm font-medium"><label className="flex items-center gap-2"><input type="checkbox" checked={product.requiresPrescription} onChange={(event) => set("requiresPrescription", event.target.checked)} />Prescription required</label><label className="flex items-center gap-2"><input type="checkbox" checked={product.preorderSupported} onChange={(event) => set("preorderSupported", event.target.checked)} />Allow pre-orders</label></div>{create.error && <p className="mt-4 text-sm text-red-700">{create.error.message}</p>}<div className="mt-5 flex gap-2"><Button disabled={create.isPending || !product.name || !product.sku || !product.category || product.unitPrice <= 0} onClick={() => void save()}>Save product</Button><Button variant="outline" onClick={onClose}>Cancel</Button></div></section>;
}

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
  const [adding, setAdding] = useState(false);
  const filtered = useMemo(() => data.filter((item) => `${item.productName} ${item.sku} ${item.category}`.toLowerCase().includes(search.toLowerCase())), [data, search]);
  if (isLoading) return <LoadingState label="Loading inventory…" />;
  if (error) return <ErrorState message="We could not load inventory." onRetry={() => void refetch()} />;
  return <div className="space-y-6"><section className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end"><div><p className="text-sm font-semibold text-primary">Stock control</p><h1 className="mt-1 text-3xl font-bold">Inventory</h1><p className="mt-2 text-muted-foreground">Add products and update stock, reorder levels, and marketplace prices.</p></div><div className="flex gap-2"><div className="flex items-center gap-2 rounded-xl bg-secondary px-4 py-3 text-sm font-semibold text-primary"><Boxes />{data.length} products</div><Button onClick={() => setAdding(true)}><Plus />Add product</Button></div></section>{adding && <AddInventoryForm onClose={() => setAdding(false)} />}<label className="relative block"><Input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search product, SKU, or category" /></label><section className="grid gap-4 xl:grid-cols-2">{filtered.map((item) => <InventoryRow key={item.id} item={item} />)}</section>{!filtered.length && <p className="rounded-2xl border border-dashed p-10 text-center text-muted-foreground">No products yet. Add the pharmacy's first catalogue item.</p>}</div>;
}

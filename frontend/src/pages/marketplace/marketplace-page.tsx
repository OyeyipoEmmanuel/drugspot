import { Building2, Search, ShieldCheck, SlidersHorizontal } from "lucide-react";
import { useState } from "react";
import { Link } from "react-router-dom";

import { ErrorState, LoadingState } from "@/components/feedback-states";
import { ProductCard } from "@/components/marketplace/product-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { usePharmacies, useProducts } from "@/hooks/use-marketplace";

const categories = ["All", "Pain & fever", "Prescription medicine", "Heart health", "Vitamins", "Allergy"];

export function MarketplacePage() {
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All");
  const [availability, setAvailability] = useState<"all" | "available" | "preorder">("all");
  const productsQuery = useProducts({ search, category, availability });
  const pharmaciesQuery = usePharmacies();
  const products = productsQuery.data ?? [];
  const pharmacies = pharmaciesQuery.data ?? [];
  return (
    <div className="space-y-7">
      <section className="overflow-hidden rounded-3xl bg-primary px-6 py-8 text-primary-foreground shadow-lg sm:px-9 sm:py-10"><div className="flex flex-col justify-between gap-6 lg:flex-row lg:items-end"><div className="max-w-2xl"><div className="flex items-center gap-2 text-sm font-semibold text-blue-100"><ShieldCheck className="size-4" />Verified pharmacy marketplace</div><h1 className="mt-3 text-3xl font-bold sm:text-4xl">Find medicine from trusted pharmacies</h1><p className="mt-3 leading-7 text-blue-100">Compare availability, price, pickup, and delivery. Prescription items are reviewed by a pharmacy professional before fulfilment.</p></div><Button asChild className="bg-white text-slate-900 hover:bg-blue-50"><Link to="/marketplace/pharmacies"><Building2 />Browse pharmacies</Link></Button></div></section>
      <section className="space-y-4 rounded-2xl border bg-card p-4 shadow-sm"><div className="relative"><Search className="absolute left-3 top-3 size-5 text-muted-foreground" /><Input className="pl-10" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search medicine, brand, or category" /></div><div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between"><div className="flex gap-2 overflow-x-auto pb-1">{categories.map((value) => <button key={value} onClick={() => setCategory(value)} className={`whitespace-nowrap rounded-full px-3 py-2 text-xs font-semibold transition ${category === value ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:text-foreground"}`}>{value}</button>)}</div><div className="flex items-center gap-2"><SlidersHorizontal className="size-4 text-muted-foreground" /><select aria-label="Availability" value={availability} onChange={(event) => setAvailability(event.target.value as typeof availability)} className="h-10 rounded-xl border bg-background px-3 text-sm font-medium"><option value="all">All availability</option><option value="available">In stock</option><option value="preorder">Pre-order</option></select></div></div></section>
      {productsQuery.isLoading || pharmaciesQuery.isLoading ? <LoadingState label="Finding medicine…" /> : productsQuery.error ? <ErrorState message={productsQuery.error.message} onRetry={() => void productsQuery.refetch()} /> : products.length ? <section><div className="mb-4 flex items-center justify-between"><h2 className="text-xl font-bold">Available products</h2><span className="text-sm text-muted-foreground">{products.length} results</span></div><div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">{products.map((product) => <ProductCard key={product.id} product={product} pharmacies={pharmacies} />)}</div></section> : <section className="rounded-2xl border border-dashed p-12 text-center"><h2 className="font-bold">No matching medicine</h2><p className="mt-1 text-sm text-muted-foreground">Try a different search or availability filter.</p></section>}
    </div>
  );
}

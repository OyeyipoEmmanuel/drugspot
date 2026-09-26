import { ChevronRight, FileCheck2, PackageX, Pill } from "lucide-react";
import { Link } from "react-router-dom";

import { Badge } from "@/components/ui/badge";
import { formatNaira } from "@/lib/format";
import type { Pharmacy, Product } from "@/types/marketplace";

export function ProductCard({ product, pharmacies }: { product: Product; pharmacies: Pharmacy[] }) {
  const availableOffers = product.offers.filter((offer) => offer.stockStatus !== "out_of_stock");
  const lowestOffer = [...availableOffers].sort((left, right) => left.price - right.price)[0];
  const pharmacy = pharmacies.find((item) => item.id === lowestOffer?.pharmacyId);
  const preorderOnly = !lowestOffer && product.offers.some((offer) => offer.preorderSupported);
  return (
    <Link to={`/marketplace/products/${product.id}`} className="group flex h-full flex-col rounded-2xl border bg-card p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-blue-300 hover:shadow-md">
      <div className="flex items-start justify-between gap-3"><div className="grid size-12 place-items-center rounded-2xl bg-secondary text-primary"><Pill /></div><ChevronRight className="size-5 text-muted-foreground transition group-hover:translate-x-1 group-hover:text-primary" /></div>
      <div className="mt-5 flex-1"><p className="text-xs font-semibold text-primary">{product.category}</p><h2 className="mt-1 text-lg font-bold">{product.name}</h2><p className="mt-1 text-sm font-medium text-muted-foreground">{product.strength} · {product.form} · {product.packSize}</p><p className="mt-3 line-clamp-2 text-sm leading-6 text-muted-foreground">{product.description}</p></div>
      <div className="mt-5 space-y-3 border-t pt-4">{product.requiresPrescription && <Badge className="bg-amber-100 text-amber-900"><FileCheck2 className="mr-1 size-3.5" />Prescription required</Badge>}{lowestOffer ? <div><p className="text-lg font-bold">From {formatNaira(lowestOffer.price)}</p><p className="mt-1 text-xs text-muted-foreground">{availableOffers.length} verified {availableOffers.length === 1 ? "pharmacy" : "pharmacies"}{pharmacy ? ` · ${pharmacy.name}` : ""}</p></div> : <div className="flex items-center gap-2 text-sm font-semibold text-amber-700"><PackageX className="size-4" />{preorderOnly ? "Available for pre-order" : "Currently unavailable"}</div>}</div>
    </Link>
  );
}

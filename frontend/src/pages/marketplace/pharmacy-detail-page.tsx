import { ArrowLeft, Clock3, MapPin, Phone, Star, Truck } from "lucide-react";
import { Link, useParams } from "react-router-dom";

import { ErrorState, LoadingState } from "@/components/feedback-states";
import { ProductCard } from "@/components/marketplace/product-card";
import { VerifiedBadge } from "@/components/marketplace/verified-badge";
import { Button } from "@/components/ui/button";
import { usePharmacies, usePharmacy } from "@/hooks/use-marketplace";
import { formatNaira } from "@/lib/format";

export function PharmacyDetailPage() {
  const { id = "" } = useParams();
  const { data, isLoading, error } = usePharmacy(id);
  const pharmaciesQuery = usePharmacies();
  if (isLoading || pharmaciesQuery.isLoading) return <LoadingState label="Loading pharmacy…" />;
  if (error || !data) return <ErrorState message={error?.message ?? "Pharmacy not found."} />;
  const { pharmacy, products } = data;
  return <div className="space-y-6"><Button asChild variant="ghost" className="-ml-3"><Link to="/marketplace/pharmacies"><ArrowLeft />All pharmacies</Link></Button><section className="rounded-3xl bg-primary p-6 text-primary-foreground shadow-lg sm:p-8"><div className="flex flex-col justify-between gap-6 lg:flex-row lg:items-start"><div><div className="flex flex-wrap items-center gap-3"><h1 className="text-3xl font-bold">{pharmacy.name}</h1><VerifiedBadge /></div><p className="mt-4 max-w-2xl leading-7 text-blue-100">{pharmacy.description}</p></div><span className="flex w-fit items-center gap-2 rounded-xl bg-white/12 px-3 py-2 text-sm font-bold"><Star className="size-4 fill-amber-300 text-amber-300" />{pharmacy.rating} ({pharmacy.reviewCount} reviews)</span></div><div className="mt-7 grid gap-3 border-t border-white/15 pt-6 text-sm text-blue-50 sm:grid-cols-2 lg:grid-cols-4"><span className="flex items-start gap-2"><MapPin className="mt-0.5 size-4 shrink-0" />{pharmacy.address}</span><span className="flex items-center gap-2"><Clock3 className="size-4" />{pharmacy.hours}</span><span className="flex items-center gap-2"><Phone className="size-4" />{pharmacy.phone}</span><span className="flex items-center gap-2"><Truck className="size-4" />{pharmacy.supportsDelivery ? `Delivery ${formatNaira(pharmacy.deliveryFee)}` : "Pickup only"}</span></div></section><section><h2 className="text-xl font-bold">Products from this pharmacy</h2><p className="mt-1 text-sm text-muted-foreground">Select a product to confirm current availability and price.</p><div className="mt-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">{products.map((product) => <ProductCard key={product.id} product={{ ...product, offers: product.offers.filter((offer) => offer.pharmacyId === id) }} pharmacies={pharmaciesQuery.data ?? [pharmacy]} />)}</div></section></div>;
}

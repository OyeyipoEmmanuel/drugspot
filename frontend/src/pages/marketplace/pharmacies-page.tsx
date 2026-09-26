import { ArrowLeft, Clock3, MapPin, Star, Truck } from "lucide-react";
import { Link } from "react-router-dom";

import { ErrorState, LoadingState } from "@/components/feedback-states";
import { VerifiedBadge } from "@/components/marketplace/verified-badge";
import { Button } from "@/components/ui/button";
import { usePharmacies } from "@/hooks/use-marketplace";
import { formatNaira } from "@/lib/format";

export function PharmaciesPage() {
  const { data = [], isLoading, error, refetch } = usePharmacies();
  if (isLoading) return <LoadingState label="Loading verified pharmacies…" />;
  if (error) return <ErrorState message={error.message} onRetry={() => void refetch()} />;
  return <div className="space-y-6"><Button asChild variant="ghost" className="-ml-3"><Link to="/marketplace"><ArrowLeft />Marketplace</Link></Button><section><p className="text-sm font-semibold text-primary">Licensed premises</p><h1 className="mt-1 text-3xl font-bold">Verified pharmacies</h1><p className="mt-2 text-muted-foreground">Compare location, fulfilment options, opening hours, and available products.</p></section><section className="grid gap-4 lg:grid-cols-2">{data.map((pharmacy) => <Link key={pharmacy.id} to={`/marketplace/pharmacies/${pharmacy.id}`} className="rounded-2xl border bg-card p-5 shadow-sm transition hover:border-blue-300 hover:shadow-md"><div className="flex items-start justify-between gap-4"><div><div className="flex flex-wrap items-center gap-2"><h2 className="text-lg font-bold">{pharmacy.name}</h2><VerifiedBadge compact /></div><p className="mt-3 flex items-start gap-2 text-sm text-muted-foreground"><MapPin className="mt-0.5 size-4 shrink-0" />{pharmacy.address}</p></div><span className="flex items-center gap-1 rounded-full bg-amber-50 px-2 py-1 text-xs font-bold text-amber-800 dark:bg-amber-950 dark:text-amber-200"><Star className="size-3.5 fill-amber-400 text-amber-400" />{pharmacy.rating}</span></div><div className="mt-5 grid gap-2 border-t pt-4 text-xs text-muted-foreground sm:grid-cols-3"><span className="flex items-center gap-1.5"><Clock3 className="size-4" />{pharmacy.hours.split(" · ")[0]}</span><span className="flex items-center gap-1.5"><Truck className="size-4" />{pharmacy.supportsDelivery ? `Delivery ${formatNaira(pharmacy.deliveryFee)}` : "Pickup only"}</span><span>{pharmacy.distanceKm} km away</span></div></Link>)}</section></div>;
}

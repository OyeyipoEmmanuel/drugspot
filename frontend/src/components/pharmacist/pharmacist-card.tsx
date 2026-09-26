import { Clock3, Languages, MessageCircle, Star } from "lucide-react";
import { Link } from "react-router-dom";

import { VerifiedBadge } from "@/components/marketplace/verified-badge";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { PharmacistProfile } from "@/types/pharmacist";

export function PharmacistCard({ pharmacist }: { pharmacist: PharmacistProfile }) {
  const available = pharmacist.availability === "available";
  return <article className="rounded-3xl border bg-card p-5 shadow-sm"><div className="flex items-start gap-4"><div className="grid size-14 shrink-0 place-items-center rounded-2xl bg-secondary text-lg font-bold text-primary">{pharmacist.firstName[0]}{pharmacist.lastName[0]}</div><div className="min-w-0"><div className="flex flex-wrap items-center gap-2"><h3 className="font-bold">Pharm. {pharmacist.firstName} {pharmacist.lastName}</h3><VerifiedBadge /></div><p className="mt-1 text-sm text-muted-foreground">{pharmacist.title} · {pharmacist.pharmacyName}</p><Badge className={`mt-3 ${available ? "bg-emerald-100 text-emerald-800" : pharmacist.availability === "busy" ? "bg-amber-100 text-amber-800" : "bg-muted text-muted-foreground"}`}>{available ? "Available now" : pharmacist.availability}</Badge></div></div><p className="mt-4 text-sm leading-6 text-muted-foreground">{pharmacist.bio}</p><div className="mt-4 flex flex-wrap gap-x-4 gap-y-2 text-xs text-muted-foreground"><span className="flex items-center gap-1"><Star className="size-3.5 fill-amber-400 text-amber-500" />{pharmacist.rating}</span><span className="flex items-center gap-1"><Clock3 className="size-3.5" />Usually {pharmacist.responseTimeMinutes} min</span><span className="flex items-center gap-1"><Languages className="size-3.5" />{pharmacist.languages.join(", ")}</span></div><Button asChild className="mt-5 w-full"><Link to={`/pharmacist/new/${pharmacist.id}`}><MessageCircle />Ask this pharmacist</Link></Button></article>;
}

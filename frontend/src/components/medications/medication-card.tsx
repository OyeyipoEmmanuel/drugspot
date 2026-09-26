import { CalendarDays, ChevronRight, Clock3, Pill } from "lucide-react";
import { Link } from "react-router-dom";

import { Badge } from "@/components/ui/badge";
import type { Medication } from "@/types/medication";

export function MedicationCard({ medication }: { medication: Medication }) {
  const isLow = medication.status === "active" && medication.remainingDoses <= 7;
  return (
    <Link to={`/medicines/${medication.id}`} className="group block rounded-2xl border bg-card p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-blue-300 hover:shadow-md">
      <div className="flex items-start gap-4">
        <div className="grid size-12 shrink-0 place-items-center rounded-2xl bg-secondary text-primary"><Pill /></div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div><h2 className="truncate text-lg font-bold">{medication.name}</h2><p className="text-sm font-semibold text-primary">{medication.strength} · {medication.form}</p></div>
            <Badge className={medication.status === "completed" ? "bg-muted text-muted-foreground" : "bg-emerald-100 text-emerald-800"}>{medication.status}</Badge>
          </div>
          <p className="mt-3 text-sm text-muted-foreground">{medication.instructions}</p>
          <div className="mt-4 flex flex-wrap gap-x-5 gap-y-2 text-xs font-medium text-muted-foreground"><span className="flex items-center gap-1.5"><Clock3 className="size-4" />{medication.frequency}</span><span className="flex items-center gap-1.5"><CalendarDays className="size-4" />Until {new Intl.DateTimeFormat("en-NG", { day: "numeric", month: "short" }).format(new Date(`${medication.endDate}T12:00:00`))}</span></div>
          {isLow && <p className="mt-4 rounded-xl bg-amber-50 px-3 py-2 text-xs font-semibold text-amber-800">Only {medication.remainingDoses} doses remaining — plan your refill.</p>}
        </div>
        <ChevronRight className="mt-3 size-5 shrink-0 text-muted-foreground transition group-hover:translate-x-1 group-hover:text-primary" />
      </div>
    </Link>
  );
}

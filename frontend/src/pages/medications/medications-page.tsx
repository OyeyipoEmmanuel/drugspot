import { Camera, Plus, Search } from "lucide-react";
import { useMemo, useState } from "react";
import { Link } from "react-router-dom";

import { ErrorState, LoadingState } from "@/components/feedback-states";
import { MedicationCard } from "@/components/medications/medication-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useMedications } from "@/hooks/use-medications";

export function MedicationsPage() {
  const { data = [], isLoading, error, refetch } = useMedications();
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<"all" | "active" | "completed">("all");
  const filtered = useMemo(() => data.filter((item) => (status === "all" || item.status === status) && item.name.toLowerCase().includes(query.toLowerCase())), [data, query, status]);
  return (
    <div className="space-y-6">
      <section className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end"><div><p className="text-sm font-semibold text-primary">Medication support</p><h1 className="mt-1 text-3xl font-bold tracking-tight">My medicines</h1><p className="mt-2 text-muted-foreground">Schedules, reminders, and adherence history in one place.</p></div><div className="flex gap-2"><Button asChild variant="outline"><Link to="/medicines/scan"><Camera />Scan</Link></Button><Button asChild><Link to="/medicines/new"><Plus />Add medicine</Link></Button></div></section>
      <section className="grid gap-3 rounded-2xl border bg-card p-4 sm:grid-cols-[1fr_auto]"><div className="relative"><Search className="absolute left-3 top-3 size-5 text-muted-foreground" /><Input className="pl-10" placeholder="Search your medicines" value={query} onChange={(event) => setQuery(event.target.value)} /></div><div className="flex rounded-xl bg-muted p-1">{(["all", "active", "completed"] as const).map((value) => <button key={value} onClick={() => setStatus(value)} className={`rounded-lg px-3 py-2 text-xs font-semibold capitalize transition ${status === value ? "bg-background text-primary shadow-sm" : "text-muted-foreground"}`}>{value}</button>)}</div></section>
      {isLoading ? <LoadingState label="Loading medicines…" /> : error ? <ErrorState message={error.message} onRetry={() => void refetch()} /> : filtered.length ? <section className="grid gap-4 lg:grid-cols-2">{filtered.map((medication) => <MedicationCard key={medication.id} medication={medication} />)}</section> : <section className="rounded-2xl border border-dashed p-10 text-center"><p className="font-bold">No medicines found</p><p className="mt-1 text-sm text-muted-foreground">Try another search or add a medication.</p></section>}
    </div>
  );
}

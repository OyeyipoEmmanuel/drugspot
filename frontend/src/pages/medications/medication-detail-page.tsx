import { ArrowLeft, CalendarDays, Check, Clock3, Edit3, History, PackagePlus, TimerReset, X } from "lucide-react";
import { Link, useParams } from "react-router-dom";

import { ErrorState, LoadingState } from "@/components/feedback-states";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useLogAdherence, useMedication } from "@/hooks/use-medications";
import type { AdherenceStatus } from "@/types/medication";

const statusStyle: Record<AdherenceStatus, string> = { taken: "bg-emerald-100 text-emerald-800", skipped: "bg-red-100 text-red-800", snoozed: "bg-amber-100 text-amber-800" };

export function MedicationDetailPage() {
  const { id = "" } = useParams();
  const { data: medication, isLoading, error, refetch } = useMedication(id);
  const adherence = useLogAdherence(id);
  if (isLoading) return <LoadingState label="Loading medication…" />;
  if (error || !medication) return <ErrorState message={error?.message ?? "Medication not found."} onRetry={() => void refetch()} />;
  const log = (status: AdherenceStatus) => adherence.mutate(status);
  const lowDoses = medication.status === "active" && medication.remainingDoses <= 7;
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3"><Button asChild variant="ghost" className="-ml-3"><Link to="/medicines"><ArrowLeft />My medicines</Link></Button><Button asChild variant="outline"><Link to={`/medicines/${id}/edit`}><Edit3 />Edit</Link></Button></div>
      <section className="overflow-hidden rounded-3xl bg-primary p-6 text-primary-foreground shadow-lg sm:p-8"><div className="flex flex-wrap items-start justify-between gap-5"><div><Badge className="bg-white/15 text-white">{medication.status}</Badge><h1 className="mt-4 text-3xl font-bold sm:text-4xl">{medication.name}</h1><p className="mt-2 text-lg text-blue-100">{medication.strength} · {medication.form}</p></div><div className="rounded-2xl bg-white/10 px-5 py-4 text-center"><p className="text-3xl font-bold">{medication.remainingDoses}</p><p className="text-xs text-blue-100">doses remaining</p></div></div><p className="mt-6 max-w-2xl text-blue-50">{medication.instructions}</p><div className="mt-6 flex flex-wrap gap-3">{medication.schedules.map((schedule) => <span key={schedule.id} className="flex items-center gap-2 rounded-full bg-white/12 px-3 py-2 text-sm"><Clock3 className="size-4" />{schedule.time} · {schedule.label}</span>)}</div></section>
      {lowDoses && <section className="flex flex-col justify-between gap-4 rounded-2xl border border-amber-200 bg-amber-50 p-5 sm:flex-row sm:items-center"><div className="flex gap-3"><PackagePlus className="mt-1 shrink-0 text-amber-700" /><div><h2 className="font-bold text-amber-950">Time to plan a refill</h2><p className="mt-1 text-sm text-amber-800">You have {medication.remainingDoses} doses left. Send a refill request before you run out.</p></div></div><Button>Request refill</Button></section>}
      <section className="rounded-3xl border bg-card p-5 shadow-sm sm:p-7"><h2 className="text-xl font-bold">Record this dose</h2><p className="mt-1 text-sm text-muted-foreground">Your response is saved as a self-reported adherence event.</p><div className="mt-5 grid gap-3 sm:grid-cols-3"><Button disabled={adherence.isPending} onClick={() => log("taken")}><Check />Taken</Button><Button disabled={adherence.isPending} variant="outline" onClick={() => log("snoozed")}><TimerReset />Snooze</Button><Button disabled={adherence.isPending} variant="outline" onClick={() => log("skipped")}><X />Skipped</Button></div></section>
      <div className="grid gap-5 lg:grid-cols-2"><section className="rounded-3xl border bg-card p-5 shadow-sm sm:p-7"><h2 className="flex items-center gap-2 text-xl font-bold"><CalendarDays className="text-primary" />Medication details</h2><dl className="mt-5 space-y-4 text-sm">{[["Frequency", medication.frequency], ["Started", new Intl.DateTimeFormat("en-NG", { dateStyle: "medium" }).format(new Date(`${medication.startDate}T12:00:00`))], ["Expected finish", new Intl.DateTimeFormat("en-NG", { dateStyle: "medium" }).format(new Date(`${medication.endDate}T12:00:00`))], ["Pharmacy", medication.pharmacy ?? "Not specified"], ["Prescriber", medication.prescribedBy ?? "Not specified"]].map(([term, description]) => <div key={term} className="flex justify-between gap-4 border-b pb-3 last:border-0"><dt className="text-muted-foreground">{term}</dt><dd className="text-right font-semibold">{description}</dd></div>)}</dl></section><section className="rounded-3xl border bg-card p-5 shadow-sm sm:p-7"><h2 className="flex items-center gap-2 text-xl font-bold"><History className="text-primary" />Recent history</h2><div className="mt-5 space-y-3">{medication.adherence.length ? medication.adherence.slice(0, 6).map((event) => <div key={event.id} className="flex items-center justify-between rounded-xl bg-muted/60 p-3"><div><p className="text-sm font-semibold">Scheduled dose</p><p className="text-xs text-muted-foreground">{new Intl.DateTimeFormat("en-NG", { dateStyle: "medium", timeStyle: "short" }).format(new Date(event.recordedAt))}</p></div><Badge className={statusStyle[event.status]}>{event.status}</Badge></div>) : <p className="rounded-xl border border-dashed p-6 text-center text-sm text-muted-foreground">No adherence history yet.</p>}</div></section></div>
    </div>
  );
}

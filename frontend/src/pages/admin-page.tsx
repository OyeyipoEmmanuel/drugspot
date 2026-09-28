import { Building2, CheckCircle2, LoaderCircle, ShieldCheck, XCircle } from "lucide-react";
import { useState } from "react";

import { ErrorState, LoadingState } from "@/components/feedback-states";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  useVerificationDecision,
  useVerificationQueue,
} from "@/hooks/use-verification";
import type { VerificationDecisionInput } from "@/types/verification";

export function AdminPage() {
  const queue = useVerificationQueue();
  const decision = useVerificationDecision();
  const [notes, setNotes] = useState<Record<string, string>>({});

  if (queue.isLoading) return <LoadingState label="Loading verification queue…" />;
  if (queue.error) return <ErrorState message={queue.error.message} onRetry={() => void queue.refetch()} />;

  const items = queue.data ?? [];
  const decide = (pharmacyId: string, nextDecision: VerificationDecisionInput["decision"]) => {
    decision.mutate({ pharmacyId, input: { decision: nextDecision, notes: notes[pharmacyId] || undefined } });
  };

  return (
    <div className="space-y-7">
      <section>
        <p className="text-sm font-semibold text-primary">Platform administration</p>
        <h1 className="mt-1 text-3xl font-bold">Pharmacy verification</h1>
        <p className="mt-2 text-muted-foreground">Review the vendor, pharmacy licence, and pharmacist-in-charge credentials as one application.</p>
      </section>
      <section className="grid gap-4 sm:grid-cols-2">
        <article className="rounded-2xl border bg-card p-5 shadow-sm"><Building2 className="text-primary" /><p className="mt-4 text-3xl font-bold">{items.length}</p><p className="text-sm text-muted-foreground">Awaiting review</p></article>
        <article className="rounded-2xl border bg-card p-5 shadow-sm"><ShieldCheck className="text-emerald-600" /><p className="mt-4 text-3xl font-bold">{items.filter((item) => item.licenses.length > 0 && item.pharmacistInCharge).length}</p><p className="text-sm text-muted-foreground">Complete credential sets</p></article>
      </section>

      {decision.error && <p className="rounded-xl bg-red-50 p-4 text-sm text-red-700">{decision.error.message}</p>}
      {items.length === 0 ? (
        <section className="rounded-3xl border bg-card p-10 text-center shadow-sm"><CheckCircle2 className="mx-auto size-10 text-emerald-600" /><h2 className="mt-4 text-xl font-bold">Queue is clear</h2><p className="mt-2 text-sm text-muted-foreground">There are no pending pharmacy applications.</p></section>
      ) : (
        <section className="space-y-5">
          {items.map(({ pharmacy, licenses, pharmacistInCharge }) => (
            <article key={pharmacy.id} className="rounded-3xl border bg-card p-6 shadow-sm sm:p-8">
              <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
                <div><div className="flex flex-wrap items-center gap-2"><h2 className="text-xl font-bold">{pharmacy.name}</h2><Badge>{pharmacy.verificationStatus}</Badge></div><p className="mt-2 text-sm text-muted-foreground">{pharmacy.address}, {pharmacy.city}, {pharmacy.state}</p><p className="mt-1 text-sm text-muted-foreground">{pharmacy.email} · {pharmacy.phone}</p></div>
                <span className="font-mono text-xs text-muted-foreground">{pharmacy.id}</span>
              </div>
              <div className="mt-6 rounded-2xl bg-muted p-4">
                <h3 className="font-bold">Pharmacy licence</h3>
                {licenses.length ? <ul className="mt-3 space-y-2">{licenses.map((license) => <li key={license.id} className="text-sm"><span className="font-semibold">{license.licenseNumber}</span> · {license.issuedBy}{license.documentUrl && <> · <a className="text-primary underline" href={license.documentUrl} target="_blank" rel="noreferrer">View document</a></>}</li>)}</ul> : <p className="mt-2 text-sm text-amber-700">No licence has been submitted. Approval is blocked by the API.</p>}
              </div>
              <div className="mt-4 rounded-2xl bg-muted p-4">
                <h3 className="font-bold">Pharmacist in charge</h3>
                {pharmacistInCharge ? <div className="mt-3 text-sm"><p className="font-semibold">{pharmacistInCharge.firstName} {pharmacistInCharge.lastName}</p><p className="mt-1 text-muted-foreground">Licence {pharmacistInCharge.licenseNumber} · {pharmacistInCharge.licenseIssuedBy}</p>{pharmacistInCharge.licenseDocumentUrl && <a className="mt-2 inline-block text-primary underline" href={pharmacistInCharge.licenseDocumentUrl} target="_blank" rel="noreferrer">View pharmacist credential</a>}</div> : <p className="mt-2 text-sm text-amber-700">No pharmacist-in-charge credentials have been submitted.</p>}
              </div>
              <div className="mt-5 space-y-2"><label className="text-sm font-semibold" htmlFor={`notes-${pharmacy.id}`}>Review notes</label><Textarea id={`notes-${pharmacy.id}`} value={notes[pharmacy.id] ?? ""} onChange={(event) => setNotes((current) => ({ ...current, [pharmacy.id]: event.target.value }))} placeholder="Add the reason or verification notes" /></div>
              <div className="mt-5 flex flex-wrap gap-3">
                <Button disabled={decision.isPending || licenses.length === 0 || !pharmacistInCharge} onClick={() => decide(pharmacy.id, "approved")}>{decision.isPending && <LoaderCircle className="animate-spin" />}<CheckCircle2 />Approve vendor</Button>
                <Button variant="outline" disabled={decision.isPending} onClick={() => decide(pharmacy.id, "rejected")}><XCircle />Reject</Button>
              </div>
            </article>
          ))}
        </section>
      )}
    </div>
  );
}

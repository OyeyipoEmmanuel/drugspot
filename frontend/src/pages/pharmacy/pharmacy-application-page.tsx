import { CheckCircle2, Clock3, LogOut, XCircle } from "lucide-react";
import { Link } from "react-router-dom";

import { BrandLogo } from "@/components/brand-logo";
import { ErrorState, LoadingState } from "@/components/feedback-states";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { usePharmacyApplication } from "@/hooks/use-verification";
import { useAuth } from "@/providers/auth-provider";

export function PharmacyApplicationPage() {
  const { logout } = useAuth();
  const application = usePharmacyApplication();

  return (
    <div className="min-h-screen bg-muted/40">
      <header className="flex h-16 items-center border-b bg-background px-4 sm:px-8">
        <BrandLogo />
        <Button className="ml-auto" variant="ghost" size="icon" onClick={() => void logout()} aria-label="Sign out"><LogOut /></Button>
      </header>
      <main className="mx-auto max-w-3xl p-4 sm:p-8">
        {application.isLoading && <LoadingState label="Loading your pharmacy application…" />}
        {application.error && <ErrorState message={application.error.message} onRetry={() => void application.refetch()} />}
        {application.data && (
          <section className="rounded-3xl border bg-card p-6 shadow-sm sm:p-9">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div><p className="text-sm font-semibold text-primary">Vendor verification</p><h1 className="mt-1 text-3xl font-bold">{application.data.name}</h1><p className="mt-2 text-sm text-muted-foreground">{application.data.address}, {application.data.city}, {application.data.state}</p></div>
              <Badge>{application.data.verificationStatus}</Badge>
            </div>
            {application.data.verificationStatus === "pending" && <div className="mt-7 flex gap-3 rounded-2xl bg-blue-50 p-5 text-blue-950"><Clock3 className="mt-0.5 shrink-0" /><div><h2 className="font-bold">Your application is under review</h2><p className="mt-1 text-sm leading-6">The DrugSpot team will verify the pharmacy licence and pharmacist-in-charge credentials submitted during registration. Your store will appear in the marketplace after approval.</p></div></div>}
            {application.data.verificationStatus === "approved" && <div className="mt-7 flex gap-3 rounded-2xl bg-emerald-50 p-5 text-emerald-950"><CheckCircle2 className="mt-0.5 shrink-0" /><div><h2 className="font-bold">Your pharmacy is approved</h2><p className="mt-1 text-sm leading-6">You can now manage the pharmacy workspace and prepare your catalogue for customers.</p><Button asChild className="mt-4"><Link to="/pharmacy">Open pharmacy workspace</Link></Button></div></div>}
            {(application.data.verificationStatus === "rejected" || application.data.verificationStatus === "suspended") && <div className="mt-7 flex gap-3 rounded-2xl bg-red-50 p-5 text-red-950"><XCircle className="mt-0.5 shrink-0" /><div><h2 className="font-bold">This application needs attention</h2><p className="mt-1 text-sm leading-6">Contact DrugSpot support to review the decision or provide updated verification documents.</p></div></div>}
            <div className="mt-7 grid gap-4 rounded-2xl border p-5 sm:grid-cols-2"><div><p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Application ID</p><p className="mt-1 break-all font-mono text-sm">{application.data.id}</p></div><div><p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Business contact</p><p className="mt-1 text-sm">{application.data.email}<br />{application.data.phone}</p></div></div>
          </section>
        )}
      </main>
    </div>
  );
}

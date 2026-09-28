import { CheckCircle2, Clock3, LogOut, ShieldAlert } from "lucide-react";

import { BrandLogo } from "@/components/brand-logo";
import { ErrorState, LoadingState } from "@/components/feedback-states";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { usePharmacistApplication } from "@/hooks/use-verification";
import { useAuth } from "@/providers/auth-provider";

export function PharmacistApplicationPage() {
  const { logout } = useAuth();
  const application = usePharmacistApplication();
  if (application.isLoading) return <LoadingState label="Loading pharmacist application…" />;
  if (application.error || !application.data) return <ErrorState message={application.error?.message ?? "Application not found."} onRetry={() => void application.refetch()} />;
  const item = application.data;
  const Icon = item.verificationStatus === "approved" ? CheckCircle2 : item.verificationStatus === "rejected" ? ShieldAlert : Clock3;
  return <div className="min-h-screen bg-muted/40"><header className="flex h-16 items-center border-b bg-background px-4 sm:px-8"><BrandLogo /><Button className="ml-auto" variant="ghost" onClick={() => void logout()}><LogOut />Sign out</Button></header><main className="mx-auto max-w-2xl p-4 sm:p-8"><section className="rounded-3xl border bg-card p-7 shadow-sm sm:p-10"><div className="grid size-14 place-items-center rounded-2xl bg-secondary text-primary"><Icon className="size-7" /></div><div className="mt-6 flex flex-wrap items-center gap-3"><h1 className="text-3xl font-bold">Pharmacist application</h1><Badge>{item.verificationStatus}</Badge></div><p className="mt-3 text-muted-foreground">Your account remains restricted until a platform administrator verifies your professional licence.</p><dl className="mt-7 grid gap-4 rounded-2xl bg-muted p-5 text-sm sm:grid-cols-2"><div><dt className="text-muted-foreground">Applicant</dt><dd className="mt-1 font-bold">{item.firstName} {item.lastName}</dd></div><div><dt className="text-muted-foreground">Pharmacy</dt><dd className="mt-1 font-bold">{item.pharmacyName}</dd></div><div><dt className="text-muted-foreground">Licence</dt><dd className="mt-1 font-bold">{item.licenseNumber}</dd></div><div><dt className="text-muted-foreground">Application ID</dt><dd className="mt-1 break-all font-mono text-xs">{item.id}</dd></div></dl>{item.verificationStatus === "approved" && <p className="mt-6 rounded-xl bg-emerald-50 p-4 text-sm text-emerald-800">Your application is approved. Sign out and sign in again to open the pharmacist workspace.</p>}{item.verificationStatus === "rejected" && <p className="mt-6 rounded-xl bg-red-50 p-4 text-sm text-red-800">Your application was not approved. Contact platform support before submitting new documentation.</p>}</section></main></div>;
}


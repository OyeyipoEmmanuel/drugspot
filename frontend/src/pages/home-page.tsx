import { ArrowRight, CheckCircle2, Clock3, MessageCircle, PackageCheck, Pill, ShoppingBag } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";

import { Button } from "@/components/ui/button";
import { useLogAdherence, useMedications } from "@/hooks/use-medications";
import { useOrders } from "@/hooks/use-marketplace";
import { useAuth } from "@/providers/auth-provider";

export function HomePage() {
  const { t } = useTranslation();
  const { session } = useAuth();
  const { data = [] } = useMedications();
  const { data: orders = [] } = useOrders();
  const recentOrder = orders[0];
  const nextMedication = data.find((item) => item.status === "active") ?? null;
  const refillMedication = data
    .filter((item) => item.status === "active")
    .sort((left, right) => left.remainingDoses - right.remainingDoses)[0] ?? null;
  const adherence = useLogAdherence(nextMedication?.id ?? "");

  return (
    <div className="space-y-7">
      <section className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div><p className="text-sm font-semibold text-primary">{new Intl.DateTimeFormat("en-NG", { weekday: "long", day: "numeric", month: "long" }).format(new Date())}</p><h1 className="mt-1 text-2xl font-bold tracking-tight sm:text-3xl">{t("home.greeting", { name: session?.user.firstName })}</h1><p className="mt-2 text-muted-foreground">{t("home.subtitle")}</p></div>
        <Button asChild><Link to="/marketplace"><ShoppingBag />Order medicine</Link></Button>
      </section>

      <div className="grid gap-5 lg:grid-cols-[1.35fr_0.65fr]">
        <section className="overflow-hidden rounded-3xl bg-primary p-6 text-primary-foreground shadow-lg shadow-blue-950/10 sm:p-8">
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="mb-5 grid size-12 place-items-center rounded-2xl bg-white/14"><Pill /></div>
              <p className="text-sm font-medium text-blue-100">{t("home.nextMedication")}</p>
              <h2 className="mt-1 text-2xl font-bold">{nextMedication ? `${nextMedication.name} · ${nextMedication.strength}` : t("home.noMedication")}</h2>
              <p className="mt-2 flex items-center gap-2 text-sm text-blue-100"><Clock3 className="size-4" />{nextMedication?.schedules[0] ? t("home.medicationDueAt", { time: nextMedication.schedules[0].time }) : t("home.addMedicationPrompt")}</p>
            </div>
            {nextMedication && <span className="rounded-full bg-white/14 px-3 py-1 text-xs font-semibold">{nextMedication.form}</span>}
          </div>
          {nextMedication ? <Button className="mt-8 bg-white text-slate-900 hover:bg-blue-50" size="lg" disabled={adherence.isPending} onClick={() => adherence.mutate("taken")}><CheckCircle2 /> {t("home.takeMedication")}</Button> : <Button asChild className="mt-8 bg-white text-slate-900 hover:bg-blue-50" size="lg"><Link to="/medicines/new">Add medicine</Link></Button>}
        </section>

        <section className="rounded-3xl border bg-card p-6 shadow-sm">
          <div className="grid size-12 place-items-center rounded-2xl bg-secondary text-primary"><MessageCircle /></div>
          <h2 className="mt-5 text-xl font-bold">{t("home.askPharmacist")}</h2>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">{t("home.askPharmacistDescription")}</p>
          <Button asChild className="mt-5" variant="outline"><Link to="/pharmacist">Start a conversation <ArrowRight /></Link></Button>
        </section>
      </div>

      <div className="grid gap-5 md:grid-cols-2">
        <Link to={recentOrder ? `/orders/${recentOrder.id}` : "/marketplace"} className="rounded-3xl border bg-card p-6 shadow-sm transition hover:border-blue-300">
          <div className="flex items-center gap-4">
            <div className="grid size-11 place-items-center rounded-2xl bg-emerald-100 text-emerald-700"><PackageCheck /></div>
            <div><p className="text-sm text-muted-foreground">{t("home.recentOrder")}</p><h3 className="font-bold">{recentOrder ? `Order #${recentOrder.reference}` : "No orders yet"}</h3></div>
          </div>
          <p className="mt-5 rounded-xl bg-muted px-4 py-3 text-sm font-medium capitalize">{recentOrder ? recentOrder.status.replaceAll("_", " ") : "Browse verified pharmacies"}</p>
        </Link>
        <section className="rounded-3xl border border-blue-200 bg-blue-50 p-6">
          <h3 className="font-bold text-primary">{t("home.upcomingRefill")}</h3>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">{refillMedication ? t("home.refillSummary", { name: refillMedication.name, count: refillMedication.remainingDoses }) : t("home.noRefill")}</p>
          {refillMedication && <Button asChild className="mt-4" variant="outline"><Link to={`/medicines/${refillMedication.id}`}>{t("home.reviewMedication")}</Link></Button>}
        </section>
      </div>
    </div>
  );
}

import { ArrowRight, CheckCircle2, Clock3, MessageCircle, PackageCheck, Pill } from "lucide-react";
import { useTranslation } from "react-i18next";

import { Button } from "@/components/ui/button";

export function HomePage() {
  const { t } = useTranslation();

  return (
    <div className="space-y-7">
      <section>
        <p className="text-sm font-semibold text-primary">Wednesday, 23 September</p>
        <h1 className="mt-1 text-2xl font-bold tracking-tight sm:text-3xl">{t("home.greeting")}</h1>
        <p className="mt-2 text-muted-foreground">{t("home.subtitle")}</p>
      </section>

      <div className="grid gap-5 lg:grid-cols-[1.35fr_0.65fr]">
        <section className="overflow-hidden rounded-3xl bg-primary p-6 text-primary-foreground shadow-lg shadow-blue-950/10 sm:p-8">
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="mb-5 grid size-12 place-items-center rounded-2xl bg-white/14"><Pill /></div>
              <p className="text-sm font-medium text-blue-100">{t("home.nextMedication")}</p>
              <h2 className="mt-1 text-2xl font-bold">Amoxicillin · 500 mg</h2>
              <p className="mt-2 flex items-center gap-2 text-sm text-blue-100"><Clock3 className="size-4" />{t("home.medicationDue")}</p>
            </div>
            <span className="rounded-full bg-white/14 px-3 py-1 text-xs font-semibold">1 capsule</span>
          </div>
          <Button className="mt-8 bg-white text-slate-900 hover:bg-blue-50" size="lg">
            <CheckCircle2 /> {t("home.takeMedication")}
          </Button>
        </section>

        <section className="rounded-3xl border bg-card p-6 shadow-sm">
          <div className="grid size-12 place-items-center rounded-2xl bg-secondary text-primary"><MessageCircle /></div>
          <h2 className="mt-5 text-xl font-bold">{t("home.askPharmacist")}</h2>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">{t("home.askPharmacistDescription")}</p>
          <Button className="mt-5" variant="outline">Start a conversation <ArrowRight /></Button>
        </section>
      </div>

      <div className="grid gap-5 md:grid-cols-2">
        <section className="rounded-3xl border bg-card p-6 shadow-sm">
          <div className="flex items-center gap-4">
            <div className="grid size-11 place-items-center rounded-2xl bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300"><PackageCheck /></div>
            <div><p className="text-sm text-muted-foreground">{t("home.recentOrder")}</p><h3 className="font-bold">Order #DSP-1024</h3></div>
          </div>
          <p className="mt-5 rounded-xl bg-muted px-4 py-3 text-sm font-medium">{t("home.orderStatus")}</p>
        </section>
        <section className="rounded-3xl border border-blue-200 bg-blue-50 p-6 dark:border-blue-900 dark:bg-blue-950/35">
          <h3 className="font-bold text-primary dark:text-blue-200">{t("home.foundationTitle")}</h3>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">{t("home.foundationDescription")}</p>
        </section>
      </div>
    </div>
  );
}

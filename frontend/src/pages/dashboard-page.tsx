import { AlertTriangle, ClipboardCheck, RotateCcw } from "lucide-react";
import { useTranslation } from "react-i18next";

const stats = [
  { key: "openOrders", value: "18", icon: ClipboardCheck, colour: "bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300" },
  { key: "lowStock", value: "7", icon: AlertTriangle, colour: "bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300" },
  { key: "refillRequests", value: "12", icon: RotateCcw, colour: "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300" },
] as const;

export function DashboardPage() {
  const { t } = useTranslation();
  return (
    <div className="space-y-7">
      <section><h1 className="text-2xl font-bold tracking-tight sm:text-3xl">{t("dashboard.title")}</h1><p className="mt-2 text-muted-foreground">{t("dashboard.subtitle")}</p></section>
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {stats.map(({ key, value, icon: Icon, colour }) => (
          <article key={key} className="rounded-2xl border bg-card p-5 shadow-sm">
            <div className={`grid size-11 place-items-center rounded-xl ${colour}`}><Icon className="size-5" /></div>
            <p className="mt-5 text-3xl font-bold">{value}</p>
            <p className="mt-1 text-sm text-muted-foreground">{t(`dashboard.${key}`)}</p>
          </article>
        ))}
      </section>
    </div>
  );
}

import { BellRing, MessageCircle, ShieldCheck } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";

import { Button } from "@/components/ui/button";

export function WelcomePage() {
  const { t } = useTranslation();
  return (
    <div className="grid w-full items-center gap-10 lg:grid-cols-2 lg:gap-16">
      <section>
        <span className="inline-flex rounded-full bg-secondary px-3 py-1 text-sm font-semibold text-primary">{t("auth.trustedCare")}</span>
        <h1 className="mt-5 max-w-xl text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl">{t("auth.welcomeTitle")}</h1>
        <p className="mt-5 max-w-xl text-lg leading-8 text-muted-foreground">{t("app.tagline")}</p>
        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          <Button asChild size="lg"><Link to="/register">{t("auth.createAccount")}</Link></Button>
          <Button asChild size="lg" variant="outline"><Link to="/login">{t("auth.signIn")}</Link></Button>
        </div>
      </section>
      <section className="grid gap-4 rounded-3xl border bg-card p-5 shadow-xl shadow-blue-950/5 sm:p-7">
        {[
          [BellRing, "auth.remindersTitle", "auth.remindersBody"],
          [MessageCircle, "auth.pharmacistTitle", "auth.pharmacistBody"],
          [ShieldCheck, "auth.verifiedTitle", "auth.verifiedBody"],
        ].map(([Icon, title, body]) => (
          <article key={String(title)} className="flex gap-4 rounded-2xl bg-muted/60 p-4">
            <div className="grid size-11 shrink-0 place-items-center rounded-xl bg-secondary text-primary"><Icon className="size-5" /></div>
            <div><h2 className="font-bold">{t(String(title))}</h2><p className="mt-1 text-sm leading-6 text-muted-foreground">{t(String(body))}</p></div>
          </article>
        ))}
      </section>
    </div>
  );
}

import { BellRing, MessageCircle, ShoppingBag, X } from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";

import { Button } from "@/components/ui/button";
import { useAuth } from "@/providers/auth-provider";

const slides = [
  { icon: BellRing, title: "onboarding.remindersTitle", body: "onboarding.remindersBody" },
  { icon: MessageCircle, title: "onboarding.pharmacistTitle", body: "onboarding.pharmacistBody" },
  { icon: ShoppingBag, title: "onboarding.orderTitle", body: "onboarding.orderBody" },
] as const;

export function OnboardingPage() {
  const { t } = useTranslation();
  const { completeOnboarding } = useAuth();
  const navigate = useNavigate();
  const [index, setIndex] = useState(0);
  const [saving, setSaving] = useState(false);
  const slide = slides[index];
  const SlideIcon = slide.icon;
  const finish = async () => { setSaving(true); await completeOnboarding(); navigate("/", { replace: true }); };
  return (
    <div className="min-h-screen bg-background p-4 sm:p-8">
      <div className="mx-auto flex max-w-2xl justify-end"><Button variant="ghost" onClick={finish}><X />{t("onboarding.skip")}</Button></div>
      <main className="mx-auto grid min-h-[75vh] max-w-2xl place-items-center text-center">
        <section>
          <div className="mx-auto grid size-24 place-items-center rounded-[2rem] bg-primary text-primary-foreground shadow-xl shadow-blue-900/20"><SlideIcon className="size-11" /></div>
          <p className="mt-8 text-sm font-bold text-primary">{index + 1} / {slides.length}</p>
          <h1 className="mt-3 text-3xl font-bold sm:text-4xl">{t(slide.title)}</h1>
          <p className="mx-auto mt-4 max-w-lg text-lg leading-8 text-muted-foreground">{t(slide.body)}</p>
          <div className="mt-10 flex justify-center gap-2">{slides.map((item, dotIndex) => <span key={item.title} className={`h-2 rounded-full transition-all ${dotIndex === index ? "w-8 bg-primary" : "w-2 bg-border"}`} />)}</div>
          <Button className="mt-8 min-w-40" size="lg" disabled={saving} onClick={() => index < slides.length - 1 ? setIndex(index + 1) : void finish()}>{index < slides.length - 1 ? t("onboarding.next") : t("onboarding.finish")}</Button>
        </section>
      </main>
    </div>
  );
}

import { zodResolver } from "@hookform/resolvers/zod";
import { CheckCircle2, Mail } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import { z } from "zod";

import { authApi } from "@/api/modules/auth.api";
import { FormField } from "@/components/form-field";
import { Button } from "@/components/ui/button";

const schema = z.object({ email: z.email("Enter a valid email address.") });

export function ForgotPasswordPage() {
  const { t } = useTranslation();
  const [sent, setSent] = useState(false);
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<z.infer<typeof schema>>({ resolver: zodResolver(schema) });
  return (
    <section className="w-full max-w-md rounded-3xl border bg-card p-6 shadow-xl shadow-blue-950/5 sm:p-8">
      <div className="grid size-12 place-items-center rounded-2xl bg-secondary text-primary">{sent ? <CheckCircle2 /> : <Mail />}</div>
      <h1 className="mt-5 text-3xl font-bold">{sent ? t("auth.checkEmail") : t("auth.resetPassword")}</h1>
      <p className="mt-2 text-sm leading-6 text-muted-foreground">{sent ? t("auth.resetSent") : t("auth.resetSubtitle")}</p>
      {!sent && <form className="mt-7 space-y-5" onSubmit={handleSubmit(async ({ email }) => { await authApi.forgotPassword(email); setSent(true); })}><FormField id="resetEmail" label={t("auth.email")} type="email" error={errors.email?.message} {...register("email")} /><Button className="w-full" size="lg" disabled={isSubmitting}>{t("auth.sendReset")}</Button></form>}
      <Button asChild className="mt-5 w-full" variant="ghost"><Link to="/login">{t("auth.backToSignIn")}</Link></Button>
    </section>
  );
}

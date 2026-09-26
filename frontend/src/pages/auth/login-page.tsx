import { zodResolver } from "@hookform/resolvers/zod";
import { LoaderCircle, LockKeyhole } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { z } from "zod";

import { FormField } from "@/components/form-field";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/providers/auth-provider";

const schema = z.object({
  email: z.email("Enter a valid email address."),
  password: z.string().min(8, "Password must be at least 8 characters."),
});
type FormValues = z.infer<typeof schema>;

export function LoginPage() {
  const { t } = useTranslation();
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [submitError, setSubmitError] = useState("");
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormValues>({ resolver: zodResolver(schema), defaultValues: { email: "patient@drugspot.ng", password: "Password123!" } });

  const onSubmit = handleSubmit(async (values) => {
    setSubmitError("");
    try {
      const session = await login(values);
      const requestedPath = (location.state as { from?: string } | null)?.from;
      const fallback = session.user.role === "platform_admin" ? "/admin" : session.user.role === "patient" ? "/" : "/pharmacy";
      navigate(requestedPath ?? fallback, { replace: true });
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : t("auth.signInError"));
    }
  });

  return (
    <section className="w-full max-w-md rounded-3xl border bg-card p-6 shadow-xl shadow-blue-950/5 sm:p-8">
      <div className="grid size-12 place-items-center rounded-2xl bg-secondary text-primary"><LockKeyhole /></div>
      <h1 className="mt-5 text-3xl font-bold">{t("auth.welcomeBack")}</h1>
      <p className="mt-2 text-sm text-muted-foreground">{t("auth.signInSubtitle")}</p>
      <form className="mt-7 space-y-5" onSubmit={onSubmit}>
        <FormField id="email" label={t("auth.email")} type="email" autoComplete="email" error={errors.email?.message} {...register("email")} />
        <FormField id="password" label={t("auth.password")} type="password" autoComplete="current-password" error={errors.password?.message} {...register("password")} />
        <div className="text-right"><Link to="/forgot-password" className="text-sm font-semibold text-primary hover:underline">{t("auth.forgotPassword")}</Link></div>
        {submitError && <p className="rounded-xl bg-red-50 p-3 text-sm font-medium text-red-700 dark:bg-red-950/30 dark:text-red-300">{submitError}</p>}
        <Button className="w-full" size="lg" disabled={isSubmitting}>{isSubmitting && <LoaderCircle className="animate-spin" />}{t("auth.signIn")}</Button>
      </form>
      <p className="mt-6 text-center text-sm text-muted-foreground">{t("auth.noAccount")} <Link to="/register" className="font-semibold text-primary hover:underline">{t("auth.createAccount")}</Link></p>
      <p className="mt-5 rounded-xl bg-muted p-3 text-xs leading-5 text-muted-foreground">{t("auth.demoHint")}</p>
    </section>
  );
}

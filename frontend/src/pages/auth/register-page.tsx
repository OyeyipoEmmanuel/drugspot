import { zodResolver } from "@hookform/resolvers/zod";
import { LoaderCircle, UserPlus } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { Link, useNavigate } from "react-router-dom";
import { z } from "zod";

import { FormField } from "@/components/form-field";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/providers/auth-provider";

const schema = z.object({
  firstName: z.string().min(2, "Enter your first name."),
  lastName: z.string().min(2, "Enter your last name."),
  phone: z.string().min(10, "Enter a valid phone number."),
  email: z.email("Enter a valid email address."),
  password: z.string().min(8, "Use at least 8 characters."),
});
type FormValues = z.infer<typeof schema>;

export function RegisterPage() {
  const { t } = useTranslation();
  const { register: createAccount } = useAuth();
  const navigate = useNavigate();
  const [submitError, setSubmitError] = useState("");
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormValues>({ resolver: zodResolver(schema) });
  const onSubmit = handleSubmit(async (values) => {
    setSubmitError("");
    try { await createAccount(values); navigate("/onboarding", { replace: true }); }
    catch (error) { setSubmitError(error instanceof Error ? error.message : t("auth.registerError")); }
  });

  return (
    <section className="w-full max-w-xl rounded-3xl border bg-card p-6 shadow-xl shadow-blue-950/5 sm:p-8">
      <div className="grid size-12 place-items-center rounded-2xl bg-secondary text-primary"><UserPlus /></div>
      <h1 className="mt-5 text-3xl font-bold">{t("auth.createAccount")}</h1>
      <p className="mt-2 text-sm text-muted-foreground">{t("auth.registerSubtitle")}</p>
      <form className="mt-7 space-y-5" onSubmit={onSubmit}>
        <div className="grid gap-5 sm:grid-cols-2">
          <FormField id="firstName" label={t("auth.firstName")} error={errors.firstName?.message} {...register("firstName")} />
          <FormField id="lastName" label={t("auth.lastName")} error={errors.lastName?.message} {...register("lastName")} />
        </div>
        <FormField id="phone" label={t("auth.phone")} type="tel" autoComplete="tel" error={errors.phone?.message} {...register("phone")} />
        <FormField id="registerEmail" label={t("auth.email")} type="email" autoComplete="email" error={errors.email?.message} {...register("email")} />
        <FormField id="registerPassword" label={t("auth.password")} type="password" autoComplete="new-password" error={errors.password?.message} hint={t("auth.passwordHint")} {...register("password")} />
        {submitError && <p className="rounded-xl bg-red-50 p-3 text-sm font-medium text-red-700">{submitError}</p>}
        <Button className="w-full" size="lg" disabled={isSubmitting}>{isSubmitting && <LoaderCircle className="animate-spin" />}{t("auth.createAccount")}</Button>
      </form>
      <p className="mt-6 text-center text-sm text-muted-foreground">{t("auth.haveAccount")} <Link to="/login" className="font-semibold text-primary hover:underline">{t("auth.signIn")}</Link></p>
    </section>
  );
}

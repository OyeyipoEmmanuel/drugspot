import { Building2, CheckCircle2, LoaderCircle, LogOut, Mail, ShieldCheck, UserRound } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { Link } from "react-router-dom";

import { authApi } from "@/api/modules/auth.api";
import { FormField } from "@/components/form-field";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/providers/auth-provider";
import type { PatientProfileInput } from "@/types/auth";

export function ProfilePage() {
  const { session, logout } = useAuth();
  const user = session!.user;
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");
  const { register, handleSubmit, formState: { isSubmitting } } = useForm<PatientProfileInput>();

  const saveProfile = handleSubmit(async (values) => {
    setSaved(false);
    setError("");
    try {
      await authApi.updatePatientProfile(values);
      setSaved(true);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "The profile could not be updated.");
    }
  });

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <section><p className="text-sm font-semibold text-primary">Account</p><h1 className="mt-1 text-3xl font-bold">Profile</h1></section>
      <section className="rounded-3xl border bg-card p-6 shadow-sm sm:p-8">
        <div className="flex flex-col items-start gap-5 sm:flex-row sm:items-center">
          <div className="grid size-20 place-items-center rounded-3xl bg-secondary text-primary"><UserRound className="size-9" /></div>
          <div><h2 className="text-2xl font-bold">{user.firstName} {user.lastName}</h2><p className="mt-1 flex items-center gap-2 text-sm text-muted-foreground"><Mail className="size-4" />{user.email}</p><p className="mt-2 font-mono text-xs text-muted-foreground">User ID: {user.id}</p><Badge className="mt-3"><ShieldCheck className="mr-1 size-3.5" />{user.role.replace("_", " ")}</Badge></div>
        </div>
        <div className="mt-8 flex flex-wrap gap-3"><Button asChild><Link to="/pharmacy-application"><Building2 />Register a pharmacy</Link></Button><Button variant="outline" onClick={() => void logout()}><LogOut />Sign out</Button></div>
      </section>

      <form onSubmit={saveProfile} className="space-y-5 rounded-3xl border bg-card p-6 shadow-sm sm:p-8">
        <div><h2 className="text-xl font-bold">Patient details</h2><p className="mt-1 text-sm text-muted-foreground">These details are stored by the live profile endpoint.</p></div>
        <div className="grid gap-5 sm:grid-cols-2">
          <FormField id="dateOfBirth" label="Date of birth" type="date" {...register("dateOfBirth")} />
          <FormField id="gender" label="Gender (optional)" {...register("gender")} />
          <FormField id="emergencyContactName" label="Emergency contact name" {...register("emergencyContactName")} />
          <FormField id="emergencyContactPhone" label="Emergency contact phone" {...register("emergencyContactPhone")} />
        </div>
        <div className="space-y-2"><label className="text-sm font-semibold" htmlFor="allergies">Allergies</label><Textarea id="allergies" {...register("allergies")} /></div>
        <div className="space-y-2"><label className="text-sm font-semibold" htmlFor="chronicConditions">Chronic conditions</label><Textarea id="chronicConditions" {...register("chronicConditions")} /></div>
        {saved && <p className="flex items-center gap-2 text-sm text-emerald-700"><CheckCircle2 className="size-4" />Profile saved.</p>}
        {error && <p className="rounded-xl bg-red-50 p-3 text-sm text-red-700">{error}</p>}
        <Button disabled={isSubmitting}>{isSubmitting && <LoaderCircle className="animate-spin" />}Save profile</Button>
      </form>
    </div>
  );
}

import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowLeft, LoaderCircle, ShieldCheck } from "lucide-react";
import { useForm } from "react-hook-form";
import { Link, useNavigate, useParams } from "react-router-dom";
import { z } from "zod";

import { ErrorState, LoadingState } from "@/components/feedback-states";
import { FormField } from "@/components/form-field";
import { VerifiedBadge } from "@/components/marketplace/verified-badge";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useMedications } from "@/hooks/use-medications";
import { usePharmacist, useStartConversation } from "@/hooks/use-pharmacist";

const schema = z.object({ subject: z.string().min(4, "Briefly describe your question."), message: z.string().min(10, "Add a little more detail for the pharmacist."), medicationName: z.string().optional() });
type Values = z.infer<typeof schema>;

export function NewConversationPage() {
  const { id } = useParams();
  const profile = usePharmacist(id);
  const medications = useMedications();
  const start = useStartConversation();
  const navigate = useNavigate();
  const { register, handleSubmit, formState: { errors } } = useForm<Values>({ resolver: zodResolver(schema), defaultValues: { subject: "", message: "", medicationName: "" } });
  if (profile.isLoading) return <LoadingState label="Opening pharmacist profile…" />;
  if (profile.error || !profile.data) return <ErrorState message="Pharmacist not found." onRetry={() => void profile.refetch()} />;
  const pharmacist = profile.data;
  const submit = handleSubmit(async (values) => { const conversation = await start.mutateAsync({ pharmacistId: pharmacist.id, ...values }); navigate(`/pharmacist/chat/${conversation.id}`, { replace: true }); });
  return <div className="mx-auto max-w-3xl space-y-6"><Button asChild variant="ghost" className="-ml-3"><Link to="/pharmacist"><ArrowLeft />All pharmacists</Link></Button><section className="rounded-3xl border bg-card p-6 shadow-sm sm:p-8"><div className="flex items-start gap-4"><div className="grid size-14 shrink-0 place-items-center rounded-2xl bg-secondary text-lg font-bold text-primary">{pharmacist.firstName[0]}{pharmacist.lastName[0]}</div><div><div className="flex flex-wrap items-center gap-2"><h1 className="text-2xl font-bold">Pharm. {pharmacist.firstName} {pharmacist.lastName}</h1><VerifiedBadge /></div><p className="mt-1 text-sm text-muted-foreground">{pharmacist.title} · {pharmacist.pharmacyName}</p><p className="mt-2 text-xs text-muted-foreground">Registration: {pharmacist.registrationNumber}</p></div></div></section><form onSubmit={submit} className="rounded-3xl border bg-card p-6 shadow-sm sm:p-8"><h2 className="text-2xl font-bold">Start a secure conversation</h2><div className="mt-6 space-y-5"><FormField id="chatSubject" label="What is your question about?" placeholder="For example: Taking amoxicillin with food" error={errors.subject?.message} {...register("subject")} /><div className="space-y-2"><Label htmlFor="medicationName">Related medicine (optional)</Label><select id="medicationName" className="h-11 w-full rounded-xl border bg-background px-3 text-sm" {...register("medicationName")}><option value="">No medicine selected</option>{medications.data?.map((medication) => <option key={medication.id} value={`${medication.name} ${medication.strength}`}>{medication.name} {medication.strength}</option>)}</select></div><div className="space-y-2"><Label htmlFor="firstMessage">Your message</Label><Textarea id="firstMessage" className="min-h-32" placeholder="Share the relevant details. Do not include information that is not needed for your question." aria-invalid={Boolean(errors.message)} {...register("message")} />{errors.message && <p className="text-xs font-medium text-destructive">{errors.message.message}</p>}</div>{start.error && <p className="rounded-xl bg-red-50 p-3 text-sm text-red-700">{start.error.message}</p>}<Button type="submit" size="lg" disabled={start.isPending}>{start.isPending ? <LoaderCircle className="animate-spin" /> : <ShieldCheck />}{start.isPending ? "Starting conversation…" : "Send securely"}</Button></div></form><p className="rounded-2xl bg-amber-50 p-4 text-sm leading-6 text-amber-900"><strong>Urgent symptoms?</strong> Chat is not an emergency service. Seek immediate in-person medical help for severe or rapidly worsening symptoms.</p></div>;
}

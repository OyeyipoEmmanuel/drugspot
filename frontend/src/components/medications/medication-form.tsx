import { zodResolver } from "@hookform/resolvers/zod";
import { LoaderCircle, Plus, Trash2 } from "lucide-react";
import { useFieldArray, useForm } from "react-hook-form";
import { z } from "zod";

import { FormField } from "@/components/form-field";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { MedicationInput, OcrMedicationDraft } from "@/types/medication";

const schema = z.object({
  name: z.string().min(2, "Enter the medicine name."),
  strength: z.string().min(1, "Enter the strength."),
  form: z.string().min(1, "Select a form."),
  instructions: z.string().min(5, "Add clear instructions."),
  frequency: z.string().min(1, "Select a frequency."),
  startDate: z.string().min(1, "Select a start date."),
  endDate: z.string().min(1, "Select an end date."),
  remainingDoses: z.number().int().min(0),
  schedules: z.array(z.object({ time: z.string().min(1, "Choose a time.") })).min(1),
}).refine((values) => values.endDate >= values.startDate, { path: ["endDate"], message: "End date must be after the start date." });

type FormValues = z.infer<typeof schema>;

function toDefaults(initial?: Partial<MedicationInput> | OcrMedicationDraft): FormValues {
  return {
    name: initial?.name ?? "",
    strength: initial?.strength ?? "",
    form: initial?.form ?? "Tablet",
    instructions: initial?.instructions ?? "",
    frequency: initial?.frequency ?? "Once daily",
    startDate: initial?.startDate ?? new Date().toISOString().slice(0, 10),
    endDate: initial?.endDate ?? "",
    remainingDoses: initial?.remainingDoses ?? 0,
    schedules: (initial?.scheduleTimes?.length ? initial.scheduleTimes : ["08:00"]).map((time) => ({ time })),
  };
}

export function MedicationForm({ initial, submitLabel, isSubmitting, onSubmit }: { initial?: Partial<MedicationInput> | OcrMedicationDraft; submitLabel: string; isSubmitting?: boolean; onSubmit: (input: MedicationInput) => Promise<void> | void }) {
  const { register, control, handleSubmit, formState: { errors } } = useForm<FormValues>({ resolver: zodResolver(schema), defaultValues: toDefaults(initial) });
  const { fields, append, remove } = useFieldArray({ control, name: "schedules" });
  return (
    <form className="space-y-6" onSubmit={handleSubmit(async (values) => onSubmit({ ...values, scheduleTimes: values.schedules.map(({ time }) => time) }))}>
      <div className="grid gap-5 sm:grid-cols-2">
        <FormField id="medicineName" label="Medicine name" error={errors.name?.message} placeholder="e.g. Amoxicillin" {...register("name")} />
        <FormField id="medicineStrength" label="Strength" error={errors.strength?.message} placeholder="e.g. 500 mg" {...register("strength")} />
        <div className="space-y-2"><Label htmlFor="medicineForm">Form</Label><select id="medicineForm" className="h-11 w-full rounded-xl border bg-background px-3 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-ring/25" {...register("form")}><option>Tablet</option><option>Capsule</option><option>Syrup</option><option>Injection</option><option>Cream</option><option>Other</option></select>{errors.form && <p className="text-xs text-destructive">{errors.form.message}</p>}</div>
        <div className="space-y-2"><Label htmlFor="frequency">Frequency</Label><select id="frequency" className="h-11 w-full rounded-xl border bg-background px-3 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-ring/25" {...register("frequency")}><option>Once daily</option><option>Twice daily</option><option>Three times daily</option><option>Four times daily</option><option>As needed</option></select></div>
      </div>
      <div className="space-y-2"><Label htmlFor="instructions">Instructions</Label><Textarea id="instructions" placeholder="How should this medicine be taken?" aria-invalid={Boolean(errors.instructions)} {...register("instructions")} />{errors.instructions && <p className="text-xs font-medium text-destructive">{errors.instructions.message}</p>}</div>
      <div className="grid gap-5 sm:grid-cols-3">
        <FormField id="startDate" label="Start date" type="date" error={errors.startDate?.message} {...register("startDate")} />
        <FormField id="endDate" label="Expected end date" type="date" error={errors.endDate?.message} {...register("endDate")} />
        <FormField id="remainingDoses" label="Current doses" type="number" min="0" error={errors.remainingDoses?.message} {...register("remainingDoses", { valueAsNumber: true })} />
      </div>
      <fieldset className="space-y-3"><div className="flex items-center justify-between"><div><legend className="font-bold">Reminder times</legend><p className="mt-1 text-xs text-muted-foreground">Add the times shown on your medication instructions.</p></div><Button type="button" variant="outline" size="sm" onClick={() => append({ time: "12:00" })}><Plus />Add time</Button></div>{fields.map((field, index) => <div key={field.id} className="flex items-center gap-2"><Input type="time" aria-label={`Reminder time ${index + 1}`} {...register(`schedules.${index}.time`)} /><Button type="button" variant="ghost" size="icon" disabled={fields.length === 1} onClick={() => remove(index)} aria-label="Remove reminder"><Trash2 /></Button></div>)}</fieldset>
      <div className="rounded-xl bg-blue-50 p-4 text-sm leading-6 text-blue-900 dark:bg-blue-950/40 dark:text-blue-100"><strong>Safety note:</strong> DrugSpot records the schedule you confirm. It does not prescribe medication or change your dosage.</div>
      <Button className="w-full sm:w-auto" size="lg" disabled={isSubmitting}>{isSubmitting && <LoaderCircle className="animate-spin" />}{submitLabel}</Button>
    </form>
  );
}

import { ArrowLeft } from "lucide-react";
import { Link, useNavigate, useParams } from "react-router-dom";

import { ErrorState, LoadingState } from "@/components/feedback-states";
import { MedicationForm } from "@/components/medications/medication-form";
import { Button } from "@/components/ui/button";
import { useCreateMedication, useMedication, useUpdateMedication } from "@/hooks/use-medications";
import type { MedicationInput } from "@/types/medication";

export function MedicationFormPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const medicationQuery = useMedication(id);
  const createMutation = useCreateMedication();
  const updateMutation = useUpdateMedication(id ?? "");
  const isEditing = Boolean(id);
  if (isEditing && medicationQuery.isLoading) return <LoadingState />;
  if (isEditing && medicationQuery.error) return <ErrorState message={medicationQuery.error.message} />;
  const initial = medicationQuery.data ? { ...medicationQuery.data, scheduleTimes: medicationQuery.data.schedules.map(({ time }) => time) } : undefined;
  const submit = async (input: MedicationInput) => {
    const medication = isEditing ? await updateMutation.mutateAsync(input) : await createMutation.mutateAsync(input);
    navigate(`/medicines/${medication.id}`);
  };
  return (
    <div className="mx-auto max-w-3xl">
      <Button asChild variant="ghost" className="-ml-3"><Link to={isEditing ? `/medicines/${id}` : "/medicines"}><ArrowLeft />Back to medicines</Link></Button>
      <section className="mt-4 rounded-3xl border bg-card p-5 shadow-sm sm:p-8"><p className="text-sm font-semibold text-primary">{isEditing ? "Update schedule" : "Manual entry"}</p><h1 className="mt-1 text-3xl font-bold">{isEditing ? "Edit medicine" : "Add a medicine"}</h1><p className="mt-2 text-sm text-muted-foreground">Enter exactly what appears on the medicine label or prescription.</p><div className="mt-8"><MedicationForm initial={initial} submitLabel={isEditing ? "Save changes" : "Create reminders"} isSubmitting={createMutation.isPending || updateMutation.isPending} onSubmit={submit} /></div></section>
    </div>
  );
}

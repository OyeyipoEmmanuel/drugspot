import { AlertTriangle, ArrowLeft, Camera, FileImage, ScanLine } from "lucide-react";
import { useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import { MedicationForm } from "@/components/medications/medication-form";
import { Button } from "@/components/ui/button";
import { useCreateMedication, useOcrExtraction } from "@/hooks/use-medications";
import type { MedicationInput, OcrMedicationDraft } from "@/types/medication";

export function OcrScanPage() {
  const inputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();
  const extraction = useOcrExtraction();
  const createMutation = useCreateMedication();
  const [draft, setDraft] = useState<OcrMedicationDraft | null>(null);
  const selectFile = async (file?: File) => { if (!file) return; setDraft(await extraction.mutateAsync(file)); };
  const create = async (input: MedicationInput) => { const medication = await createMutation.mutateAsync(input); navigate(`/medicines/${medication.id}`); };
  return (
    <div className="mx-auto max-w-3xl">
      <Button asChild variant="ghost" className="-ml-3"><Link to="/medicines"><ArrowLeft />Back to medicines</Link></Button>
      {!draft ? <section className="mt-4 rounded-3xl border bg-card p-6 text-center shadow-sm sm:p-10"><div className="mx-auto grid size-20 place-items-center rounded-3xl bg-secondary text-primary"><ScanLine className="size-9" /></div><h1 className="mt-6 text-3xl font-bold">Scan medicine information</h1><p className="mx-auto mt-3 max-w-xl text-sm leading-6 text-muted-foreground">Upload a clear photo of a prescription or medicine package. We will extract candidate text for you to review.</p><input ref={inputRef} className="sr-only" type="file" accept="image/jpeg,image/png,image/webp" onChange={(event) => void selectFile(event.target.files?.[0])} /><div className="mt-7 flex flex-col justify-center gap-3 sm:flex-row"><Button size="lg" disabled={extraction.isPending} onClick={() => inputRef.current?.click()}><Camera />{extraction.isPending ? "Reading image…" : "Choose an image"}</Button></div><div className="mt-8 flex gap-3 rounded-2xl bg-amber-50 p-4 text-left text-sm leading-6 text-amber-900 dark:bg-amber-950/30 dark:text-amber-200"><AlertTriangle className="mt-1 shrink-0" /><p>OCR can make mistakes. It does not identify unknown medicine with certainty or prove that a dose was taken. Always confirm the extracted details.</p></div>{extraction.error && <p className="mt-5 text-sm font-medium text-destructive">{extraction.error.message}</p>}</section> : <section className="mt-4 rounded-3xl border bg-card p-5 shadow-sm sm:p-8"><div className="flex flex-wrap items-start justify-between gap-4"><div><p className="text-sm font-semibold text-primary">Extracted draft</p><h1 className="mt-1 text-3xl font-bold">Confirm medication details</h1><p className="mt-2 text-sm text-muted-foreground">Review and correct every field before creating reminders.</p></div><div className="flex items-center gap-2 rounded-xl bg-secondary px-3 py-2 text-sm font-semibold text-primary"><FileImage className="size-4" />{Math.round(draft.confidence * 100)}% text confidence</div></div><div className="my-6 rounded-xl bg-amber-50 p-4 text-sm text-amber-900 dark:bg-amber-950/30 dark:text-amber-200"><strong>Needs confirmation:</strong> {draft.warnings[0]}</div><MedicationForm initial={draft} submitLabel="Confirm and create reminders" isSubmitting={createMutation.isPending} onSubmit={create} /></section>}
    </div>
  );
}

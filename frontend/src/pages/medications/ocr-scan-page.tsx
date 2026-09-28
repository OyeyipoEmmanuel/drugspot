import {
  AlertTriangle,
  BadgeCheck,
  Camera,
  FileText,
  Plus,
  ScanLine,
  Trash2,
} from "lucide-react";
import { useRef, useState } from "react";
import { useNavigate } from "react-router-dom";

import { BackButton } from "@/components/back-button";
import { MedicationForm } from "@/components/medications/medication-form";
import { Button } from "@/components/ui/button";
import { useCreateMedication, useOcrExtraction } from "@/hooks/use-medications";
import type {
  MedicationInput,
  OcrExtractionResult,
  OcrMedicationDraft,
} from "@/types/medication";

const MAX_OCR_IMAGE_BYTES = 1024 * 1024;

interface ReviewDraft {
  id: string;
  medication: OcrMedicationDraft;
}

function blankMedication(): OcrMedicationDraft {
  return {
    startDate: new Date().toISOString().slice(0, 10),
    remainingDoses: 0,
    scheduleTimes: ["08:00"],
    confidence: 0,
    warnings: [
      "This medicine was added manually. Complete and confirm every field.",
    ],
  };
}

export function OcrScanPage() {
  const inputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();
  const extraction = useOcrExtraction();
  const createMutation = useCreateMedication();
  const [result, setResult] = useState<OcrExtractionResult | null>(null);
  const [drafts, setDrafts] = useState<ReviewDraft[]>([]);
  const [localError, setLocalError] = useState("");

  const selectFile = async (file?: File) => {
    if (!file) return;
    setLocalError("");
    if (file.size > MAX_OCR_IMAGE_BYTES) {
      setLocalError(
        "Choose an image smaller than 1 MB for the free OCR service.",
      );
      return;
    }
    try {
      const next = await extraction.mutateAsync(file);
      setResult(next);
      setDrafts(
        next.medications.map((medication) => ({
          id: crypto.randomUUID(),
          medication,
        })),
      );
    } catch {
      // React Query exposes the API error below.
    }
  };

  const addMedicine = () => {
    setDrafts((current) => [
      ...current,
      { id: crypto.randomUUID(), medication: blankMedication() },
    ]);
  };

  const saveMedicine = async (id: string, input: MedicationInput) => {
    await createMutation.mutateAsync(input);
    const remaining = drafts.filter((draft) => draft.id !== id);
    setDrafts(remaining);
    if (!remaining.length) navigate("/medicines");
  };

  return (
    <div className="mx-auto max-w-4xl">
      <BackButton>Back to medicines</BackButton>

      {!result ? (
        <section className="mt-4 rounded-3xl border bg-card p-6 text-center shadow-sm sm:p-10">
          <div className="mx-auto grid size-20 place-items-center rounded-3xl bg-secondary text-primary">
            <ScanLine className="size-9" />
          </div>
          <h1 className="mt-6 text-3xl font-bold">Scan medicine information</h1>
          <p className="mx-auto mt-3 max-w-xl text-sm leading-6 text-muted-foreground">
            Upload a clear, well-lit photo of a prescription or medicine
            package. If the slip contains several medicines, each detected
            medicine will get its own review form.
          </p>
          <input
            ref={inputRef}
            className="sr-only"
            type="file"
            accept="image/jpeg,image/png,image/webp"
            onChange={(event) => void selectFile(event.target.files?.[0])}
          />
          <Button
            className="mt-7"
            size="lg"
            disabled={extraction.isPending}
            onClick={() => inputRef.current?.click()}
          >
            <Camera />
            {extraction.isPending
              ? "Reading all medicines…"
              : "Choose an image"}
          </Button>
          <p className="mt-3 text-xs text-muted-foreground">
            JPEG, PNG or WebP · maximum 1 MB
          </p>
          <div className="mt-8 flex gap-3 rounded-2xl bg-amber-50 p-4 text-left text-sm leading-6 text-amber-900">
            <AlertTriangle className="mt-1 shrink-0" />
            <p>
              OCR can miss medicines or mix instructions between lines. Confirm
              every medicine and dosage before saving.
            </p>
          </div>
          {(localError || extraction.error) && (
            <p className="mt-5 text-sm font-medium text-destructive">
              {localError || extraction.error?.message}
            </p>
          )}
        </section>
      ) : (
        <div className="mt-4 space-y-6">
          <section className="rounded-3xl border bg-card p-5 shadow-sm sm:p-8">
            <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
              <div>
                <p className="text-sm font-semibold text-primary">
                  Prescription review
                </p>
                <h1 className="mt-1 text-3xl font-bold">
                  Confirm {drafts.length}{" "}
                  {drafts.length === 1 ? "medicine" : "medicines"}
                </h1>
                <p className="mt-2 text-sm text-muted-foreground">
                  Save each medicine separately. You can also add one the scan
                  missed.
                </p>
              </div>
              <Button variant="outline" onClick={addMedicine}>
                <Plus />
                Add another medicine
              </Button>
            </div>
            <div className="mt-5 space-y-2 rounded-xl bg-amber-50 p-4 text-sm text-amber-900">
              {result.warnings.map((warning) => (
                <p key={warning} className="flex gap-2">
                  <AlertTriangle className="mt-0.5 size-4 shrink-0" />
                  {warning}
                </p>
              ))}
            </div>
            <details className="mt-4 rounded-xl border bg-slate-50 p-4 text-sm">
              <summary className="flex cursor-pointer items-center gap-2 font-semibold">
                <FileText className="size-4" />
                View all extracted text
              </summary>
              <pre className="mt-3 max-h-56 overflow-auto whitespace-pre-wrap font-sans text-xs leading-5 text-muted-foreground">
                {result.extractedText}
              </pre>
            </details>
          </section>

          {drafts.map(({ id, medication }, index) => (
            <section
              key={id}
              className="rounded-3xl border bg-card p-5 shadow-sm sm:p-8"
            >
              <div className="mb-6 flex flex-wrap items-start justify-between gap-3 border-b pb-5">
                <div>
                  <p className="text-sm font-semibold text-primary">
                    Medicine {index + 1}
                  </p>
                  <h2 className="mt-1 text-2xl font-bold">
                    {medication.name || "Add medicine details"}
                  </h2>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {Math.round(medication.confidence * 100)}% OCR draft
                    confidence
                  </p>
                </div>
                <Button
                  variant="ghost"
                  className="text-destructive"
                  onClick={() =>
                    setDrafts((current) =>
                      current.filter((draft) => draft.id !== id),
                    )
                  }
                >
                  <Trash2 />
                  Remove
                </Button>
              </div>
              {medication.detectedNafdacNumber && (
                <div
                  className={`mb-5 flex gap-3 rounded-2xl p-4 text-sm ${medication.nafdacVerified ? "bg-emerald-50 text-emerald-900" : "bg-blue-50 text-blue-900"}`}
                >
                  <BadgeCheck className="mt-0.5 size-5 shrink-0" />
                  <p>
                    <strong>Detected NAFDAC number:</strong>{" "}
                    {medication.detectedNafdacNumber}.{" "}
                    {medication.nafdacVerified
                      ? "It matches this product in the NAFDAC Greenbook."
                      : "Confirm it manually before relying on it."}
                  </p>
                </div>
              )}
              <div className="mb-6 space-y-2 rounded-xl bg-amber-50 p-4 text-sm text-amber-900">
                {medication.warnings.map((warning) => (
                  <p key={warning} className="flex gap-2">
                    <AlertTriangle className="mt-0.5 size-4 shrink-0" />
                    {warning}
                  </p>
                ))}
              </div>
              <MedicationForm
                initial={medication}
                submitLabel={`Save medicine ${index + 1}`}
                isSubmitting={createMutation.isPending}
                onSubmit={(input) => saveMedicine(id, input)}
              />
            </section>
          ))}

          {!drafts.length && (
            <section className="rounded-3xl border border-dashed p-8 text-center">
              <p className="text-muted-foreground">
                No medicines remain in this review.
              </p>
              <div className="mt-4 flex justify-center gap-2">
                <Button onClick={addMedicine}>
                  <Plus />
                  Add medicine
                </Button>
                <Button
                  variant="outline"
                  onClick={() => navigate("/medicines")}
                >
                  Finish
                </Button>
              </div>
            </section>
          )}
        </div>
      )}
    </div>
  );
}

export type MedicationStatus = "active" | "completed";
export type AdherenceStatus = "taken" | "skipped" | "snoozed";

export interface MedicationSchedule {
  id: string;
  time: string;
  label: string;
}

export interface AdherenceEvent {
  id: string;
  status: AdherenceStatus;
  scheduledAt: string;
  recordedAt: string;
}

export interface Medication {
  id: string;
  name: string;
  strength: string;
  form: string;
  instructions: string;
  frequency: string;
  startDate: string;
  endDate: string;
  remainingDoses: number;
  status: MedicationStatus;
  prescribedBy?: string;
  pharmacy?: string;
  schedules: MedicationSchedule[];
  adherence: AdherenceEvent[];
}

export interface MedicationInput {
  name: string;
  strength: string;
  form: string;
  instructions: string;
  frequency: string;
  startDate: string;
  endDate: string;
  remainingDoses: number;
  scheduleTimes: string[];
}

export interface OcrMedicationDraft extends Partial<MedicationInput> {
  confidence: number;
  warnings: string[];
  detectedNafdacNumber?: string;
  nafdacVerified?: boolean;
}

export interface OcrExtractionResult {
  medications: OcrMedicationDraft[];
  sourceFileName: string;
  extractedText: string;
  warnings: string[];
}

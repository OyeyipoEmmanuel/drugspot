import { api } from "@/api/API";
import { endpoints } from "@/api/endpoints";
import type {
  AdherenceStatus,
  Medication,
  MedicationInput,
  OcrExtractionResult,
} from "@/types/medication";

export const medicationsApi = {
  list() {
    return api.get<Medication[]>(endpoints.medications.list);
  },
  detail(id: string) {
    return api.get<Medication>(endpoints.medications.detail(id));
  },
  create(input: MedicationInput) {
    return api.post<Medication, MedicationInput>(
      endpoints.medications.list,
      input,
    );
  },
  update(id: string, input: MedicationInput) {
    return api.patch<Medication, MedicationInput>(
      endpoints.medications.detail(id),
      input,
    );
  },
  logAdherence(id: string, status: AdherenceStatus) {
    return api.post<Medication, { status: AdherenceStatus }>(
      endpoints.medications.adherence(id),
      { status },
    );
  },
  extract(file: File) {
    const body = new FormData();
    body.append("image", file);
    return api.post<OcrExtractionResult, FormData>(
      endpoints.medications.ocr,
      body,
      { timeoutMs: 35_000 },
    );
  },
};

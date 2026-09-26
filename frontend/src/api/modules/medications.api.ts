import { api } from "@/api/API";
import { endpoints } from "@/api/endpoints";
import { mockDb } from "@/mocks/mock-db";
import type {
  AdherenceStatus,
  Medication,
  MedicationInput,
  OcrMedicationDraft,
} from "@/types/medication";

const useMocks = import.meta.env.VITE_USE_MOCK_API !== "false";

export const medicationsApi = {
  list() {
    return useMocks ? mockDb.medications.list() : api.get<Medication[]>(endpoints.medications.list);
  },
  detail(id: string) {
    return useMocks
      ? mockDb.medications.detail(id)
      : api.get<Medication>(endpoints.medications.detail(id));
  },
  create(input: MedicationInput) {
    return useMocks
      ? mockDb.medications.create(input)
      : api.post<Medication, MedicationInput>(endpoints.medications.list, input);
  },
  update(id: string, input: MedicationInput) {
    return useMocks
      ? mockDb.medications.update(id, input)
      : api.patch<Medication, MedicationInput>(endpoints.medications.detail(id), input);
  },
  logAdherence(id: string, status: AdherenceStatus) {
    return useMocks
      ? mockDb.medications.logAdherence(id, status)
      : api.post<Medication, { status: AdherenceStatus }>(endpoints.medications.adherence(id), {
          status,
        });
  },
  extract(file: File) {
    if (useMocks) return mockDb.medications.extract(file);
    const body = new FormData();
    body.append("image", file);
    return api.post<OcrMedicationDraft, FormData>(endpoints.medications.ocr, body);
  },
};

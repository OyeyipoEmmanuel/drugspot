import { api } from "@/api/API";
import { endpoints } from "@/api/endpoints";
import type {
  PharmacistLink,
  PharmacistLinkInput,
  PharmacistApplication,
  PharmacyApplication,
  PharmacyApplicationInput,
  PharmacyLicense,
  PharmacyLicenseInput,
  VerificationDecisionInput,
  VerificationQueueItem,
  VerificationRecord,
} from "@/types/verification";

export const verificationApi = {
  submitApplication(input: PharmacyApplicationInput) {
    return api.post<PharmacyApplication, PharmacyApplicationInput>(
      endpoints.pharmacyWorkspace.applications,
      input,
    );
  },
  application() {
    return api.get<PharmacyApplication>(
      endpoints.pharmacyWorkspace.application,
    );
  },
  addLicense(input: PharmacyLicenseInput) {
    return api.post<PharmacyLicense, PharmacyLicenseInput>(
      endpoints.pharmacyWorkspace.licenses,
      input,
    );
  },
  addPharmacist(input: PharmacistLinkInput) {
    return api.post<PharmacistLink, PharmacistLinkInput>(
      endpoints.pharmacyWorkspace.pharmacists,
      input,
    );
  },
  queue() {
    return api.get<VerificationQueueItem[]>(endpoints.admin.verifications);
  },
  pharmacistApplication() {
    return api.get<PharmacistApplication>(
      endpoints.pharmacistApplications.current,
    );
  },
  pharmacistQueue() {
    return api.get<PharmacistApplication[]>(
      endpoints.admin.pharmacistVerifications,
    );
  },
  decidePharmacist(pharmacistId: string, input: VerificationDecisionInput) {
    return api.patch<VerificationRecord, VerificationDecisionInput>(
      endpoints.admin.pharmacistVerification(pharmacistId),
      input,
    );
  },
  decide(pharmacyId: string, input: VerificationDecisionInput) {
    return api.patch<VerificationRecord, VerificationDecisionInput>(
      endpoints.admin.verification(pharmacyId),
      input,
    );
  },
};

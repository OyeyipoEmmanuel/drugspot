import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { verificationApi } from "@/api/modules/verification.api";
import { queryKeys } from "@/api/queryKeys";
import type {
  PharmacistLinkInput,
  PharmacyApplicationInput,
  PharmacyLicenseInput,
  VerificationDecisionInput,
} from "@/types/verification";

export function usePharmacyApplication(enabled = true) {
  return useQuery({
    queryKey: queryKeys.pharmacyApplication,
    queryFn: verificationApi.application,
    enabled,
    retry: false,
  });
}

export function useSubmitPharmacyApplication() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: PharmacyApplicationInput) => verificationApi.submitApplication(input),
    onSuccess: (application) => queryClient.setQueryData(queryKeys.pharmacyApplication, application),
  });
}

export function useAddPharmacyLicense() {
  return useMutation({ mutationFn: (input: PharmacyLicenseInput) => verificationApi.addLicense(input) });
}

export function useAddPharmacist() {
  return useMutation({ mutationFn: (input: PharmacistLinkInput) => verificationApi.addPharmacist(input) });
}

export function useVerificationQueue() {
  return useQuery({ queryKey: queryKeys.verifications, queryFn: verificationApi.queue });
}

export function useVerificationDecision() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ pharmacyId, input }: { pharmacyId: string; input: VerificationDecisionInput }) =>
      verificationApi.decide(pharmacyId, input),
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: queryKeys.verifications }),
  });
}

export function usePharmacistApplication() {
  return useQuery({
    queryKey: queryKeys.pharmacistApplication,
    queryFn: verificationApi.pharmacistApplication,
  });
}

export function usePharmacistVerificationQueue() {
  return useQuery({
    queryKey: queryKeys.pharmacistVerifications,
    queryFn: verificationApi.pharmacistQueue,
  });
}

export function usePharmacistVerificationDecision() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ pharmacistId, input }: { pharmacistId: string; input: VerificationDecisionInput }) =>
      verificationApi.decidePharmacist(pharmacistId, input),
    onSuccess: () =>
      void queryClient.invalidateQueries({ queryKey: queryKeys.pharmacistVerifications }),
  });
}


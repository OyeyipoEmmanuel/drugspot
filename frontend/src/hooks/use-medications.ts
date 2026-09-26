import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { medicationsApi } from "@/api/modules/medications.api";
import { queryKeys } from "@/api/queryKeys";
import type { AdherenceStatus, MedicationInput } from "@/types/medication";

export function useMedications() {
  return useQuery({ queryKey: queryKeys.medications.all, queryFn: medicationsApi.list });
}

export function useMedication(id?: string) {
  return useQuery({
    queryKey: queryKeys.medications.detail(id ?? ""),
    queryFn: () => medicationsApi.detail(id!),
    enabled: Boolean(id),
  });
}

export function useCreateMedication() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: MedicationInput) => medicationsApi.create(input),
    onSuccess: (medication) => {
      queryClient.setQueryData(queryKeys.medications.detail(medication.id), medication);
      void queryClient.invalidateQueries({ queryKey: queryKeys.medications.all });
    },
  });
}

export function useUpdateMedication(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: MedicationInput) => medicationsApi.update(id, input),
    onSuccess: (medication) => {
      queryClient.setQueryData(queryKeys.medications.detail(id), medication);
      void queryClient.invalidateQueries({ queryKey: queryKeys.medications.all });
    },
  });
}

export function useLogAdherence(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (status: AdherenceStatus) => medicationsApi.logAdherence(id, status),
    onSuccess: (medication) => {
      queryClient.setQueryData(queryKeys.medications.detail(id), medication);
      void queryClient.invalidateQueries({ queryKey: queryKeys.medications.all });
    },
  });
}

export function useOcrExtraction() {
  return useMutation({ mutationFn: (file: File) => medicationsApi.extract(file) });
}

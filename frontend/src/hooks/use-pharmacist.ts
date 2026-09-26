import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { pharmacistApi } from "@/api/modules/pharmacist.api";
import { queryKeys } from "@/api/queryKeys";
import type { SendMessageInput, StartConversationInput } from "@/types/pharmacist";

export const usePharmacists = () => useQuery({ queryKey: queryKeys.pharmacists.all, queryFn: pharmacistApi.listPharmacists });
export const usePharmacist = (id?: string) => useQuery({ queryKey: queryKeys.pharmacists.detail(id ?? ""), queryFn: () => pharmacistApi.pharmacist(id!), enabled: Boolean(id) });
export const useConversations = () => useQuery({ queryKey: queryKeys.conversations.all, queryFn: pharmacistApi.listConversations });
export const useConversation = (id?: string) => useQuery({ queryKey: queryKeys.conversations.detail(id ?? ""), queryFn: () => pharmacistApi.conversation(id!), enabled: Boolean(id) });

export function useStartConversation() {
  const client = useQueryClient();
  return useMutation({ mutationFn: (input: StartConversationInput) => pharmacistApi.startConversation(input), onSuccess: (conversation) => { client.setQueryData(queryKeys.conversations.detail(conversation.id), conversation); void client.invalidateQueries({ queryKey: queryKeys.conversations.all }); } });
}

export function useSendMessage(id: string) {
  const client = useQueryClient();
  return useMutation({ mutationFn: (input: SendMessageInput) => pharmacistApi.sendMessage(id, input), onSuccess: () => { void client.invalidateQueries({ queryKey: queryKeys.conversations.detail(id) }); void client.invalidateQueries({ queryKey: queryKeys.conversations.all }); } });
}

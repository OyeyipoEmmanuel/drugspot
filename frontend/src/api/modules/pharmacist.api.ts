import { api } from "@/api/API";
import { endpoints } from "@/api/endpoints";
import { mockPharmacist } from "@/mocks/mock-pharmacist";
import type { ConversationMessage, PharmacistConversation, PharmacistProfile, SendMessageInput, StartConversationInput } from "@/types/pharmacist";

const useMocks = import.meta.env.VITE_USE_MOCK_API !== "false";

export const pharmacistApi = {
  listPharmacists: () => useMocks ? mockPharmacist.listPharmacists() : api.get<PharmacistProfile[]>(endpoints.pharmacists.list),
  pharmacist: (id: string) => useMocks ? mockPharmacist.pharmacist(id) : api.get<PharmacistProfile>(endpoints.pharmacists.detail(id)),
  listConversations: () => useMocks ? mockPharmacist.listConversations() : api.get<PharmacistConversation[]>(endpoints.conversations.list),
  conversation: (id: string) => useMocks ? mockPharmacist.conversation(id) : api.get<PharmacistConversation>(endpoints.conversations.detail(id)),
  startConversation: (input: StartConversationInput) => useMocks ? mockPharmacist.startConversation(input) : api.post<PharmacistConversation, StartConversationInput>(endpoints.conversations.list, input),
  sendMessage: (id: string, input: SendMessageInput) => useMocks ? mockPharmacist.sendMessage(id, input) : api.post<ConversationMessage, SendMessageInput>(endpoints.conversations.messages(id), input),
};

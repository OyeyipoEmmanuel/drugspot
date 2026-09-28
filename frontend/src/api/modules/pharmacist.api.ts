import { api } from "@/api/API";
import { endpoints } from "@/api/endpoints";
import type {
  ConversationMessage,
  PharmacistConversation,
  PharmacistProfile,
  SendMessageInput,
  StartConversationInput,
} from "@/types/pharmacist";

export const pharmacistApi = {
  listPharmacists: () =>
    api.get<PharmacistProfile[]>(endpoints.pharmacists.list),
  pharmacist: (id: string) =>
    api.get<PharmacistProfile>(endpoints.pharmacists.detail(id)),
  listConversations: () =>
    api.get<PharmacistConversation[]>(endpoints.conversations.list),
  conversation: (id: string) =>
    api.get<PharmacistConversation>(endpoints.conversations.detail(id)),
  startConversation: (input: StartConversationInput) =>
    api.post<PharmacistConversation, StartConversationInput>(
      endpoints.conversations.list,
      input,
    ),
  sendMessage: (id: string, input: SendMessageInput) =>
    api.post<ConversationMessage, SendMessageInput>(
      endpoints.conversations.messages(id),
      input,
    ),
};

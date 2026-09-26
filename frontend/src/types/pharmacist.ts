export type PharmacistAvailability = "available" | "busy" | "offline";

export interface PharmacistProfile {
  id: string;
  firstName: string;
  lastName: string;
  title: string;
  registrationNumber: string;
  pharmacyId: string;
  pharmacyName: string;
  pharmacyLocation: string;
  verified: boolean;
  availability: PharmacistAvailability;
  specialties: string[];
  languages: string[];
  rating: number;
  responseTimeMinutes: number;
  bio: string;
}

export interface ConversationMessage {
  id: string;
  senderRole: "patient" | "pharmacist";
  senderName: string;
  body: string;
  createdAt: string;
  attachmentName?: string;
  medicationName?: string;
}

export interface PharmacistConversation {
  id: string;
  pharmacist: PharmacistProfile;
  patientName: string;
  subject: string;
  status: "open" | "waiting" | "closed";
  unreadCount: number;
  updatedAt: string;
  messages: ConversationMessage[];
}

export interface StartConversationInput {
  pharmacistId: string;
  subject: string;
  message: string;
  medicationName?: string;
}

export interface SendMessageInput {
  body: string;
  senderRole: "patient" | "pharmacist";
  attachmentName?: string;
  medicationName?: string;
}

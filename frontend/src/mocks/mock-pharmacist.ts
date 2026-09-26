import type { PharmacistConversation, PharmacistProfile, SendMessageInput, StartConversationInput } from "@/types/pharmacist";

const CONVERSATIONS_KEY = "drugspot-mock-conversations";
const pause = (duration = 250) => new Promise((resolve) => window.setTimeout(resolve, duration));

export const seedPharmacists: PharmacistProfile[] = [
  { id: "pharm-ada", firstName: "Ada", lastName: "Okafor", title: "Superintendent Pharmacist", registrationNumber: "PCN-PH-10482", pharmacyId: "pharmacy-bluecare", pharmacyName: "BlueCare Pharmacy", pharmacyLocation: "Lekki, Lagos", verified: true, availability: "available", specialties: ["Medication guidance", "Chronic care"], languages: ["English", "Igbo"], rating: 4.9, responseTimeMinutes: 8, bio: "Patient-focused pharmacist supporting safe medicine use and long-term treatment routines." },
  { id: "pharm-musa", firstName: "Musa", lastName: "Ibrahim", title: "Clinical Pharmacist", registrationNumber: "PCN-PH-11807", pharmacyId: "pharmacy-healthfirst", pharmacyName: "HealthFirst Pharmacy", pharmacyLocation: "Ikeja, Lagos", verified: true, availability: "busy", specialties: ["Diabetes care", "Medicine interactions"], languages: ["English", "Hausa"], rating: 4.8, responseTimeMinutes: 18, bio: "Clinical pharmacist with a focus on clear, practical medicine counselling." },
  { id: "pharm-bisi", firstName: "Bisi", lastName: "Adebayo", title: "Community Pharmacist", registrationNumber: "PCN-PH-12551", pharmacyId: "pharmacy-medpoint", pharmacyName: "MedPoint Pharmacy", pharmacyLocation: "Yaba, Lagos", verified: true, availability: "offline", specialties: ["Women's health", "General wellness"], languages: ["English", "Yoruba"], rating: 4.7, responseTimeMinutes: 35, bio: "Community pharmacist helping patients understand prescriptions and everyday medicine questions." },
];

const seedConversations: PharmacistConversation[] = [{
  id: "conversation-demo",
  pharmacist: seedPharmacists[0],
  patientName: "Amara Okoro",
  subject: "Taking amoxicillin with food",
  status: "open",
  unreadCount: 1,
  updatedAt: "2026-09-26T08:42:00+01:00",
  messages: [
    { id: "message-1", senderRole: "patient", senderName: "Amara Okoro", body: "Hello, should I take my amoxicillin before or after breakfast?", medicationName: "Amoxicillin 500 mg", createdAt: "2026-09-26T08:35:00+01:00" },
    { id: "message-2", senderRole: "pharmacist", senderName: "Pharm. Ada Okafor", body: "Hello Amara. Follow the directions on your prescription. Taking it after food may help if it upsets your stomach. Do not change the prescribed dose or interval.", createdAt: "2026-09-26T08:42:00+01:00" },
  ],
}];

function readConversations() {
  const stored = localStorage.getItem(CONVERSATIONS_KEY);
  if (!stored) { localStorage.setItem(CONVERSATIONS_KEY, JSON.stringify(seedConversations)); return structuredClone(seedConversations); }
  return JSON.parse(stored) as PharmacistConversation[];
}

function saveConversations(items: PharmacistConversation[]) { localStorage.setItem(CONVERSATIONS_KEY, JSON.stringify(items)); }

export const mockPharmacist = {
  async listPharmacists() { await pause(); return structuredClone(seedPharmacists); },
  async pharmacist(id: string) { await pause(); const item = seedPharmacists.find((profile) => profile.id === id); if (!item) throw new Error("Pharmacist not found."); return structuredClone(item); },
  async listConversations() { await pause(180); return readConversations(); },
  async conversation(id: string) { await pause(180); const item = readConversations().find((conversation) => conversation.id === id); if (!item) throw new Error("Conversation not found."); return item; },
  async startConversation(input: StartConversationInput) {
    await pause();
    const pharmacist = seedPharmacists.find((profile) => profile.id === input.pharmacistId);
    if (!pharmacist) throw new Error("Pharmacist not found.");
    const now = new Date().toISOString();
    const conversation: PharmacistConversation = { id: crypto.randomUUID(), pharmacist, patientName: "Amara Okoro", subject: input.subject, status: "waiting", unreadCount: 0, updatedAt: now, messages: [{ id: crypto.randomUUID(), senderRole: "patient", senderName: "Amara Okoro", body: input.message, medicationName: input.medicationName, createdAt: now }] };
    saveConversations([conversation, ...readConversations()]);
    return conversation;
  },
  async sendMessage(id: string, input: SendMessageInput) {
    await pause();
    const conversations = readConversations();
    const conversation = conversations.find((item) => item.id === id);
    if (!conversation) throw new Error("Conversation not found.");
    const message = { id: crypto.randomUUID(), senderRole: input.senderRole, senderName: input.senderRole === "patient" ? conversation.patientName : `Pharm. ${conversation.pharmacist.firstName} ${conversation.pharmacist.lastName}`, body: input.body, attachmentName: input.attachmentName, medicationName: input.medicationName, createdAt: new Date().toISOString() } as const;
    conversation.messages.push(message);
    conversation.updatedAt = message.createdAt;
    conversation.status = input.senderRole === "patient" ? "waiting" : "open";
    conversation.unreadCount = input.senderRole === "pharmacist" ? 1 : 0;
    saveConversations(conversations);
    return message;
  },
};

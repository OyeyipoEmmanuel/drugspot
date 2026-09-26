import type { AuthSession, LoginInput, RegisterInput } from "@/types/auth";
import type {
  AdherenceStatus,
  Medication,
  MedicationInput,
  OcrMedicationDraft,
} from "@/types/medication";

const MEDICATIONS_KEY = "drugspot-mock-medications";
const SESSION_KEY = "drugspot-session";

const seedMedications: Medication[] = [
  {
    id: "med-amoxicillin",
    name: "Amoxicillin",
    strength: "500 mg",
    form: "Capsule",
    instructions: "Take one capsule after food.",
    frequency: "Three times daily",
    startDate: "2026-09-21",
    endDate: "2026-09-28",
    remainingDoses: 14,
    status: "active",
    prescribedBy: "Dr. Ada Okafor",
    pharmacy: "BlueCare Pharmacy",
    schedules: [
      { id: "sch-am-1", time: "08:00", label: "Morning" },
      { id: "sch-am-2", time: "14:00", label: "Afternoon" },
      { id: "sch-am-3", time: "20:00", label: "Evening" },
    ],
    adherence: [
      {
        id: "evt-1",
        status: "taken",
        scheduledAt: "2026-09-23T08:00:00+01:00",
        recordedAt: "2026-09-23T08:04:00+01:00",
      },
      {
        id: "evt-2",
        status: "taken",
        scheduledAt: "2026-09-22T20:00:00+01:00",
        recordedAt: "2026-09-22T20:12:00+01:00",
      },
    ],
  },
  {
    id: "med-amlodipine",
    name: "Amlodipine",
    strength: "5 mg",
    form: "Tablet",
    instructions: "Take one tablet with water.",
    frequency: "Once daily",
    startDate: "2026-09-01",
    endDate: "2026-10-01",
    remainingDoses: 6,
    status: "active",
    pharmacy: "HealthFirst Pharmacy",
    schedules: [{ id: "sch-amlo-1", time: "09:00", label: "Morning" }],
    adherence: [
      {
        id: "evt-3",
        status: "snoozed",
        scheduledAt: "2026-09-23T09:00:00+01:00",
        recordedAt: "2026-09-23T09:01:00+01:00",
      },
    ],
  },
  {
    id: "med-vitamin-c",
    name: "Vitamin C",
    strength: "1000 mg",
    form: "Tablet",
    instructions: "Dissolve one tablet in water.",
    frequency: "Once daily",
    startDate: "2026-08-01",
    endDate: "2026-08-30",
    remainingDoses: 0,
    status: "completed",
    schedules: [{ id: "sch-vit-1", time: "08:00", label: "Morning" }],
    adherence: [],
  },
];

function pause(duration = 350) {
  return new Promise((resolve) => window.setTimeout(resolve, duration));
}

function readMedications() {
  const saved = localStorage.getItem(MEDICATIONS_KEY);
  if (!saved) {
    localStorage.setItem(MEDICATIONS_KEY, JSON.stringify(seedMedications));
    return structuredClone(seedMedications);
  }
  return JSON.parse(saved) as Medication[];
}

function writeMedications(medications: Medication[]) {
  localStorage.setItem(MEDICATIONS_KEY, JSON.stringify(medications));
}

function createSession(input: LoginInput): AuthSession {
  const isStaff = input.email.toLowerCase().includes("pharmacy");
  const isAdmin = input.email.toLowerCase().includes("admin");
  return {
    accessToken: `mock-access-${crypto.randomUUID()}`,
    refreshToken: `mock-refresh-${crypto.randomUUID()}`,
    user: {
      id: "user-demo",
      firstName: isStaff ? "Chidi" : isAdmin ? "Nneka" : "Amara",
      lastName: isStaff ? "Eze" : isAdmin ? "Bello" : "Okoro",
      email: input.email,
      role: isAdmin ? "platform_admin" : isStaff ? "pharmacy_admin" : "patient",
      onboardingComplete: true,
    },
  };
}

export const mockDb = {
  session: {
    read(): AuthSession | null {
      const saved = localStorage.getItem(SESSION_KEY);
      return saved ? (JSON.parse(saved) as AuthSession) : null;
    },
    save(session: AuthSession | null) {
      if (session) localStorage.setItem(SESSION_KEY, JSON.stringify(session));
      else localStorage.removeItem(SESSION_KEY);
    },
  },
  auth: {
    async login(input: LoginInput) {
      await pause();
      if (!input.email || input.password.length < 8) throw new Error("Invalid email or password.");
      return createSession(input);
    },
    async register(input: RegisterInput) {
      await pause();
      const session: AuthSession = {
        accessToken: `mock-access-${crypto.randomUUID()}`,
        user: {
          id: crypto.randomUUID(),
          firstName: input.firstName,
          lastName: input.lastName,
          email: input.email,
          phone: input.phone,
          role: "patient",
          onboardingComplete: false,
        },
      };
      return session;
    },
    async forgotPassword() {
      await pause();
      return { message: "Reset instructions sent." };
    },
  },
  medications: {
    async list() {
      await pause(200);
      return readMedications();
    },
    async detail(id: string) {
      await pause(200);
      const medication = readMedications().find((item) => item.id === id);
      if (!medication) throw new Error("Medication not found.");
      return medication;
    },
    async create(input: MedicationInput) {
      await pause();
      const medication: Medication = {
        ...input,
        id: crypto.randomUUID(),
        status: "active",
        schedules: input.scheduleTimes.map((time, index) => ({
          id: crypto.randomUUID(),
          time,
          label: index === 0 ? "Morning" : index === 1 ? "Afternoon" : "Evening",
        })),
        adherence: [],
      };
      const medications = readMedications();
      writeMedications([medication, ...medications]);
      return medication;
    },
    async update(id: string, input: MedicationInput) {
      await pause();
      const medications = readMedications();
      const index = medications.findIndex((item) => item.id === id);
      if (index < 0) throw new Error("Medication not found.");
      medications[index] = {
        ...medications[index],
        ...input,
        schedules: input.scheduleTimes.map((time, scheduleIndex) => ({
          id: medications[index].schedules[scheduleIndex]?.id ?? crypto.randomUUID(),
          time,
          label: scheduleIndex === 0 ? "Morning" : scheduleIndex === 1 ? "Afternoon" : "Evening",
        })),
      };
      writeMedications(medications);
      return medications[index];
    },
    async logAdherence(id: string, status: AdherenceStatus) {
      await pause(250);
      const medications = readMedications();
      const medication = medications.find((item) => item.id === id);
      if (!medication) throw new Error("Medication not found.");
      const now = new Date().toISOString();
      medication.adherence.unshift({
        id: crypto.randomUUID(),
        status,
        scheduledAt: now,
        recordedAt: now,
      });
      if (status === "taken") medication.remainingDoses = Math.max(0, medication.remainingDoses - 1);
      writeMedications(medications);
      return medication;
    },
    async extract(file: File): Promise<OcrMedicationDraft> {
      await pause(900);
      return {
        name: "Co-amoxiclav",
        strength: "625 mg",
        form: "Tablet",
        instructions: "Take one tablet after food.",
        frequency: "Twice daily",
        startDate: new Date().toISOString().slice(0, 10),
        endDate: "2026-10-01",
        remainingDoses: 14,
        scheduleTimes: ["08:00", "20:00"],
        confidence: 0.84,
        sourceFileName: file.name,
        warnings: ["Please confirm the medicine name and dosage against the prescription."],
      };
    },
  },
};

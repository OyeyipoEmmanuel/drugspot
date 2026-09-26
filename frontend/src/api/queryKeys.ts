export const queryKeys = {
  profile: ["profile"] as const,
  medications: {
    all: ["medications"] as const,
    detail: (id: string) => ["medications", id] as const,
  },
  pharmacies: (filters?: Record<string, unknown>) => ["pharmacies", filters] as const,
  pharmacy: (id: string) => ["pharmacies", id] as const,
  products: (filters?: Record<string, unknown>) => ["products", filters] as const,
  product: (id: string) => ["products", id] as const,
  orders: {
    all: ["orders"] as const,
    detail: (id: string) => ["orders", id] as const,
  },
  conversations: ["conversations"] as const,
  refills: ["refills"] as const,
  verifications: ["admin", "verifications"] as const,
  preorders: ["preorders"] as const,
};

import type { AuthSession } from "@/types/auth";

const SESSION_KEY = "drugspot-session";

export const sessionStorage = {
  read(): AuthSession | null {
    try {
      return JSON.parse(
        localStorage.getItem(SESSION_KEY) ?? "null",
      ) as AuthSession | null;
    } catch {
      localStorage.removeItem(SESSION_KEY);
      return null;
    }
  },
  save(session: AuthSession | null) {
    if (session) localStorage.setItem(SESSION_KEY, JSON.stringify(session));
    else localStorage.removeItem(SESSION_KEY);
  },
};

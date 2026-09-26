import { createContext, useContext, useEffect, useMemo, useState } from "react";

import { api } from "@/api/API";
import { authApi } from "@/api/modules/auth.api";
import { mockDb } from "@/mocks/mock-db";
import type { AuthSession, LoginInput, RegisterInput } from "@/types/auth";

interface AuthContextValue {
  session: AuthSession | null;
  isAuthenticated: boolean;
  login: (input: LoginInput) => Promise<AuthSession>;
  register: (input: RegisterInput) => Promise<AuthSession>;
  logout: () => void;
  completeOnboarding: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<AuthSession | null>(() => mockDb.session.read());

  useEffect(() => {
    api.setAccessTokenProvider(() => session?.accessToken ?? null);
    mockDb.session.save(session);
  }, [session]);

  const value = useMemo<AuthContextValue>(
    () => ({
      session,
      isAuthenticated: Boolean(session),
      async login(input) {
        const nextSession = await authApi.login(input);
        setSession(nextSession);
        return nextSession;
      },
      async register(input) {
        const nextSession = await authApi.register(input);
        setSession(nextSession);
        return nextSession;
      },
      logout() {
        setSession(null);
      },
      async completeOnboarding() {
        await authApi.completeOnboarding();
        setSession((current) =>
          current
            ? { ...current, user: { ...current.user, onboardingComplete: true } }
            : current,
        );
      },
    }),
    [session],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used inside AuthProvider");
  return context;
}

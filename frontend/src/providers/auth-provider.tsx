import { createContext, useContext, useEffect, useMemo, useRef, useState } from "react";

import { api } from "@/api/API";
import { authApi } from "@/api/modules/auth.api";
import { useLiveBackend } from "@/api/mode";
import { mockDb } from "@/mocks/mock-db";
import type { AuthSession, LoginInput, RegisterInput } from "@/types/auth";
import type { PharmacyVendorRegistrationInput } from "@/types/verification";

interface AuthContextValue {
  session: AuthSession | null;
  isAuthenticated: boolean;
  login: (input: LoginInput) => Promise<AuthSession>;
  register: (input: RegisterInput) => Promise<AuthSession>;
  registerPharmacy: (input: PharmacyVendorRegistrationInput) => Promise<AuthSession>;
  logout: () => Promise<void>;
  completeOnboarding: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<AuthSession | null>(() => mockDb.session.read());
  const hydrated = useRef(false);

  useEffect(() => {
    api.setAccessTokenProvider(() => session?.accessToken ?? null);
    mockDb.session.save(session);
  }, [session]);

  useEffect(() => {
    if (!useLiveBackend || !session || hydrated.current) return;
    hydrated.current = true;
    void authApi
      .profile()
      .then((user) => setSession((current) => (current ? { ...current, user } : current)))
      .catch(async () => {
        if (!session.refreshToken) {
          setSession(null);
          return;
        }
        try {
          setSession(await authApi.refresh(session.refreshToken));
        } catch {
          setSession(null);
        }
      });
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
      async registerPharmacy(input) {
        const nextSession = await authApi.registerPharmacy(input);
        setSession(nextSession);
        return nextSession;
      },
      async logout() {
        const refreshToken = session?.refreshToken;
        try {
          if (useLiveBackend && refreshToken) await authApi.logout(refreshToken);
        } finally {
          setSession(null);
          hydrated.current = false;
        }
      },
      async refreshProfile() {
        if (!useLiveBackend) return;
        const user = await authApi.profile();
        setSession((current) => (current ? { ...current, user } : current));
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

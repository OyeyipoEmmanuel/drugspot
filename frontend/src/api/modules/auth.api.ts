import { api } from "@/api/API";
import { endpoints } from "@/api/endpoints";
import { mockDb } from "@/mocks/mock-db";
import type { AuthSession, LoginInput, RegisterInput } from "@/types/auth";

const useMocks = import.meta.env.VITE_USE_MOCK_API !== "false";

export const authApi = {
  login(input: LoginInput) {
    return useMocks
      ? mockDb.auth.login(input)
      : api.post<AuthSession, LoginInput>(endpoints.auth.login, input);
  },
  register(input: RegisterInput) {
    return useMocks
      ? mockDb.auth.register(input)
      : api.post<AuthSession, RegisterInput>(endpoints.auth.register, input);
  },
  forgotPassword(email: string) {
    return useMocks
      ? mockDb.auth.forgotPassword()
      : api.post<{ message: string }, { email: string }>(endpoints.auth.forgotPassword, { email });
  },
  completeOnboarding() {
    return useMocks
      ? Promise.resolve({ onboardingComplete: true })
      : api.post<{ onboardingComplete: boolean }, Record<string, never>>(
          endpoints.auth.completeOnboarding,
          {},
        );
  },
};

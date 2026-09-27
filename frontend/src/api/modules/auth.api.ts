import { api } from "@/api/API";
import { endpoints } from "@/api/endpoints";
import { useLiveBackend } from "@/api/mode";
import { mockDb } from "@/mocks/mock-db";
import type { AuthSession, LoginInput, PatientProfile, PatientProfileInput, RegisterInput } from "@/types/auth";
import type { PharmacyVendorRegistrationInput } from "@/types/verification";

const useMocks = !useLiveBackend;

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
  registerPharmacy(input: PharmacyVendorRegistrationInput) {
    return api.post<AuthSession, PharmacyVendorRegistrationInput>(
      endpoints.pharmacyWorkspace.register,
      input,
    );
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
  profile() {
    return api.get<AuthSession["user"]>(endpoints.auth.profile);
  },
  refresh(refreshToken: string) {
    return api.post<AuthSession, { refreshToken: string }>(endpoints.auth.refresh, { refreshToken });
  },
  logout(refreshToken: string) {
    return api.post<{ message: string }, { refreshToken: string }>(endpoints.auth.logout, {
      refreshToken,
    });
  },
  updatePatientProfile(input: PatientProfileInput) {
    return api.patch<PatientProfile, PatientProfileInput>(endpoints.auth.patientProfile, input);
  },
  resetPassword(token: string, newPassword: string) {
    return api.post<{ message: string }, { token: string; newPassword: string }>(
      endpoints.auth.resetPassword,
      { token, newPassword },
    );
  },
  verifyEmail(token: string) {
    return api.post<AuthSession["user"], { token: string }>(endpoints.auth.verifyEmail, { token });
  },
  verifyPhone(token: string) {
    return api.post<AuthSession["user"], { token: string }>(endpoints.auth.verifyPhone, { token });
  },
};

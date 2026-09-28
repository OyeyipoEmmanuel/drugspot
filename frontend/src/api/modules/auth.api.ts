import { api } from "@/api/API";
import { endpoints } from "@/api/endpoints";
import type {
  AuthSession,
  LoginInput,
  PatientProfile,
  PatientProfileInput,
  RegisterInput,
} from "@/types/auth";
import type { PharmacyVendorRegistrationInput } from "@/types/verification";

export const authApi = {
  login(input: LoginInput) {
    return api.post<AuthSession, LoginInput>(endpoints.auth.login, input, {
      skipUnauthorizedHandler: true,
    });
  },
  register(input: RegisterInput) {
    return api.post<AuthSession, RegisterInput>(endpoints.auth.register, input, {
      skipUnauthorizedHandler: true,
    });
  },
  registerPharmacy(input: PharmacyVendorRegistrationInput) {
    return api.post<AuthSession, PharmacyVendorRegistrationInput>(
      endpoints.pharmacyWorkspace.register,
      input,
      { skipUnauthorizedHandler: true },
    );
  },
  forgotPassword(email: string) {
    return api.post<{ message: string }, { email: string }>(
      endpoints.auth.forgotPassword,
      { email },
      { skipUnauthorizedHandler: true },
    );
  },
  completeOnboarding() {
    return api.post<{ onboardingComplete: boolean }, Record<string, never>>(
      endpoints.auth.completeOnboarding,
      {},
    );
  },
  profile() {
    return api.get<AuthSession["user"]>(endpoints.auth.profile, {
      skipUnauthorizedHandler: true,
    });
  },
  refresh(refreshToken: string) {
    return api.post<AuthSession, { refreshToken: string }>(
      endpoints.auth.refresh,
      { refreshToken },
      { skipUnauthorizedHandler: true },
    );
  },
  logout(refreshToken: string) {
    return api.post<{ message: string }, { refreshToken: string }>(
      endpoints.auth.logout,
      {
        refreshToken,
      },
      { skipUnauthorizedHandler: true },
    );
  },
  updatePatientProfile(input: PatientProfileInput) {
    return api.patch<PatientProfile, PatientProfileInput>(
      endpoints.auth.patientProfile,
      input,
    );
  },
  resetPassword(token: string, newPassword: string) {
    return api.post<
      { message: string },
      { token: string; newPassword: string }
    >(endpoints.auth.resetPassword, { token, newPassword }, {
      skipUnauthorizedHandler: true,
    });
  },
  verifyEmail(token: string) {
    return api.post<AuthSession["user"], { token: string }>(
      endpoints.auth.verifyEmail,
      { token },
      { skipUnauthorizedHandler: true },
    );
  },
  verifyPhone(token: string) {
    return api.post<AuthSession["user"], { token: string }>(
      endpoints.auth.verifyPhone,
      { token },
      { skipUnauthorizedHandler: true },
    );
  },
};

export type UserRole =
  | "patient"
  | "pharmacist_applicant"
  | "pharmacist"
  | "pharmacy_admin"
  | "platform_admin";

export interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  role: UserRole;
  onboardingComplete: boolean;
}

export interface AuthSession {
  accessToken: string;
  refreshToken?: string;
  user: User;
}

export interface LoginInput {
  email: string;
  password: string;
}

export interface RegisterInput extends LoginInput {
  firstName: string;
  lastName: string;
  phone: string;
}

export interface PatientProfileInput {
  dateOfBirth?: string;
  gender?: string;
  emergencyContactName?: string;
  emergencyContactPhone?: string;
  allergies?: string;
  chronicConditions?: string;
}

export interface PatientProfile extends PatientProfileInput {
  id: string;
  userId: string;
}

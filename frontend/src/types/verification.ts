export type VerificationStatus = "pending" | "approved" | "rejected" | "suspended";

export interface PharmacyApplicationInput {
  name: string;
  address: string;
  city: string;
  state: string;
  country: string;
  phone: string;
  email: string;
  description: string;
  hours: string;
  supportsDelivery: boolean;
  supportsPickup: boolean;
  deliveryFee: number;
}

export interface PharmacyApplication extends PharmacyApplicationInput {
  id: string;
  ownerUserId: string;
  verificationStatus: VerificationStatus;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface PharmacyLicenseInput {
  licenseNumber: string;
  issuedBy: string;
  issuedAt?: string;
  expiresAt?: string;
  documentUrl?: string;
}

export interface PharmacyLicense extends PharmacyLicenseInput {
  id: string;
  pharmacyId: string;
  createdAt: string;
}

export interface PharmacistLinkInput {
  userId: string;
  licenseNumber: string;
}

export interface PharmacistLink extends PharmacistLinkInput {
  id: string;
  pharmacyId: string;
  verificationStatus: VerificationStatus;
  isActive: boolean;
  createdAt: string;
}

export interface PharmacistApplication {
  id: string;
  userId: string;
  pharmacyId: string;
  pharmacyName: string;
  firstName: string;
  lastName: string;
  email: string;
  licenseNumber: string;
  licenseIssuedBy?: string;
  licenseDocumentUrl?: string;
  verificationStatus: VerificationStatus;
  createdAt: string;
}

export interface VerificationQueueItem {
  pharmacy: PharmacyApplication;
  licenses: PharmacyLicense[];
  pharmacistInCharge?: PharmacistApplication;
}

export interface PharmacyVendorRegistrationInput {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  password: string;
  pharmacy: PharmacyApplicationInput;
  pharmacyLicense: PharmacyLicenseInput;
  pharmacistLicenseNumber: string;
  pharmacistLicenseIssuedBy: string;
  pharmacistLicenseDocumentUrl: string;
}

export interface VerificationDecisionInput {
  decision: Exclude<VerificationStatus, "pending">;
  notes?: string;
}

export interface VerificationRecord {
  id: string;
  pharmacyId?: string;
  pharmacistId?: string;
  reviewerId: string;
  decision: VerificationStatus;
  notes?: string;
  createdAt: string;
}


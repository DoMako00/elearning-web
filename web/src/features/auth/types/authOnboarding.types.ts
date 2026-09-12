export type AuthStepId =
  | "sign-in"
  | "verify-otp"
  | "complete-profile"
  | "choose-brand"
  | "access-granted";

export type SignInMode = "password" | "otp";
export type BrandId = "medway" | "elite";

export interface AuthProgressStep {
  id: AuthStepId;
  label: string;
}

export interface BrandOption {
  id: BrandId;
  name: string;
  description: string;
  categories: string;
}

export interface ProfileFormData {
  fullName: string;
  phone: string;
  email: string;
  university: string;
  faculty: string;
  academicYear: string;
  semester: string;
  studentId: string;
  termsAccepted: boolean;
}

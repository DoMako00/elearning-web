import type { AuthProgressStep, BrandOption, ProfileFormData } from "../types/authOnboarding.types";

export const authProgressSteps: AuthProgressStep[] = [
  { id: "sign-in", label: "Sign in" },
  { id: "verify-otp", label: "Verify OTP" },
  { id: "complete-profile", label: "Complete Profile" },
  { id: "choose-brand", label: "Choose Brand & Access" },
  { id: "access-granted", label: "You’re all set!" },
];

export const brandOptions: BrandOption[] = [
  {
    id: "medway",
    name: "Medway",
    description: "Medical learning, simplified.",
    categories: "Clinical • University • Exams",
  },
  {
    id: "elite",
    name: "Elite",
    description: "Excellence in medical education.",
    categories: "Postgraduate • MRCP • Specialties",
  },
];

export const initialProfileData: ProfileFormData = {
  fullName: "Juliana Student",
  phone: "+20 100 123 4567",
  email: "juliana.student@greenlearn.com",
  university: "Badr University in Cairo (BUC)",
  faculty: "School of Medicine",
  academicYear: "Year 2",
  semester: "Semester 3",
  studentId: "B20231234",
  termsAccepted: false,
};

export const academicYears = ["Year 1", "Year 2", "Year 3", "Year 4", "Year 5"];
export const semesters = Array.from({ length: 10 }, (_, index) => `Semester ${index + 1}`);

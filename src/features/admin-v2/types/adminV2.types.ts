export type BrandCode = "medway" | "elite" | "nexus";
export type BrandFilter = "all" | BrandCode;
export type AccountStatus = "Pending" | "Pending Payment" | "Active" | "Suspended" | "Payment Rejected" | "Inactive";
export type CourseStatus = "Published" | "Draft" | "Archived";
export type SubscriptionStatus = "Pending Payment" | "Active" | "Payment Rejected" | "Expired" | "Expiring Soon" | "Cancelled" | "Past Due";
export type PaymentStatus = "Pending Verification" | "Approved" | "Rejected";
export type DeviceStatus = "Active" | "Revoked" | "Replacement Pending";
export type SessionStatus = "Active" | "Revoked";
export type AuditEventStatus = "Info" | "Success" | "Warning" | "Critical";
export type DeviceCategory = "Mobile" | "Additional device";
export type DeviceType = "Phone" | "PC / laptop" | "Tablet";
export type RecordStatus = "Active" | "Published" | "Draft" | "Archived" | "Closed" | "Suspended" | "Inactive" | "Pending" | "Pending Payment" | "Pending Review" | "Payment Rejected" | "Pending Verification" | "Expiring Soon" | "Expired" | "Cancelled" | "Past Due" | "Revoked" | "Replacement Pending" | "Approved" | "Rejected" | "Withdrawn" | "Submitted" | "Reviewed" | "Returned";

export type InstructorStatus = "Active" | "Inactive";
export interface InstructorRecord {
  id: string;
  fullName: string;
  email: string;
  phone?: string;
  avatar?: string;
  specialties: string[];
  status: InstructorStatus;
  createdAt: string;
  updatedAt: string;
  version?: number;
  code?: string;
}
export interface InstructorBrandAssignment { id: string; instructorId: string; brand: BrandCode; createdAt: string; }
export interface InstructorAssignment { instructorId?: string; name: string; role: "Lead Instructor" | "Co-Instructor" | "Unspecified"; allocation?: number; }
export interface CourseRecord {
  id: string; title: string; brand: BrandCode; scope: "Curriculum" | "Standalone"; curriculumUnitId: string | null;
  status: CourseStatus; updated: string; instructors: InstructorAssignment[];
  version?: number; code?: string; brandId?: string; academicInstitutionId?: string | null; cataloguePresentation?: "module_based" | "subject_based";
}

export interface InstitutionRecord { id: string; name: string; shortName: string; status: "Active" | "Archived"; version?:number; }
export interface CurriculumRecord { id: string; institutionId: string; title: string; status: "Approved" | "Draft"; updatedAt: string; }
export interface AcademicYearRecord { id: string; curriculumId: string; title: string; order: number; levelNumber?:number; status: "Active" | "Archived"; version?: number; }
export interface SemesterRecord { id: string; academicYearId: string; title: string; order: number; semesterNumber?:number; status: "Active" | "Archived"; version?: number; }
export interface CurriculumUnitRecord {
  id: string; institutionId: string; academicYearId: string; semesterId: string; type: "Subject" | "Module";
  code: string; title: string; description: string; status: "Approved" | "Draft" | "Archived"; credits?: number; order: number; version?: number;
}
export interface CourseChapter { id: string; courseId: string; title: string; order: number; status: "Active" | "Archived"; updatedAt: string; version?: number; backendStatus?: "draft" | "published" | "archived"; }
export type LessonStatus = "Draft" | "Published" | "Archived";
export type ReleaseMode = "Immediate" | "Scheduled";
export interface CourseLesson {
  id: string; courseId: string; chapterId: string; title: string; description: string; order: number; status: LessonStatus;
  releaseMode: ReleaseMode; releaseAt: string | null; visibility: "Visible" | "Hidden"; updatedAt: string;
  version?: number;
  deliverySettingsAvailable?: boolean;
}
export type ContentResourceType = "Video" | "PDF";
export type ContentResourceStatus = "Draft" | "Published" | "Withdrawn" | "Archived";
export interface ContentResource {
  id: string; lessonId: string; type: ContentResourceType; title: string; description: string; fileName: string;
  fileSize: number; mimeType: string; durationSeconds?: number; pageCount?: number; status: ContentResourceStatus;
  createdAt: string; updatedAt: string; releaseAt: string | null; visibility: "Visible" | "Hidden";
  brandId?: string; courseId?: string; version?: number; mediaAssetId?: string | null;
  mediaVersion?: number; maxCompletedViews?: number;
  uploadStatus?: "not_uploaded" | "pending_upload" | "uploaded" | "verified" | "published" | "withdrawn" | "failed";
  backendStatus?: "draft" | "published" | "archived";
  resourceKind?: "video" | "document";
}
export interface StudentRecord {
  id: string; accountIdentifier: string; setupCode?: string; fullName: string; email: string; phone?: string; brand: BrandCode;
  institution: string; academicInstitutionId?: string | null; academicLevel: string; academicLevelId?: string | null; semester: string; academicSemesterId?: string | null; program: string; activeDeviceCount?: number;
  status: AccountStatus; createdAt: string; lastActivity: string;
}
export interface SubscriptionPlan { id: "individual" | "trio" | "group"; name: string; capacity: 1 | 3 | 5; amount: number; currency: "EGP"; termMonths: 12; }
export interface SubscriptionRecord {
  id: string; planId: SubscriptionPlan["id"]; brand: BrandCode; studentIds: string[]; status: SubscriptionStatus;
  startDate: string | null; expiryDate: string | null; renewal: "Auto-renew" | "Manual renewal" | "Not renewing";
  amount: number; currency: "EGP"; paymentId: string | null; createdAt: string;
}
export interface PaymentRecord {
  id: string; orderId: string; subscriptionId: string; brand: BrandCode; studentIds: string[];
  planId: SubscriptionPlan["id"]; seatCount: number; amount: number; currency: "EGP";
  method: "Bank transfer" | "Cash" | "Wallet" | "Other"; submittedAt: string; status: PaymentStatus;
}
export interface CourseEnrollment {
  id: string; studentId: string; courseId: string; source: "Subscription" | "Admin grant";
  subscriptionId: string | null; createdAt: string; expiryDate: string | null; status: "Active" | "Revoked";
}
export interface StudentDevice {
  id: string; studentId: string; name: string; category: DeviceCategory; type: DeviceType;
  platform: string; browser: string; firstSeen: string; lastSeen: string; status: DeviceStatus;
}
export interface StudentSession {
  id: string; studentId: string; deviceId: string; device: string; platform: string; browser: string;
  created: string; lastActivity: string; status: SessionStatus;
}
export interface AuditEvent {
  id: string; actor: string; action: string; targetType: string; targetId: string; targetLabel: string;
  status: AuditEventStatus; timestamp: string; metadata?: string;
}
export interface AdminV2Data {
  courses: CourseRecord[]; students: StudentRecord[]; plans: SubscriptionPlan[]; subscriptions: SubscriptionRecord[];
  payments: PaymentRecord[]; enrollments: CourseEnrollment[]; devices: StudentDevice[]; sessions: StudentSession[];
  institutions: InstitutionRecord[]; curricula: CurriculumRecord[]; academicYears: AcademicYearRecord[]; semesters: SemesterRecord[];
  curriculumUnits: CurriculumUnitRecord[]; chapters: CourseChapter[]; lessons: CourseLesson[]; contentResources: ContentResource[]; auditEvents: AuditEvent[];
  instructors: InstructorRecord[]; instructorBrandAssignments: InstructorBrandAssignment[];
}

export interface StudentDraft {
  fullName: string; accountIdentifier: string; email: string; phone?: string; brand: BrandCode; institution: "BUC" | "Delta";
  academicInstitutionId?: string; academicLevel: string; academicLevelId?: string; academicLevelNumber: number; academicSemesterId?: string; academicSemesterNumber: number; academicInstitutionCode: "buc" | "delta"; semester: string; program: string;
}

# 🔐 Authentication, Onboarding & Access Flow
# توثيق دورة تسجيل الدخول، إنشاء الحساب، وصلاحيات البراند (Auth & Onboarding)

---

## 🇺🇸 English Documentation

### 1. Overview
The platform features an enterprise authentication and onboarding pipeline supporting multi-brand institutional affiliations, OTP verification, profile completion, and access review workflows.

### 2. Architecture & File Structure
- **Directory**: `src/features/auth/`
- **Pages (`src/features/auth/pages/`)**:
  - `SignInPage.tsx` (`/auth/sign-in`): Email/password and student ID authentication with form validation.
  - `RegisterPage.tsx` (`/auth/register`): Account creation with role and faculty selection.
  - `VerifyOtpPage.tsx` (`/auth/verify-otp`): 6-digit numeric OTP input with auto-focus and resend countdown.
  - `CompleteProfilePage.tsx` (`/auth/complete-profile`): Post-registration step for avatar, bio, and academic year details.
  - `ChooseBrandPage.tsx` (`/auth/choose-brand`): Tenant/university affiliation selector allowing students to enter their specific university campus portal.
  - `AccessPendingPage.tsx` (`/auth/access-pending`): Institutional pending review screen for unverified student accounts.
  - `AccessGrantedPage.tsx` (`/auth/access-granted`): Welcome gate granting access to the student dashboard.
- **Brand Provider**: `src/app/providers/BrandProvider.tsx`: Manages active brand configuration (e.g., BUC, colors, logos) injected globally into the navigation and topbars.

---

## 🇪🇬 التوثيق بالعربي المصري (Egyptian Arabic)

### 1. فكرة نظام المصادقة والتسجيل (Overview)
دورة كاملة وآمنة لتسجيل دخول الطلاب، إنشاء حساب جديد، وتأكيد الهوية بكود الـ OTP، واختيار الجامعة التابع ليها الطالب.

### 2. صفحات الدخول والتحقق
1. **تسجيل الدخول والتسجيل (Sign In & Register)**: واجهات أنيقة وعصرية تتيح للطالب الدخول ببياناته أو عمل حساب جديد.
2. **التحقق من الكود (Verify OTP)**: صفحة إدخال كود التأكيد (6 أرقام) مع مؤقت زمني لإعادة الإرسال.
3. **استكمال البيانات (Complete Profile)**: إدخال السنة الدراسية والكلية والبيانات الشخصية.
4. **اختيار الجامعة/البراند (Choose Brand)**: إمكانية اختيار المؤسسة التعليمية (زي جامعة بدر BUC) وتخصيص هوية المنصة بناءً عليها.
5. **شاشات المراجعة والقبول (Access Pending & Granted)**: إشعار الطالب بحالة مراجعة الحساب وتأكيد تفعيل اشتراكه في المنصة.

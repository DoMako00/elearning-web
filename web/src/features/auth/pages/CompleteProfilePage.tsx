import { useState, type FormEvent } from "react";
import { ArrowRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import profileCompletion from "../../../Assets/onboarding/profile-completion.webp";
import { AuthButton, AuthSelectField, AuthTextField } from "../components/AuthControls";
import { AuthIllustrationCard } from "../components/AuthIllustrationCard";
import { AuthShell } from "../components/AuthShell";
import { academicYears, initialProfileData, semesters } from "../data/authOnboarding.mock";
import type { ProfileFormData } from "../types/authOnboarding.types";

type ProfileErrors = Partial<Record<keyof ProfileFormData, string>>;

export function CompleteProfilePage() {
  const navigate = useNavigate();
  const [form, setForm] = useState(initialProfileData);
  const [errors, setErrors] = useState<ProfileErrors>({});

  const update = <Key extends keyof ProfileFormData>(key: Key, value: ProfileFormData[Key]) => {
    setForm((current) => ({ ...current, [key]: value }));
    setErrors((current) => ({ ...current, [key]: undefined }));
  };

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const nextErrors: ProfileErrors = {};
    const requiredTextFields: (keyof Omit<ProfileFormData, "termsAccepted">)[] = ["fullName", "phone", "email", "university", "faculty", "academicYear", "semester", "studentId"];
    requiredTextFields.forEach((key) => { if (!form[key].trim()) nextErrors[key] = "This field is required."; });
    if (form.email && !/^\S+@\S+\.\S+$/.test(form.email)) nextErrors.email = "Enter a valid email address.";
    if (!form.termsAccepted) nextErrors.termsAccepted = "Accept the Terms of Service to continue.";
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length === 0) navigate("/auth/choose-brand");
  };

  const illustration = (
    <AuthIllustrationCard image={profileCompletion} alt="Student profile card with graduation cap" title="Almost there!" description="This helps us match you with the right content and peers.">
      <div className="auth-mini-progress"><span>Step 3 of 4</span><div><i /></div></div>
    </AuthIllustrationCard>
  );

  return (
    <AuthShell step="complete-profile" stepNumber={3} stepLabel="Complete Profile" aside={illustration}>
      <div className="auth-heading auth-heading--compact">
        <p className="auth-eyebrow">Personalize your learning</p>
        <h1 id="auth-page-title">Complete your profile</h1>
        <p>Tell us a bit about yourself to personalize your learning experience.</p>
      </div>
      <form className="auth-form auth-profile-form" onSubmit={submit} noValidate>
        <AuthTextField label="Full name" name="fullName" autoComplete="name" value={form.fullName} onChange={(event) => update("fullName", event.target.value)} error={errors.fullName} />
        <AuthSelectField label="Academic year" name="academicYear" value={form.academicYear} onChange={(event) => update("academicYear", event.target.value)} error={errors.academicYear}>{academicYears.map((year) => <option key={year}>{year}</option>)}</AuthSelectField>
        <AuthTextField label="Phone number" name="phone" autoComplete="tel" value={form.phone} onChange={(event) => update("phone", event.target.value)} error={errors.phone} />
        <AuthSelectField label="Semester" name="semester" value={form.semester} onChange={(event) => update("semester", event.target.value)} error={errors.semester}>{semesters.map((semester) => <option key={semester}>{semester}</option>)}</AuthSelectField>
        <AuthTextField label="Email address" name="email" type="email" autoComplete="email" value={form.email} onChange={(event) => update("email", event.target.value)} error={errors.email} />
        <AuthTextField label="Username / Student ID" name="studentId" value={form.studentId} onChange={(event) => update("studentId", event.target.value)} error={errors.studentId} />
        <AuthTextField label="University" name="university" value={form.university} onChange={(event) => update("university", event.target.value)} error={errors.university} />
        <div className="auth-profile-form__terms">
          <label className="auth-checkbox"><input type="checkbox" checked={form.termsAccepted} onChange={(event) => update("termsAccepted", event.target.checked)} /><span>I agree to the <button type="button" className="auth-inline-link">Terms of Service</button></span></label>
          {errors.termsAccepted && <span className="auth-field__error" role="alert">{errors.termsAccepted}</span>}
        </div>
        <AuthTextField label="Faculty / Track" name="faculty" value={form.faculty} onChange={(event) => update("faculty", event.target.value)} error={errors.faculty} />
        <AuthButton type="submit" className="auth-profile-form__submit">Save & continue <ArrowRight aria-hidden="true" /></AuthButton>
      </form>
    </AuthShell>
  );
}

import { createContext, useContext, useMemo, type PropsWithChildren } from "react";
import { BrandOverrideProvider } from "../../../app/providers/BrandProvider";
import { RouteLoadingFallback } from "../../../components/layout/RouteLoadingFallback";
import { useIsMobile } from "../../../hooks/useIsMobile";
import {
  brandDisplayName,
  isValidBrandInstitution,
  normalizeCode,
  toBrandCode,
  type BrandCode,
} from "../../../shared/domain/brandInstitution";
import { classifyStudentApiError } from "../api/studentApiErrors";
import { useStudentProfile } from "../api/useStudentLearning";

export interface StudentScope {
  readonly brand: BrandCode;
  readonly brandName: string;
  readonly institutionCode: string;
  readonly institutionName: string;
}

const StudentScopeContext = createContext<StudentScope | null>(null);

/** The verified Brand/Institution scope of the signed-in student. */
export function useStudentScope(): StudentScope {
  const scope = useContext(StudentScopeContext);
  if (!scope) throw new Error("useStudentScope must be used within StudentScopeProvider.");
  return scope;
}

/** Same as useStudentScope, for components that can also render outside the student workspace. */
export function useOptionalStudentScope(): StudentScope | null {
  return useContext(StudentScopeContext);
}

/** True when a course DTO belongs to the active scope. Used to make sure a
 * record from another Brand or Institution can never render. */
export function belongsToStudentScope(
  scope: StudentScope,
  item: { readonly brand?: { readonly code?: string } | null; readonly academicInstitution?: { readonly code?: string } | null },
): boolean {
  return normalizeCode(item.brand?.code) === scope.brand
    && normalizeCode(item.academicInstitution?.code) === normalizeCode(scope.institutionCode);
}

function ScopeNotice({ title, message, onRetry }: { title: string; message: string; onRetry?: () => void }) {
  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-50 px-4" role="alert">
      <section className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 text-center shadow-sm">
        <h1 className="text-lg font-bold text-slate-900">{title}</h1>
        <p className="mt-2 text-sm leading-relaxed text-slate-600">{message}</p>
        {onRetry ? (
          <button type="button" onClick={onRetry} className="mt-5 inline-flex min-h-11 items-center justify-center rounded-xl bg-emerald-700 px-5 text-sm font-semibold text-white hover:bg-emerald-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-700">
            Try again
          </button>
        ) : null}
      </section>
    </main>
  );
}

/**
 * Resolves the student's Brand and Institution from the authenticated profile
 * and validates the pair (Medway/Elite → BUC, Nexus → Delta) before any
 * student content renders. No default or guessed scope is ever used.
 */
export function StudentScopeProvider({ children }: PropsWithChildren) {
  const isMobile = useIsMobile();
  const profileQuery = useStudentProfile();
  const profile = profileQuery.data;

  const scope = useMemo<StudentScope | null>(() => {
    if (!profile) return null;
    const brand = toBrandCode(profile.brand?.code);
    if (!brand || !isValidBrandInstitution(brand, profile.institution?.code)) return null;
    return {
      brand,
      brandName: brandDisplayName(brand),
      institutionCode: normalizeCode(profile.institution.code),
      institutionName: profile.institution.name,
    };
  }, [profile]);
  const brandValue = useMemo(
    () => (scope ? { id: scope.brand, name: scope.brandName, shortName: scope.brandName.slice(0, 2).toUpperCase() } : null),
    [scope],
  );

  if (profileQuery.isPending) {
    return <RouteLoadingFallback isMobile={isMobile} message="Loading your learning space…" />;
  }
  if (profileQuery.isError && !profile) {
    const classified = classifyStudentApiError(profileQuery.error);
    const retry = classified.kind === "unavailable" || classified.kind === "unknown" ? () => void profileQuery.refetch() : undefined;
    return <ScopeNotice title={classified.title} message={classified.message} onRetry={retry} />;
  }
  if (!scope || !brandValue) {
    return (
      <ScopeNotice
        title="Your learning membership needs attention"
        message="Your account's learning brand and academic institution are not a supported combination, so course content can't be shown safely. Please contact support to correct your membership."
      />
    );
  }

  return (
    <StudentScopeContext.Provider value={scope}>
      <BrandOverrideProvider brand={brandValue}>
        {children}
      </BrandOverrideProvider>
    </StudentScopeContext.Provider>
  );
}

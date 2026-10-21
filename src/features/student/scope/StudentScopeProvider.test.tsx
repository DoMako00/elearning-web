import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { StudentScopeProvider, belongsToStudentScope, useStudentScope } from "./StudentScopeProvider";
import { useBrand } from "../../../app/providers/BrandProvider";
import { useStudentProfile } from "../api/useStudentLearning";
import { StudentLearningApiError } from "../api/studentLearningApi";
import { getStudentAuthMethods } from "../../auth/api/identityApi";
import { NEXUS_LOGO_URL } from "../../../shared/brandAssets";

vi.mock("../api/useStudentLearning", () => ({ useStudentProfile: vi.fn() }));
vi.mock("../../auth/api/identityApi", () => ({ getStudentAuthMethods: vi.fn() }));
vi.mock("../../../components/layout/RouteLoadingFallback", () => ({
  RouteLoadingFallback: ({ message }: { message?: string }) => <p role="status">{message}</p>,
}));

type ProfileQuery = ReturnType<typeof useStudentProfile>;
function profileQuery(partial: Partial<{ data: unknown; isPending: boolean; isError: boolean; error: unknown }>): ProfileQuery {
  return { data: undefined, isPending: false, isError: false, error: null, refetch: vi.fn(), ...partial } as unknown as ProfileQuery;
}
function profile(brand: string, institution: string) {
  return { brand: { id: "b", code: brand, name: brand }, institution: { id: "i", code: institution, name: institution === "delta" ? "Delta University" : "BUC" } };
}

function ScopeProbe() {
  const scope = useStudentScope();
  const { brand } = useBrand();
  return <>
    <p>scope {scope.brand}/{scope.institutionCode} brand-name {brand.name}</p>
    {brand.logoUrl ? <img src={brand.logoUrl} alt={`${brand.name} logo`} /> : null}
  </>;
}

function renderScope() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(<QueryClientProvider client={client}><StudentScopeProvider><ScopeProbe /></StudentScopeProvider></QueryClientProvider>);
}

beforeEach(() => {
  vi.mocked(useStudentProfile).mockReset();
  vi.mocked(getStudentAuthMethods).mockReset();
});

describe("StudentScopeProvider", () => {
  it("provides the verified Nexus → Delta scope and the real brand name", () => {
    vi.mocked(useStudentProfile).mockReturnValue(profileQuery({ data: profile("nexus", "delta") }));
    renderScope();
    expect(screen.getByText("scope nexus/delta brand-name Nexus")).toBeTruthy();
    expect(screen.getByRole("img", { name: "Nexus logo" }).getAttribute("src")).toBe(NEXUS_LOGO_URL);
  });

  it.each([["medway", "buc"], ["elite", "buc"]])("accepts %s → %s", (brand, institution) => {
    vi.mocked(useStudentProfile).mockReturnValue(profileQuery({ data: profile(brand, institution) }));
    renderScope();
    expect(screen.getByText(new RegExp(`scope ${brand}/${institution}`))).toBeTruthy();
    expect(screen.queryByRole("img", { name: "Nexus logo" })).toBeNull();
  });

  it.each([["nexus", "buc"], ["medway", "delta"], ["greenlearn", "buc"]])("blocks student content for the invalid pair %s / %s", (brand, institution) => {
    vi.mocked(useStudentProfile).mockReturnValue(profileQuery({ data: profile(brand, institution) }));
    renderScope();
    expect(screen.queryByText(/^scope /)).toBeNull();
    expect(screen.getByRole("alert").textContent).toMatch(/not a supported combination/i);
  });

  it("shows a loading state without guessing a scope", () => {
    vi.mocked(useStudentProfile).mockReturnValue(profileQuery({ isPending: true }));
    renderScope();
    expect(screen.getByRole("status")).toBeTruthy();
    expect(screen.queryByText(/^scope /)).toBeNull();
  });

  it("explains a 403 membership rejection instead of a connection error, with no retry", () => {
    vi.mocked(useStudentProfile).mockReturnValue(profileQuery({ isError: true, error: new StudentLearningApiError("An active student academic placement is required.", 403, "forbidden") }));
    renderScope();
    const alert = screen.getByRole("alert");
    expect(alert.textContent).toMatch(/no active learning membership/i);
    expect(alert.textContent).not.toMatch(/connection/i);
    expect(screen.queryByRole("button", { name: /try again/i })).toBeNull();
    expect(getStudentAuthMethods).not.toHaveBeenCalled();
  });

  it("falls back to the session brand when the profile endpoint returns 503, instead of locking the student out", async () => {
    vi.mocked(useStudentProfile).mockReturnValue(profileQuery({ isError: true, error: new StudentLearningApiError("Service unavailable", 503, "service_unavailable") }));
    vi.mocked(getStudentAuthMethods).mockResolvedValue({ brandCode: "nexus" });
    renderScope();
    await waitFor(() => expect(screen.getByText("scope nexus/delta brand-name Nexus")).toBeTruthy());
  });

  it.each([["medway", "buc"], ["elite", "buc"]])("maps a %s session brand to %s during a profile outage", async (brand, institution) => {
    vi.mocked(useStudentProfile).mockReturnValue(profileQuery({ isError: true, error: new StudentLearningApiError("Service unavailable", 503, "service_unavailable") }));
    vi.mocked(getStudentAuthMethods).mockResolvedValue({ brandCode: brand as "medway" | "elite" });
    renderScope();
    await waitFor(() => expect(screen.getByText(new RegExp(`scope ${brand}/${institution}`))).toBeTruthy());
  });

  it("shows a retryable outage notice when both the profile and the session brand are unavailable", async () => {
    const refetch = vi.fn();
    vi.mocked(useStudentProfile).mockReturnValue(profileQuery({ isError: true, error: new StudentLearningApiError("Service unavailable", 503, "service_unavailable"), refetch } as never));
    vi.mocked(getStudentAuthMethods).mockRejectedValue(new Error("down"));
    renderScope();
    // The session-brand lookup retries once before giving up.
    await waitFor(() => expect(screen.getByRole("alert").textContent).toMatch(/couldn't reach the learning service/i), { timeout: 5000 });
    expect(screen.queryByText(/^scope /)).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: /try again/i }));
    expect(refetch).toHaveBeenCalled();
  });

  it("does not invent a scope when the session reports no brand", async () => {
    vi.mocked(useStudentProfile).mockReturnValue(profileQuery({ isError: true, error: new StudentLearningApiError("Service unavailable", 503, "service_unavailable") }));
    vi.mocked(getStudentAuthMethods).mockResolvedValue({});
    renderScope();
    await waitFor(() => expect(screen.getByRole("alert")).toBeTruthy());
    expect(screen.queryByText(/^scope /)).toBeNull();
  });
});

describe("belongsToStudentScope", () => {
  const nexus = { brand: "nexus" as const, brandName: "Nexus", institutionCode: "delta", institutionName: "Delta University" };
  it("rejects a course from another brand or institution", () => {
    expect(belongsToStudentScope(nexus, { brand: { code: "nexus" }, academicInstitution: { code: "delta" } })).toBe(true);
    expect(belongsToStudentScope(nexus, { brand: { code: "medway" }, academicInstitution: { code: "buc" } })).toBe(false);
    expect(belongsToStudentScope(nexus, { brand: { code: "nexus" }, academicInstitution: { code: "buc" } })).toBe(false);
    expect(belongsToStudentScope(nexus, { brand: null, academicInstitution: null })).toBe(false);
  });
});

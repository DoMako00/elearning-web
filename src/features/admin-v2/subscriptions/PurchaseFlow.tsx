import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { BookOpen, Check, ChevronLeft, ChevronRight, Layers3, UserRound, Users, UsersRound } from "lucide-react";
import { useNavigate, useSearchParams } from "react-router-dom";
import type { BrandFilter } from "../types/adminV2.types";
import { listAllAdminStudents } from "../api/adminOperationsApi";
import { createSemesterOfferingOrder, type CreateSemesterOfferingOrderInput, type SemesterOfferingPaymentMethod } from "../api/adminCommercialApi";
import { listSemesterOfferings, getSemesterOffering, type SemesterOffering } from "../api/semesterOfferingsApi";
import type { AdminStudentListItem } from "../api/adminStudentsApi";
import { isAdminTestStudentName, toEnglishStudentName } from "../api/studentDisplay";
import { extractApiErrorMessage } from "../../../app/api/client";
import { BrandBadge, Drawer, FormActions, FormField } from "../shared/AdminV2Primitives";
import { createInstructorPurchaseRequest, getInstructorSemesterOffering, listInstructorSemesterOfferings, listInstructorStudents } from "../api/instructorWorkspaceApi";

type Capacity = 1 | 3 | 5;
type Step = 1 | 2 | 3 | 4;

const plans: ReadonlyArray<{
  capacity: Capacity;
  name: string;
  description: string;
  icon: typeof UserRound;
}> = [
  { capacity: 1, name: "Individual", description: "One Student in a selected Semester Offering.", icon: UserRound },
  { capacity: 3, name: "Team", description: "Up to three Students in one selected Offering.", icon: Users },
  { capacity: 5, name: "Group", description: "Up to five Students in one selected Offering.", icon: UsersRound },
];

const methods: ReadonlyArray<{ value: SemesterOfferingPaymentMethod; label: string }> = [
  { value: "instapay", label: "InstaPay" },
  { value: "wallet", label: "Mobile Wallet" },
  { value: "bank_transfer", label: "Bank Transfer" },
  { value: "cash", label: "Cash" },
  { value: "other", label: "Other manual method" },
];

const planCode = (capacity: Capacity) => `semester_offering_${capacity}` as const;
const formatDate = (value: string) => new Date(value).toLocaleDateString();
const formatMoney = (minor: number, currency: string) => {
  try {
    return new Intl.NumberFormat("en", { style: "currency", currency, maximumFractionDigits: 2 }).format(minor / 100);
  } catch {
    return `${(minor / 100).toLocaleString()} ${currency}`;
  }
};

function offeringIsForSale(offering: SemesterOffering, now = Date.now()) {
  return offering.status === "active"
    && new Date(offering.startsAt).getTime() <= now
    && new Date(offering.endsAt).getTime() > now
    && (!offering.salesOpenAt || new Date(offering.salesOpenAt).getTime() <= now)
    && (!offering.salesCloseAt || new Date(offering.salesCloseAt).getTime() > now)
    && offering.includedCourseCount > 0;
}

function studentMatchesOffering(student: AdminStudentListItem, offering: SemesterOffering) {
  return student.platform?.platformCode?.trim().toLowerCase() === offering.brand.code.trim().toLowerCase()
    && student.academicInstitutionId === offering.institution.id
    && student.academicLevelId === offering.academicLevel.id
    && student.academicSemesterId === offering.academicSemester.id;
}

function unavailableReason(offering: SemesterOffering, now = Date.now()) {
  if (offering.status !== "active") return `Offering is ${offering.status}.`;
  if (new Date(offering.startsAt).getTime() > now) return "Offering term has not started.";
  if (new Date(offering.endsAt).getTime() <= now) return "Offering term has ended.";
  if (offering.salesOpenAt && new Date(offering.salesOpenAt).getTime() > now) return "Sales have not opened.";
  if (offering.salesCloseAt && new Date(offering.salesCloseAt).getTime() <= now) return "Sales have closed.";
  if (offering.includedCourseCount < 1) return "Offering has no included Courses.";
  return "Unavailable for purchase.";
}

export function PurchaseFlow({ brand, mode = "admin", onInstructorOrderCreated }: { brand: BrandFilter; mode?: "admin" | "instructor"; onInstructorOrderCreated?: (order: { orderId: string }) => void }) {
  const [params, setParams] = useSearchParams();
  const navigate = useNavigate();
  const autoOpenHandled = useRef(false);
  const [open, setOpen] = useState(false);
  const [capacity, setCapacity] = useState<Capacity>(1);
  const [step, setStep] = useState<Step>(1);
  const [students, setStudents] = useState<AdminStudentListItem[]>([]);
  const [offerings, setOfferings] = useState<SemesterOffering[]>([]);
  const [selectedStudentIds, setSelectedStudentIds] = useState<string[]>([]);
  const [selectedOfferingId, setSelectedOfferingId] = useState("");
  const [offeringDetail, setOfferingDetail] = useState<SemesterOffering | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<SemesterOfferingPaymentMethod>("bank_transfer");
  const [paymentReference, setPaymentReference] = useState("");
  const [paymentEvidenceNote, setPaymentEvidenceNote] = useState("");
  const [priceConfirmed, setPriceConfirmed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [mutating, setMutating] = useState(false);
  const [error, setError] = useState("");
  const [studentSearch, setStudentSearch] = useState("");

  const close = useCallback(() => {
    if (mutating) return;
    setOpen(false);
    setError("");
  }, [mutating]);

  const startPurchase = useCallback(async (nextCapacity: Capacity, preselectedStudentId?: string | null) => {
    setCapacity(nextCapacity);
    setStep(1);
    setSelectedStudentIds(preselectedStudentId ? [preselectedStudentId] : []);
    setSelectedOfferingId("");
    setOfferingDetail(null);
    setPaymentMethod("bank_transfer");
    setPaymentReference("");
    setPaymentEvidenceNote("");
    setPriceConfirmed(false);
    setStudentSearch("");
    setError("");
    setOpen(true);
    setLoading(true);
    try {
      const [studentRows, offeringResult] = await Promise.all(mode === "instructor"
        ? [listInstructorStudents(), listInstructorSemesterOfferings()] as const
        : [listAllAdminStudents(brand), listSemesterOfferings(brand === "all" ? {} : { brand })] as const);
      setStudents(studentRows);
      setOfferings(offeringResult.items);
    } catch (cause) {
      setError(extractApiErrorMessage(cause, "Purchase options could not be loaded."));
    } finally {
      setLoading(false);
    }
  }, [brand, mode]);

  const autoStart = params.get("startPurchase") === "1";
  const autoStudentId = params.get("purchaseStudent");
  const rawCapacity = Number(params.get("capacity"));
  const autoCapacity: Capacity = rawCapacity === 3 || rawCapacity === 5 ? rawCapacity : 1;
  useEffect(() => {
    if (!autoStart || autoOpenHandled.current) return;
    autoOpenHandled.current = true;
    void startPurchase(autoCapacity, autoStudentId);
    const clean = new URLSearchParams(params);
    clean.delete("startPurchase");
    clean.delete("purchaseStudent");
    clean.delete("capacity");
    setParams(clean, { replace: true });
  }, [autoCapacity, autoStart, autoStudentId, params, setParams, startPurchase]);

  const selectedStudents = useMemo(
    () => selectedStudentIds.map((id) => students.find((student) => student.id === id)).filter((student): student is AdminStudentListItem => Boolean(student)),
    [selectedStudentIds, students],
  );
  const selectedOffering = offeringDetail?.id === selectedOfferingId
    ? offeringDetail
    : offerings.find((offering) => offering.id === selectedOfferingId) ?? null;
  const compatibleOfferings = useMemo(() => offerings.filter((offering) =>
    selectedStudents.length > 0 && selectedStudents.every((student) => studentMatchesOffering(student, offering))), [offerings, selectedStudents]);
  const eligibleStudents = useMemo(() => students.filter((student) => {
    const statusAllowed = student.status === "active" || student.status === "pending";
    // Student eligibility is academic/brand compatibility. Saleability is a
    // separate Offering state and must not hide valid persisted Students from
    // the first wizard step when an Offering is still draft or closed.
    const hasCompatibleOffering = offerings.some((offering) => studentMatchesOffering(student, offering));
    return statusAllowed && !isAdminTestStudentName(student.displayName) && hasCompatibleOffering;
  }), [students, offerings]);
  const hasSaleableOfferingForEligibleStudents = useMemo(() => offerings.some((offering) =>
    offeringIsForSale(offering) && eligibleStudents.some((student) => studentMatchesOffering(student, offering))), [eligibleStudents, offerings]);
  const compatibleStudents = useMemo(() => {
    const query = studentSearch.trim().toLocaleLowerCase();
    return eligibleStudents.filter((student) => !query
      || `${toEnglishStudentName(student.displayName)} ${student.academicInstitution ?? ""}`.toLocaleLowerCase().includes(query));
  }, [eligibleStudents, studentSearch]);
  const orderTotalMinor = selectedOffering ? selectedOffering.priceMinor * capacity : 0;
  const validOrderTotal = Number.isSafeInteger(orderTotalMinor) && orderTotalMinor > 0;
  const currentPlan = plans.find((plan) => plan.capacity === capacity)!;

  const toggleStudent = (studentId: string) => {
    setSelectedStudentIds((current) => {
      if (current.includes(studentId)) return current.filter((id) => id !== studentId);
      if (current.length >= capacity) return current;
      return [...current, studentId];
    });
    setSelectedOfferingId("");
    setOfferingDetail(null);
    setPriceConfirmed(false);
  };

  const chooseOffering = async (offering: SemesterOffering) => {
    if (!offeringIsForSale(offering)) return;
    setSelectedOfferingId(offering.id);
    setOfferingDetail(null);
    setPriceConfirmed(false);
    setError("");
    try {
      setOfferingDetail(mode === "instructor" ? await getInstructorSemesterOffering(offering.id) : await getSemesterOffering(offering.id));
    } catch (cause) {
      setError(extractApiErrorMessage(cause, "Offering details could not be loaded."));
    }
  };

  const createOrder = async () => {
    if (!selectedOffering || !validOrderTotal || !priceConfirmed || selectedStudentIds.length < 1 || selectedStudentIds.length > capacity
      || selectedStudents.length !== selectedStudentIds.length
      || selectedStudents.some((student) => !compatibleStudents.some((candidate) => candidate.id === student.id))) return;
    setMutating(true);
    setError("");
    try {
      const input: CreateSemesterOfferingOrderInput = {
        semesterOfferingId: selectedOffering.id,
        planCode: planCode(capacity),
        selectedStudentProfileIds: selectedStudentIds,
        paymentMethod,
        ...(paymentReference.trim() ? { paymentReference: paymentReference.trim() } : {}),
        ...(paymentEvidenceNote.trim() ? { paymentEvidenceNote: paymentEvidenceNote.trim() } : {}),
      };
      const order = mode === "instructor"
        ? await createInstructorPurchaseRequest(input)
        : await createSemesterOfferingOrder(input);
      if (order.status !== "pending_review") throw new Error("The server did not return a pending-review Order.");
      setOpen(false);
      if (mode === "instructor") onInstructorOrderCreated?.({ orderId: order.orderId });
      else navigate(`/admin/payments?payment=${encodeURIComponent(order.orderId)}`);
    } catch (cause) {
      setError(extractApiErrorMessage(cause, "The manual payment Order could not be created."));
    } finally {
      setMutating(false);
    }
  };

  const canContinue = step === 1
    ? selectedStudentIds.length > 0 && selectedStudentIds.length <= capacity && selectedStudents.length === selectedStudentIds.length
      && selectedStudents.every((student) => compatibleStudents.some((candidate) => candidate.id === student.id))
    : step === 2
      ? Boolean(selectedOffering && offeringDetail?.id === selectedOffering.id && offeringIsForSale(selectedOffering))
      : step === 3
        ? Boolean(selectedOffering && validOrderTotal && priceConfirmed)
        : Boolean(selectedOffering && validOrderTotal && priceConfirmed);

  const next = () => {
    if (!canContinue) return;
    if (step < 4) setStep((current) => (current + 1) as Step);
    else void createOrder();
  };

  return <>
    <section className="admin-v2__table-card admin-v2__plans" aria-labelledby="admin-v2-plans-title">
      <header>
        <div><h2 id="admin-v2-plans-title">{mode === "instructor" ? "Student purchase options" : "Plans &amp; Packages"}</h2><p>{mode === "instructor" ? "Submit the selected plan for Super Admin payment review." : "Each purchase is tied to one real Semester Offering."}</p></div>
      </header>
      <div className="admin-v2__plan-grid">
        {plans.map((plan) => {
          const Icon = plan.icon;
          const priceCopy = "Price set by the selected Offering";
          return <article key={plan.capacity} className={plan.capacity === 1 ? "is-featured" : ""}>
            <span className="admin-v2__plan-icon"><Icon size={17} aria-hidden="true" /></span>
            <div className="admin-v2__plan-title"><h3>{plan.name}</h3>{plan.capacity === 1 && <small>STANDARD</small>}</div>
            <p>{plan.capacity} Seat{plan.capacity === 1 ? "" : "s"} · {plan.description}</p>
            <strong>{plan.capacity}<small> seat{plan.capacity === 1 ? "" : "s"}</small></strong>
            <ul>
              <li><Check size={13} />Access to included courses in the selected Offering</li>
              <li><Check size={13} />{priceCopy}</li>
              {plan.capacity > 1 && <li><Check size={13} />Friend pricing is eligibility-based, never automatic</li>}
            </ul>
            <button type="button" onClick={() => void startPurchase(plan.capacity)}>{mode === "instructor" ? "Prepare request" : "Start purchase"}</button>
          </article>;
        })}
      </div>
    </section>

    {open && <Drawer
      title={mode === "instructor" ? "Prepare student purchase" : "Create manual-payment Order"}
      subtitle={`${currentPlan.name} · ${capacity} Seat${capacity === 1 ? "" : "s"} · access activates only after Super Admin payment approval`}
      onClose={close}
      footer={<FormActions>
        {step > 1 && <button type="button" className="admin-v2__button" disabled={mutating} onClick={() => setStep((current) => (current - 1) as Step)}><ChevronLeft size={14} /> Back</button>}
        <button type="button" className="admin-v2__button" disabled={mutating} onClick={close}>Cancel</button>
        <button type="button" className="admin-v2__button is-primary" disabled={mutating || loading || !canContinue} onClick={next}>
          {mutating ? "Creating…" : step === 4 ? mode === "instructor" ? "Submit for payment review" : "Create pending-review Order" : "Continue"}{step < 4 && <ChevronRight size={14} />}
        </button>
      </FormActions>}
    >
      <div className="admin-v2__purchase-steps" aria-label="Purchase steps">
        {["Students", "Offering", "Payment", "Review"].map((label, index) => <span key={label} className={step === index + 1 ? "is-active" : step > index + 1 ? "is-complete" : ""}><i>{step > index + 1 ? <Check size={11} /> : index + 1}</i>{label}</span>)}
      </div>
      {error && <div className="admin-v2__purchase-error" role="alert">{error}</div>}
      {loading && <p className="admin-v2__purchase-status" role="status">Loading compatible Students and Semester Offerings…</p>}

      {!loading && step === 1 && <div className="admin-v2__purchase-step">
        <h3>Select Students</h3>
        <p>Choose one to {capacity} Students. The backend verifies every Student’s brand and academic placement against the selected Offering.</p>
        {eligibleStudents.length > 0 && !hasSaleableOfferingForEligibleStudents && <div className="admin-v2__inline-notice" role="status">{mode === "instructor" ? "Your students are listed, but no active purchase Offering contains only courses assigned to you." : "Compatible Students are shown from persisted records, but no matching Semester Offering is currently open for purchase. Activate a compatible Offering in Manage Semester Offerings before continuing."}</div>}
        <FormField label="Plan capacity" wide><select value={capacity} onChange={(event) => {
          const value = Number(event.target.value) as Capacity;
          if (selectedStudentIds.length > value) { setError("Remove Students before selecting a smaller capacity."); return; }
          setCapacity(value); setPriceConfirmed(false); setError("");
        }}><option value={1}>Individual · 1 Seat</option><option value={3}>Team · 3 Seats</option><option value={5}>Group · 5 Seats</option></select></FormField>
        <label className="admin-v2__search admin-v2__purchase-search"><span className="admin-v2__sr-only">Search Students</span><UserRound size={14} /><input value={studentSearch} onChange={(event) => setStudentSearch(event.target.value)} placeholder="Search Students…" /></label>
        <div className="admin-v2__purchase-students" role="group" aria-label="Select Students">
          {compatibleStudents.map((student) => {
            const checked = selectedStudentIds.includes(student.id);
            const fullName = student.displayName ?? "Student";
            return <label key={student.id} className={checked ? "is-selected" : ""}>
              <input type="checkbox" checked={checked} disabled={!checked && selectedStudentIds.length >= capacity} onChange={() => toggleStudent(student.id)} />
              <span><strong>{fullName}</strong><small>{student.academicInstitution ?? "Institution unavailable"} · {student.academicLevel ?? "Level unavailable"} · {student.academicSemester ?? "Semester unavailable"}</small></span>
              <small>{student.platform?.platformDisplayName ?? "Brand"}</small>
            </label>;
          })}
          {!eligibleStudents.length && <p className="admin-v2__empty">No active or provisioned non-test Students match a persisted Semester Offering for this Brand and academic placement.</p>}
          {eligibleStudents.length > 0 && !compatibleStudents.length && <p className="admin-v2__empty">No eligible Students match this search.</p>}
        </div>
        <p className="admin-v2__purchase-count">{selectedStudentIds.length} of {capacity} maximum selected. A larger package is charged at its full capacity even if not all Seats are assigned yet.</p>
      </div>}

      {!loading && step === 2 && <div className="admin-v2__purchase-step">
        <h3>Choose a Semester Offering</h3>
        <p>Only persisted Offerings compatible with every selected Student can be purchased. Draft, closed, future, expired, or empty Offerings cannot be selected.</p>
        <div className="admin-v2__purchase-offerings">
          {compatibleOfferings.map((offering) => {
            const available = offeringIsForSale(offering);
            const selected = offering.id === selectedOfferingId;
            return <button type="button" key={offering.id} className={selected ? "is-selected" : ""} disabled={!available} onClick={() => void chooseOffering(offering)}>
              <span><strong>{offering.title}</strong><small>{offering.institution.name} · Year {offering.academicLevel.number} · Semester {offering.academicSemester.number}</small></span>
              <BrandBadge brand={offering.brand.code as "medway" | "elite" | "nexus"} />
              <small>{formatDate(offering.startsAt)} → {formatDate(offering.endsAt)}</small>
              <small>{offering.includedCourseCount} included Course{offering.includedCourseCount === 1 ? "" : "s"} · {formatMoney(offering.priceMinor, offering.currency)} / student</small>
              {!available && <em>{unavailableReason(offering)}</em>}
            </button>;
          })}
          {!compatibleOfferings.length && <p className="admin-v2__empty">No Semester Offering matches the selected Students’ Brand and academic placement.</p>}
        </div>
        {selectedOffering && <section className="admin-v2__purchase-included"><h4><BookOpen size={14} /> Included courses/modules</h4>{offeringDetail?.includedCourses?.filter((course) => !course.removedAt).map((course) => <span key={course.courseId}>{course.title}</span>) ?? <span>{selectedOffering.includedCourseCount} included Course{selectedOffering.includedCourseCount === 1 ? "" : "s"} returned by the server.</span>}</section>}
      </div>}

      {!loading && step === 3 && selectedOffering && <div className="admin-v2__purchase-step">
        <h3>Confirm price and manual payment</h3>
        <p>Order pricing comes from the selected Offering. Payment is reviewed manually; entering a reference or note never activates access.</p>
        <div className="admin-v2__purchase-price"><span>Standard Offering price</span><strong>{formatMoney(selectedOffering.priceMinor, selectedOffering.currency)} <small>/ student / Seat</small></strong><span>Capacity charge · {capacity} × {formatMoney(selectedOffering.priceMinor, selectedOffering.currency)}</span><strong>{formatMoney(orderTotalMinor, selectedOffering.currency)}</strong></div>
        {capacity > 1 && <p className="admin-v2__purchase-pricing-note">Capacity does not automatically qualify a purchase for a discount. The Order amount comes from the selected Offering’s persisted price.</p>}
        <FormField label="Manual payment method" wide><select value={paymentMethod} onChange={(event) => setPaymentMethod(event.target.value as SemesterOfferingPaymentMethod)}>{methods.map((method) => <option key={method.value} value={method.value}>{method.label}</option>)}</select></FormField>
        <FormField label="Payment reference (optional)" wide><input value={paymentReference} onChange={(event) => setPaymentReference(event.target.value)} maxLength={500} placeholder="Enter only a real reference supplied by the payer" /></FormField>
        <FormField label="Payment note / evidence description (optional)" wide><textarea value={paymentEvidenceNote} onChange={(event) => setPaymentEvidenceNote(event.target.value)} maxLength={1000} placeholder="Record truthful payment details; private evidence upload is not available here." /></FormField>
        <label className="admin-v2__purchase-confirm"><input type="checkbox" checked={priceConfirmed} onChange={(event) => setPriceConfirmed(event.target.checked)} /><span>I confirm the displayed amount and understand this Order remains pending review until an authorized Admin verifies payment.</span></label>
      </div>}

      {!loading && step === 4 && selectedOffering && <div className="admin-v2__purchase-step">
        <h3>Review Order</h3>
        <div className="admin-v2__purchase-review">
          <div><small>Plan</small><strong>{currentPlan.name} · {capacity} Seat{capacity === 1 ? "" : "s"}</strong></div>
          <div><small>Offering</small><strong>{selectedOffering.title}</strong><span>{selectedOffering.brand.name} · {selectedOffering.institution.name} · Year {selectedOffering.academicLevel.number} · Semester {selectedOffering.academicSemester.number}</span></div>
          <div><small>Term</small><strong>{formatDate(selectedOffering.startsAt)} → {formatDate(selectedOffering.endsAt)}</strong></div>
          <div><small>Students</small><strong>{selectedStudents.map((student) => student.displayName ?? "Student").join(", ")}</strong></div>
          <div><small>Manual payment</small><strong>{methods.find((method) => method.value === paymentMethod)?.label}</strong><span>{paymentReference.trim() ? `Reference: ${paymentReference.trim()}` : "No reference supplied"}</span></div>
          <div><small>Order total</small><strong>{formatMoney(orderTotalMinor, selectedOffering.currency)}</strong></div>
        </div>
        <p className="admin-v2__purchase-pending-note"><Layers3 size={14} />The Order will be created as Pending Review. No Subscription, Seat entitlement, or AccessGrant is activated until the Super Admin approves the payment.</p>
      </div>}
    </Drawer>}
  </>;
}

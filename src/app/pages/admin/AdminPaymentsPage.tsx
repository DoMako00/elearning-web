import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useOutletContext } from "react-router-dom";
import { AdminSideDrawer } from "../../../features/admin/components/AdminSideDrawer";
import {
  Activity,
  BookOpen,
  ChevronRight,
  CreditCard,
  ShieldCheck,
  UsersRound,
  Wallet,
} from "lucide-react";
import {
  createAdminApiFromEnvironment,
  type AdminBrandContext,
  type AdminStudentListItem,
} from "../../../features/admin/api";
import { brandToPlatform } from "../../../features/admin/hooks/useAdminBrand";
import {
  WorkspaceBadge,
  WorkspaceCard,
  WorkspaceFields,
  WorkspaceInspector,
  WorkspaceState,
} from "../../../features/admin/components/AdminWorkspacePrimitives";
import {
  approveManualSubscriptionOrder,
  createManualSubscriptionOrder,
  listBrandCourses,
  listManualSubscriptionOrders,
  listManualSubscriptionPlans,
  rejectManualSubscriptionOrder,
  type BrandCourseOption,
  type ManualPlanCode,
  type ManualSubscriptionOrder,
  type ManualSubscriptionPlan,
} from "../../../features/admin/api/adminOperationsApi";
import {
  adminDeliveryRequest,
  catalogueBrandAccessPath,
  type CatalogueBrand,
} from "../../../features/admin/api/adminDelivery.http";
import {
  clientRequestId,
  request,
  date,
  SourceLabel,
  Toolbar,
  Metrics,
} from "../../../features/admin/components/AdminWorkspace";

export function AdminPaymentsPage() {
  const [createOrderOpen, setCreateOrderOpen] = useState(false);
  const { brand } = useOutletContext<{
    brand?: AdminBrandContext;
    availableBrands: readonly AdminBrandContext[];
  }>();
  const api = useMemo(createAdminApiFromEnvironment, []);
  const [plans, setPlans] = useState<readonly ManualSubscriptionPlan[]>([]);
  const [orders, setOrders] = useState<readonly ManualSubscriptionOrder[]>([]);
  const [students, setStudents] = useState<readonly AdminStudentListItem[]>([]);
  const [courses, setCourses] = useState<readonly BrandCourseOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [revision, setRevision] = useState(0);
  const [reviewReason, setReviewReason] = useState("");
  const [reviewTarget, setReviewTarget] = useState<{
    readonly order: ManualSubscriptionOrder;
    readonly action: "approve" | "reject";
  } | null>(null);
  const [orderSearch, setOrderSearch] = useState("");
  const [orderStatus, setOrderStatus] = useState("all");
  const [selectedOrderId, setSelectedOrderId] = useState("");
  const savingLock = useRef(false);
  const pendingOperationKeys = useRef(new Map<string, string>());
  const [orderForm, setOrderForm] = useState<{
    studentProfileId: string;
    planCode: ManualPlanCode;
    courseIds: string[];
    pricePerStudent: string;
    paymentMethod: "bank_transfer" | "cash" | "wallet" | "other";
    paymentReference: string;
    paymentEvidenceNote: string;
  }>({
    studentProfileId: "",
    planCode: "oct10_four_subjects_individual",
    courseIds: [],
    pricePerStudent: "",
    paymentMethod: "bank_transfer",
    paymentReference: "",
    paymentEvidenceNote: "",
  });
  const activeBrand = brand;
  const platform = useMemo(
    () => (activeBrand ? brandToPlatform(activeBrand) : undefined),
    [activeBrand],
  );
  const selectedPlan = plans.find((plan) => plan.code === orderForm.planCode);
  useEffect(() => {
    let active = true;
    if (!activeBrand || !platform) {
      setLoading(false);
      setPlans([]);
      setOrders([]);
      setStudents([]);
      setCourses([]);
      return;
    }
    setLoading(true);
    setOrders([]);
    setPlans([]);
    setStudents([]);
    setCourses([]);
    setSelectedOrderId("");
    setReviewTarget(null);
    setCreateOrderOpen(false);
    setMessage(null);
    setError(null);
    const load = async () => {
      const [brandRows, planItems, orderItems, studentResponse] =
        await Promise.all([
          adminDeliveryRequest<CatalogueBrand[]>(catalogueBrandAccessPath),
          listManualSubscriptionPlans(),
          listManualSubscriptionOrders(activeBrand.brandCode),
          api.searchStudents({
            ...request(platform),
            pagination: { page: 1, pageSize: 100 },
          }),
        ]);
      const apiBrand = brandRows.find(
        (item) => item.code === activeBrand.brandCode,
      );
      if (!apiBrand)
        throw new Error(
          "This brand is not available for the current Admin account.",
        );
      if (!("data" in studentResponse)) {
        throw new Error(studentResponse.error.message);
      }
      const courseItems = await listBrandCourses(apiBrand.id);
      if (!active) return;
      setPlans(planItems);
      setOrders(orderItems);
      setStudents(studentResponse.data);
      setCourses(courseItems.filter((course) => course.status === "published"));
    };
    void load()
      .catch((cause: unknown) => {
        if (active)
          setError(
            cause instanceof Error
              ? cause.message
              : "Payment orders could not be loaded.",
          );
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [activeBrand, api, platform, revision]);
  const refresh = () => setRevision((value) => value + 1);
  const pending = orders.filter(
    (order) => order.status === "pending_review",
  ).length;
  const visibleOrders = orders.filter((order) => {
    const query = orderSearch.trim().toLowerCase();
    const searchText = [
      order.studentName,
      order.planCode,
      order.status,
      order.paymentMethod,
      ...(order.courses ?? []).map(
        (course) => course.title + " " + course.code,
      ),
    ]
      .join(" ")
      .toLowerCase();
    return (
      (orderStatus === "all" || order.status === orderStatus) &&
      (!query || searchText.includes(query))
    );
  });
  const selectedOrder = orders.find((order) => order.id === selectedOrderId);
  const toggleCourse = (courseId: string) => {
    setOrderForm((current) => ({
      ...current,
      courseIds: current.courseIds.includes(courseId)
        ? current.courseIds.filter((id) => id !== courseId)
        : [...current.courseIds, courseId],
    }));
  };
  async function submitOrder(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!activeBrand || !selectedPlan || savingLock.current) return;
    savingLock.current = true;
    setMessage(null);
    setError(null);
    setSaving(true);
    try {
      const configuredPrice = selectedPlan.requiresManualPrice
        ? Number(orderForm.pricePerStudent)
        : selectedPlan.pricePerStudent;
      if (!configuredPrice || configuredPrice < 1) {
        throw new Error("Enter a valid price for this order.");
      }
      const payload = {
        studentProfileId: orderForm.studentProfileId,
        brandCode: activeBrand.brandCode,
        planCode: orderForm.planCode,
        courseIds: orderForm.courseIds,
        pricePerStudent: configuredPrice,
        paymentMethod: orderForm.paymentMethod,
        paymentReference: orderForm.paymentReference.trim(),
        paymentEvidenceNote: orderForm.paymentEvidenceNote.trim(),
      };
      const signature = "create-order:" + JSON.stringify(payload);
      const idempotencyKey =
        pendingOperationKeys.current.get(signature) ?? clientRequestId();
      pendingOperationKeys.current.set(signature, idempotencyKey);
      await createManualSubscriptionOrder(payload, idempotencyKey);
      pendingOperationKeys.current.delete(signature);
      setMessage(
        "Manual order created. Review the supplied payment evidence before approving it.",
      );
      setCreateOrderOpen(false);
      setOrderForm((current) => ({
        ...current,
        courseIds: [],
        paymentReference: "",
        paymentEvidenceNote: "",
      }));
      refresh();
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : "The order could not be created.",
      );
    } finally {
      savingLock.current = false;
      setSaving(false);
    }
  }
  async function review(orderId: string, action: "approve" | "reject") {
    if (savingLock.current || !reviewReason.trim()) return;
    savingLock.current = true;
    setMessage(null);
    setError(null);
    setSaving(true);
    const normalizedReason = reviewReason.trim();
    const signature =
      "review-order:" + action + ":" + orderId + ":" + normalizedReason;
    const idempotencyKey =
      pendingOperationKeys.current.get(signature) ?? clientRequestId();
    pendingOperationKeys.current.set(signature, idempotencyKey);
    try {
      if (action === "approve") {
        await approveManualSubscriptionOrder(
          orderId,
          normalizedReason,
          idempotencyKey,
        );
        setMessage(
          "Order approved. Subscription, grants, and enrollments were refreshed from the backend.",
        );
      } else {
        await rejectManualSubscriptionOrder(
          orderId,
          normalizedReason,
          idempotencyKey,
        );
        setMessage("Order rejected and refreshed from the backend.");
      }
      pendingOperationKeys.current.delete(signature);
      setReviewReason("");
      setReviewTarget(null);
      refresh();
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : "The order review could not be completed.",
      );
    } finally {
      savingLock.current = false;
      setSaving(false);
    }
  }
  if (!activeBrand) {
    return (
      <section
        className="admin-page admin-workspace-page admin-subscriptions-live"
        aria-label="Manual payment review"
      >
        <SourceLabel preview={false} label="Select a brand" />
        <WorkspaceCard title="Choose a brand context">
          <p>
            Select Medway, Elite, or Nexus to review commercial records and
            create an order.
          </p>
        </WorkspaceCard>
      </section>
    );
  }
  return (
    <section
      className="admin-page admin-workspace-page admin-subscriptions-live"
      aria-label="Manual payment review"
    >
      <SourceLabel preview={false} label={activeBrand.brandDisplayName} />
      <Metrics
        values={[
          {
            title: "Pending orders",
            value: loading || error ? "—" : pending,
            icon: Activity,
          },
          {
            title: "Approved orders",
            value:
              loading || error
                ? "—"
                : orders.filter((order) => order.status === "approved").length,
            icon: UsersRound,
          },
          {
            title: "Rejected orders",
            value:
              loading || error
                ? "—"
                : orders.filter((order) => order.status === "rejected").length,
            icon: BookOpen,
          },
          {
            title: "Orders in this context",
            value: loading || error ? "—" : orders.length,
            icon: Wallet,
          },
        ]}
      />
      {message && (
        <div className="admin-workspace-inline-state" role="status">
          <ShieldCheck aria-hidden="true" />
          <div>
            <h3>Done</h3>
            <p>{message}</p>
          </div>
        </div>
      )}
      {error && (
        <div className="admin-workspace-inline-state" role="alert">
          <Activity aria-hidden="true" />
          <div>
            <h3>Action needed</h3>
            <p>{error}</p>
            <button type="button" onClick={refresh}>
              Retry
            </button>
          </div>
        </div>
      )}
      <div className="admin-workspace-context">
        <span>Create an order, then review the payment evidence.</span>
        <button
          type="button"
          disabled={loading || saving}
          onClick={() => {
            setError(null);
            setCreateOrderOpen(true);
          }}
        >
          Create manual order
        </button>
      </div>
      <AdminSideDrawer
        open={createOrderOpen}
        eyebrow={activeBrand.brandDisplayName + " · Manual orders"}
        title="Create subscription order"
        dismissible={!saving}
        onClose={() => setCreateOrderOpen(false)}
      >
        <form
          className="admin-workspace-form"
          onSubmit={submitOrder}
          aria-busy={saving}
        >
          {error && <p role="alert">{error}</p>}
          <label>
            Student
            <select
              required
              value={orderForm.studentProfileId}
              onChange={(event) =>
                setOrderForm((current) => ({
                  ...current,
                  studentProfileId: event.target.value,
                }))
              }
            >
              <option value="">Select student</option>
              {students.map((student) => (
                <option key={student.id} value={student.id}>
                  {student.displayName ??
                    student.emailMasked ??
                    "Student record"}
                </option>
              ))}
            </select>
          </label>
          <label>
            Plan
            <select
              value={orderForm.planCode}
              onChange={(event) =>
                setOrderForm((current) => ({
                  ...current,
                  planCode: event.target.value as ManualPlanCode,
                  courseIds: [],
                }))
              }
            >
              {plans.map((plan) => (
                <option key={plan.code} value={plan.code}>
                  {plan.title}
                </option>
              ))}
            </select>
          </label>
          {selectedPlan?.requiresManualPrice && (
            <label>
              Price per student
              <input
                required
                type="number"
                min={1}
                value={orderForm.pricePerStudent}
                onChange={(event) =>
                  setOrderForm((current) => ({
                    ...current,
                    pricePerStudent: event.target.value,
                  }))
                }
              />
            </label>
          )}
          <label>
            Payment method
            <select
              value={orderForm.paymentMethod}
              onChange={(event) =>
                setOrderForm((current) => ({
                  ...current,
                  paymentMethod: event.target
                    .value as typeof current.paymentMethod,
                }))
              }
            >
              <option value="bank_transfer">Bank transfer</option>
              <option value="wallet">Wallet</option>
              <option value="cash">Cash</option>
              <option value="other">Other</option>
            </select>
          </label>
          <label>
            Payment reference
            <input
              required
              value={orderForm.paymentReference}
              onChange={(event) =>
                setOrderForm((current) => ({
                  ...current,
                  paymentReference: event.target.value,
                }))
              }
            />
          </label>
          <label>
            Payment evidence note
            <textarea
              required
              value={orderForm.paymentEvidenceNote}
              onChange={(event) =>
                setOrderForm((current) => ({
                  ...current,
                  paymentEvidenceNote: event.target.value,
                }))
              }
            />
          </label>
          <div
            className="admin-workspace-course-picker"
            aria-label="Select courses"
          >
            {courses.map((course) => (
              <label key={course.id}>
                <input
                  type="checkbox"
                  checked={orderForm.courseIds.includes(course.id)}
                  onChange={() => toggleCourse(course.id)}
                />{" "}
                <span>
                  {course.title}
                  <small>{course.code}</small>
                </span>
              </label>
            ))}
          </div>
          <p className="admin-workspace-note">
            Selected {orderForm.courseIds.length} of{" "}
            {selectedPlan?.subjectCount ?? 0} course(s). Approval creates the
            subscription, effective grants, and enrollment records
            transactionally.
          </p>
          <button
            type="submit"
            disabled={
              loading ||
              saving ||
              !orderForm.studentProfileId ||
              !selectedPlan ||
              orderForm.courseIds.length !== selectedPlan.subjectCount
            }
          >
            Create pending order
          </button>
        </form>
      </AdminSideDrawer>
      <div className="admin-commercial-split">
        <WorkspaceCard
          title="Manual payment review"
          aside={
            <button
              type="button"
              disabled={loading || saving}
              onClick={refresh}
            >
              Refresh
            </button>
          }
        >
          <Toolbar
            search={orderSearch}
            onSearch={setOrderSearch}
            status={orderStatus}
            onStatus={setOrderStatus}
            statuses={[
              "pending_review",
              "approved",
              "rejected",
              "cancelled",
              "active",
              "expired",
            ]}
            label="manual orders"
          />
          <div className="admin-workspace-table-wrap">
            <table className="admin-workspace-table">
              <caption className="admin-sr-only">
                Manual subscription orders
              </caption>
              <thead>
                <tr>
                  <th>Student</th>
                  <th>Plan</th>
                  <th>Courses</th>
                  <th>Payment method</th>
                  <th>Status</th>
                  <th>Submitted</th>
                  <th>Details</th>
                </tr>
              </thead>
              <tbody>
                {visibleOrders.map((order) => (
                  <tr
                    key={order.id}
                    className={
                      selectedOrderId === order.id ? "is-selected" : ""
                    }
                  >
                    <td>
                      <button
                        type="button"
                        onClick={() => setSelectedOrderId(order.id)}
                      >
                        {order.studentName ?? "Student"}
                      </button>
                    </td>
                    <td>{order.planCode.replaceAll("_", " ")}</td>
                    <td>{order.courseCount}</td>
                    <td>
                      {order.paymentMethod?.replaceAll("_", " ") ??
                        "Not recorded"}
                    </td>
                    <td>
                      <WorkspaceBadge value={order.status} />
                    </td>
                    <td>{date(order.createdAt)}</td>
                    <td>
                      <button
                        type="button"
                        onClick={() => setSelectedOrderId(order.id)}
                      >
                        Review details
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {!visibleOrders.length && (
            <WorkspaceState
              loading={loading}
              error={Boolean(error)}
              title={
                orders.length
                  ? "No orders match these filters"
                  : "No manual orders"
              }
              onRetry={refresh}
            />
          )}
        </WorkspaceCard>
        <WorkspaceInspector
          title="Verification details"
          selected={!!selectedOrder}
          onClose={() => setSelectedOrderId("")}
        >
          {selectedOrder && (
            <>
              <div className="admin-workspace-receipt">
                <CreditCard aria-hidden="true" />
                <strong>{selectedOrder.studentName ?? "Student"}</strong>
                <WorkspaceBadge value={selectedOrder.status} />
              </div>
              <WorkspaceFields
                fields={[
                  ["Order", selectedOrder.id],
                  ["Brand", selectedOrder.brandCode],
                  ["Plan", selectedOrder.planCode.replaceAll("_", " ")],
                  ["Capacity", selectedOrder.capacity],
                  ["Courses", selectedOrder.courseCount],
                  [
                    "Payment method",
                    selectedOrder.paymentMethod?.replaceAll("_", " ") ??
                      "Not recorded",
                  ],
                  ["Submitted", date(selectedOrder.createdAt)],
                  ["Reviewed", date(selectedOrder.reviewedAt)],
                  [
                    "Review reason",
                    selectedOrder.reviewReason ?? "Not recorded",
                  ],
                ]}
              />
              <section className="admin-inspector-section">
                <h3>Payment evidence</h3>
                <p>
                  Amount, receipt, payment reference, and reviewer identity are
                  not included in the current order read model. Confirm the
                  original payment evidence before approval.
                </p>
              </section>
              {selectedOrder.status === "pending_review" && (
                <div className="admin-workspace-actions">
                  <button
                    type="button"
                    className="is-primary"
                    disabled={saving}
                    onClick={() => {
                      setReviewReason("");
                      setReviewTarget({
                        order: selectedOrder,
                        action: "approve",
                      });
                    }}
                  >
                    Approve payment
                  </button>
                  <button
                    type="button"
                    className="is-danger"
                    disabled={saving}
                    onClick={() => {
                      setReviewReason("");
                      setReviewTarget({
                        order: selectedOrder,
                        action: "reject",
                      });
                    }}
                  >
                    Reject payment
                  </button>
                </div>
              )}
              <Link className="admin-inspector-link" to="/admin/subscriptions">
                View subscription lifecycle <ChevronRight aria-hidden="true" />
              </Link>
            </>
          )}
        </WorkspaceInspector>
      </div>
      {reviewTarget && (
        <AdminSideDrawer
          open
          eyebrow="Manual order review"
          title={
            reviewTarget.action === "approve" ? "Approve order" : "Reject order"
          }
          dismissible={!saving}
          onClose={() => setReviewTarget(null)}
        >
          <form
            className="admin-workspace-form"
            onSubmit={(event) => {
              event.preventDefault();
              void review(reviewTarget.order.id, reviewTarget.action);
            }}
          >
            <dl className="admin-workspace-fields">
              <div>
                <dt>Student</dt>
                <dd>{reviewTarget.order.studentName ?? "Student"}</dd>
              </div>
              <div>
                <dt>Brand</dt>
                <dd>{reviewTarget.order.brandCode}</dd>
              </div>
              <div>
                <dt>Plan</dt>
                <dd>{reviewTarget.order.planCode.replaceAll("_", " ")}</dd>
              </div>
              <div>
                <dt>Courses</dt>
                <dd>{reviewTarget.order.courseCount}</dd>
              </div>
              <div>
                <dt>Payment method</dt>
                <dd>
                  {reviewTarget.order.paymentMethod?.replaceAll("_", " ") ??
                    "Not recorded"}
                </dd>
              </div>
            </dl>
            <p>
              {reviewTarget.action === "approve"
                ? "Approval creates the subscription and its access records. Confirm the payment evidence before continuing."
                : "Reject this pending order. No subscription or course access will be created."}
            </p>
            <label>
              Review reason
              <textarea
                required
                maxLength={500}
                value={reviewReason}
                disabled={saving}
                onChange={(event) => setReviewReason(event.target.value)}
                placeholder="Record why this order is approved or rejected"
              />
            </label>
            {error && <p role="alert">{error}</p>}
            <div className="admin-workspace-actions">
              <button
                type="button"
                disabled={saving}
                onClick={() => setReviewTarget(null)}
              >
                Keep pending
              </button>
              <button type="submit" disabled={saving || !reviewReason.trim()}>
                {saving
                  ? "Saving…"
                  : reviewTarget.action === "approve"
                    ? "Confirm approval"
                    : "Confirm rejection"}
              </button>
            </div>
          </form>
        </AdminSideDrawer>
      )}
    </section>
  );
}

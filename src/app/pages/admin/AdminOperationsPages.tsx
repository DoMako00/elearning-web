import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useOutletContext } from "react-router-dom";
import { AdminSideDrawer } from "../../../features/admin/components/AdminSideDrawer";
import {
  Activity,
  BookOpen,
  ChevronRight,
  CreditCard,
  FileText,
  KeyRound,
  Laptop,
  Layers3,
  Search,
  ShieldCheck,
  UsersRound,
  Wallet,
  Video,
  type LucideIcon,
} from "lucide-react";
import {
  createAdminApiFromEnvironment,
  getAdminDataSource,
  type AdminApi,
  type AdminBrandContext,
  type AdminBrandView,
  type AdminPaymentListItem,
  type AdminSecurityEventItem,
  type AdminStudentListItem,
  type AdminPlatformContext,
  type AdminListResponse,
} from "../../../features/admin/api";
import { brandToPlatform } from "../../../features/admin/hooks/useAdminBrand";
import {
  WorkspaceBadge,
  WorkspaceCard,
  WorkspaceFields,
  WorkspaceInspector,
  WorkspaceMetric,
  WorkspaceState,
} from "../../../features/admin/components/AdminWorkspacePrimitives";
import {
  approveManualSubscriptionOrder,
  cancelAdminSubscription,
  createManualSubscriptionOrder,
  listAdminSubscriptions,
  listBrandCourses,
  listManualSubscriptionOrders,
  listManualSubscriptionPlans,
  rejectManualSubscriptionOrder,
  type AdminSubscription,
  type BrandCourseOption,
  type ManualPlanCode,
  type ManualSubscriptionOrder,
  type ManualSubscriptionPlan,
} from "../../../features/admin/api/adminOperationsApi";
import {
  adminDeliveryRequest,
  catalogueBrandAccessPath,
  deliveryCoursePath,
  type DeliveryChapter,
  type DeliveryCourse,
  type DeliveryLesson,
  type DeliveryResource,
  type CatalogueBrand,
} from "../../../features/admin/api/adminDelivery.http";
import { AdminSubscriptionDetailDialog } from "../../../features/admin/subscriptions/AdminSubscriptionDetailDialog";
import { AdminLessonMediaManagement } from "../../../features/admin/courses/AdminLessonMediaManagement";
import { AdminLessonMediaUpload } from "../../../features/admin/courses/AdminLessonMediaUpload";

type ReadResult<T> = AdminListResponse<T> | { success: false };
type ListLoader<T> = (
  api: AdminApi,
  platform: AdminPlatformContext,
) => Promise<ReadResult<T>>;
const clientRequestId = () =>
  typeof crypto !== "undefined" && typeof crypto.randomUUID === "function"
    ? crypto.randomUUID()
    : `admin-${Date.now()}-${Math.random().toString(36).slice(2)}`;
const request = (platform: AdminPlatformContext) => ({
  platform,
  correlationId: clientRequestId(),
  pagination: { page: 1, pageSize: 50 },
});
const readPayments: ListLoader<AdminPaymentListItem> = (api, platform) =>
  api.listPayments(request(platform));
const readSecurity: ListLoader<AdminSecurityEventItem> = (api, platform) =>
  api.listSecurityEvents(request(platform));
const date = (value?: string | null) =>
  value
    ? new Date(value).toLocaleDateString("en-GB", {
        day: "numeric",
        month: "short",
        year: "numeric",
      })
    : "Unavailable";
const money = (amount: number, currency: string) =>
  new Intl.NumberFormat("en", { style: "currency", currency }).format(amount);
const rowKey = (row: { id: string; platform: AdminPlatformContext }) =>
  `${row.platform.platformCode}:${row.id}`;

function useWorkspaceRecords<T>(load: ListLoader<T>) {
  const { brand, availableBrands } = useOutletContext<{
    brand?: AdminBrandContext;
    availableBrands: readonly AdminBrandContext[];
  }>();
  const api = useMemo(createAdminApiFromEnvironment, []);
  const [revision, setRevision] = useState(0);
  const scope = brand?.brandCode ?? "all";
  const [state, setState] = useState<{
    scope: string;
    rows: readonly T[];
    loading: boolean;
    error: boolean;
    total: number;
  }>({ scope, rows: [], loading: true, error: false, total: 0 });
  useEffect(() => {
    let active = true;
    setState({ scope, rows: [], loading: true, error: false, total: 0 });
    const targets = brand ? [brand] : availableBrands;
    void Promise.all(
      targets.map((target) => load(api, brandToPlatform(target))),
    )
      .then((responses) => {
        if (!active) return;
        // Never present partial brand results as a complete cross-brand total.
        if (
          !responses.length ||
          responses.some((response) => !("data" in response))
        ) {
          setState({ scope, rows: [], loading: false, error: true, total: 0 });
        } else {
          const lists = responses as AdminListResponse<T>[];
          setState({
            scope,
            rows: lists.flatMap((response) => response.data),
            loading: false,
            error: false,
            total: lists.reduce(
              (sum, response) => sum + response.pagination.totalItems,
              0,
            ),
          });
        }
      })
      .catch(() => {
        if (active)
          setState({ scope, rows: [], loading: false, error: true, total: 0 });
      });
    return () => {
      active = false;
    };
  }, [api, brand, availableBrands, scope, revision, load]);
  const current =
    state.scope === scope
      ? state
      : {
          scope,
          rows: [] as readonly T[],
          loading: true,
          error: false,
          total: 0,
        };
  return {
    ...current,
    preview: getAdminDataSource() === "mock",
    label: brand?.brandDisplayName ?? "All brands",
    retry: () => setRevision((value) => value + 1),
  };
}

function SourceLabel({ preview, label }: { preview: boolean; label: string }) {
  return (
    <div className="admin-workspace-context">
      <span>
        <ShieldCheck aria-hidden="true" />
        {label}
      </span>
      <span
        className={
          preview ? "admin-workspace-preview" : "admin-workspace-readonly"
        }
      >
        {preview ? "Local preview data · not production" : "Live API data"}
      </span>
    </div>
  );
}
function Toolbar({
  search,
  onSearch,
  statuses,
  status,
  onStatus,
  label,
}: {
  search: string;
  onSearch: (value: string) => void;
  statuses: readonly string[];
  status: string;
  onStatus: (value: string) => void;
  label: string;
}) {
  return (
    <div className="admin-workspace-toolbar">
      <label>
        <Search aria-hidden="true" />
        <span className="admin-sr-only">Search {label}</span>
        <input
          type="search"
          placeholder={`Search ${label}…`}
          value={search}
          onChange={(event) => onSearch(event.target.value)}
        />
      </label>
      <select
        aria-label={`Filter ${label} by status`}
        value={status}
        onChange={(event) => onStatus(event.target.value)}
      >
        <option value="all">All statuses</option>
        {statuses.map((item) => (
          <option key={item} value={item}>
            {item.replaceAll("_", " ")}
          </option>
        ))}
      </select>
      <button type="button" disabled title="Export is not connected">
        Export
      </button>
    </div>
  );
}
function Metrics({
  values,
}: {
  values: readonly {
    title: string;
    value: string | number;
    icon: LucideIcon;
    note?: string;
  }[];
}) {
  return (
    <div className="admin-workspace-metrics">
      {values.map((item) => (
        <WorkspaceMetric
          key={item.title}
          {...item}
          note={item.note ?? "Within loaded records"}
        />
      ))}
    </div>
  );
}

export function AdminPaymentsPage() {
  const data = useWorkspaceRecords(readPayments);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");
  const [selectedId, setSelectedId] = useState("");
  const rows = data.rows.filter(
    (row) =>
      (status === "all" || row.status === status) &&
      [row.method, row.platform.platformDisplayName, row.status]
        .join(" ")
        .toLowerCase()
        .includes(search.toLowerCase()),
  );
  const selected = rows.find((row) => rowKey(row) === selectedId);
  const count = (value: string) =>
    data.loading || data.error
      ? "—"
      : data.rows.filter((row) => row.status === value).length;
  return (
    <section
      className="admin-page admin-workspace-page"
      aria-label="Payments management"
    >
      <SourceLabel {...data} />
      <Metrics
        values={[
          {
            title: "Confirmed payments",
            value: count("confirmed"),
            icon: Wallet,
          },
          {
            title: "Pending review",
            value: count("pending_review"),
            icon: CreditCard,
          },
          { title: "Failed payments", value: count("failed"), icon: Activity },
          {
            title: "Reversed payments",
            value: count("reversed"),
            icon: CreditCard,
          },
        ]}
      />
      <div className="admin-workspace-split">
        <WorkspaceCard
          title="Transactions"
          aside={
            <span className="admin-workspace-readonly">Payment records</span>
          }
        >
          <Toolbar
            search={search}
            onSearch={setSearch}
            status={status}
            onStatus={setStatus}
            statuses={[
              "confirmed",
              "pending_review",
              "initiated",
              "failed",
              "reversed",
            ]}
            label="payments"
          />
          <div className="admin-workspace-table-wrap">
            <table className="admin-workspace-table">
              <caption className="admin-sr-only">Payment transactions</caption>
              <thead>
                <tr>
                  <th>Payment method</th>
                  <th>Brand</th>
                  <th>Amount</th>
                  <th>Status</th>
                  <th>Confirmed</th>
                  <th>Details</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr
                    key={rowKey(row)}
                    className={selected === row ? "is-selected" : ""}
                  >
                    <td>
                      <span className="admin-workspace-cell">
                        <CreditCard aria-hidden="true" />
                        {row.method.replaceAll("_", " ")}
                      </span>
                    </td>
                    <td>{row.platform.platformDisplayName}</td>
                    <td>
                      <strong>{money(row.amount, row.currency)}</strong>
                    </td>
                    <td>
                      <WorkspaceBadge value={row.status} />
                    </td>
                    <td>{date(row.confirmedAt)}</td>
                    <td>
                      <button
                        type="button"
                        aria-label={`View ${row.platform.platformDisplayName} ${row.method} payment of ${money(row.amount, row.currency)}`}
                        onClick={() => setSelectedId(rowKey(row))}
                      >
                        View
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {!rows.length && (
            <WorkspaceState
              {...data}
              title={
                search || status !== "all"
                  ? "No matching payments"
                  : "No payments yet"
              }
              onRetry={data.retry}
            />
          )}
          <footer className="admin-workspace-table-footer">
            {data.error || data.loading
              ? "Totals unavailable"
              : `${rows.length} shown · ${data.total} records in this context`}
          </footer>
        </WorkspaceCard>
        <WorkspaceInspector title="Payment details" selected={!!selected}>
          {selected && (
            <>
              <div className="admin-workspace-receipt">
                <CreditCard aria-hidden="true" />
                <small>Payment amount</small>
                <strong>{money(selected.amount, selected.currency)}</strong>
                <WorkspaceBadge value={selected.status} />
              </div>
              <WorkspaceFields
                fields={[
                  ["Brand", selected.platform.platformDisplayName],
                  ["Method", selected.method.replaceAll("_", " ")],
                  ["Confirmed", date(selected.confirmedAt)],
                  ["Receipt", "Unavailable"],
                ]}
              />
              <div className="admin-workspace-actions">
                <button disabled type="button">
                  Review payment
                </button>
                <button disabled type="button">
                  Download receipt
                </button>
                <p>Payment review and receipt actions are not connected.</p>
              </div>
            </>
          )}
        </WorkspaceInspector>
      </div>
    </section>
  );
}

export function AdminSubscriptionsPage() {
  const [createOrderOpen, setCreateOrderOpen] = useState(false);
  const { brand } = useOutletContext<{
    brand?: AdminBrandContext;
    availableBrands: readonly AdminBrandContext[];
  }>();
  const api = useMemo(createAdminApiFromEnvironment, []);
  const [plans, setPlans] = useState<readonly ManualSubscriptionPlan[]>([]);
  const [orders, setOrders] = useState<readonly ManualSubscriptionOrder[]>([]);
  const [subscriptions, setSubscriptions] = useState<
    readonly AdminSubscription[]
  >([]);
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
  const [cancelTarget, setCancelTarget] = useState<AdminSubscription | null>(
    null,
  );
  const [cancelReason, setCancelReason] = useState("");
  const [orderSearch, setOrderSearch] = useState("");
  const [orderStatus, setOrderStatus] = useState("all");
  const [subscriptionSearch, setSubscriptionSearch] = useState("");
  const [subscriptionStatus, setSubscriptionStatus] = useState("all");
  const [selectedSubscriptionId, setSelectedSubscriptionId] = useState("");
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
      setSubscriptions([]);
      setStudents([]);
      setCourses([]);
      return;
    }

    setLoading(true);
    setError(null);
    const load = async () => {
      const [
        brandRows,
        planItems,
        orderItems,
        subscriptionItems,
        studentResponse,
      ] = await Promise.all([
        adminDeliveryRequest<CatalogueBrand[]>(catalogueBrandAccessPath),
        listManualSubscriptionPlans(),
        listManualSubscriptionOrders(activeBrand.brandCode),
        listAdminSubscriptions(activeBrand.brandCode),
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
      setSubscriptions(subscriptionItems);
      setStudents(studentResponse.data);
      setCourses(courseItems.filter((course) => course.status === "published"));
    };

    void load()
      .catch((cause: unknown) => {
        if (active)
          setError(
            cause instanceof Error
              ? cause.message
              : "Subscription data could not be loaded.",
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
  const activeSubscriptionCount = subscriptions.filter(
    (item) => item.status === "active",
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
  const visibleSubscriptions = subscriptions.filter((subscription) => {
    const query = subscriptionSearch.trim().toLowerCase();
    const searchText = [
      subscription.studentName,
      subscription.status,
      ...subscription.courses.map((course) => course.title + " " + course.code),
    ]
      .join(" ")
      .toLowerCase();
    return (
      (subscriptionStatus === "all" ||
        subscription.status === subscriptionStatus) &&
      (!query || searchText.includes(query))
    );
  });

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

  async function cancelSubscription() {
    if (!cancelTarget || !cancelReason.trim() || savingLock.current) return;
    savingLock.current = true;
    setSaving(true);
    setError(null);
    setMessage(null);
    const normalizedReason = cancelReason.trim();
    const signature =
      "cancel-subscription:" + cancelTarget.id + ":" + normalizedReason;
    const idempotencyKey =
      pendingOperationKeys.current.get(signature) ?? clientRequestId();
    pendingOperationKeys.current.set(signature, idempotencyKey);
    try {
      await cancelAdminSubscription(
        cancelTarget.id,
        normalizedReason,
        idempotencyKey,
      );
      pendingOperationKeys.current.delete(signature);
      setSelectedSubscriptionId("");
      setCancelTarget(null);
      setCancelReason("");
      setMessage(
        "Subscription cancellation completed. The backend has revoked its effective grants and ended the associated enrollment.",
      );
      refresh();
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : "The subscription could not be cancelled.",
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
        aria-label="Subscriptions management"
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
      aria-label="Subscriptions management"
    >
      <SourceLabel preview={false} label={activeBrand.brandDisplayName} />
      <Metrics
        values={[
          {
            title: "Pending orders",
            value: loading ? "—" : pending,
            icon: Activity,
          },
          {
            title: "Active subscriptions",
            value: loading ? "—" : activeSubscriptionCount,
            icon: UsersRound,
          },
          {
            title: "Published courses",
            value: loading ? "—" : courses.length,
            icon: BookOpen,
          },
          {
            title: "Manual plans",
            value: loading ? "—" : plans.length,
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

      <WorkspaceCard
        title="Manual orders"
        aside={
          <button type="button" disabled={loading || saving} onClick={refresh}>
            Refresh
          </button>
        }
      >
        {plans.length > 0 && (
          <div className="admin-workspace-plans">
            {plans.map((plan) => (
              <article key={plan.code}>
                <span className="admin-workspace-metric__icon">
                  <UsersRound aria-hidden="true" />
                </span>
                <h3>{plan.title}</h3>
                <strong>
                  {plan.pricePerStudent
                    ? money(plan.pricePerStudent, plan.currency)
                    : "Price entered per order"}
                </strong>
                <p>{plan.description}</p>
                <WorkspaceBadge
                  value={`${plan.subjectCount} course${plan.subjectCount === 1 ? "" : "s"} · capacity ${plan.studentCount}`}
                />
              </article>
            ))}
          </div>
        )}
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
                <th>Review</th>
              </tr>
            </thead>
            <tbody>
              {visibleOrders.map((order) => (
                <tr key={order.id}>
                  <td>
                    <strong>{order.studentName ?? "Student"}</strong>
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
                  <td>
                    {order.status === "pending_review" ? (
                      <span className="admin-workspace-actions-inline">
                        <button
                          type="button"
                          disabled={saving}
                          onClick={() => {
                            setReviewReason("");
                            setReviewTarget({ order, action: "approve" });
                          }}
                        >
                          Approve
                        </button>
                        <button
                          type="button"
                          disabled={saving}
                          onClick={() => {
                            setReviewReason("");
                            setReviewTarget({ order, action: "reject" });
                          }}
                        >
                          Reject
                        </button>
                      </span>
                    ) : (
                      date(order.reviewedAt)
                    )}
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

      {reviewTarget && (
        <AdminSideDrawer
          open
          eyebrow="Manual order review"
          title={reviewTarget.action === "approve" ? "Approve order" : "Reject order"}
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
              <div><dt>Student</dt><dd>{reviewTarget.order.studentName ?? "Student"}</dd></div>
              <div><dt>Brand</dt><dd>{reviewTarget.order.brandCode}</dd></div>
              <div><dt>Plan</dt><dd>{reviewTarget.order.planCode.replaceAll("_", " ")}</dd></div>
              <div><dt>Courses</dt><dd>{reviewTarget.order.courseCount}</dd></div>
              <div><dt>Payment method</dt><dd>{reviewTarget.order.paymentMethod?.replaceAll("_", " ") ?? "Not recorded"}</dd></div>
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
              <button type="button" disabled={saving} onClick={() => setReviewTarget(null)}>
                Keep pending
              </button>
              <button type="submit" disabled={saving || !reviewReason.trim()}>
                {saving ? "Saving…" : reviewTarget.action === "approve" ? "Confirm approval" : "Confirm rejection"}
              </button>
            </div>
          </form>
        </AdminSideDrawer>
      )}

      <WorkspaceCard
        title="Subscriptions"
        aside={
          <span className="admin-workspace-readonly">
            Persisted status and access summary
          </span>
        }
      >
        <Toolbar
          search={subscriptionSearch}
          onSearch={setSubscriptionSearch}
          status={subscriptionStatus}
          onStatus={setSubscriptionStatus}
          statuses={["active", "cancelled", "expired"]}
          label="subscriptions"
        />
        <div className="admin-workspace-table-wrap">
          <table className="admin-workspace-table">
            <caption className="admin-sr-only">Subscriptions</caption>
            <thead>
              <tr>
                <th>Student</th>
                <th>Courses</th>
                <th>Term</th>
                <th>Grants</th>
                <th>Status</th>
                <th>Details</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {visibleSubscriptions.map((subscription) => (
                <tr key={subscription.id}>
                  <td>
                    <strong>{subscription.studentName ?? "Student"}</strong>
                  </td>
                  <td>
                    {subscription.courses
                      .map((course) => course.title)
                      .join(", ") || "No courses"}
                  </td>
                  <td>
                    {date(subscription.startsAt)} – {date(subscription.endsAt)}
                  </td>
                  <td>
                    {subscription.activeGrantCount} active ·{" "}
                    {subscription.revokedGrantCount} revoked
                  </td>
                  <td>
                    <WorkspaceBadge value={subscription.status} />
                  </td>
                  <td>
                    <button
                      type="button"
                      onClick={() => setSelectedSubscriptionId(subscription.id)}
                    >
                      View
                    </button>
                  </td>
                  <td>
                    {subscription.status === "active" ? (
                      <button
                        type="button"
                        disabled={saving}
                        onClick={() => {
                          setCancelTarget(subscription);
                          setCancelReason("");
                        }}
                      >
                        Cancel
                      </button>
                    ) : (
                      "—"
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {!visibleSubscriptions.length && (
          <WorkspaceState
            loading={loading}
            error={Boolean(error)}
            title={
              subscriptions.length
                ? "No subscriptions match these filters"
                : "No subscriptions"
            }
            onRetry={refresh}
          />
        )}
      </WorkspaceCard>

      {selectedSubscriptionId && (
        <AdminSubscriptionDetailDialog
          subscriptionId={selectedSubscriptionId}
          onClose={() => setSelectedSubscriptionId("")}
          onCancel={(subscription) => {
            setSelectedSubscriptionId("");
            setCancelTarget(subscription);
            setCancelReason("");
          }}
        />
      )}
      {cancelTarget && (
        <AdminSideDrawer
          open
          eyebrow="Subscription lifecycle"
          title="Cancel subscription"
          dismissible={!saving}
          onClose={() => setCancelTarget(null)}
        >
          <div className="admin-workspace-form" aria-busy={saving}>
            <p>
              This backend action also revokes sourced access grants and ends
              associated enrollment.
            </p>
            {error && <p role="alert">{error}</p>}
            <label>
              Cancellation reason
              <textarea
                required
                maxLength={500}
                value={cancelReason}
                onChange={(event) => setCancelReason(event.target.value)}
              />
            </label>
            <div className="admin-workspace-actions">
              <button
                type="button"
                disabled={saving}
                onClick={() => setCancelTarget(null)}
              >
                Keep subscription
              </button>
              <button
                type="button"
                disabled={saving || !cancelReason.trim()}
                onClick={() => void cancelSubscription()}
              >
                {saving ? "Cancelling…" : "Confirm cancellation"}
              </button>
            </div>
          </div>
        </AdminSideDrawer>
      )}
    </section>
  );
}

interface ContentCourseEntry {
  readonly course: DeliveryCourse;
  readonly brandLabel: string;
}

type ContentSelection =
  | { readonly kind: "course"; readonly id: string }
  | { readonly kind: "chapter"; readonly id: string }
  | { readonly kind: "lesson"; readonly id: string }
  | { readonly kind: "resource"; readonly id: string };

const contentSelectionKey = (selection: ContentSelection) => `${selection.kind}:${selection.id}`;

export function AdminContentPage() {
  const { brand, availableBrands } = useOutletContext<{
    brand?: AdminBrandContext;
    brandView: AdminBrandView;
    availableBrands: readonly AdminBrandContext[];
  }>();
  const targets = useMemo(() => brand ? [brand] : availableBrands, [brand, availableBrands]);
  const [courses, setCourses] = useState<readonly ContentCourseEntry[]>([]);
  const [selectedCourseKey, setSelectedCourseKey] = useState("");
  const [chapters, setChapters] = useState<readonly DeliveryChapter[]>([]);
  const [lessons, setLessons] = useState<readonly DeliveryLesson[]>([]);
  const [resources, setResources] = useState<readonly DeliveryResource[]>([]);
  const [selection, setSelection] = useState<ContentSelection>();
  const [loadingCourses, setLoadingCourses] = useState(true);
  const [loadingStructure, setLoadingStructure] = useState(false);
  const [error, setError] = useState("");
  const [revision, setRevision] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    setLoadingCourses(true);
    setError("");
    void Promise.all(targets.map(async (target) => {
      const rows = await adminDeliveryRequest<DeliveryCourse[]>(
        `/v1/admin/brands/${encodeURIComponent(target.brandId)}/courses`,
        { signal: controller.signal },
      );
      if (!Array.isArray(rows)) throw new Error("A brand course response is invalid.");
      return rows.map((course) => ({ course, brandLabel: target.brandDisplayName }));
    }))
      .then((groups) => {
        if (controller.signal.aborted) return;
        const next = groups.flat();
        setCourses(next);
        setSelectedCourseKey((current) => next.some((entry) => `${entry.course.brandId}:${entry.course.id}` === current)
          ? current
          : next[0] ? `${next[0].course.brandId}:${next[0].course.id}` : "");
      })
      .catch((cause: unknown) => {
        if (controller.signal.aborted) return;
        setCourses([]);
        setSelectedCourseKey("");
        setError(cause instanceof Error ? cause.message : "Courses could not be loaded.");
      })
      .finally(() => { if (!controller.signal.aborted) setLoadingCourses(false); });
    return () => controller.abort();
  }, [targets, revision]);

  const selectedEntry = courses.find((entry) => `${entry.course.brandId}:${entry.course.id}` === selectedCourseKey);
  const selectedCourse = selectedEntry?.course;

  useEffect(() => {
    if (!selectedCourse) {
      setChapters([]);
      setLessons([]);
      setResources([]);
      setSelection(undefined);
      setLoadingStructure(false);
      return;
    }
    const controller = new AbortController();
    const path = deliveryCoursePath(selectedCourse.brandId, selectedCourse.id);
    setLoadingStructure(true);
    setError("");
    void Promise.all([
      adminDeliveryRequest<DeliveryChapter[]>(path + "/chapters", { signal: controller.signal }),
      adminDeliveryRequest<DeliveryLesson[]>(path + "/lessons", { signal: controller.signal }),
      adminDeliveryRequest<DeliveryResource[]>(path + "/resources", { signal: controller.signal }),
    ])
      .then(([chapterRows, lessonRows, resourceRows]) => {
        if (controller.signal.aborted) return;
        if (![chapterRows, lessonRows, resourceRows].every(Array.isArray)) throw new Error("The course content response is invalid.");
        setChapters(chapterRows);
        setLessons(lessonRows);
        setResources(resourceRows);
        setSelection((current) => {
          const keys = new Set([
            ...chapterRows.map((item) => `chapter:${item.id}`),
            ...lessonRows.map((item) => `lesson:${item.id}`),
            ...resourceRows.map((item) => `resource:${item.id}`),
          ]);
          if (current && keys.has(contentSelectionKey(current))) return current;
          const firstResource = resourceRows[0];
          const firstLesson = lessonRows[0];
          const firstChapter = chapterRows[0];
          return firstResource ? { kind: "resource", id: firstResource.id }
            : firstLesson ? { kind: "lesson", id: firstLesson.id }
              : firstChapter ? { kind: "chapter", id: firstChapter.id }
                : { kind: "course", id: selectedCourse.id };
        });
      })
      .catch((cause: unknown) => {
        if (controller.signal.aborted) return;
        setChapters([]);
        setLessons([]);
        setResources([]);
        setError(cause instanceof Error ? cause.message : "Course content could not be loaded.");
      })
      .finally(() => { if (!controller.signal.aborted) setLoadingStructure(false); });
    return () => controller.abort();
  }, [selectedCourse]);

  const selectedChapter = selection?.kind === "chapter" ? chapters.find((item) => item.id === selection.id) : undefined;
  const selectedLesson = selection?.kind === "lesson" ? lessons.find((item) => item.id === selection.id) : undefined;
  const selectedResource = selection?.kind === "resource" ? resources.find((item) => item.id === selection.id) : undefined;
  const selectedResourceLesson = selectedResource ? lessons.find((item) => item.id === selectedResource.courseLessonId) : undefined;
  const selectedTitle = selectedResource?.title ?? selectedLesson?.title ?? selectedChapter?.title ?? selectedCourse?.title ?? "Select course content";
  const selectedStatus = selectedResource?.status ?? selectedLesson?.status ?? selectedChapter?.status ?? selectedCourse?.status ?? "";
  const selectedType = selectedResource?.resourceKind ?? (selectedLesson ? "lesson" : selectedChapter ? "chapter" : selectedCourse ? "course" : "");
  const courseBuilderUrl = selectedCourse ? `/admin/courses/${encodeURIComponent(selectedCourse.id)}/builder?brandId=${encodeURIComponent(selectedCourse.brandId)}` : "/admin/courses";

  return (
    <section className="admin-page admin-workspace-page admin-content-live" aria-label="Course content management">
      <div className="admin-content-live__toolbar">
        <div className="admin-content-live__summary"><strong>{courses.length}</strong><span>{courses.length === 1 ? "course" : "courses"} in this context</span></div>
        <span className="admin-content-live__context">{brand?.brandDisplayName ?? "All authorized brands"}</span>
        <Link to="/admin/courses" className="admin-content-live__link">Manage courses <ChevronRight aria-hidden="true" /></Link>
      </div>
      {error ? (
        <div className="admin-content-live__error" role="alert"><strong>Course content is unavailable</strong><p>{error}</p><button type="button" onClick={() => setRevision((value) => value + 1)}>Retry</button></div>
      ) : loadingCourses ? (
        <WorkspaceState loading title="Loading course content" />
      ) : !courses.length ? (
        <WorkspaceState title="No courses in this brand context" />
      ) : (
        <div className="admin-content-live__workspace">
          <WorkspaceCard title="Courses" className="admin-content-live__tree">
            <nav aria-label="Courses and content">
              {courses.map((entry) => {
                const key = `${entry.course.brandId}:${entry.course.id}`;
                return <button key={key} type="button" className={key === selectedCourseKey ? "is-selected" : ""} aria-pressed={key === selectedCourseKey} onClick={() => { setSelectedCourseKey(key); setSelection(undefined); }}>
                  <BookOpen aria-hidden="true" /><span><strong>{entry.course.title}</strong><small>{entry.brandLabel} · {entry.course.code}</small></span><WorkspaceBadge value={entry.course.status} />
                </button>;
              })}
            </nav>
          </WorkspaceCard>

          <WorkspaceCard title={selectedCourse?.title ?? "Course structure"} className="admin-content-live__outline" aside={<span className="admin-workspace-readonly">Live course structure</span>}>
            {loadingStructure ? <WorkspaceState loading title="Loading chapters, lessons, and resources" /> : selectedCourse && (
              <div className="admin-content-live__items">
                <div className="admin-content-live__course-summary"><span>{selectedEntry?.brandLabel}</span><strong>{selectedCourse.code}</strong><WorkspaceBadge value={selectedCourse.status} /></div>
                {chapters.map((chapter) => (
                  <section className="admin-content-live__chapter" key={chapter.id}>
                    <button type="button" className={selection?.kind === "chapter" && selection.id === chapter.id ? "is-selected" : ""} onClick={() => setSelection({ kind: "chapter", id: chapter.id })}><Layers3 aria-hidden="true" /><span><strong>{chapter.title}</strong><small>Chapter · {chapter.status}</small></span><WorkspaceBadge value={chapter.status} /></button>
                    {lessons.filter((lesson) => lesson.courseChapterId === chapter.id).map((lesson) => (
                      <div className="admin-content-live__lesson" key={lesson.id}>
                        <button type="button" className={selection?.kind === "lesson" && selection.id === lesson.id ? "is-selected" : ""} onClick={() => setSelection({ kind: "lesson", id: lesson.id })}><BookOpen aria-hidden="true" /><span><strong>{lesson.title}</strong><small>Lesson · {lesson.status}</small></span><WorkspaceBadge value={lesson.status} /></button>
                        {resources.filter((resource) => resource.courseLessonId === lesson.id).map((resource) => (
                          <button className={`admin-content-live__resource${selection?.kind === "resource" && selection.id === resource.id ? " is-selected" : ""}`} key={resource.id} type="button" onClick={() => setSelection({ kind: "resource", id: resource.id })}>
                            {resource.resourceKind === "video" ? <Video aria-hidden="true" /> : <FileText aria-hidden="true" />}
                            <span><strong>{resource.title}</strong><small>{resource.resourceKind.replaceAll("_", " ")}</small></span><WorkspaceBadge value={resource.status} />
                          </button>
                        ))}
                      </div>
                    ))}
                  </section>
                ))}
                {!chapters.length && <WorkspaceState title="No chapters yet" />}
              </div>
            )}
          </WorkspaceCard>

          <aside className="admin-content-live__inspector">
            <header><span>Selected content</span><WorkspaceBadge value={selectedStatus || "unavailable"} /></header>
            <div className="admin-content-live__identity"><span>{selectedType.replaceAll("_", " ") || "Content"}</span><h2>{selectedTitle}</h2><p>{selectedEntry?.brandLabel} · {selectedCourse?.code}</p></div>
            <dl>
              <div><dt>Status</dt><dd>{selectedStatus || "Unavailable"}</dd></div>
              <div><dt>Course</dt><dd>{selectedCourse?.title ?? "Unavailable"}</dd></div>
              <div><dt>Resource type</dt><dd>{selectedResource?.resourceKind ?? "—"}</dd></div>
              <div><dt>Course status</dt><dd>{selectedCourse?.status ?? "Unavailable"}</dd></div>
              {selectedResource && <div><dt>Media workflow</dt><dd>{selectedResource.status === "published" ? "Published to lesson" : "Needs media verification or publishing"}</dd></div>}
              <div><dt>Sort order</dt><dd>{selectedResource?.sortOrder ?? selectedLesson?.sortOrder ?? selectedChapter?.sortOrder ?? "—"}</dd></div>
            </dl>
            <div className="admin-content-live__action">
              {selectedResource && selectedResourceLesson && selectedCourse && (selectedResource.resourceKind === "video" || selectedResource.resourceKind === "document") ? (
                <>
                  <strong>Lesson media</strong>
                  <p>Course publication and lesson media publication are separate. This resource is <b>{selectedResource.status}</b>; the course is <b>{selectedCourse.status}</b>.</p>
                  {selectedResource.status === "published" ? (
                    <AdminLessonMediaManagement
                      key={selectedResource.id}
                      course={selectedCourse}
                      lessonId={selectedResourceLesson.id}
                      resource={selectedResource}
                      onChanged={() => setRevision((value) => value + 1)}
                    />
                  ) : (
                    <AdminLessonMediaUpload
                      key={selectedResource.id}
                      course={selectedCourse}
                      lessonId={selectedResourceLesson.id}
                      resource={selectedResource}
                      onPublished={() => setRevision((value) => value + 1)}
                    />
                  )}
                  <Link to={courseBuilderUrl}>Open course builder <ChevronRight aria-hidden="true" /></Link>
                </>
              ) : (
                <>
                  <Link to={courseBuilderUrl}>Open course builder <ChevronRight aria-hidden="true" /></Link>
                  <p>Select a video or PDF lesson resource to verify, publish, or withdraw its media here.</p>
                </>
              )}
            </div>
          </aside>
        </div>
      )}
    </section>
  );
}
export function AdminSecurityPage() {
  const data = useWorkspaceRecords(readSecurity);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");
  const [selectedId, setSelectedId] = useState("");
  const rows = data.rows.filter(
    (row) =>
      (status === "all" || row.severity === status) &&
      [row.eventType, row.platform.platformDisplayName]
        .join(" ")
        .toLowerCase()
        .includes(search.toLowerCase()),
  );
  const selected = rows.find((row) => rowKey(row) === selectedId);
  const count = (severity: string) =>
    data.loading || data.error
      ? "—"
      : data.rows.filter((row) => row.severity === severity).length;
  return (
    <section
      className="admin-page admin-workspace-page"
      aria-label="Security management"
    >
      <SourceLabel {...data} />
      <Metrics
        values={[
          {
            title: "Security events",
            value: data.loading || data.error ? "—" : data.rows.length,
            icon: ShieldCheck,
          },
          { title: "Warnings", value: count("warning"), icon: Activity },
          {
            title: "Critical events",
            value: count("critical"),
            icon: KeyRound,
          },
          {
            title: "Active sessions",
            value: "—",
            icon: Laptop,
            note: "Session totals unavailable",
          },
        ]}
      />
      <div className="admin-workspace-split">
        <div className="admin-workspace-stack">
          <WorkspaceCard
            title="Security activity"
            aside={
              <span className="admin-workspace-readonly">Event history</span>
            }
          >
            <Toolbar
              search={search}
              onSearch={setSearch}
              status={status}
              onStatus={setStatus}
              statuses={["info", "warning", "critical"]}
              label="security events"
            />
            <div className="admin-workspace-table-wrap">
              <table className="admin-workspace-table">
                <caption className="admin-sr-only">Security events</caption>
                <thead>
                  <tr>
                    <th>Event</th>
                    <th>Brand</th>
                    <th>Severity</th>
                    <th>Recorded</th>
                    <th>Details</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row) => (
                    <tr
                      key={rowKey(row)}
                      className={selected === row ? "is-selected" : ""}
                    >
                      <td>
                        <span className="admin-workspace-cell">
                          <ShieldCheck aria-hidden="true" />
                          <strong>{row.eventType.replaceAll("_", " ")}</strong>
                        </span>
                      </td>
                      <td>{row.platform.platformDisplayName}</td>
                      <td>
                        <WorkspaceBadge value={row.severity} />
                      </td>
                      <td>{date(row.occurredAt)}</td>
                      <td>
                        <button
                          type="button"
                          aria-label={`View ${row.eventType} event for ${row.platform.platformDisplayName}`}
                          onClick={() => setSelectedId(rowKey(row))}
                        >
                          View
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {!rows.length && (
              <WorkspaceState
                {...data}
                title={
                  search || status !== "all"
                    ? "No matching events"
                    : "No security events yet"
                }
                onRetry={data.retry}
              />
            )}
          </WorkspaceCard>
          <WorkspaceCard title="Devices & sessions">
            <div className="admin-workspace-table-wrap">
              <table className="admin-workspace-table">
                <caption className="admin-sr-only">
                  Devices and sessions availability
                </caption>
                <thead>
                  <tr>
                    <th>Device</th>
                    <th>Session</th>
                    <th>Last active</th>
                    <th>Status</th>
                  </tr>
                </thead>
              </table>
            </div>
            <div className="admin-workspace-inline-state">
              <Laptop aria-hidden="true" />
              <div>
                <h3>Session inventory unavailable</h3>
                <p>
                  Review available account-level device and session information
                  in Students.
                </p>
                <a href="/admin/students">Open Students →</a>
              </div>
            </div>
          </WorkspaceCard>
        </div>
        <div className="admin-workspace-stack">
          <WorkspaceInspector title="Event details" selected={!!selected}>
            {selected && (
              <WorkspaceFields
                fields={[
                  ["Event", selected.eventType.replaceAll("_", " ")],
                  ["Brand", selected.platform.platformDisplayName],
                  ["Severity", <WorkspaceBadge value={selected.severity} />],
                  ["Recorded", date(selected.occurredAt)],
                ]}
              />
            )}
          </WorkspaceInspector>
          <WorkspaceCard title="Security actions">
            <div className="admin-workspace-actions">
              <button type="button" disabled>
                Revoke sessions
              </button>
              <button type="button" disabled>
                Reset account access
              </button>
              <button type="button" disabled>
                Update security policy
              </button>
              <p>
                These actions are unavailable here. No security changes can be
                made from this screen.
              </p>
            </div>
          </WorkspaceCard>
        </div>
      </div>
    </section>
  );
}

import { useEffect, useRef, useState } from "react";
import { Link, useOutletContext } from "react-router-dom";
import { AdminSideDrawer } from "../../../features/admin/components/AdminSideDrawer";
import { Activity, CreditCard, ShieldCheck, UsersRound } from "lucide-react";
import { type AdminBrandContext } from "../../../features/admin/api";
import {
  WorkspaceBadge,
  WorkspaceCard,
  WorkspaceInspector,
  WorkspaceState,
} from "../../../features/admin/components/AdminWorkspacePrimitives";
import {
  cancelAdminSubscription,
  listAdminSubscriptions,
  listManualSubscriptionPlans,
  type AdminSubscription,
  type ManualSubscriptionPlan,
} from "../../../features/admin/api/adminOperationsApi";
import { AdminSubscriptionDetailDialog } from "../../../features/admin/subscriptions/AdminSubscriptionDetailDialog";
import {
  clientRequestId,
  date,
  money,
  SourceLabel,
  Toolbar,
  Metrics,
} from "../../../features/admin/components/AdminWorkspace";

export function AdminSubscriptionsPage() {
  const { brand: activeBrand } = useOutletContext<{
    brand?: AdminBrandContext;
  }>();
  const [plans, setPlans] = useState<readonly ManualSubscriptionPlan[]>([]);
  const [subscriptions, setSubscriptions] = useState<
    readonly AdminSubscription[]
  >([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [revision, setRevision] = useState(0);
  const [cancelTarget, setCancelTarget] = useState<AdminSubscription | null>(
    null,
  );
  const [cancelReason, setCancelReason] = useState("");
  const [subscriptionSearch, setSubscriptionSearch] = useState("");
  const [subscriptionStatus, setSubscriptionStatus] = useState("all");
  const [selectedSubscriptionId, setSelectedSubscriptionId] = useState("");
  const savingLock = useRef(false);
  const pendingOperationKeys = useRef(new Map<string, string>());
  useEffect(() => {
    let active = true;
    setSubscriptions([]);
    setPlans([]);
    setSelectedSubscriptionId("");
    setCancelTarget(null);
    setError(null);
    if (!activeBrand) {
      setLoading(false);
      return;
    }
    setLoading(true);
    void Promise.all([
      listManualSubscriptionPlans(),
      listAdminSubscriptions(activeBrand.brandCode),
    ])
      .then(([planItems, subscriptionItems]) => {
        if (active) {
          setPlans(planItems);
          setSubscriptions(subscriptionItems);
        }
      })
      .catch((cause: unknown) => {
        if (active)
          setError(
            cause instanceof Error
              ? cause.message
              : "Subscriptions could not be loaded.",
          );
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [activeBrand, revision]);
  const refresh = () => setRevision((value) => value + 1);
  const visibleSubscriptions = subscriptions.filter(
    (item) =>
      (subscriptionStatus === "all" || item.status === subscriptionStatus) &&
      [item.studentName, ...item.courses.map((course) => course.title)]
        .join(" ")
        .toLowerCase()
        .includes(subscriptionSearch.trim().toLowerCase()),
  );
  const count = (status: string) =>
    loading || error
      ? "—"
      : subscriptions.filter((item) => item.status === status).length;
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
  if (!activeBrand)
    return (
      <section className="admin-page">
        <WorkspaceCard title="Choose a brand context">
          <p>Select Medway, Elite, or Nexus to inspect subscriptions.</p>
        </WorkspaceCard>
      </section>
    );
  return (
    <section
      className="admin-page admin-workspace-page admin-subscriptions-live"
      aria-label="Subscription lifecycle"
    >
      <SourceLabel preview={false} label={activeBrand.brandDisplayName} />
      <Metrics
        values={[
          {
            title: "Subscriptions",
            value: loading || error ? "—" : subscriptions.length,
            icon: UsersRound,
          },
          { title: "Active", value: count("active"), icon: ShieldCheck },
          { title: "Expired", value: count("expired"), icon: Activity },
          { title: "Cancelled", value: count("cancelled"), icon: CreditCard },
        ]}
      />
      {message && (
        <p role="status" className="admin-workspace-note">
          {message}
        </p>
      )}
      {error && (
        <p role="alert" className="admin-workspace-note">
          {error}{" "}
          <button type="button" onClick={refresh}>
            Retry
          </button>
        </p>
      )}
      <div className="admin-commercial-split">
        <div className="admin-commercial-main">
          <WorkspaceCard
            title="Plans & capacity"
            aside={<Link to="/admin/payments">Create a manual order →</Link>}
          >
            <div className="admin-workspace-plans">
              {plans.map((plan) => (
                <article key={plan.code}>
                  <UsersRound aria-hidden="true" />
                  <h3>{plan.title}</h3>
                  <strong>
                    {plan.pricePerStudent
                      ? money(plan.pricePerStudent, plan.currency)
                      : "Price set per order"}
                  </strong>
                  <p>{plan.description}</p>
                  <WorkspaceBadge
                    value={`Capacity ${plan.studentCount} · ${plan.subjectCount} course${plan.subjectCount === 1 ? "" : "s"}`}
                  />
                </article>
              ))}
              {!plans.length && (
                <p>
                  {loading ? "Loading plans…" : "Plan information unavailable."}
                </p>
              )}
            </div>
          </WorkspaceCard>
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
                    <tr
                      key={subscription.id}
                      className={
                        subscription.id === selectedSubscriptionId
                          ? "is-selected"
                          : ""
                      }
                    >
                      <td>
                        <strong>{subscription.studentName ?? "Student"}</strong>
                      </td>
                      <td>
                        {subscription.courses
                          .map((course) => course.title)
                          .join(", ") || "No courses"}
                      </td>
                      <td>
                        {date(subscription.startsAt)} –{" "}
                        {date(subscription.endsAt)}
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
                          onClick={() =>
                            setSelectedSubscriptionId(subscription.id)
                          }
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
        </div>
        {selectedSubscriptionId ? (
          <AdminSubscriptionDetailDialog
            inline
            subscriptionId={selectedSubscriptionId}
            onClose={() => setSelectedSubscriptionId("")}
            onCancel={(subscription) => {
              setSelectedSubscriptionId("");
              setCancelTarget(subscription);
              setCancelReason("");
            }}
          />
        ) : (
          <WorkspaceInspector title="Subscription details" selected={false} />
        )}
      </div>
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

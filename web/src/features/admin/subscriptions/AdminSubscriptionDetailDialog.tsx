import { useEffect, useState } from "react";
import { AdminSideDrawer } from "../components/AdminSideDrawer";
import {
  getAdminSubscription,
  type AdminSubscription,
} from "../api/adminOperationsApi";

function displayDate(value: string | null): string {
  if (!value) return "Not set";
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime())
    ? "Not available"
    : parsed.toLocaleDateString();
}

interface AdminSubscriptionDetailDialogProps {
  readonly subscriptionId: string;
  readonly onClose: () => void;
  readonly onCancel: (subscription: AdminSubscription) => void;
}

export function AdminSubscriptionDetailDialog({
  subscriptionId,
  onClose,
  onCancel,
}: AdminSubscriptionDetailDialogProps) {
  const [subscription, setSubscription] = useState<AdminSubscription>();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    setError("");
    setSubscription(undefined);

    void getAdminSubscription(subscriptionId, controller.signal)
      .then((record) => {
        if (!controller.signal.aborted) setSubscription(record);
      })
      .catch((cause: unknown) => {
        if (!controller.signal.aborted) {
          setError(
            cause instanceof Error
              ? cause.message
              : "Subscription details could not be loaded.",
          );
        }
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });

    return () => controller.abort();
  }, [subscriptionId]);

  return (
    <AdminSideDrawer
      open
      eyebrow="Student access"
      title="Subscription details"
      onClose={onClose}
    >
      <section>
        {loading && <p role="status">Loading subscription details…</p>}
        {error && <p role="alert">{error}</p>}
        {subscription && (
          <>
            <dl className="admin-workspace-detail-list">
              <div>
                <dt>Student</dt>
                <dd>{subscription.studentName ?? "Student record"}</dd>
              </div>
              <div>
                <dt>Brand</dt>
                <dd>{subscription.brandCode}</dd>
              </div>
              <div>
                <dt>Status</dt>
                <dd>{subscription.status.replaceAll("_", " ")}</dd>
              </div>
              <div>
                <dt>Capacity</dt>
                <dd>
                  {subscription.capacity} seat
                  {subscription.capacity === 1 ? "" : "s"}
                </dd>
              </div>
              <div>
                <dt>Starts</dt>
                <dd>{displayDate(subscription.startsAt)}</dd>
              </div>
              <div>
                <dt>Ends</dt>
                <dd>{displayDate(subscription.endsAt)}</dd>
              </div>
              <div>
                <dt>Access grants</dt>
                <dd>
                  {subscription.activeGrantCount} active ·{" "}
                  {subscription.revokedGrantCount} revoked
                </dd>
              </div>
              <div>
                <dt>Courses</dt>
                <dd>
                  {subscription.courses
                    .map((course) => course.title)
                    .join(", ") || "No courses"}
                </dd>
              </div>
            </dl>
            {subscription.status === "active" && (
              <button type="button" onClick={() => onCancel(subscription)}>
                Cancel subscription
              </button>
            )}
          </>
        )}
      </section>
    </AdminSideDrawer>
  );
}

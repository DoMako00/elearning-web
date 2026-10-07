import { useEffect, useState } from "react";
import {
  listAdminSubscriptions,
  type AdminSubscription,
} from "../api/adminOperationsApi";
import type { AdminBrandCode } from "../api";

function displayDate(value: string | null): string {
  if (!value) return "Not set";
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? "Not available"
    : date.toLocaleDateString();
}

export function AdminStudentSubscriptionsPanel({
  brandCode,
  studentProfileId,
}: Readonly<{
  brandCode: AdminBrandCode;
  studentProfileId: string;
}>) {
  const [subscriptions, setSubscriptions] = useState<
    readonly AdminSubscription[]
  >([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let current = true;
    setLoading(true);
    setError("");

    void listAdminSubscriptions(brandCode, undefined, studentProfileId)
      .then((items) => {
        if (current) setSubscriptions(items);
      })
      .catch((cause: unknown) => {
        if (current) {
          setError(
            cause instanceof Error
              ? cause.message
              : "Subscription details could not be loaded.",
          );
        }
      })
      .finally(() => {
        if (current) setLoading(false);
      });

    return () => {
      current = false;
    };
  }, [brandCode, studentProfileId]);

  return (
    <section aria-label="Student subscriptions">
      <h3>Subscriptions</h3>
      {loading && <p role="status">Loading subscription records…</p>}
      {error && <p role="alert">{error}</p>}
      {!loading && !error && subscriptions.length === 0 && (
        <p>No subscriptions are recorded for this Student.</p>
      )}
      {subscriptions.map((subscription) => (
        <article className="admin-students-fields" key={subscription.id}>
          <div>
            <strong>{subscription.status.replaceAll("_", " ")}</strong>
            <small>
              {displayDate(subscription.startsAt)} –{" "}
              {displayDate(subscription.endsAt)}
            </small>
            <small>
              {subscription.courses.map((course) => course.title).join(", ") ||
                "No courses"}
            </small>
            <small>
              {subscription.activeGrantCount} active grants ·{" "}
              {subscription.revokedGrantCount} revoked
            </small>
          </div>
        </article>
      ))}
    </section>
  );
}

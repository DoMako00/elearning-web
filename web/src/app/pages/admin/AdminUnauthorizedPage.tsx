import { ShieldAlert } from "lucide-react";

/** Reserved for the future backend-authenticated admin guard. */
export function AdminUnauthorizedPage() {
  return <main className="admin-unauthorized" aria-labelledby="admin-unauthorized-title"><ShieldAlert aria-hidden="true" /><h1 id="admin-unauthorized-title">Admin access is unavailable</h1><p>This view will be enabled when trusted backend admin authorization is connected.</p></main>;
}
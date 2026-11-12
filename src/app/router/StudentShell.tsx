import { StudentLayout } from "../../features/student/pages/StudentLayout";
import { StudentRouteProviders } from "../providers/StudentRouteProviders";
import { StudentScopeProvider } from "../../features/student/scope/StudentScopeProvider";
import "./student-dashboard.css";
import "./student-shell.css";

/* Everything the signed-in student area needs, loaded as one chunk after authentication so the sign-in page stays light. */
export default function StudentShell() {
  return <StudentScopeProvider><StudentRouteProviders><StudentLayout /></StudentRouteProviders></StudentScopeProvider>;
}

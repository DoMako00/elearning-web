import type { RouteObject } from "react-router-dom";
import { Navigate } from "react-router-dom";
import { AccessGrantedPage } from "../../features/auth/pages/AccessGrantedPage";
import { AccessPendingPage } from "../../features/auth/pages/AccessPendingPage";
import { SignInPage } from "../../features/auth/pages/SignInPage";

export const publicRoutes: RouteObject[] = [
  { path: "/auth/sign-in", element: <SignInPage /> },
  // Student accounts are provisioned by Admin; public signup/password auth is not supported.
  { path: "/auth/register", element: <Navigate to="/auth/sign-in" replace /> },
  // Legacy self-registration and phone-OTP onboarding are intentionally not valid auth flows.
  { path: "/auth/verify-otp", element: <Navigate to="/auth/sign-in" replace /> },
  { path: "/auth/complete-profile", element: <Navigate to="/auth/sign-in" replace /> },
  { path: "/auth/choose-brand", element: <Navigate to="/auth/sign-in" replace /> },
  { path: "/auth/access-pending", element: <AccessPendingPage /> },
  { path: "/auth/access-granted", element: <AccessGrantedPage /> },
];

import type { RouteObject } from "react-router-dom";
import { Navigate } from "react-router-dom";
import { SignInPage } from "../../features/auth/pages/SignInPage";

export const publicRoutes: RouteObject[] = [
  { path: "/auth/sign-in", element: <SignInPage /> },
  // Student accounts are provisioned by Admin; public signup/password auth is not supported.
  { path: "/auth/register", element: <Navigate to="/auth/sign-in" replace /> },
  // Legacy self-registration and phone-OTP onboarding are intentionally not valid auth flows.
  { path: "/auth/verify-otp", element: <Navigate to="/auth/sign-in" replace /> },
  { path: "/auth/complete-profile", element: <Navigate to="/auth/sign-in" replace /> },
  { path: "/auth/choose-brand", element: <Navigate to="/auth/sign-in" replace /> },
  // Legacy self-signup/access-preview pages are not valid production identity or
  // entitlement flows. Return users to the real provisioned-account sign-in.
  { path: "/auth/access-pending", element: <Navigate to="/auth/sign-in" replace /> },
  { path: "/auth/access-granted", element: <Navigate to="/auth/sign-in" replace /> },
];

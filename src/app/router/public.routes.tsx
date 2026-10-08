import type { RouteObject } from "react-router-dom";
import { AccessGrantedPage } from "../../features/auth/pages/AccessGrantedPage";
import { AccessPendingPage } from "../../features/auth/pages/AccessPendingPage";
import { ChooseBrandPage } from "../../features/auth/pages/ChooseBrandPage";
import { CompleteProfilePage } from "../../features/auth/pages/CompleteProfilePage";
import { SignInPage } from "../../features/auth/pages/SignInPage";
import { AccountActivationPage } from "../../features/auth/pages/AccountActivationPage";
import { GoogleAuthCallbackPage } from "../../features/auth/pages/GoogleAuthCallbackPage";
import { RegisterPage } from "../../features/auth/pages/RegisterPage";
import { VerifyOtpPage } from "../../features/auth/pages/VerifyOtpPage";

export const publicRoutes: RouteObject[] = [
  { path: "/auth/sign-in", element: <SignInPage /> },
  { path: "/auth/activate", element: <AccountActivationPage /> },
  { path: "/auth/callback", element: <GoogleAuthCallbackPage /> },
  { path: "/auth/register", element: <RegisterPage /> },
  { path: "/auth/verify-otp", element: <VerifyOtpPage /> },
  { path: "/auth/complete-profile", element: <CompleteProfilePage /> },
  { path: "/auth/choose-brand", element: <ChooseBrandPage /> },
  { path: "/auth/access-pending", element: <AccessPendingPage /> },
  { path: "/auth/access-granted", element: <AccessGrantedPage /> },
];

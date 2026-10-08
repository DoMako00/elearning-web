import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../../app/providers/AuthProvider";
import "../styles/SignInModern.css";

export function GoogleAuthCallbackPage() {
  const auth = useAuth();
  const navigate = useNavigate();
  const [error, setError] = useState("");
  useEffect(() => {
    let active = true;
    void auth.completeStudentGoogleCallback().then((result) => {
      if (!active) return;
      if (result.success) navigate("/", { replace: true });
      else setError(result.message);
    });
    return () => { active = false; };
  }, [auth, navigate]);
  return <div className="signin-page"><div className="signin-layout"><div className="signin-form-col"><h1 className="signin-title">Completing secure sign-in</h1>{error ? <><p className="signin-subtitle" role="alert">{error}</p><a className="signin-submit-btn" href="/auth/sign-in">Return to sign in</a></> : <p className="signin-subtitle" role="status">Verifying your Google account and establishing the secure platform session…</p>}</div></div></div>;
}
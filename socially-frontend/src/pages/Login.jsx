import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import AuthCard from "../components/AuthCard";
import FormField from "../components/FormField";
import VisibilityToggle from "../components/VisibilityToggle";
import { useAuth } from "../context/AuthContext";
import { ApiError } from "../lib/http";
import { savePendingVerification } from "../lib/pendingVerification";
import styles from "./Login.module.css";

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [formError, setFormError] = useState(null);
  // True when the backend refused login with 403 (email not verified yet).
  const [needsVerification, setNeedsVerification] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const redirectTo = location.state?.from?.pathname || "/";
  const justVerified = location.state?.justVerified;

  // The verify page needs an email. Only offer the shortcut when the user
  // logged in with one (a username alone doesn't tell us where the OTP went).
  const emailIdentifier = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(identifier.trim())
    ? identifier.trim()
    : null;

  async function handleSubmit(event) {
    event.preventDefault();
    setFormError(null);
    setNeedsVerification(false);

    if (!identifier.trim() || !password) {
      setFormError("Enter your email/username and password.");
      return;
    }

    setSubmitting(true);
    try {
      await login(identifier.trim(), password);
      navigate(redirectTo, { replace: true });
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        setFormError("Invalid email or password");
      } else if (err instanceof ApiError && err.status === 403) {
        // "Please verify your email before logging in." — not logged in at all.
        setFormError(err.message);
        setNeedsVerification(true);
      } else {
        setFormError(err.message || "Something went wrong. Try again.");
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <AuthCard title="Welcome back" subtitle="Log in to InstaCore">
      <form className={styles.form} onSubmit={handleSubmit} noValidate>
        {justVerified && !formError && (
          <p className={styles.successNotice} role="status">
            Email verified. Log in to continue.
          </p>
        )}
        <FormField
          id="identifier"
          label="Email or Username"
          icon="person"
          type="text"
          placeholder="Enter your email or username"
          autoComplete="username"
          value={identifier}
          onChange={(e) => setIdentifier(e.target.value)}
        />

        <FormField
          id="password"
          label="Password"
          icon="lock"
          type={showPassword ? "text" : "password"}
          placeholder="Enter your password"
          autoComplete="current-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          labelAction={
            <Link to="/forgot-password" className={styles.forgotLink}>
              Forgot password?
            </Link>
          }
          endAdornment={
            <VisibilityToggle visible={showPassword} onToggle={() => setShowPassword((v) => !v)} />
          }
        />

        {formError && (
          <p className={styles.formError} role="alert">
            <span className="material-symbols-outlined" aria-hidden="true">
              error
            </span>
            {formError}
          </p>
        )}

        {needsVerification && emailIdentifier && (
          <Link
            to="/verify-email"
            state={{ email: emailIdentifier }}
            className={styles.verifyLink}
            onClick={() => savePendingVerification(emailIdentifier, null)}
          >
            Enter your verification code
          </Link>
        )}

        <button type="submit" className={styles.submit} disabled={submitting}>
          {submitting ? "Logging in…" : "Log In"}
        </button>
      </form>

      <div className={styles.divider}>
        <span />
        <span className={styles.dividerLabel}>or</span>
        <span />
      </div>

      <Link to="/signup" className={styles.secondaryButton}>
        Create an Account
      </Link>
    </AuthCard>
  );
}

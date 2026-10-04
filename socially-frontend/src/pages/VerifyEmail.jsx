import { useEffect, useState } from "react";
import { Link, Navigate, useLocation, useNavigate } from "react-router-dom";
import OtpInput from "../components/OtpInput";
import { verifyEmail } from "../api/auth";
import { ApiError } from "../lib/http";
import {
  OTP_TTL_SECONDS,
  clearPendingVerification,
  getPendingVerification,
} from "../lib/pendingVerification";
import styles from "./VerifyEmail.module.css";

// Wording shown on the Create Account page after a failed verification.
// "Invalid OTP." is the mismatch case the flow was specified around; the
// other 400s (expired / already used) keep the backend's own reason.
function redirectMessage(err) {
  if (err.status === 404) return "We couldn't find that account. Create it again to continue.";
  if (/invalid/i.test(err.message)) {
    return "The OTP does not match. Check your email and try again.";
  }
  return `${err.message.replace(/\.$/, "")}. Check your email for the latest code.`;
}

function formatClock(totalSeconds) {
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  return `${m}:${s < 10 ? "0" : ""}${s}`;
}

export default function VerifyEmail() {
  const location = useLocation();
  const pending = getPendingVerification();
  const email = location.state?.email || pending?.email;

  // Opened directly with nothing to verify -> back to the start of the flow.
  if (!email) return <Navigate to="/signup" replace />;

  return <VerifyForm email={email} sentAt={pending?.sentAt} />;
}

function VerifyForm({ email, sentAt }) {
  const navigate = useNavigate();

  const [otp, setOtp] = useState("");
  const [alert, setAlert] = useState(null); // { title, message }
  const [submitting, setSubmitting] = useState(false);

  // null = send time unknown (came from Login), so no countdown is shown.
  const [secondsLeft, setSecondsLeft] = useState(() => {
    if (!sentAt) return null;
    const elapsed = Math.floor((Date.now() - sentAt) / 1000);
    return Math.max(0, OTP_TTL_SECONDS - elapsed);
  });

  useEffect(() => {
    if (secondsLeft === null || secondsLeft <= 0) return undefined;
    const id = setTimeout(() => setSecondsLeft((s) => s - 1), 1000);
    return () => clearTimeout(id);
  }, [secondsLeft]);

  async function handleSubmit(event) {
    event.preventDefault();
    if (submitting) return;
    setAlert(null);

    if (otp.length !== 6) {
      setAlert({
        title: "Incomplete code",
        message: "Enter all 6 digits from the email we sent you.",
      });
      return;
    }

    setSubmitting(true);
    try {
      await verifyEmail({ email, otp });
      clearPendingVerification();
      navigate("/login", { replace: true, state: { justVerified: true } });
    } catch (err) {
      if (err instanceof ApiError && (err.status === 400 || err.status === 404)) {
        // Code rejected -> back to Create Account with a "check your email" note.
        clearPendingVerification();
        navigate("/signup", {
          replace: true,
          state: { otpError: redirectMessage(err) },
        });
        return;
      }
      // Network / server trouble is not a wrong code: stay here so the
      // user can retry without losing the digits they typed.
      setAlert({
        title: "Verification failed",
        message: err.message || "Something went wrong. Try again.",
      });
      setSubmitting(false);
    }
  }

  const expired = secondsLeft !== null && secondsLeft <= 0;

  return (
    <div className={styles.page}>
      <div className={styles.glow} aria-hidden="true" />
      <main className={styles.card}>
        <div className={styles.aura} aria-hidden="true" />

        <div className={styles.badgeWrap}>
          <div className={styles.badge}>
            <span className={`material-symbols-outlined ${styles.badgeIcon}`} aria-hidden="true">
              shield_person
            </span>
          </div>
          <span className={styles.badgeDot} aria-hidden="true">
            <span />
          </span>
        </div>

        <div className={styles.brand}>
          <span className={styles.brandMark}>S</span>
          <span className={styles.brandName}>Socially Network</span>
        </div>

        <h1 className={styles.title}>Verify Your Email</h1>
        <p className={styles.lede}>
          A 6-digit confirmation code has been dispatched to{" "}
          <span className={styles.email}>{email}</span>
          <Link to="/signup" className={styles.change} onClick={clearPendingVerification}>
            Change
          </Link>
        </p>

        {alert && (
          <div className={styles.alert} role="alert">
            <span className={`material-symbols-outlined ${styles.alertIcon}`} aria-hidden="true">
              warning
            </span>
            <div className={styles.alertBody}>
              <p className={styles.alertTitle}>{alert.title}</p>
              <p className={styles.alertText}>{alert.message}</p>
            </div>
            <button
              type="button"
              className={styles.alertClose}
              onClick={() => setAlert(null)}
              aria-label="Dismiss"
            >
              <span className="material-symbols-outlined" aria-hidden="true">
                close
              </span>
            </button>
          </div>
        )}

        <div className={styles.info}>
          <span className={`material-symbols-outlined ${styles.infoIcon}`} aria-hidden="true">
            route
          </span>
          <p>
            Successful validation completes registration and forwards to <strong>Sign In</strong>.
            If the code does not match, you will be redirected to <strong>Create Account</strong>{" "}
            with an alert to check your inbox.
          </p>
        </div>

        <form className={styles.form} onSubmit={handleSubmit} noValidate>
          <OtpInput
            value={otp}
            onChange={(next) => {
              setOtp(next);
              if (alert) setAlert(null);
            }}
            disabled={submitting}
            invalid={Boolean(alert)}
            autoFocus
          />

          <button type="submit" className={styles.submit} disabled={submitting}>
            <span>{submitting ? "Verifying…" : "Confirm & Authenticate"}</span>
            {!submitting && (
              <span className="material-symbols-outlined" aria-hidden="true">
                arrow_forward
              </span>
            )}
          </button>
        </form>

        <div className={styles.utility}>
          {secondsLeft !== null && (
            <>
              <p className={styles.timer}>
                <span className="material-symbols-outlined" aria-hidden="true">
                  schedule
                </span>
                {expired ? (
                  <span>Code expired</span>
                ) : (
                  <span>
                    Code expires in <strong>{formatClock(secondsLeft)}</strong>
                  </span>
                )}
              </p>

              <span className={styles.rule} aria-hidden="true" />
            </>
          )}

          <nav className={styles.links}>
            <Link to="/signup" onClick={clearPendingVerification}>
              <span className="material-symbols-outlined" aria-hidden="true">
                arrow_back
              </span>
              Return to Sign Up
            </Link>
            <span className={styles.sep} aria-hidden="true" />
            <Link to="/login" onClick={clearPendingVerification}>
              Back to Login
            </Link>
          </nav>
        </div>

        <p className={styles.footnote}>
          <span className="material-symbols-outlined" aria-hidden="true">
            lock
          </span>
          End-to-end cryptographic handshake
        </p>
      </main>
    </div>
  );
}

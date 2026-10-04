// Remembers which email is waiting for OTP verification, so the verify
// page survives a refresh. sessionStorage (not localStorage): it's scoped
// to this tab and disappears when the tab closes. Only the email and the
// send time are kept — never a password or token.
const KEY = "socially.pendingVerification";

// Must match time_to_live in crud.email_otp_verification (5 minutes).
export const OTP_TTL_SECONDS = 300;

// sentAt = when the OTP email went out. Pass null when that's unknown
// (e.g. arriving from the Login page) so the UI doesn't show a fake countdown.
export function savePendingVerification(email, sentAt = Date.now()) {
  try {
    sessionStorage.setItem(KEY, JSON.stringify({ email, sentAt }));
  } catch {
    /* storage blocked — router state still carries the email */
  }
}

export function getPendingVerification() {
  try {
    const raw = sessionStorage.getItem(KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return parsed?.email ? parsed : null;
  } catch {
    return null;
  }
}

export function clearPendingVerification() {
  try {
    sessionStorage.removeItem(KEY);
  } catch {
    /* ignore */
  }
}

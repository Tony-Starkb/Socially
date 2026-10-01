// Base URL for the FastAPI backend.
// Dev: empty string -> requests go to /api/v1/... and Vite proxies them.
// Prod: e.g. https://instacore-backend.up.railway.app
// Trailing slashes are stripped here so we never produce a double-slash URL.
const raw = import.meta.env.VITE_API_BASE_URL || "";

export const API_BASE = raw.replace(/\/+$/, "");
export const API_V1 = `${API_BASE}/api/v1`;

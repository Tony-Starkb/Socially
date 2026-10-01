import { API_V1 } from "./config";
import { isExpired } from "./jwt";

// The access token lives in memory only — never localStorage.
// On a page reload it's gone, and we silently rebuild it from the
// HttpOnly refresh cookie via bootstrapSession().
let accessToken = null;
let onSessionLost = () => {};

export function setAccessToken(token) {
  accessToken = token;
}
export function getAccessToken() {
  return accessToken;
}
export function onLogout(handler) {
  onSessionLost = handler;
}

export class ApiError extends Error {
  constructor(status, message, requestId) {
    super(message);
    this.status = status;
    this.requestId = requestId;
  }
}

// The backend wraps every failure as { error: { code, message, request_id } }.
async function toApiError(response) {
  let message = response.statusText || "Request failed";
  let requestId;
  try {
    const bodyClone = response.clone();
    const body = await bodyClone.json();
    message = body?.error?.message || body?.detail || message;
    requestId = body?.error?.request_id;
  } catch {
    /* non-JSON body, keep the status text */
  }
  return new ApiError(response.status, message, requestId);
}

// Only one refresh call in flight, no matter how many requests 401 at once.
let refreshInFlight = null;

async function refreshAccessToken() {
  if (!refreshInFlight) {
    refreshInFlight = fetch(`${API_V1}/auth/refresh`, {
      method: "POST",
      credentials: "include",
    })
      .then(async (res) => {
        if (!res.ok) throw await toApiError(res);
        const data = await res.json();
        accessToken = data.access_token;
        return accessToken;
      })
      .finally(() => {
        refreshInFlight = null;
      });
  }
  return refreshInFlight;
}

export async function bootstrapSession() {
  try {
    return await refreshAccessToken();
  } catch {
    accessToken = null;
    return null;
  }
}

/**
 * @param {string} path      path under /api/v1, e.g. "/posts" or "/users/tony"
 * @param {object} options
 *   method, body (auto-JSON unless `form` or `raw` is set),
 *   auth (default true), query, form (URLSearchParams), raw (FormData)
 */
export async function request(path, options = {}) {
  const {
    method = "GET",
    body,
    auth = true,
    query,
    form,
    raw,
    retryOn401 = true,
  } = options;

  let url = `${API_V1}${path}`;
  if (query) {
    const qs = new URLSearchParams(
      Object.entries(query).filter(([, v]) => v !== undefined && v !== null)
    ).toString();
    if (qs) url += `?${qs}`;
  }

  // Refresh proactively if the token is about to expire, so we
  // don't burn a round-trip on a guaranteed 401.
  if (auth && accessToken && isExpired(accessToken)) {
    try {
      await refreshAccessToken();
    } catch {
      /* fall through; the 401 handler below deals with it */
    }
  }

  const headers = {};
  if (auth && accessToken) headers.Authorization = `Bearer ${accessToken}`;

  let payload;
  if (raw) {
    payload = raw; // FormData — browser sets its own multipart boundary
  } else if (form) {
    headers["Content-Type"] = "application/x-www-form-urlencoded";
    payload = form;
  } else if (body !== undefined) {
    headers["Content-Type"] = "application/json";
    payload = JSON.stringify(body);
  }

  const response = await fetch(url, {
    method,
    headers,
    body: payload,
    credentials: "include",
  });

  if (response.status === 401 && auth && retryOn401) {
    try {
      await refreshAccessToken();
      return request(path, { ...options, retryOn401: false });
    } catch {
      accessToken = null;
      onSessionLost();
      throw new ApiError(401, "Your session expired. Sign in again.");
    }
  }

  if (!response.ok) throw await toApiError(response);
  if (response.status === 204) return null;

  const contentType = response.headers.get("content-type") || "";
  return contentType.includes("application/json") ? response.json() : response.text();
}

// The backend has no /me endpoint, so we read the username out of the
// access token itself and then fetch the full profile from /users/{username}.
export function decodeJwt(token) {
  try {
    const payload = token.split(".")[1];
    const normalised = payload.replace(/-/g, "+").replace(/_/g, "/");
    const json = decodeURIComponent(
      atob(normalised)
        .split("")
        .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
        .join("")
    );
    return JSON.parse(json);
  } catch {
    return null;
  }
}

export function isExpired(token, skewSeconds = 30) {
  const payload = decodeJwt(token);
  if (!payload?.exp) return true;
  return payload.exp * 1000 <= Date.now() + skewSeconds * 1000;
}

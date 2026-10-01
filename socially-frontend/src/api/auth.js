import { request, setAccessToken } from "../lib/http";

// GET /auth/me — returns the full profile for whoever the access token
// belongs to. Replaces the old decode-JWT-then-fetch-by-username dance.
export function getMe() {
  return request("/auth/me");
}

export async function logout() {
  try {
    await request("/auth/logout", { method: "POST" });
  } finally {
    setAccessToken(null);
  }
}

// POST /auth/login expects application/x-www-form-urlencoded
// (OAuth2PasswordRequestForm on the backend) — NOT JSON.
// The "username" field doubles as username-or-email; backend tries both.
export async function login({ identifier, password }) {
  const form = new URLSearchParams();
  form.set("username", identifier);
  form.set("password", password);

  const data = await request("/auth/login", {
    method: "POST",
    form,
    auth: false,
  });
  setAccessToken(data.access_token);
  return data;
}

export async function register({ username, email, password, fullName, bio, avatarUrl }) {
  return request("/auth/registration", {
    method: "POST",
    auth: false,
    body: {
      username,
      email,
      password,
      full_name: fullName || null,
      bio: bio || null,
      avatar_url: avatarUrl || null,
    },
  });
}

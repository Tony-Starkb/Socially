import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { bootstrapSession, onLogout, getAccessToken, setAccessToken } from "../lib/http";
import { login as apiLogin, register as apiRegister, getMe, logout as apiLogout } from "../api/auth";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  // "loading" while we try to silently restore a session from the
  // refresh cookie on first load; every route waits on this once.
  const [status, setStatus] = useState("loading");

  const hydrateUser = useCallback(async () => {
    const profile = await getMe();
    setUser(profile);
    return profile;
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const token = await bootstrapSession();
      if (cancelled) return;
      if (!token) {
        setStatus("signed-out");
        return;
      }
      try {
        await hydrateUser();
        if (!cancelled) setStatus("signed-in");
      } catch {
        if (!cancelled) setStatus("signed-out");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [hydrateUser]);

  useEffect(() => {
    onLogout(() => {
      setUser(null);
      setStatus("signed-out");
    });
  }, []);

  const login = useCallback(
    async (identifier, password) => {
      const data = await apiLogin({ identifier, password });
      await hydrateUser();
      setStatus("signed-in");
      return data;
    },
    [hydrateUser]
  );

  const register = useCallback(async (fields) => {
    return apiRegister(fields);
  }, []);

  const logout = useCallback(async () => {
    try {
      await apiLogout();
    } finally {
      setUser(null);
      setStatus("signed-out");
    }
  }, []);

  return (
    <AuthContext.Provider value={{ user, status, login, register, logout, getAccessToken }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside <AuthProvider>");
  return ctx;
}

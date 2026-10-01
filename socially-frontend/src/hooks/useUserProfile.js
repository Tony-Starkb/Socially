import { useEffect, useState } from "react";
import { getUserByUsername } from "../api/users";

// Module-level cache: many PostCards can reference the same username,
// so this dedupes both the fetch and the in-flight request.
const cache = new Map();
const inflight = new Map();

export function useUserProfile(username) {
  const [profile, setProfile] = useState(() => (username ? cache.get(username) : null) || null);

  useEffect(() => {
    if (!username) return;
    if (cache.has(username)) {
      setProfile(cache.get(username));
      return;
    }

    let cancelled = false;
    const promise =
      inflight.get(username) ||
      getUserByUsername(username)
        .then((data) => {
          cache.set(username, data);
          return data;
        })
        .finally(() => inflight.delete(username));
    inflight.set(username, promise);

    promise.then((data) => {
      if (!cancelled) setProfile(data);
    }).catch(() => {
      /* leave profile null; PostCard falls back to initials */
    });

    return () => {
      cancelled = true;
    };
  }, [username]);

  return profile;
}

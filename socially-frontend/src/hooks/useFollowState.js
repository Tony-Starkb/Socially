import { useEffect, useState } from "react";
import { followUser, unfollowUser, getIsFollowing, getIsFollower } from "../api/users";
import { ApiError } from "../lib/http";

// Follow/unfollow state for one username, shared by the Profile page and
// Search results.
//
// - On mount it asks the backend both directions: whether you already
//   follow them (`is_following`, drives the button) and whether they
//   already follow you (`is_follower`, drives a "Follows you" badge). If
//   either endpoint isn't working it returns null and that half just
//   starts at its default.
// - Toggling calls POST/DELETE /follow. A 409 means our guess was wrong
//   (already followed / not followed), so we sync to what the server says
//   instead of showing an error.
// - `followerDelta` is the net change in that user's follower count since
//   the page loaded, so the number on screen can move immediately.
export function useFollowState(username) {
  const [following, setFollowing] = useState(false);
  const [isFollower, setIsFollower] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);
  const [followerDelta, setFollowerDelta] = useState(0);

  useEffect(() => {
    let cancelled = false;
    setFollowing(false);
    setIsFollower(false);
    setError(null);
    setFollowerDelta(0);
    if (!username) return;
    getIsFollowing(username).then((status) => {
      if (!cancelled && status !== null) setFollowing(status);
    });
    getIsFollower(username).then((status) => {
      if (!cancelled && status !== null) setIsFollower(status);
    });
    return () => {
      cancelled = true;
    };
  }, [username]);

  async function toggle() {
    if (busy) return;
    setBusy(true);
    setError(null);
    try {
      if (!following) {
        await followUser(username);
        setFollowing(true);
        setFollowerDelta((d) => d + 1);
      } else {
        await unfollowUser(username);
        setFollowing(false);
        setFollowerDelta((d) => d - 1);
      }
    } catch (err) {
      if (err instanceof ApiError && err.status === 409) {
        // POST 409 => already following; DELETE 409 => not following.
        setFollowing(!following);
      } else {
        setError(err.message || "Couldn't update follow status.");
      }
    } finally {
      setBusy(false);
    }
  }

  return { following, isFollower, busy, error, followerDelta, toggle };
}

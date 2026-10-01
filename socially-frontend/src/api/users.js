import { request } from "../lib/http";

export function getUserByUsername(username) {
  return request(`/users/${encodeURIComponent(username)}`);
}

// GET /users/search?q=... — case-insensitive username substring match.
// Returns { query, results: [UserPublicResponse, ...] }.
export function searchUsers(query) {
  return request("/users/search", { query: { q: query } });
}

export function followUser(username) {
  return request(`/users/${encodeURIComponent(username)}/follow`, { method: "POST" });
}

export function unfollowUser(username) {
  return request(`/users/${encodeURIComponent(username)}/follow`, { method: "DELETE" });
}

export function getUserPosts(username) {
  return request(`/users/${encodeURIComponent(username)}/posts`);
}

// -> true / false, or null if the endpoint errors. Stops retrying for the
// session once it's clearly failing, so a broken endpoint doesn't spam a
// failing request on every profile/search render.
let followingStatusAvailable = true;
export async function getIsFollowing(username) {
  if (!followingStatusAvailable) return null;
  try {
    const data = await request(`/users/${encodeURIComponent(username)}/is_following`);
    return typeof data?.is_following === "boolean" ? data.is_following : null;
  } catch (err) {
    if (err?.status === 404 || err?.status >= 500) followingStatusAvailable = false;
    return null;
  }
}

// Does *this* user follow the current (logged-in) user? Drives the
// "Follows you" badge on their profile.
let followerStatusAvailable = true;
export async function getIsFollower(username) {
  if (!followerStatusAvailable) return null;
  try {
    const data = await request(`/users/${encodeURIComponent(username)}/is_follower`);
    return typeof data?.is_follower === "boolean" ? data.is_follower : null;
  } catch (err) {
    if (err?.status === 404 || err?.status >= 500) followerStatusAvailable = false;
    return null;
  }
}

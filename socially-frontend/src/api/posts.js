import { request } from "../lib/http";

// Trailing slash matters here — the backend router is mounted at
// /api/v1/feeds with a route registered at "/".
export function getHomeFeed() {
  return request("/feeds/");
}

// POST /posts/{id}/like is a TOGGLE on this backend: the first call likes,
// a second call unlikes. The response says which happened:
//   { message: "post liked" | "post unliked", post: { like_count, ... } }
// (DELETE /posts/{id}/like also toggles, so it isn't used from the UI.)
export function toggleLikePost(id) {
  return request(`/posts/${id}/like`, { method: "POST" });
}

// GET /posts/{id}/like-status -> { post_id, user_id, like_status }
// Returns null (instead of throwing) if the endpoint errors, and stops
// calling it for the rest of the session so a broken endpoint doesn't
// spam a failing request for every post in the feed.
let likeStatusAvailable = true;
export async function getLikeStatus(id) {
  if (!likeStatusAvailable) return null;
  try {
    const data = await request(`/posts/${id}/like-status`);
    return typeof data?.like_status === "boolean" ? data.like_status : null;
  } catch (err) {
    if (err?.status === 404 || err?.status >= 500) likeStatusAvailable = false;
    return null;
  }
}

// `comment` is a query param on the backend, not a JSON body field.
export function commentOnPost(id, comment) {
  return request(`/posts/${id}/comment`, {
    method: "POST",
    query: { comment },
  });
}

// Upload one media file to Cloudinary via the backend.
export function uploadMedia(file) {
  if (!(file instanceof File)) {
    throw new Error("Select a valid image or video file before uploading.");
  }

  const form = new FormData();
  form.append("files", file, file.name);
  return request("/posts/upload-media", { method: "POST", raw: form });
}

export function createPost({ caption, media_urls }) {
  return request("/posts/", { method: "POST", body: { caption, media_urls } });
}

export function getPostById(id) {
  return request(`/posts/${id}`);
}

// PATCH /posts/{id} — owner only. Send just the fields being changed.
export function updatePost(id, updates) {
  return request(`/posts/${id}`, { method: "PATCH", body: updates });
}

// Returns { post_id, comments: [{ comment_id, user_id, comment, created_at }] }.
// Note: comments carry user_id, not username — the backend has no
// lookup-by-id endpoint yet, so the UI can only reliably label the
// current user's own comments.
export function getPostComments(id) {
  return request(`/posts/${id}/comments`);
}

export function deleteComment(postId, commentId) {
  return request(`/posts/${postId}/comments/${commentId}`, { method: "DELETE" });
}

export function deletePost(id) {
  return request(`/posts/${id}`, { method: "DELETE" });
}

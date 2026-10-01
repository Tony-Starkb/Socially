import { useEffect, useState } from "react";
import { toggleLikePost, getLikeStatus, commentOnPost, deletePost } from "../api/posts";

// Centralizes the like/comment/delete logic so PostCard (feed) and
// PostDetail (modal) stay in sync instead of drifting into two
// slightly-different implementations.
export function usePostInteractions(post) {
  const [likeCount, setLikeCount] = useState(post.like_count);
  const [commentCount, setCommentCount] = useState(post.comment_count);
  const [liked, setLiked] = useState(false);
  const [likeBusy, setLikeBusy] = useState(false);

  const [postedComments, setPostedComments] = useState([]);
  const [commentBusy, setCommentBusy] = useState(false);

  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState(null);

  // Ask the backend whether this user already liked the post so the heart
  // starts in the right state. If that endpoint isn't working it returns
  // null and we just leave the heart empty — the toggle below still ends
  // up correct because it reads the real result from the server.
  useEffect(() => {
    let cancelled = false;
    getLikeStatus(post.id).then((status) => {
      if (!cancelled && status !== null) setLiked(status);
    });
    return () => {
      cancelled = true;
    };
  }, [post.id]);

  async function toggleLike() {
    if (likeBusy) return;
    setLikeBusy(true);
    setError(null);
    try {
      // The server decides: it likes if not liked, unlikes if already liked,
      // and tells us which one it did. No guessing, no optimistic drift.
      const data = await toggleLikePost(post.id);
      setLiked(data.message === "post liked");
      if (typeof data.post?.like_count === "number") setLikeCount(data.post.like_count);
    } catch {
      setError("Couldn't update like. Try again.");
    } finally {
      setLikeBusy(false);
    }
  }

  async function submitComment(text) {
    const trimmed = text.trim();
    if (!trimmed || commentBusy) return false;

    setCommentBusy(true);
    setError(null);
    try {
      const data = await commentOnPost(post.id, trimmed);
      setPostedComments((list) => [...list, data.post]);
      setCommentCount((c) => c + 1);
      return true;
    } catch {
      setError("Couldn't post your comment. Try again.");
      return false;
    } finally {
      setCommentBusy(false);
    }
  }

  async function removePost(onDeleted) {
    if (deleting) return;
    if (!window.confirm("Delete this post? This can't be undone.")) return;
    setDeleting(true);
    setError(null);
    try {
      await deletePost(post.id);
      onDeleted?.(post.id);
    } catch {
      setError("Couldn't delete this post. Try again.");
      setDeleting(false);
    }
  }

  return {
    likeCount,
    commentCount,
    setCommentCount,
    liked,
    likeBusy,
    toggleLike,
    postedComments,
    commentBusy,
    submitComment,
    deleting,
    removePost,
    error,
    setError,
  };
}

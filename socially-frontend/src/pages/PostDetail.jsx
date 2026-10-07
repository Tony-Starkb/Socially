import { useCallback, useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import { getPostById, getPostComments, deleteComment, updatePost } from "../api/posts";
import MediaCarousel from "../components/MediaCarousel";
import { useAuth } from "../context/AuthContext";
import { useUserProfile } from "../hooks/useUserProfile";
import { getPostMediaUrls } from "../lib/media";
import { usePostInteractions } from "../hooks/usePostInteractions";
import { relativeTime } from "../lib/time";
import styles from "./PostDetail.module.css";

function CommentRow({ label, text, meta, onDelete, deleting }) {
  return (
    <div className={styles.commentRow}>
      <div className={styles.commentAvatar}>{label[0]?.toUpperCase()}</div>
      <div className={styles.commentBody}>
        <span className={styles.commentAuthor}>{label}</span>
        <span className={styles.commentText}>{text}</span>
        <div className={styles.commentMeta}>
          <span>{meta}</span>
          {onDelete && (
            <button
              type="button"
              className={styles.commentDelete}
              onClick={onDelete}
              disabled={deleting}
            >
              {deleting ? "Deleting…" : "Delete"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function PostDetailContent({ post, currentUser, onDeleted }) {
  const profile = useUserProfile(post.username);
  const isOwn = post.username === currentUser?.username;
  const navigate = useNavigate();

  const { likeCount, liked, likeBusy, toggleLike, submitComment, commentBusy, deleting, removePost, error } =
    usePostInteractions(post);

  const [menuOpen, setMenuOpen] = useState(false);
  const [caption, setCaption] = useState(post.caption);
  const [editing, setEditing] = useState(false);
  const [draftCaption, setDraftCaption] = useState(post.caption);
  const [savingCaption, setSavingCaption] = useState(false);
  const [captionError, setCaptionError] = useState(null);
  const [deletingCommentId, setDeletingCommentId] = useState(null);
  const [commentText, setCommentText] = useState("");
  const [comments, setComments] = useState([]);
  const [commentsLoading, setCommentsLoading] = useState(true);

  const loadComments = useCallback(async () => {
    try {
      const data = await getPostComments(post.id);
      const sorted = [...(data.comments || [])].sort(
        (a, b) => new Date(a.created_at) - new Date(b.created_at)
      );
      setComments(sorted);
    } catch {
      setComments([]);
    } finally {
      setCommentsLoading(false);
    }
  }, [post.id]);

  useEffect(() => {
    loadComments();
  }, [loadComments]);

  // The backend only returns user_id per comment, not username — there's
  // no lookup-by-id endpoint yet — so anyone but the current user shows
  // as a generic label rather than a fabricated handle.
  const hasUnresolvedAuthor = comments.some((c) => c.user_id !== currentUser?.id);

  async function handleSubmit(event) {
    event.preventDefault();
    const ok = await submitComment(commentText);
    if (ok) {
      setCommentText("");
      loadComments();
    }
  }

  async function handleSaveCaption() {
    const trimmed = draftCaption.trim();
    if (!trimmed || savingCaption) return;
    if (trimmed === caption) {
      setEditing(false);
      return;
    }
    setSavingCaption(true);
    setCaptionError(null);
    try {
      const updated = await updatePost(post.id, { caption: trimmed });
      setCaption(updated.caption);
      setEditing(false);
    } catch (err) {
      setCaptionError(err.message || "Couldn't update the caption.");
    } finally {
      setSavingCaption(false);
    }
  }

  async function handleDeleteComment(commentId) {
    if (deletingCommentId) return;
    if (!window.confirm("Delete this comment?")) return;
    setDeletingCommentId(commentId);
    try {
      await deleteComment(post.id, commentId);
      setComments((list) => list.filter((c) => c.comment_id !== commentId));
    } catch {
      /* leave the comment in place; nothing changed on the server */
    } finally {
      setDeletingCommentId(null);
    }
  }

  async function handleDelete() {
    setMenuOpen(false);
    // Deleting closes back to the feed rather than the modal's normal
    // "go back" — the feed's own post list can't know about the
    // deletion otherwise, so this forces a fresh fetch of it.
    await removePost(() => {
      onDeleted?.(post.id);
      navigate("/", { replace: true });
    });
  }

  const avatarUrl = profile?.avatar_url;
  const postedDate = new Date(post.created_at).toLocaleDateString(undefined, {
    month: "long",
    day: "numeric",
  });

  return (
    <div className={styles.modalBox} onClick={(e) => e.stopPropagation()}>
      <div className={styles.imagePane}>
        <MediaCarousel mediaUrls={getPostMediaUrls(post)} alt={caption} variant="detail" />
      </div>

      <div className={styles.infoPane}>
        <div className={styles.header}>
          <div
            className={styles.author}
            onClick={() => navigate(`/profile/${post.username}`)}
            role="button"
            tabIndex={0}
          >
            {avatarUrl ? (
              <img className={styles.avatarImg} src={avatarUrl} alt="" />
            ) : (
              <div className={styles.avatar}>{post.username[0]?.toUpperCase()}</div>
            )}
            <span className={styles.username}>@{post.username}</span>
          </div>

          {isOwn && (
            <div className={styles.menuWrap}>
              <button
                className={styles.moreButton}
                aria-label="Post options"
                aria-expanded={menuOpen}
                onClick={() => setMenuOpen((v) => !v)}
              >
                <span className="material-symbols-outlined">more_horiz</span>
              </button>
              {menuOpen && (
                <div className={styles.menu} role="menu">
                  <button
                    className={styles.menuItemNeutral}
                    role="menuitem"
                    onClick={() => {
                      setMenuOpen(false);
                      setDraftCaption(caption);
                      setCaptionError(null);
                      setEditing(true);
                    }}
                  >
                    Edit caption
                  </button>
                  <button
                    className={styles.menuItem}
                    role="menuitem"
                    onClick={handleDelete}
                    disabled={deleting}
                  >
                    {deleting ? "Deleting…" : "Delete post"}
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        <div className={styles.commentsScroll}>
          {editing ? (
            <div className={styles.captionEdit}>
              <textarea
                className={styles.captionEditInput}
                value={draftCaption}
                onChange={(e) => setDraftCaption(e.target.value)}
                maxLength={2200}
                rows={4}
                autoFocus
              />
              {captionError && <p className={styles.error}>{captionError}</p>}
              <div className={styles.captionEditActions}>
                <button
                  type="button"
                  className={styles.captionCancel}
                  onClick={() => setEditing(false)}
                  disabled={savingCaption}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className={styles.captionSave}
                  onClick={handleSaveCaption}
                  disabled={savingCaption || !draftCaption.trim()}
                >
                  {savingCaption ? "Saving…" : "Save"}
                </button>
              </div>
            </div>
          ) : (
            <CommentRow
              label={`@${post.username}`}
              text={caption}
              meta={relativeTime(post.created_at)}
            />
          )}

          {commentsLoading && <p className={styles.loadingComments}>Loading comments…</p>}

          {comments.map((c) => (
            <CommentRow
              key={c.comment_id}
              label={c.user_id === currentUser?.id ? `@${currentUser.username}` : "Someone"}
              text={c.comment}
              meta={relativeTime(c.created_at)}
              onDelete={c.user_id === currentUser?.id ? () => handleDeleteComment(c.comment_id) : undefined}
              deleting={deletingCommentId === c.comment_id}
            />
          ))}

          {hasUnresolvedAuthor && (
            <p className={styles.olderNotice}>
              Some commenters show as "Someone" — the backend only returns a user ID per
              comment, not a username, so their name can't be resolved yet.
            </p>
          )}
        </div>

        <div className={styles.footer}>
          <div className={styles.actionsRow}>
            <div className={styles.actionsLeft}>
              <button
                className={`${styles.actionButton} ${liked ? styles.liked : ""}`}
                onClick={toggleLike}
                disabled={likeBusy}
                aria-pressed={liked}
                aria-label={liked ? "Unlike" : "Like"}
              >
                <span
                  className="material-symbols-outlined"
                  style={{ fontSize: "28px", ...(liked ? { fontVariationSettings: "'FILL' 1" } : {}) }}
                >
                  favorite
                </span>
              </button>
              <button className={styles.actionButton} aria-label="Comments">
                <span className="material-symbols-outlined" style={{ fontSize: "28px" }}>
                  chat_bubble
                </span>
              </button>
            </div>
          </div>

          <div className={styles.meta}>
            <span className={styles.likeCount}>{likeCount.toLocaleString()} likes</span>
            <span className={styles.postedDate}>{postedDate}</span>
          </div>

          {error && <p className={styles.error}>{error}</p>}

          <form className={styles.composer} onSubmit={handleSubmit}>
            <input
              className={styles.composerInput}
              type="text"
              placeholder="Add a comment…"
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              maxLength={2200}
            />
            <button
              type="submit"
              className={styles.composerSubmit}
              disabled={!commentText.trim() || commentBusy}
            >
              Post
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

export default function PostDetail({ asModal, onDeleted }) {
  const { postId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [post, setPost] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;
    setPost(null);
    setError(null);
    getPostById(postId)
      .then((data) => {
        if (!cancelled) setPost(data);
      })
      .catch((err) => {
        if (!cancelled) setError(err.message || "This post couldn't be loaded.");
      });
    return () => {
      cancelled = true;
    };
  }, [postId]);

  function close() {
    if (asModal) navigate(-1);
    else navigate("/");
  }

  useEffect(() => {
    if (!asModal) return;
    document.body.style.overflow = "hidden";
    function onKeyDown(e) {
      if (e.key === "Escape") close();
    }
    window.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", onKeyDown);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [asModal]);

  return (
    <div className={styles.overlay} onClick={close}>
      <button className={styles.closeButton} onClick={close} aria-label="Close">
        <span className="material-symbols-outlined" style={{ fontSize: "32px" }}>
          close
        </span>
      </button>

      {!post && !error && (
        <div className={styles.modalBox} onClick={(e) => e.stopPropagation()}>
          <p className={styles.loadingText}>Loading post…</p>
        </div>
      )}

      {error && (
        <div className={styles.modalBox} onClick={(e) => e.stopPropagation()}>
          <p className={styles.loadingText}>{error}</p>
        </div>
      )}

      {post && <PostDetailContent post={post} currentUser={user} onDeleted={onDeleted} />}
    </div>
  );
}

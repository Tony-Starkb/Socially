import { useRef, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { relativeTime } from "../lib/time";
import { useUserProfile } from "../hooks/useUserProfile";
import { usePostInteractions } from "../hooks/usePostInteractions";
import MediaCarousel from "./MediaCarousel";
import { getPostMediaUrls } from "../lib/media";
import styles from "./PostCard.module.css";

export default function PostCard({ post, currentUsername, onDeleted }) {
  const profile = useUserProfile(post.username);
  const isOwn = post.username === currentUsername;
  const navigate = useNavigate();
  const location = useLocation();

  const {
    likeCount,
    commentCount,
    liked,
    likeBusy,
    toggleLike,
    postedComments,
    commentBusy,
    submitComment,
    deleting,
    removePost,
    error,
  } = usePostInteractions(post);

  const [showComposer, setShowComposer] = useState(false);
  const [commentText, setCommentText] = useState("");
  const [menuOpen, setMenuOpen] = useState(false);
  const [shareNotice, setShareNotice] = useState(false);
  const shareTimeout = useRef(null);

  function openDetail() {
    // Background-location pattern: the feed stays mounted behind the
    // modal instead of navigating away from it.
    navigate(`/posts/${post.id}`, { state: { backgroundLocation: location } });
  }

  async function handleCommentSubmit(event) {
    event.preventDefault();
    const ok = await submitComment(commentText);
    if (ok) setCommentText("");
  }

  function handleShare() {
    const url = `${window.location.origin}/posts/${post.id}`;
    navigator.clipboard?.writeText(url).then(() => {
      setShareNotice(true);
      clearTimeout(shareTimeout.current);
      shareTimeout.current = setTimeout(() => setShareNotice(false), 1800);
    });
  }

  const avatarUrl = profile?.avatar_url;
  const mediaUrls = getPostMediaUrls(post);

  return (
    <article className={styles.card}>
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
          <div>
            <p className={styles.username}>{post.username}</p>
            <p className={styles.timestamp}>{relativeTime(post.created_at)}</p>
          </div>
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
                  className={styles.menuItem}
                  role="menuitem"
                  onClick={() => {
                    setMenuOpen(false);
                    removePost(onDeleted);
                  }}
                  disabled={deleting}
                >
                  {deleting ? "Deleting…" : "Delete post"}
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      <div
        className={styles.imageWrap}
        onClick={openDetail}
        onKeyDown={(event) => {
          if (event.target === event.currentTarget && ["Enter", " "].includes(event.key)) {
            event.preventDefault();
            openDetail();
          }
        }}
        role="button"
        tabIndex={0}
        aria-label="Open post"
      >
        {mediaUrls.length > 0 ? (
          <MediaCarousel mediaUrls={mediaUrls} alt={post.caption} variant="feed" />
        ) : (
          <div className={styles.imageFallback}>Media unavailable</div>
        )}
      </div>

      <div className={styles.actions}>
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
              style={liked ? { fontVariationSettings: "'FILL' 1" } : undefined}
            >
              favorite
            </span>
          </button>
          <button
            className={styles.actionButton}
            onClick={() => setShowComposer((v) => !v)}
            aria-label="Comment"
            aria-expanded={showComposer}
          >
            <span className="material-symbols-outlined">chat_bubble_outline</span>
          </button>
          <button className={styles.actionButton} onClick={handleShare} aria-label="Copy link">
            <span className="material-symbols-outlined">send</span>
          </button>
        </div>
      </div>

      {shareNotice && <p className={styles.shareNotice}>Link copied</p>}

      <div className={styles.details}>
        <p className={styles.likeCount}>{likeCount.toLocaleString()} likes</p>
        <p className={styles.caption}>
          <span className={styles.captionUsername}>{post.username}</span>
          {post.caption}
        </p>

        {postedComments.map((c, i) => (
          <p key={i} className={styles.caption}>
            <span className={styles.captionUsername}>you</span>
            {c.comment}
          </p>
        ))}

        {commentCount > 0 && (
          <button type="button" className={styles.commentCountButton} onClick={openDetail}>
            View all {commentCount.toLocaleString()} comment{commentCount === 1 ? "" : "s"}
          </button>
        )}

        {error && <p className={styles.error}>{error}</p>}

        {showComposer && (
          <form className={styles.composer} onSubmit={handleCommentSubmit}>
            <input
              className={styles.composerInput}
              type="text"
              placeholder="Add a comment…"
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              maxLength={2200}
              autoFocus
            />
            <button
              type="submit"
              className={styles.composerSubmit}
              disabled={!commentText.trim() || commentBusy}
            >
              Post
            </button>
          </form>
        )}
      </div>
    </article>
  );
}

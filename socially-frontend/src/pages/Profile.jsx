import { useEffect, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import AppShell from "../components/AppShell";
import SuggestionsPanel from "../components/SuggestionsPanel";
import { useAuth } from "../context/AuthContext";
import { getUserByUsername, getUserPosts } from "../api/users";
import { useFollowState } from "../hooks/useFollowState";
import { getPostMediaUrls, isVideoMedia } from "../lib/media";
import styles from "./Profile.module.css";

const TABS = [
  { key: "posts", label: "Posts", icon: "grid_on", enabled: true },
  { key: "reels", label: "Reels", icon: "movie", enabled: false },
  { key: "saved", label: "Saved", icon: "bookmark", enabled: false },
  { key: "tagged", label: "Tagged", icon: "person_pin", enabled: false },
];

// You can't follow yourself, so don't bother asking the backend about it.
function isOwnLookup(username, currentUser) {
  return currentUser?.username === username ? null : username;
}

export default function Profile() {
  const { username } = useParams();
  const { user: currentUser } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [profile, setProfile] = useState(null);
  const [profileError, setProfileError] = useState(null);

  const [posts, setPosts] = useState(null);
  const [postsError, setPostsError] = useState(null);

  const {
    following,
    isFollower,
    busy: followBusy,
    error: followError,
    followerDelta,
    toggle: toggleFollow,
  } = useFollowState(isOwnLookup(username, currentUser));

  const [linkCopied, setLinkCopied] = useState(false);

  const isOwn = currentUser?.username === username;

  useEffect(() => {
    let cancelled = false;
    setProfile(null);
    setProfileError(null);
    getUserByUsername(username)
      .then((data) => {
        if (!cancelled) setProfile(data);
      })
      .catch((err) => {
        if (!cancelled) setProfileError(err.message || "Couldn't load this profile.");
      });
    return () => {
      cancelled = true;
    };
  }, [username]);

  useEffect(() => {
    let cancelled = false;
    setPosts(null);
    setPostsError(null);
    getUserPosts(username)
      .then((data) => {
        if (!cancelled) setPosts(Array.isArray(data) ? data : []);
      })
      .catch((err) => {
        if (!cancelled) setPostsError(err.message || "Couldn't load posts for this profile.");
      });
    return () => {
      cancelled = true;
    };
  }, [username]);

  function copyProfileLink() {
    const url = `${window.location.origin}/profile/${username}`;
    navigator.clipboard?.writeText(url).then(() => {
      setLinkCopied(true);
      setTimeout(() => setLinkCopied(false), 1800);
    });
  }

  function openPost(postId) {
    navigate(`/posts/${postId}`, { state: { backgroundLocation: location } });
  }

  return (
    <AppShell rightPanel={<SuggestionsPanel />}>
      {profileError && (
        <div className={styles.state}>
          <p className={styles.errorText}>{profileError}</p>
        </div>
      )}

      {!profile && !profileError && (
        <div className={styles.state}>
          <p>Loading profile…</p>
        </div>
      )}

      {profile && (
        <>
          <div className={styles.header}>
            {profile.avatar_url ? (
              <img className={styles.avatarImg} src={profile.avatar_url} alt="" />
            ) : (
              <div className={styles.avatar}>{profile.username[0]?.toUpperCase()}</div>
            )}

            <div className={styles.headerInfo}>
              <div className={styles.titleRow}>
                <h1 className={styles.username}>{profile.username}</h1>
                {!isOwn && isFollower && (
                  <span className={styles.followsYouBadge}>Follows you</span>
                )}

                {!isOwn && (
                  <div className={styles.actions}>
                    <button
                      className={`${styles.followButton} ${following ? styles.followingButton : ""}`}
                      onClick={toggleFollow}
                      disabled={followBusy}
                    >
                      {following ? "Following" : "Follow"}
                    </button>
                    <button className={styles.secondaryButton} disabled title="Coming soon">
                      Message
                    </button>
                    <button className={styles.iconButton} onClick={copyProfileLink} aria-label="Copy profile link">
                      <span className="material-symbols-outlined">more_horiz</span>
                    </button>
                  </div>
                )}

                {isOwn && (
                  <button className={styles.secondaryButton} disabled title="Coming soon">
                    Edit Profile
                  </button>
                )}
              </div>

              {linkCopied && <p className={styles.linkCopied}>Profile link copied</p>}
              {followError && <p className={styles.errorText}>{followError}</p>}

              <div className={styles.statsRow}>
                <span>
                  <strong>{profile.post_count.toLocaleString()}</strong> Posts
                </span>
                <span>
                  <strong>{Math.max(0, profile.follower_count + followerDelta).toLocaleString()}</strong> Followers
                </span>
                <span>
                  <strong>{profile.following_count.toLocaleString()}</strong> Following
                </span>
              </div>

              {profile.full_name && <p className={styles.fullName}>{profile.full_name}</p>}
              {profile.bio && <p className={styles.bio}>{profile.bio}</p>}
            </div>
          </div>

          <div className={styles.tabs}>
            {TABS.map((tab) =>
              tab.enabled ? (
                <button key={tab.key} className={`${styles.tab} ${styles.tabActive}`}>
                  <span className="material-symbols-outlined">{tab.icon}</span>
                  {tab.label}
                </button>
              ) : (
                <button key={tab.key} className={styles.tab} disabled title="Coming soon">
                  <span className="material-symbols-outlined">{tab.icon}</span>
                  {tab.label}
                </button>
              )
            )}
          </div>

          {postsError && (
            <div className={styles.state}>
              <p className={styles.errorText}>{postsError}</p>
            </div>
          )}

          {posts === null && !postsError && (
            <div className={styles.state}>
              <p>Loading posts…</p>
            </div>
          )}

          {posts?.length === 0 && !postsError && (
            <div className={styles.state}>
              <p>No posts yet.</p>
            </div>
          )}

          {posts?.length > 0 && (
            <div className={styles.grid}>
              {posts.map((post) => {
                const mediaUrl = getPostMediaUrls(post)[0];
                return (
                  <button key={post.id} className={styles.gridItem} onClick={() => openPost(post.id)}>
                    {isVideoMedia(mediaUrl) ? (
                      <video
                        src={mediaUrl}
                        muted
                        loop
                        autoPlay
                        playsInline
                        preload="metadata"
                      />
                    ) : (
                      <img src={mediaUrl} alt={post.caption} loading="lazy" />
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </>
      )}
    </AppShell>
  );
}

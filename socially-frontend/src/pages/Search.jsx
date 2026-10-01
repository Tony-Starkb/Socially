import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import AppShell from "../components/AppShell";
import SuggestionsPanel from "../components/SuggestionsPanel";
import { searchUsers } from "../api/users";
import { useFollowState } from "../hooks/useFollowState";
import styles from "./Search.module.css";

const DEBOUNCE_MS = 350;

function ResultCard({ user }) {
  const navigate = useNavigate();
  const { following, busy, error, followerDelta, toggle: toggleFollow } = useFollowState(user.username);
  const followers = Math.max(0, user.follower_count + followerDelta);

  return (
    <div className={styles.card}>
      <button
        className={styles.cardMain}
        onClick={() => navigate(`/profile/${user.username}`)}
      >
        {user.avatar_url ? (
          <img className={styles.avatarImg} src={user.avatar_url} alt="" />
        ) : (
          <div className={styles.avatar}>{user.username[0]?.toUpperCase()}</div>
        )}
        <div className={styles.info}>
          <span className={styles.username}>{user.username}</span>
          <p className={styles.meta}>
            {user.full_name && <span>{user.full_name} · </span>}
            {followers.toLocaleString()} follower{followers === 1 ? "" : "s"}
          </p>
          {user.bio && <p className={styles.bio}>{user.bio}</p>}
        </div>
      </button>
      <button
        className={`${styles.followButton} ${following ? styles.followingButton : ""}`}
        onClick={toggleFollow}
        disabled={busy}
      >
        {following ? "Following" : "Follow"}
      </button>
      {error && <p className={styles.cardError}>{error}</p>}
    </div>
  );
}

export default function Search() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState(null); // null = haven't searched yet
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const requestId = useRef(0);

  useEffect(() => {
    const trimmed = query.trim();
    if (!trimmed) {
      setResults(null);
      setLoading(false);
      setError(null);
      return;
    }

    setLoading(true);
    setError(null);
    const thisRequest = ++requestId.current;

    const timer = setTimeout(async () => {
      try {
        const data = await searchUsers(trimmed);
        if (requestId.current === thisRequest) {
          setResults(data.results || []);
        }
      } catch (err) {
        if (requestId.current === thisRequest) {
          setError(err.message || "Search failed. Try again.");
          setResults([]);
        }
      } finally {
        if (requestId.current === thisRequest) setLoading(false);
      }
    }, DEBOUNCE_MS);

    return () => clearTimeout(timer);
  }, [query]);

  return (
    <AppShell rightPanel={<SuggestionsPanel />}>
      <div className={styles.searchBar}>
        <span className="material-symbols-outlined" style={{ fontSize: "20px" }}>
          search
        </span>
        <input
          className={styles.searchInput}
          type="text"
          placeholder="Search by username…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          autoFocus
        />
        {query && (
          <button className={styles.clearButton} onClick={() => setQuery("")} aria-label="Clear search">
            <span className="material-symbols-outlined" style={{ fontSize: "18px" }}>
              close
            </span>
          </button>
        )}
      </div>

      {results === null && !loading && (
        <div className={styles.state}>
          <p>Search for someone by their username.</p>
        </div>
      )}

      {loading && (
        <div className={styles.state}>
          <p>Searching…</p>
        </div>
      )}

      {error && !loading && (
        <div className={styles.state}>
          <p className={styles.errorText}>{error}</p>
        </div>
      )}

      {results?.length === 0 && !loading && !error && (
        <div className={styles.state}>
          <p>No accounts found for "{query.trim()}".</p>
        </div>
      )}

      {results?.length > 0 && !loading && (
        <div className={styles.results}>
          {results.map((user) => (
            <ResultCard key={user.id} user={user} />
          ))}
        </div>
      )}
    </AppShell>
  );
}

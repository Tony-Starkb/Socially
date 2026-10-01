import { useCallback, useEffect, useState } from "react";
import AppShell from "../components/AppShell";
import PostCard from "../components/PostCard";
import SuggestionsPanel from "../components/SuggestionsPanel";
import { useAuth } from "../context/AuthContext";
import { getHomeFeed } from "../api/posts";
import styles from "./Feed.module.css";

export default function Feed() {
  const { user } = useAuth();
  const [posts, setPosts] = useState(null); // null = loading
  const [error, setError] = useState(null);

  const loadFeed = useCallback(async () => {
    setError(null);
    try {
      const data = await getHomeFeed();
      setPosts(data.posts || []);
    } catch (err) {
      setError(err.message || "Couldn't load your feed.");
      setPosts([]);
    }
  }, []);

  useEffect(() => {
    loadFeed();
  }, [loadFeed]);

  function handleDeleted(postId) {
    setPosts((list) => list.filter((p) => p.id !== postId));
  }

  return (
    <AppShell rightPanel={<SuggestionsPanel />}>
      {posts === null && (
        <div className={styles.state}>
          <p>Loading your feed…</p>
        </div>
      )}

      {error && posts?.length === 0 && (
        <div className={styles.state}>
          <p className={styles.errorText}>{error}</p>
          <button className={styles.retry} onClick={loadFeed}>
            Try again
          </button>
        </div>
      )}

      {posts?.length === 0 && !error && (
        <div className={styles.state}>
          <p className={styles.emptyTitle}>Your feed is empty</p>
          <p className={styles.emptySubtext}>
            Posts from people you follow will show up here. Follow a few accounts to get
            started.
          </p>
        </div>
      )}

      {posts?.map((post) => (
        <PostCard key={post.id} post={post} currentUsername={user?.username} onDeleted={handleDeleted} />
      ))}
    </AppShell>
  );
}

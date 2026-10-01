import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import styles from "./SuggestionsPanel.module.css";

export default function SuggestionsPanel() {
  const { user, logout } = useAuth();

  return (
    <div className={styles.panel}>
      <div className={styles.profileRow}>
        <Link to={`/profile/${user?.username}`} className={styles.profileInfo}>
          {user?.avatar_url ? (
            <img className={styles.avatarImg} src={user.avatar_url} alt="" />
          ) : (
            <div className={styles.avatar}>{user?.username?.[0]?.toUpperCase()}</div>
          )}
          <div>
            <p className={styles.username}>{user?.username}</p>
            <p className={styles.subtext}>Your Profile</p>
          </div>
        </Link>
        <button className={styles.logoutButton} onClick={logout}>
          Log out
        </button>
      </div>

      <div className={styles.suggestions}>
        <div className={styles.suggestionsHeader}>
          <h3 className={styles.suggestionsTitle}>Suggested for you</h3>
        </div>
        <p className={styles.suggestionsEmpty}>
          Suggestions aren't available yet — this needs a discovery endpoint on the backend
          (e.g. a "who to follow" list) before it can show real people.
        </p>
      </div>

      <footer className={styles.footer}>
        <a href="#">About</a>
        <a href="#">Help</a>
        <a href="#">Privacy</a>
        <a href="#">Terms</a>
        <div className={styles.copyright}>© 2026 InstaCore</div>
      </footer>
    </div>
  );
}

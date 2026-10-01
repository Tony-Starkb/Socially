import { NavLink, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import styles from "./AppShell.module.css";

function SidebarLink({ to, label, icon, enabled, isModal }) {
  const navigate = useNavigate();
  const location = useLocation();

  if (!enabled) {
    return (
      <span className={`${styles.navLink} ${styles.navLinkDisabled}`} title="Coming soon">
        <span className={`material-symbols-outlined ${styles.navIcon}`}>{icon}</span>
        <span className={styles.navLabel}>{label}</span>
      </span>
    );
  }

  if (isModal) {
    return (
      <button
        type="button"
        className={styles.navLink}
        onClick={() => navigate(to, { state: { backgroundLocation: location } })}
      >
        <span className={`material-symbols-outlined ${styles.navIcon}`}>{icon}</span>
        <span className={styles.navLabel}>{label}</span>
      </button>
    );
  }

  return (
    <NavLink
      to={to}
      end
      className={({ isActive }) => `${styles.navLink} ${isActive ? styles.navLinkActive : ""}`}
    >
      <span
        className={`material-symbols-outlined ${styles.navIcon}`}
        style={{ fontVariationSettings: "'FILL' 1" }}
      >
        {icon}
      </span>
      <span className={styles.navLabel}>{label}</span>
    </NavLink>
  );
}

function MobileNavLink({ to, label, icon, enabled, isModal }) {
  const navigate = useNavigate();
  const location = useLocation();

  if (!enabled) {
    return (
      <span className={styles.mobileNavLink} title="Coming soon">
        <span className="material-symbols-outlined">{icon}</span>
      </span>
    );
  }

  if (isModal) {
    return (
      <button
        type="button"
        className={styles.mobileNavLink}
        aria-label={label}
        onClick={() => navigate(to, { state: { backgroundLocation: location } })}
      >
        <span className="material-symbols-outlined">{icon}</span>
      </button>
    );
  }

  return (
    <NavLink
      to={to}
      end
      className={({ isActive }) =>
        `${styles.mobileNavLink} ${isActive ? styles.mobileNavLinkActive : ""}`
      }
    >
      <span className="material-symbols-outlined">{icon}</span>
    </NavLink>
  );
}

export default function AppShell({ rightPanel, children }) {
  const { user } = useAuth();

  const NAV_ITEMS = [
    { to: "/", label: "Home", icon: "home", enabled: true },
    { to: "/search", label: "Search", icon: "search", enabled: true },
    { to: "/create", label: "Create", icon: "add_box", enabled: true, isModal: true },
    { to: "/notifications", label: "Notifications", icon: "notifications", enabled: false },
    {
      to: user?.username ? `/profile/${user.username}` : "/profile",
      label: "Profile",
      icon: "person",
      enabled: Boolean(user?.username),
    },
  ];

  return (
    <div className={styles.root}>
      <header className={styles.mobileHeader}>
        <span className={styles.mobileBrand}>InstaCore</span>
      </header>

      <div className={styles.frame}>
        <aside className={styles.sidebar}>
          <div className={styles.brandRow}>
            <span className={styles.brandMark}>IC</span>
            <span className={styles.brandName}>InstaCore</span>
          </div>
          <nav className={styles.nav}>
            {NAV_ITEMS.map((item) => (
              <SidebarLink key={item.label} {...item} />
            ))}
          </nav>
        </aside>

        <main className={styles.main}>{children}</main>

        {rightPanel && <aside className={styles.rightRail}>{rightPanel}</aside>}
      </div>

      <nav className={styles.mobileNav}>
        {NAV_ITEMS.map((item) => (
          <MobileNavLink key={item.label} {...item} />
        ))}
      </nav>
    </div>
  );
}

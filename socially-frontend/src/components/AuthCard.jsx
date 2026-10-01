import styles from "./AuthCard.module.css";

export default function AuthCard({ title, subtitle, children, footer }) {
  return (
    <div className={styles.page}>
      <div className={styles.glow} aria-hidden="true" />
      <main className={styles.card}>
        <div className={styles.header}>
          <div className={styles.logo}>IC</div>
          <h1 className={styles.title}>{title}</h1>
          {subtitle && <p className={styles.subtitle}>{subtitle}</p>}
        </div>
        {children}
      </main>
      {footer !== false && (
        <footer className={styles.footer}>
          <span className={styles.footerBrand}>© 2026 InstaCore. All rights reserved.</span>
          <nav className={styles.footerNav}>
            <a href="#">Privacy Policy</a>
            <a href="#">Terms of Service</a>
            <a href="#">Support</a>
          </nav>
        </footer>
      )}
    </div>
  );
}

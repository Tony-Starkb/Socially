import styles from "./VisibilityToggle.module.css";

export default function VisibilityToggle({ visible, onToggle }) {
  return (
    <button
      type="button"
      className={styles.toggle}
      onClick={onToggle}
      aria-label={visible ? "Hide password" : "Show password"}
      tabIndex={0}
    >
      <span className="material-symbols-outlined" aria-hidden="true">
        {visible ? "visibility_off" : "visibility"}
      </span>
    </button>
  );
}

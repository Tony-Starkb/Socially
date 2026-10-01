import { forwardRef } from "react";
import styles from "./FormField.module.css";

const FormField = forwardRef(function FormField(
  { label, icon, error, endAdornment, labelAction, uppercaseLabel, ...inputProps },
  ref
) {
  return (
    <div className={styles.field}>
      <div className={styles.labelRow}>
        <label className={uppercaseLabel ? styles.labelUpper : styles.label} htmlFor={inputProps.id}>
          {label}
        </label>
        {labelAction}
      </div>
      <div className={styles.inputWrap}>
        {icon && (
          <span className={`material-symbols-outlined ${styles.icon}`} aria-hidden="true">
            {icon}
          </span>
        )}
        <input
          ref={ref}
          className={`${styles.input} ${icon ? styles.inputWithIcon : ""} ${
            endAdornment ? styles.inputWithEndAdornment : ""
          } ${error ? styles.inputError : ""}`}
          aria-invalid={error ? "true" : undefined}
          aria-describedby={error ? `${inputProps.id}-error` : undefined}
          {...inputProps}
        />
        {endAdornment}
      </div>
      {error && (
        <p className={styles.error} id={`${inputProps.id}-error`}>
          <span className={`material-symbols-outlined ${styles.errorIcon}`} aria-hidden="true">
            error
          </span>
          {error}
        </p>
      )}
    </div>
  );
});

export default FormField;

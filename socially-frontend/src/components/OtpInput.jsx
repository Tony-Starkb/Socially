import { useRef } from "react";
import styles from "./OtpInput.module.css";

const LENGTH = 6;

/**
 * Six single-digit boxes that behave like one field.
 * `value` is a plain string of up to 6 digits; `onChange` gets the new string.
 */
export default function OtpInput({ value, onChange, disabled, invalid, autoFocus }) {
  const refs = useRef([]);
  const digits = Array.from({ length: LENGTH }, (_, i) => value[i] || "");

  function focusBox(index) {
    const target = refs.current[Math.max(0, Math.min(LENGTH - 1, index))];
    if (target) {
      target.focus();
      target.select();
    }
  }

  function setDigit(index, digit) {
    const next = digits.slice();
    next[index] = digit;
    // Trailing blanks are dropped so `value` stays a contiguous string.
    onChange(next.join("").slice(0, LENGTH));
  }

  function handleChange(index, event) {
    const typed = event.target.value.replace(/\D/g, "");
    if (!typed) return;
    if (typed.length > 1) {
      // Autofill / IME can drop several digits into one box at once.
      fillFrom(index, typed);
      return;
    }
    setDigit(index, typed);
    if (index < LENGTH - 1) focusBox(index + 1);
  }

  function fillFrom(index, text) {
    const next = digits.slice();
    const incoming = text.slice(0, LENGTH - index).split("");
    incoming.forEach((d, i) => {
      next[index + i] = d;
    });
    onChange(next.join("").slice(0, LENGTH));
    focusBox(index + incoming.length);
  }

  function handleKeyDown(index, event) {
    if (event.key === "Backspace") {
      event.preventDefault();
      if (digits[index]) {
        setDigit(index, "");
      } else if (index > 0) {
        setDigit(index - 1, "");
        focusBox(index - 1);
      }
    } else if (event.key === "ArrowLeft") {
      event.preventDefault();
      focusBox(index - 1);
    } else if (event.key === "ArrowRight") {
      event.preventDefault();
      focusBox(index + 1);
    }
  }

  function handlePaste(index, event) {
    const text = event.clipboardData.getData("text").replace(/\D/g, "");
    if (!text) return;
    event.preventDefault();
    // A pasted full code always replaces from the first box.
    fillFrom(text.length >= LENGTH ? 0 : index, text);
  }

  return (
    <div className={styles.row} role="group" aria-label="6-digit verification code">
      {digits.map((digit, i) => (
        <input
          key={i}
          ref={(el) => (refs.current[i] = el)}
          className={`${styles.box} ${invalid ? styles.invalid : ""}`}
          type="text"
          inputMode="numeric"
          pattern="[0-9]*"
          maxLength={LENGTH}
          autoComplete={i === 0 ? "one-time-code" : "off"}
          autoFocus={autoFocus && i === 0}
          placeholder="·"
          aria-label={`Digit ${i + 1} of ${LENGTH}`}
          value={digit}
          disabled={disabled}
          onChange={(e) => handleChange(i, e)}
          onKeyDown={(e) => handleKeyDown(i, e)}
          onPaste={(e) => handlePaste(i, e)}
          onFocus={(e) => e.target.select()}
        />
      ))}
    </div>
  );
}

import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import AuthCard from "../components/AuthCard";
import FormField from "../components/FormField";
import VisibilityToggle from "../components/VisibilityToggle";
import { useAuth } from "../context/AuthContext";
import { ApiError } from "../lib/http";
import { validateUsername, validatePassword, passwordStrength } from "../lib/validators";
import styles from "./Signup.module.css";

const STRENGTH_COLORS = ["strength1", "strength2", "strength3", "strength4"];

export default function Signup() {
  const { register } = useAuth();
  const navigate = useNavigate();

  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [agreed, setAgreed] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const strength = passwordStrength(password);

  function validate() {
    const next = {};

    const usernameError = username ? validateUsername(username) : "Username is required.";
    if (usernameError) next.username = usernameError;

    if (!email.trim()) next.email = "Email is required.";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) next.email = "Enter a valid email address.";

    const passwordError = password ? validatePassword(password) : "Password is required.";
    if (passwordError) next.password = passwordError;

    if (confirmPassword !== password) next.confirmPassword = "Passwords don't match.";

    if (!agreed) next.terms = "You must agree to the Terms of Service and Privacy Policy.";

    setErrors(next);
    return Object.keys(next).length === 0;
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setFormError(null);
    if (!validate()) return;

    setSubmitting(true);
    try {
      await register({ username: username.trim(), email: email.trim(), password });
      navigate("/login", {
        replace: true,
        state: { justRegistered: true },
      });
    } catch (err) {
      if (err instanceof ApiError && err.status === 409) {
        setFormError(err.message);
      } else if (err instanceof ApiError && err.status === 422) {
        setFormError(err.message);
      } else {
        setFormError(err.message || "Something went wrong. Try again.");
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <AuthCard title="Join InstaCore">
      <form className={styles.form} onSubmit={handleSubmit} noValidate>
        <FormField
          id="username"
          label="Username"
          uppercaseLabel
          type="text"
          placeholder="creative_mind_99"
          autoComplete="username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          error={errors.username}
        />

        <FormField
          id="email"
          label="Email"
          uppercaseLabel
          type="email"
          placeholder="hello@example.com"
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          error={errors.email}
        />

        <div>
          <FormField
            id="password"
            label="Password"
            uppercaseLabel
            type={showPassword ? "text" : "password"}
            placeholder="••••••••"
            autoComplete="new-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            error={errors.password}
            endAdornment={
              <VisibilityToggle visible={showPassword} onToggle={() => setShowPassword((v) => !v)} />
            }
          />
          <div className={styles.strengthMeter} aria-hidden="true">
            {[0, 1, 2, 3].map((i) => (
              <div key={i} className={styles.strengthTrack}>
                <div
                  className={`${styles.strengthFill} ${
                    i < strength ? styles[STRENGTH_COLORS[strength - 1]] : ""
                  }`}
                  style={{ width: i < strength ? "100%" : "0%" }}
                />
              </div>
            ))}
          </div>
        </div>

        <FormField
          id="confirm-password"
          label="Confirm Password"
          uppercaseLabel
          type={showPassword ? "text" : "password"}
          placeholder="••••••••"
          autoComplete="new-password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          error={errors.confirmPassword}
        />

        <div className={styles.termsRow}>
          <input
            id="terms"
            type="checkbox"
            className={styles.checkbox}
            checked={agreed}
            onChange={(e) => setAgreed(e.target.checked)}
          />
          <label htmlFor="terms" className={styles.termsLabel}>
            I agree to the <a href="#">Terms of Service</a> and <a href="#">Privacy Policy</a>
          </label>
        </div>
        {errors.terms && (
          <p className={styles.termsError} role="alert">
            {errors.terms}
          </p>
        )}

        {formError && (
          <p className={styles.formError} role="alert">
            <span className="material-symbols-outlined" aria-hidden="true">
              error
            </span>
            {formError}
          </p>
        )}

        <button type="submit" className={styles.submit} disabled={submitting}>
          {submitting ? "Creating account…" : "Create Account"}
        </button>
      </form>

      <p className={styles.loginPrompt}>
        Already have an account? <Link to="/login">Log in</Link>
      </p>
    </AuthCard>
  );
}

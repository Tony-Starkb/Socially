// Mirrors services/user_input_validation.py so the form can reject bad
// input immediately, with the same messages the backend would return.

export function validateUsername(raw) {
  const username = raw.trim();
  if (username.length < 5) return "Username must be at least 5 characters long.";
  if (!/^[a-zA-Z0-9_\-$@#]+$/.test(username))
    return "Username can only contain letters, numbers, and _, -, $, @, #.";
  const first = username[0];
  const last = username[username.length - 1];
  if (!/[a-zA-Z0-9]/.test(first) || !/[a-zA-Z0-9]/.test(last))
    return "Username cannot start or end with a special character.";
  if (!/[a-zA-Z]/.test(username)) return "Username must contain at least one letter.";
  return null;
}

export function validatePassword(raw) {
  const password = raw.trim();
  if (password.length < 8) return "Password must be at least 8 characters long.";
  if (!/[a-zA-Z]/.test(password)) return "Password must contain at least one letter.";
  if (!/[0-9]/.test(password)) return "Password must contain at least one number.";
  if (!/[!@#$%&*]/.test(password))
    return "Password must contain at least one special character (!, @, #, $, %, &, *).";
  return null;
}

// 0-4 scale driving the strength meter — cosmetic only, validatePassword
// is what actually gates submission.
export function passwordStrength(raw) {
  const password = raw || "";
  let score = 0;
  if (password.length >= 8) score++;
  if (/[a-z]/.test(password) && /[A-Z]/.test(password)) score++;
  if (/[0-9]/.test(password)) score++;
  if (/[!@#$%&*]/.test(password)) score++;
  return score;
}

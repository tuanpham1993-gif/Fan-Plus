const PHONE_PATTERN = /^[0-9+\s()\-]+$/;
const SPECIAL_CHARACTER_PATTERN = /[!-\/:-@\[-`{-~]/;

export function validatePhone(value: string): string {
  const phone = value.trim();
  if (!phone) return "";
  if (!PHONE_PATTERN.test(phone)) {
    return "Use only digits, +, spaces, hyphens, and parentheses in the phone number.";
  }
  const compact = phone.replace(/\s/g, "");
  const digits = phone.match(/[0-9]/g)?.length ?? 0;
  if (compact.length < 8 || compact.length > 20 || digits < 8) {
    return "Phone number must have 8 to 20 non-space characters and at least 8 digits.";
  }
  return "";
}

export function validateBirthday(value: string): string {
  const birthday = value.trim();
  if (!birthday) return "";
  if (!/^\d{4}-\d{2}-\d{2}$/.test(birthday)) {
    return "Enter a valid date of birth in YYYY-MM-DD format.";
  }
  const parsed = new Date(`${birthday}T00:00:00.000Z`);
  if (
    Number.isNaN(parsed.getTime()) ||
    parsed.toISOString().slice(0, 10) !== birthday
  ) {
    return "Enter a valid date of birth in YYYY-MM-DD format.";
  }
  const today = new Date();
  const todayString = [
    today.getFullYear(),
    String(today.getMonth() + 1).padStart(2, "0"),
    String(today.getDate()).padStart(2, "0"),
  ].join("-");
  if (birthday > todayString) return "Date of birth cannot be in the future.";

  let age = today.getFullYear() - parsed.getUTCFullYear();
  const birthdayMonth = parsed.getUTCMonth();
  const birthdayDay = parsed.getUTCDate();
  if (
    today.getMonth() < birthdayMonth ||
    (today.getMonth() === birthdayMonth && today.getDate() < birthdayDay)
  ) {
    age -= 1;
  }
  return age > 120 ? "Age cannot exceed 120 years." : "";
}

export function validateBio(value: string): string {
  return value.trim().length > 300
    ? "About me must be 300 characters or fewer."
    : "";
}

export function validateCity(value: string): string {
  return value.trim().length > 100
    ? "City must be 100 characters or fewer."
    : "";
}

export function validateNewPassword(password: string): string {
  if (password.length < 8)
    return "Password must be at least 8 characters long.";
  if (!/[A-Z]/.test(password)) {
    return "Password must contain at least one uppercase letter.";
  }
  if (!/[a-z]/.test(password)) {
    return "Password must contain at least one lowercase letter.";
  }
  if (!/\d/.test(password)) return "Password must contain at least one number.";
  if (!SPECIAL_CHARACTER_PATTERN.test(password)) {
    return "Password must contain at least one special character (!@#$%^&*...).";
  }
  return "";
}

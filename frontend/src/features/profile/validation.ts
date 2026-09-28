const PHONE_PATTERN = /^[0-9+\s()\-]+$/;
const SPECIAL_CHARACTER_PATTERN = /[!-\/:-@\[-`{-~]/;

export function validatePhone(value: string): string {
  const phone = value.trim();
  if (!phone) return "";
  if (!PHONE_PATTERN.test(phone)) {
    return "Số điện thoại chỉ được chứa chữ số, dấu +, khoảng trắng, dấu gạch ngang và ngoặc đơn";
  }
  const compact = phone.replace(/\s/g, "");
  const digits = phone.match(/[0-9]/g)?.length ?? 0;
  if (compact.length < 8 || compact.length > 20 || digits < 8) {
    return "Số điện thoại phải có từ 8 đến 20 ký tự (không tính khoảng trắng) và ít nhất 8 chữ số";
  }
  return "";
}

export function validateBirthday(value: string): string {
  const birthday = value.trim();
  if (!birthday) return "";
  if (!/^\d{4}-\d{2}-\d{2}$/.test(birthday)) {
    return "Ngày sinh phải có định dạng YYYY-MM-DD hợp lệ";
  }
  const parsed = new Date(`${birthday}T00:00:00.000Z`);
  if (
    Number.isNaN(parsed.getTime()) ||
    parsed.toISOString().slice(0, 10) !== birthday
  ) {
    return "Ngày sinh phải có định dạng YYYY-MM-DD hợp lệ";
  }
  const today = new Date();
  const todayString = [
    today.getFullYear(),
    String(today.getMonth() + 1).padStart(2, "0"),
    String(today.getDate()).padStart(2, "0"),
  ].join("-");
  if (birthday > todayString) return "Ngày sinh không được ở tương lai";

  let age = today.getFullYear() - parsed.getUTCFullYear();
  const birthdayMonth = parsed.getUTCMonth();
  const birthdayDay = parsed.getUTCDate();
  if (
    today.getMonth() < birthdayMonth ||
    (today.getMonth() === birthdayMonth && today.getDate() < birthdayDay)
  ) {
    age -= 1;
  }
  return age > 120 ? "Tuổi không được vượt quá 120" : "";
}

export function validateBio(value: string): string {
  return value.trim().length > 300
    ? "Giới thiệu bản thân không được vượt quá 300 ký tự"
    : "";
}

export function validateCity(value: string): string {
  return value.trim().length > 100
    ? "Thành phố không được vượt quá 100 ký tự"
    : "";
}

export function validateNewPassword(password: string): string {
  if (password.length < 8) return "Mật khẩu phải có ít nhất 8 ký tự";
  if (!/[A-Z]/.test(password)) {
    return "Mật khẩu phải chứa ít nhất 1 chữ cái viết hoa";
  }
  if (!/[a-z]/.test(password)) {
    return "Mật khẩu phải chứa ít nhất 1 chữ cái viết thường";
  }
  if (!/\d/.test(password)) return "Mật khẩu phải chứa ít nhất 1 chữ số";
  if (!SPECIAL_CHARACTER_PATTERN.test(password)) {
    return "Mật khẩu phải chứa ít nhất 1 ký tự đặc biệt (!@#$%^&*...)";
  }
  return "";
}

export function formatAuthError(message: string) {
  const normalized = message.toLowerCase();

  if (normalized.includes("email not confirmed") || normalized.includes("confirm your email")) {
    return "البريد الإلكتروني غير مؤكد. اضغط على رابط التأكيد أو أعد إرسال الرابط.";
  }

  if (normalized.includes("invalid login") || normalized.includes("invalid credentials")) {
    return "البريد الإلكتروني أو كلمة المرور غير صحيحة.";
  }

  if (normalized.includes("already registered") || normalized.includes("user already exists")) {
    return "هذا البريد مسجل مسبقًا. سجّل الدخول أو أعد إرسال رابط التأكيد.";
  }

  return message;
}

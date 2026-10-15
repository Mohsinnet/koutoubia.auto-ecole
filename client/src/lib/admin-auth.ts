export const ADMIN_USERNAME = "admin";
export const ADMIN_EMAIL = "koutoubiauto@gmail.com";

function normalizeLoginValue(value: string) {
  return value.replace(/[\u200B-\u200D\uFEFF]/g, "").trim().toLocaleLowerCase();
}

export function isAdminUsername(value: string) {
  const normalized = normalizeLoginValue(value);
  return normalized === ADMIN_USERNAME || normalized === ADMIN_EMAIL;
}

export const ADMIN_USERNAME = "admin";

export function isAdminUsername(value: string) {
  return value.trim().toLowerCase() === ADMIN_USERNAME;
}

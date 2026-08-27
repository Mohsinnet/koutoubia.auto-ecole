export function getAuthRedirectUrl(origin: string, baseUrl: string) {
  return new URL(baseUrl || "/", origin).toString();
}

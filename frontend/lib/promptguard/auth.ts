import { authApi } from "@/lib/api/auth";

export function isAuthenticated(): boolean {
  return authApi.isAuthenticated();
}

export function logout(): void {
  authApi.logout();
}

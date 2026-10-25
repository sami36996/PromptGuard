import { apiClient } from "./client";

export interface UserProfile {
  id: number;
  email: string;
  full_name: string | null;
  is_active: boolean;
  is_super_admin: boolean;
  created_at: string;
}

export interface UserProfileUpdate {
  full_name?: string;
  email?: string;
}

export async function getMe(): Promise<UserProfile> {
  return apiClient.get<UserProfile>("/users/me");
}

export async function updateMe(
  data: UserProfileUpdate,
): Promise<UserProfile> {
  return apiClient.put<UserProfile>("/users/me", data);
}

export async function changePassword(
  currentPassword: string,
  newPassword: string,
): Promise<void> {
  await apiClient.post("/users/me/password", {
    current_password: currentPassword,
    new_password: newPassword,
  });
}

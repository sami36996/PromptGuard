import { apiClient } from "./client";

export interface ApiKey {
  id: number | string;
  name?: string | null;
  api_key?: string | null;
  key_prefix: string;
  created_at?: string;
  last_used_at?: string | null;
  is_active?: boolean;
}

export interface CreateApiKeyRequest {
  name?: string;
}

export async function getApiKeys(): Promise<ApiKey[]> {
  return apiClient.get<ApiKey[]>("/api-keys/api-keys");
}

export async function createApiKey(
  data: CreateApiKeyRequest = {},
): Promise<ApiKey> {
  const query = data.name
    ? `?name=${encodeURIComponent(data.name)}`
    : "";

  return apiClient.post<ApiKey>(
    `/api-keys/api-keys/generate${query}`,
  );
}

export async function revokeApiKey(
  keyId: number | string,
): Promise<void> {
  await apiClient.delete(
    `/api-keys/api-keys/${keyId}`,
  );
}
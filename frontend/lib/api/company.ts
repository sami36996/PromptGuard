import { apiClient } from "./client";

export interface Company {
  id: number;
  name: string;
  slug: string;
  description: string | null;
  plan: string | null;
  is_active: boolean;
  email: string | null;
  website: string | null;
  created_at: string;
  email_alerts?: boolean;
  high_risk_alerts?: boolean;
  quarantine_alerts?: boolean;
}

export async function getMyCompany(): Promise<Company> {
  return apiClient.get<Company>("/company/me");
}

export async function updateMyCompany(
  data: Partial<Company>
): Promise<Company> {
  return apiClient.put<Company>("/company/me", data);
}
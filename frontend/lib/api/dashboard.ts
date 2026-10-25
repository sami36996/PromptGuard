import { apiClient } from "./client";

export interface DashboardOverview {
  total_agents: number;
  active_agents: number;
  quarantined_agents: number;
  total_messages: number;
  blocked_prompts: number;
  review_prompts: number;
  average_trust: number;
  highest_chain_risk: number;
}

export interface RequestStats {
  total_requests: number;
  allowed: number;
  review: number;
  blocked: number;
}

export async function getDashboardOverview(): Promise<DashboardOverview> {
  return apiClient.get<DashboardOverview>("/api/dashboard");
}

export async function getRequestStats(): Promise<RequestStats> {
  return apiClient.get<RequestStats>("/api/stats");
}
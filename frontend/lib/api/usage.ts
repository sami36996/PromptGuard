import { apiClient } from "./client";

export interface UsageSummary {
  total_requests: number;
  allowed_requests: number;
  review_requests: number;
  blocked_requests: number;
  total_tokens?: number;
  period?: string;
}

interface AnalyticsStats {
  total_requests: number;
  allowed: number;
  blocked: number;
  flagged: number;
}

export async function getUsage(): Promise<UsageSummary> {
  const stats = await apiClient.get<AnalyticsStats>(
    "/api/analytics/stats",
  );

  return {
    total_requests: stats.total_requests,
    allowed_requests: stats.allowed,
    review_requests: stats.flagged,
    blocked_requests: stats.blocked,
  };
}
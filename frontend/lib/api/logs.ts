import { apiClient } from "./client";
import type { Decision } from "@/lib/promptguard/types";

export interface PromptLog {
  id: number | string;
  prompt: string;
  response?: string | null;

  decision: Decision;
  risk_score: number;
  trust_score: number;

  agent_id?: string | null;

  created_at: string;

  findings?: string[];
}

interface GuardLog {
  id: number;
  prompt: string;
  action: string;
  score: number;
  agent_id: number | null;
  detections: Array<{ type?: string; detector?: string }> | null;
  created_at: string;
}

interface PaginatedLogs {
  items: GuardLog[];
  total: number;
  page: number;
  page_size: number;
  pages: number;
}

export async function getLogs(): Promise<PromptLog[]> {
  const response = await apiClient.get<PaginatedLogs>(
    "/api/logs?page=1&page_size=100",
  );

  return response.items.map((log) => ({
    id: log.id,
    prompt: log.prompt,
    decision: normalizeDecision(log.action),
    risk_score: log.score,
    trust_score: Math.max(0, 100 - log.score),
    agent_id: log.agent_id === null ? null : String(log.agent_id),
    created_at: log.created_at,
    findings: (log.detections ?? []).map(
      (detection) =>
        detection.type ?? detection.detector ?? "Security finding",
    ),
  }));
}

function normalizeDecision(action: string): Decision {
  const normalized = action.toUpperCase();
  if (normalized === "BLOCK") return "BLOCK";
  if (normalized === "FLAG" || normalized === "SANITIZE") return "REVIEW";
  return "ALLOW";
}
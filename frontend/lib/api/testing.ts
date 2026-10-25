import { apiClient } from "./client";

export interface ChatRequest {
  prompt: string;
}

export interface ChatResponse {
  status: "allowed" | "blocked";
  decision: string;
  score: number;
  severity: string;
  findings: string[];
  response?: string;
  llm_error?: string;
  analysis: {
    decision: string;
    score: number;
    severity: string;
    findings: string[];
    breakdown: Record<string, number>;
  };
}

export interface AgentMessage {
  to_agent: string;
  message: string;
  origin_agent: string | null;
}

export interface AgentMessageResponse {
  status: string;
  decision: string;
  score: number;
  findings: string[];
  chain_id?: string;
  chain_risk?: number;
  trust_score?: number;
  analysis?: {
    decision: string;
    score: number;
    findings: string[];
  };
}

export async function sendChatMessage(
  data: ChatRequest,
): Promise<ChatResponse> {
  const response = await apiClient.post<{
    status: "allowed" | "blocked";
    analysis: ChatResponse["analysis"];
    response?: string;
    llm_error?: string;
  }>("/api/chat", data);

  return {
    ...response,
    decision: response.analysis.decision.toUpperCase(),
    score: response.analysis.score,
    severity: response.analysis.severity,
    findings: response.analysis.findings,
  };
}

export async function sendAgentMessage(
  data: AgentMessage,
): Promise<AgentMessageResponse> {
  const response = await apiClient.post<Omit<
    AgentMessageResponse,
    "decision" | "score" | "findings"
  > & {
    analysis?: AgentMessageResponse["analysis"];
  }>(
    "/api/agents/a2a",
    data,
  );

  return {
    ...response,
    decision: (response.analysis?.decision ?? response.status).toUpperCase(),
    score: response.analysis?.score ?? response.chain_risk ?? 0,
    findings: response.analysis?.findings ?? [],
  };
}

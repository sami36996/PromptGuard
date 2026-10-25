import { apiClient } from "./client";
import type {
  AgentDetail,
  AgentListItem,
} from "@/lib/types/agent";

export function getAgents() {
  return apiClient.get<AgentListItem[]>("/api/agents");
}

export function getAgent(agentId: string) {
  return apiClient.get<AgentDetail>(
    `/api/agents/${agentId}`,
  );
}

export type RegisterAgentRequest = {
  agent_name: string;
  agent_type: string;
  organization: string;
  description: string;
};

export type RegisteredAgentResponse = {
  agent_id: string;
  agent_name: string;
  agent_type: string;
  organization: string;
  description: string;
  api_key: string;
};

export function registerAgent(data: RegisterAgentRequest) {
  return apiClient.post<RegisteredAgentResponse>(
    "/api/agents/register",
    data,
  );
}
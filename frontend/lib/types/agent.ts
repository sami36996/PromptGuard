import type { AgentStatus } from "@/lib/promptguard/types";

export type AgentListItem = {
  id: string;
  name: string;
  status: AgentStatus;
  trust: number;
  risk: number;
  messagesSent: number;
  createdAt: string;
};

export type AgentDetail = AgentListItem & {
  agentId?: string;
  type?: string;
  organization?: string;
  description?: string;

  apiKey?: string | null;
  messagesReceived?: number;
  blocked?: number;

  registeredAt?: string;
  lastSeen?: string | null;

  strikes?: number;
  quarantineReason?: string | null;
};
export type AgentType =
  | "LLM"
  | "API"
  | "AGENT"
  | "SERVICE"
  | "Research"
  | "Finance"
  | "Customer Support"
  | "Data"
  | "Orchestrator"
  | "Marketing";

export type Decision = "ALLOW" | "REVIEW" | "BLOCK";

export interface Finding {
  category: string;
  detail: string;
  severity: "low" | "medium" | "high" | "critical";
}

export interface Analysis {
  score: number;

  risk: number;

  decision: Decision;

  reason: string;

  latencyMs: number;

  findings: Finding[];
}

export type AgentStatus =
| "ACTIVE" 
| "INACTIVE" 
| "QUARANTINED" 
| "WARNING";

export interface Agent {
  id: string;
  name: string;
  type: string;
  organization: string;
  description?: string;

  status: AgentStatus;

  trust: number;
  risk: number;

  messagesSent: number;
  messagesReceived: number;
  blocked: number;

  createdAt: string;
  registeredAt: string;
  lastSeen: string | null;

  apiKey?: string;
  strikes?: number;
  quarantineReason?: string | null;
}

export interface SecurityEvent {
  id: string;

  agentId: string;

  agentName: string;

  destinationId: string;

  destinationName: string;

  decision: Decision;

  risk: number;

  trust: number;

  content: string;

  chainId: string;

  time: number;

  findings: Finding[];
}

export interface Chain {
  id: string;

  chainRisk: number;

  createdAt: number | string;

  finalVerdict: Decision;

  hops: Hop[];
}

export interface Hop {
  from: string;

  to: string;

  attackTypes: string[];

  decision: Decision;

  risk: number;
}

export interface Policy {
  maxChainRisk: number;

  reviewThreshold: number;

  blockThreshold: number;

  quarantineStrikes: number;
}

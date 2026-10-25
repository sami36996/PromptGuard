import {
  AgentStatus,
  AgentType,
  Decision,
  Analysis,
  Finding,
  Policy,
  SecurityEvent,
} from "./types";

export interface Agent {
  id: string;
  name: string;
  type: AgentType;
  organization: string;
  description: string;

  apiKey: string;

  status: AgentStatus;

  trust: number;
  risk: number;

  messagesSent: number;
  messagesReceived: number;

  blocked: number;

  registeredAt: number;
  lastSeen: number;

  strikes: number;

  quarantineReason?: string;
}

export interface Chain {
  id: string;
  hops: any[];
  chainRisk: number;
  createdAt: number | string;
  finalVerdict: Decision;
}

export interface StoreState {
  agents: Agent[];

  events: SecurityEvent[];

  chains: Chain[];

  policy: Policy;

  setStatus(id: string, status: AgentStatus, reason?: string): void;

  rotateApiKey(id: string): void;

  deleteAgent(id: string): void;

  registerAgent(data: Partial<Agent>): Agent;

  updatePolicy(policy: Partial<Policy>): void;

  analyze(prompt: string): Analysis;
}

export const store: StoreState = {
  agents: [],

  events: [],

  chains: [],

  policy: {
    maxChainRisk: 70,
    reviewThreshold: 30,
    blockThreshold: 70,
    quarantineStrikes: 3,
  },

  setStatus(id: string, status: AgentStatus, reason?: string) {
    const agent = this.agents.find((a) => a.id === id);

    if (agent) {
      agent.status = status;
    }
  },

  rotateApiKey(id: string) {
    const agent = this.agents.find((a) => a.id === id);

    if (agent) {
      agent.apiKey = "pg-" + crypto.randomUUID();
    }
  },

  deleteAgent(id: string) {
    this.agents = this.agents.filter((a) => a.id !== id);
  },

  registerAgent(data: Partial<Agent>): Agent {
    const agent: Agent = {
      id: crypto.randomUUID(),

      name: data.name || "New Agent",

      type: data.type || "LLM",

      organization: data.organization || "Unknown",

      description: data.description || "",

      apiKey: "pg-" + crypto.randomUUID(),

      status: "ACTIVE",

      trust: 100,

      risk: 0,

      messagesSent: 0,

      messagesReceived: 0,

      blocked: 0,

      registeredAt: Date.now(),

      lastSeen: Date.now(),

      strikes: 0,
    };

    this.agents.push(agent);

    return agent;
  },

  updatePolicy(policy: Partial<Policy>) {
    this.policy = {
      ...this.policy,
      ...policy,
    };
  },

  analyze(prompt: string) {
    return {
      score: 0,
      risk: 0,
      decision: "ALLOW",
      reason: "No threats detected",
      latencyMs: 0,
      findings: [],
    };
  },
};

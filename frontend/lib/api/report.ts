import { apiClient } from "./client";

export interface IncidentReport {
  generated_at: string;

  summary: {
    total_messages: number;
    allowed: number;
    review: number;
    blocked: number;
  };

  agents: {
    total: number;
    ACTIVE: number;
    QUARANTINED: number;
  };

  average_trust: number;
  average_risk: number;
  highest_chain_risk: number;
  highest_risk_agent: string | null;

  recommendations: string[];
}

export async function getReport(): Promise<IncidentReport> {
  const response = await apiClient.get<
    Omit<IncidentReport, "agents"> & {
      agents: {
        total: number;
        active: number;
        quarantined: number;
      };
    }
  >("/api/report/");

  return {
    ...response,
    agents: {
      total: response.agents.total,
      ACTIVE: response.agents.active,
      QUARANTINED: response.agents.quarantined,
    },
  };
}

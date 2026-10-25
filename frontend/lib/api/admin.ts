import { apiClient } from "./client";
import type { Company } from "./company";

export interface AdminStats {
  total_companies: number;
  total_agents: number;
  total_requests: number;
  total_blocked: number;
  active_today: number;
  threats_today: number;

  // Optional future fields
  quarantined_agents?: number;
  average_trust?: number;
  average_risk?: number;
  critical_chains?: number;
}

export interface AdminAgent {
  id: number;
  agent_id: string;
  company_id: number;
  company_name: string;
  agent_name: string;
  agent_type: string;
  status: string;
  total_messages: number;
  blocked_messages: number;
  trust_score: number;
  last_seen: string | null;
  created_at: string;
}

export interface ThreatEvent {
  id: number;
  company_id: number;
  agent_id: number | null;
  guard_log_id: number | null;
  threat_type: string;
  severity: string;
  confidence: number;
  matched_text: string | null;
  prompt_snippet: string | null;
  status: string;
  created_at: string;
}

export async function getAdminStats(): Promise<AdminStats> {
  return apiClient.get<AdminStats>("/admin/stats");
}

export async function getGlobalAgents(): Promise<AdminAgent[]> {
  return apiClient.get<AdminAgent[]>("/admin/agents/global");
}

export async function getGlobalThreats(): Promise<ThreatEvent[]> {
  return apiClient.get<ThreatEvent[]>("/admin/threats/global");
}

export async function getCompanyAgents(
  companyId: number
): Promise<AdminAgent[]> {
  return apiClient.get<AdminAgent[]>(
    `/admin/companies/${companyId}/agents`
  );
}
export interface AdminCompany {
  id: number;
  name: string;
  slug: string;
  is_active: boolean;
  member_count: number;
  agent_count: number;
  total_requests: number;
  created_at: string;
}

export async function getCompanies(): Promise<AdminCompany[]> {
  return apiClient.get<AdminCompany[]>("/admin/companies");
}

export async function getCompany(
  companyId: number
): Promise<Company> {
  return apiClient.get<Company>(
    `/admin/companies/${companyId}`
  );
}

export interface AdminPolicy {
  id?: number;
  name?: string;
  review_threshold: number;
  block_threshold: number;
  quarantine_threshold: number;
  max_chain_risk: number;
  auto_quarantine: boolean;
}

export async function getAdminPolicy(): Promise<AdminPolicy> {
  return apiClient.get<AdminPolicy>("/admin/policy");
}

export async function updateAdminPolicy(
  policy: Omit<AdminPolicy, "id" | "name">,
): Promise<AdminPolicy> {
  const query = new URLSearchParams({
    review_threshold: String(policy.review_threshold),
    block_threshold: String(policy.block_threshold),
    quarantine_threshold: String(policy.quarantine_threshold),
    max_chain_risk: String(policy.max_chain_risk),
    auto_quarantine: String(policy.auto_quarantine),
  });
  const response = await apiClient.put<{
    policy: AdminPolicy;
  }>(`/admin/policy?${query.toString()}`);
  return response.policy;
}

export function quarantineAgent(agentId: string) {
  return apiClient.post(`/admin/agents/${agentId}/quarantine`);
}

export function activateAgent(agentId: string) {
  return apiClient.post(`/admin/agents/${agentId}/activate`);
}

export function rotateAgentKey(agentId: string) {
  return apiClient.post<{
    api_key: string;
    message: string;
  }>(`/admin/agents/${agentId}/rotate-key`);
}

export function revokeAgent(agentId: string) {
  return apiClient.post(`/admin/agents/${agentId}/revoke`);
}
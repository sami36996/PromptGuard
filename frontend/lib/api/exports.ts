import { apiClient } from "./client";

export function downloadAgentsCsv() {
  return apiClient.download("/api/export/agents/csv");
}

export function downloadLogsCsv() {
  return apiClient.download("/api/export/logs/csv");
}

export function downloadLogsJson() {
  return apiClient.download("/api/export/logs/json");
}
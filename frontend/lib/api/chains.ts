import { apiClient } from "./client";
import type { Chain } from "@/lib/promptguard/types";

export function getChains() {
  return apiClient.get<Chain[]>("/api/chain");
}

export function getChain(chainId: string) {
  return apiClient.get<Chain>(`/api/chain/${chainId}`);
}
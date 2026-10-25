import { apiClient } from "./client"

export interface Policy {
  id?: string

  maxRisk: number
  maxChainRisk: number
  autoBlock: boolean

  allowedModels: string[]
  blockedKeywords: string[]

  updatedAt?: string
}

export interface UpdatePolicyRequest {
  maxRisk: number
  maxChainRisk: number
  autoBlock: boolean

  allowedModels: string[]
  blockedKeywords: string[]
}

export const policyApi = {
  async get(): Promise<Policy> {
    return apiClient.get("/api/policy")
  },

  async update(data: UpdatePolicyRequest): Promise<Policy> {
    return apiClient.put("/api/policy", data)
  },

  async reset(): Promise<Policy> {
    return apiClient.post("/api/policy/reset")
  }
}
"use client"

import { useEffect, useState } from "react"
import { policyApi, Policy, UpdatePolicyRequest } from "@/lib/api/policies"
import { apiClient } from "@/lib/api/client";
export function usePolicy() {
  const [policy, setPolicy] = useState<Policy | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function loadPolicy() {
    try {
      setLoading(true)
      setError(null)

      const data = await policyApi.get()

      setPolicy(data)
    } catch {
      setError("Failed to load policy")
    } finally {
      setLoading(false)
    }
  }

  async function updatePolicy(data: UpdatePolicyRequest) {
    try {
      setSaving(true)

      const updated = await policyApi.update(data)

      setPolicy(updated)

      return true
    } catch {
      setError("Failed to update policy")
      return false
    } finally {
      setSaving(false)
    }
  }

  async function resetPolicy() {
    try {
      setSaving(true)

      const policy = await policyApi.reset()

      setPolicy(policy)

      return true
    } catch {
      setError("Failed to reset policy")
      return false
    } finally {
      setSaving(false)
    }
  }

  useEffect(() => {
    loadPolicy()
  }, [])

  return {
    policy,
    loading,
    saving,
    error,
    reload: loadPolicy,
    updatePolicy,
    resetPolicy,
  }
}

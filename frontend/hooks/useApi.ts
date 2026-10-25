"use client"

import { useEffect, useState } from "react"

export function useApi<T>(
  request: () => Promise<T>,
  dependencies: any[] = []
) {
  const [data, setData] = useState<T | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<any>(null)

  const load = async () => {
    try {
      setLoading(true)
      const result = await request()
      setData(result)
      setError(null)
    } catch (err) {
      setError(err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, dependencies)

  return {
    data,
    loading,
    error,
    refresh: load,
  }
}
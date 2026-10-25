"use client";

import { useCallback, useEffect, useState } from "react";
import {
  AdminStats,
  AdminAgent,
  ThreatEvent,
  getAdminStats,
  getGlobalAgents,
  getGlobalThreats,
} from "@/lib/api/admin";

export function useAdminStats() {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const data = await getAdminStats();
      setStats(data);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to load admin stats"
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return {
    stats,
    loading,
    error,
    refresh,
  };
}


export function useGlobalAgents() {
  const [agents, setAgents] = useState<AdminAgent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const data = await getGlobalAgents();
      setAgents(data);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to load agents"
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return {
    agents,
    loading,
    error,
    refresh,
  };
}


export function useGlobalThreats() {
  const [threats, setThreats] = useState<ThreatEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const data = await getGlobalThreats();
      setThreats(data);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to load threats"
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return {
    threats,
    loading,
    error,
    refresh,
  };
}
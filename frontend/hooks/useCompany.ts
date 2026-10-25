"use client";

import { useCallback, useEffect, useState } from "react";
import {
  Company,
  getMyCompany,
} from "@/lib/api/company";

export function useCompany() {
  const [company, setCompany] = useState<Company | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const data = await getMyCompany();

      setCompany(data);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Failed to load company"
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return {
    company,
    loading,
    error,
    refresh,
  };
}
"use client";

import { useEffect, useState } from "react";
import { getChains } from "@/lib/api/chains";
import type { Chain } from "@/lib/promptguard/store";

export function useChains() {
  const [chains, setChains] = useState<Chain[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getChains()
      .then((data) => {
        setChains(data);
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  return {
    chains,
    loading,
  };
}
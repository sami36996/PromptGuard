"use client";

import { useEffect, useState } from "react";
import { store } from "./store";

export function useStore() {
  const [, setUpdate] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setUpdate((v) => v + 1);
    }, 500);

    return () => clearInterval(interval);
  }, []);

  return store;
}

export function useMounted() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return mounted;
}

export function useKpis() {
  const state = store;

  return {
    agents: state.agents.length,

    events: state.events.length,

    blocked: state.events.filter((e) => e.decision === "BLOCK").length,

    risk: state.events.length
      ? Math.round(
          state.events.reduce((sum, e) => sum + e.risk, 0) /
            state.events.length,
        )
      : 0,

    messagesToday: state.events.length,

    blockedToday: state.events.filter((e) => e.decision === "BLOCK").length,

    QUARANTINED: state.agents.filter((a) => a.status === "QUARANTINED").length,
  };
}

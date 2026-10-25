"use client";

import { useCallback, useEffect, useState } from "react";
import { getGraph } from "@/hooks/graph";

export interface GraphNode {
  id: string;

  name: string;

  status: " ACTIVE" | "IN ACTIVE" | " QUARANTINED" | "WARNING";

  risk: number;

  trust: number;
}

export interface GraphData {
  nodes: GraphNode[];

  edges: {
    source: string;
    target: string;
    risk: number;
  }[];
}

export function useGraph() {
  const [graph, setGraph] = useState<GraphData>({
    nodes: [],
    edges: [],
  });

  const [loading, setLoading] = useState(true);

  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const data = await getGraph();

      setGraph(
        (data ?? {
          nodes: [],
          edges: [],
        }) as GraphData,
      );
    } catch (err) {
      console.error(err);

      setError(err instanceof Error ? err.message : "Failed to load graph");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return {
    graph,
    loading,
    error,
    refresh,
  };
}

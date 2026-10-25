"use client";

import Link from "next/link";
import { ShieldAlert } from "lucide-react";

import { useEvents } from "@/hooks/useEvents";
import { fmtTime, riskColor } from "@/lib/promptguard/format";
import { cn } from "@/lib/utils";
import { DecisionBadge } from "@/components/promptguard/decision-badge";

interface LiveEventsProps {
  limit?: number;
}

export function LiveEvents({
  limit = 8,
}: LiveEventsProps) {
  const {
    events,
    loading,
    error,
  } = useEvents();

  if (loading) {
    return (
      <div className="py-10 text-center text-sm text-muted-foreground">
        Loading events...
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-4">
        <p className="font-medium text-red-500">
          Failed to load events
        </p>

        <p className="mt-2 text-sm text-muted-foreground">
          {error}
        </p>
      </div>
    );
  }

  if (events.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-10">

        <ShieldAlert className="mb-3 h-8 w-8 text-muted-foreground" />

        <p className="font-medium">
          No security events
        </p>

        <p className="text-sm text-muted-foreground">
          Waiting for incoming traffic...
        </p>

      </div>
    );
  }

  return (
    <div className="space-y-3">

      {events.slice(0, limit).map((event) => (

        <div
          key={event.id}
          className="rounded-xl border border-border bg-card p-4"
        >

          <div className="flex items-center justify-between">

            <span className="text-xs text-muted-foreground">
              {fmtTime(event.time)}
            </span>

            <DecisionBadge
              decision={event.decision}
            />

          </div>

          <div className="mt-2">

            <h4 className="font-medium">
              {event.agentName}
            </h4>

            <p className="mt-1 text-sm text-muted-foreground line-clamp-2">
              {event.content}
            </p>

          </div>

          <div className="mt-3 flex items-center justify-between">

            <span
              className={cn(
                "text-xs font-semibold",
                riskColor(event.risk)
              )}
            >
              Risk {event.risk}
            </span>

            <Link
              href={`/admin/chains?id=${event.chainId}`}
              className="text-xs font-medium text-primary hover:underline"
            >
              View Chain
            </Link>

          </div>

        </div>

      ))}

    </div>
  );
}
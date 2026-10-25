import { cn } from "@/lib/api/utils";
import { decisionStyles } from "@/lib/promptguard/format";
import type { AgentStatus, Decision } from "@/lib/promptguard/types";

export function DecisionBadge({
  decision,
  className,
}: {
  decision: Decision;
  className?: string;
}) {
  const s = decisionStyles[decision];

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium",
        s.bg,
        s.border,
        s.text,
        className,
      )}
    >
      <span className={cn("size-1.5 rounded-full", s.dot)} aria-hidden />
      {decision}
    </span>
  );
}
type StatusStyle = {
  text: string;
  bg: string;
  border: string;
  dot: string;
  label: string;
};

const statusStyles: Record<AgentStatus, StatusStyle> = {
  ACTIVE: {
    text: "text-safe",
    bg: "bg-safe/10",
    border: "border-safe/30",
    dot: "bg-safe",
    label: "Active",
  },

  INACTIVE: {
    text: "text-muted-foreground",
    bg: "bg-muted",
    border: "border-border",
    dot: "bg-muted-foreground",
    label: "Inactive",
  },

  QUARANTINED: {
    text: "text-blocked",
    bg: "bg-blocked/10",
    border: "border-blocked/30",
    dot: "bg-blocked",
    label: "Quarantined",
  },

  WARNING: {
    text: "text-review",
    bg: "bg-review/10",
    border: "border-review/30",
    dot: "bg-review",
    label: "Warning",
  },
};

export function StatusBadge({
  status,
  className,
}: {
  status: AgentStatus;
  className?: string;
}) {
  const s = statusStyles[status];

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium",
        s.bg,
        s.border,
        s.text,
        className,
      )}
    >
      <span
        className={cn(
          "size-1.5 rounded-full",
          s.dot,
          status === "ACTIVE" && "animate-pulse",
        )}
        aria-hidden
      />

      {s.label}
    </span>
  );
}
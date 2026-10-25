import type { Decision } from './types'

export function fmtTime(time:number|string)
{
 const value =
   typeof time === "string"
   ? Date.parse(time)
   : time;

 return new Date(value)
 .toLocaleTimeString();
}

export function fmtDateTime(value: string | number | null | undefined) {
  if (!value) return "—";

  const date =
    typeof value === "number"
      ? new Date(value)
      : new Date(value);

  if (Number.isNaN(date.getTime())) return "—";

  return date.toLocaleString();
}

export function fmtDate(value: string | number | null | undefined) {
  if (!value) return "—";

  const date =
    typeof value === "number"
      ? new Date(value)
      : new Date(value);

  if (Number.isNaN(date.getTime())) return "—";

  return date.toLocaleDateString();
}
export function maskKey(key: string): string {
  if (key.length <= 10) return '••••••••'
  return `${key.slice(0, 7)}••••••••••••${key.slice(-4)}`
}

// Tailwind class fragments keyed by decision. Uses the SOC semantic tokens.
export const decisionStyles: Record<
  Decision,
  { text: string; bg: string; border: string; dot: string; label: string }
> = {
  ALLOW: {
    text: 'text-safe',
    bg: 'bg-safe/15',
    border: 'border-safe/40',
    dot: 'bg-safe',
    label: 'Allowed',
  },
  REVIEW: {
    text: 'text-review',
    bg: 'bg-review/15',
    border: 'border-review/40',
    dot: 'bg-review',
    label: 'Review',
  },
  BLOCK: {
    text: 'text-blocked',
    bg: 'bg-blocked/15',
    border: 'border-blocked/40',
    dot: 'bg-blocked',
    label: 'Blocked',
  },
}

export function riskColor(risk: number): string {
  if (risk >= 70) return 'text-blocked'
  if (risk >= 40) return 'text-review'
  return 'text-safe'
}

export function trustColor(trust: number): string {
  if (trust >= 70) return 'text-safe'
  if (trust >= 40) return 'text-review'
  return 'text-blocked'
}

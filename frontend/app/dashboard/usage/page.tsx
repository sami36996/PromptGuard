"use client";

import { useEffect, useState } from "react";
import {
  Activity,
  BarChart3,
  CheckCircle2,
  ShieldAlert,
  AlertTriangle,
} from "lucide-react";

import {
  getUsage,
  type UsageSummary,
} from "@/lib/api/usage";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default function UsagePage() {
  const [usage, setUsage] = useState<UsageSummary | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadUsage() {
      try {
        const data = await getUsage();
        setUsage(data);
      } catch (error) {
        console.error("Failed to load usage:", error);
      } finally {
        setLoading(false);
      }
    }

    loadUsage();
  }, []);

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-semibold">
            Usage
          </h1>

          <p className="text-muted-foreground">
            Monitor your PromptGuard security gateway usage.
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {[1, 2, 3, 4].map((item) => (
            <Card key={item}>
              <CardContent className="p-6">
                <div className="h-20 animate-pulse rounded bg-muted" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (!usage) {
    return (
      <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-6">
        <h2 className="font-semibold">
          Unable to load usage data
        </h2>

        <p className="mt-1 text-sm text-muted-foreground">
          Usage data is currently unavailable.
        </p>
      </div>
    );
  }

  const blockRate =
    usage.total_requests > 0
      ? Math.round(
          (usage.blocked_requests /
            usage.total_requests) *
            100,
        )
      : 0;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">
          Usage
        </h1>

        <p className="text-muted-foreground">
          Monitor your PromptGuard security gateway usage.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <UsageCard
          label="Total Requests"
          value={usage.total_requests}
          icon={Activity}
        />

        <UsageCard
          label="Allowed"
          value={usage.allowed_requests}
          icon={CheckCircle2}
        />

        <UsageCard
          label="Under Review"
          value={usage.review_requests}
          icon={AlertTriangle}
        />

        <UsageCard
          label="Blocked"
          value={usage.blocked_requests}
          icon={ShieldAlert}
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Request Distribution</CardTitle>
          </CardHeader>

          <CardContent className="space-y-6">
            <UsageBar
              label="Allowed"
              value={usage.allowed_requests}
              total={usage.total_requests}
            />

            <UsageBar
              label="Under Review"
              value={usage.review_requests}
              total={usage.total_requests}
            />

            <UsageBar
              label="Blocked"
              value={usage.blocked_requests}
              total={usage.total_requests}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Security Performance</CardTitle>
          </CardHeader>

          <CardContent className="space-y-6">
            <PerformanceRow
              label="Block Rate"
              value={`${blockRate}%`}
            />

            <PerformanceRow
              label="Total Requests"
              value={usage.total_requests}
            />

            {usage.total_tokens !== undefined && (
              <PerformanceRow
                label="Total Tokens"
                value={usage.total_tokens}
              />
            )}

            {usage.period && (
              <PerformanceRow
                label="Period"
                value={usage.period}
              />
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardContent className="flex items-center gap-4 p-6">
          <div className="rounded-lg bg-primary/10 p-3 text-primary">
            <BarChart3 className="size-5" />
          </div>

          <div>
            <p className="font-medium">
              Usage analytics
            </p>

            <p className="text-sm text-muted-foreground">
              Request activity and security metrics are collected from the PromptGuard gateway.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function UsageCard({
  label,
  value,
  icon: Icon,
}: {
  label: string;
  value: number;
  icon: React.ElementType;
}) {
  return (
    <Card>
      <CardContent className="flex items-center gap-4 p-6">
        <div className="rounded-lg bg-primary/10 p-3 text-primary">
          <Icon className="size-5" />
        </div>

        <div>
          <p className="text-sm text-muted-foreground">
            {label}
          </p>

          <p className="text-2xl font-bold">
            {value}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

function UsageBar({
  label,
  value,
  total,
}: {
  label: string;
  value: number;
  total: number;
}) {
  const percentage =
    total > 0
      ? Math.round((value / total) * 100)
      : 0;

  return (
    <div className="space-y-2">
      <div className="flex justify-between text-sm">
        <span>{label}</span>

        <span className="font-medium">
          {value} ({percentage}%)
        </span>
      </div>

      <div className="h-2 overflow-hidden rounded-full bg-muted">
        <div
          className="h-full rounded-full bg-primary transition-all"
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}

function PerformanceRow({
  label,
  value,
}: {
  label: string;
  value: string | number;
}) {
  return (
    <div className="flex items-center justify-between border-b pb-4 last:border-0 last:pb-0">
      <span className="text-sm text-muted-foreground">
        {label}
      </span>

      <span className="font-semibold">
        {value}
      </span>
    </div>
  );
}
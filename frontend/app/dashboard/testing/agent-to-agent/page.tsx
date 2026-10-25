"use client";

import { FormEvent, useState } from "react";
import {
  ArrowRight,
  Bot,
  CheckCircle2,
  Loader2,
  Network,
  Send,
  ShieldAlert,
} from "lucide-react";

import { sendAgentMessage } from "@/lib/api/testing";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

type AgentMessageResult = {
  decision?: string;
  score?: number;
  chain_risk?: number;
  risk?: number;
  findings?: string[];
};

export default function AgentToAgentPage() {
  const [toAgent, setToAgent] = useState("");
  const [originAgent, setOriginAgent] = useState("");
  const [message, setMessage] = useState("");

  const [result, setResult] =
    useState<AgentMessageResult | null>(null);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    if (!toAgent.trim() || !message.trim()) {
      return;
    }

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const response = await sendAgentMessage({
        to_agent: toAgent.trim(),
        message: message.trim(),
        origin_agent: originAgent.trim() || null,
      });

      setResult(response);
    } catch (err) {
      console.error("Failed to send agent message:", err);

      setError(
        err instanceof Error
          ? err.message
          : "Failed to process the agent message.",
      );
    } finally {
      setLoading(false);
    }
  }

  const decision = result?.decision?.toLowerCase();

  const risk =
    typeof result?.chain_risk === "number"
      ? result.chain_risk
      : typeof result?.risk === "number"
        ? result.risk
        : null;

  return (
    <div className="mx-auto max-w-5xl space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">
          Agent → Agent
        </h1>

        <p className="text-muted-foreground">
          Test agent-to-agent communication and analyze message chain risk.
        </p>
      </div>

      {/* Communication Flow */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center gap-4">
            <AgentNode
              label={originAgent || "Origin Agent"}
            />

            <ArrowRight className="size-5 text-muted-foreground" />

            <AgentNode
              label={toAgent || "Target Agent"}
            />
          </div>
        </CardContent>
      </Card>

      {/* Message Form */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Network className="size-5" />
            Send Agent Message
          </CardTitle>
        </CardHeader>

        <CardContent>
          <form
            onSubmit={handleSubmit}
            className="space-y-6"
          >
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <label
                  htmlFor="origin-agent"
                  className="text-sm font-medium"
                >
                  Origin Agent
                </label>

                <Input
                  id="origin-agent"
                  value={originAgent}
                  onChange={(event) =>
                    setOriginAgent(event.target.value)
                  }
                  placeholder="agent-a"
                  disabled={loading}
                />

                <p className="text-xs text-muted-foreground">
                  Optional. Leave empty for a direct message.
                </p>
              </div>

              <div className="space-y-2">
                <label
                  htmlFor="to-agent"
                  className="text-sm font-medium"
                >
                  Target Agent
                </label>

                <Input
                  id="to-agent"
                  value={toAgent}
                  onChange={(event) =>
                    setToAgent(event.target.value)
                  }
                  placeholder="agent-b"
                  disabled={loading}
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <label
                htmlFor="agent-message"
                className="text-sm font-medium"
              >
                Message
              </label>

              <Textarea
                id="agent-message"
                value={message}
                onChange={(event) =>
                  setMessage(event.target.value)
                }
                placeholder="Enter the message sent from one agent to another..."
                className="min-h-40 resize-y"
                disabled={loading}
                required
              />
            </div>

            <div className="flex justify-end">
              <Button
                type="submit"
                disabled={
                  loading ||
                  !toAgent.trim() ||
                  !message.trim()
                }
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 size-4 animate-spin" />
                    Analyzing...
                  </>
                ) : (
                  <>
                    <Send className="mr-2 size-4" />
                    Send Agent Message
                  </>
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Error */}
      {error && (
        <Card className="border-destructive/30">
          <CardContent className="flex items-start gap-3 p-6">
            <ShieldAlert className="mt-0.5 size-5 text-destructive" />

            <div>
              <p className="font-medium">
                Request failed
              </p>

              <p className="mt-1 text-sm text-muted-foreground">
                {error}
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Result */}
      {result && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bot className="size-5" />
              Agent Message Analysis
            </CardTitle>
          </CardHeader>

          <CardContent className="space-y-6">
            <div className="grid gap-4 sm:grid-cols-3">
              <ResultMetric
                label="Decision"
                value={result.decision ?? "Unknown"}
              />

              <ResultMetric
                label="Risk Score"
                value={
                  typeof result.score === "number"
                    ? result.score
                    : "N/A"
                }
              />

              <ResultMetric
                label="Chain Risk"
                value={risk ?? "N/A"}
              />
            </div>

            <div className="flex items-center gap-3 border-t pt-6">
              {decision === "block" ? (
                <ShieldAlert className="size-5 text-destructive" />
              ) : (
                <CheckCircle2 className="size-5 text-primary" />
              )}

              <span className="text-sm text-muted-foreground">
                Security Decision
              </span>

              <Badge
                variant={
                  decision === "block"
                    ? "destructive"
                    : "secondary"
                }
              >
                {result.decision ?? "UNKNOWN"}
              </Badge>
            </div>

            {result.findings &&
              result.findings.length > 0 && (
                <div className="border-t pt-6">
                  <h3 className="mb-3 text-sm font-medium">
                    Findings
                  </h3>

                  <div className="space-y-2">
                    {result.findings.map(
                      (finding, index) => (
                        <div
                          key={`${finding}-${index}`}
                          className="rounded-lg border bg-muted/30 p-3 text-sm"
                        >
                          {finding}
                        </div>
                      ),
                    )}
                  </div>
                </div>
              )}

            <details className="border-t pt-6">
              <summary className="cursor-pointer text-sm font-medium">
                View raw response
              </summary>

              <pre className="mt-3 overflow-x-auto rounded-lg bg-muted p-4 text-xs">
                {JSON.stringify(result, null, 2)}
              </pre>
            </details>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function AgentNode({
  label,
}: {
  label: string;
}) {
  return (
    <div className="flex items-center gap-3 rounded-lg border bg-card px-4 py-3">
      <div className="flex size-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
        <Bot className="size-4" />
      </div>

      <div>
        <p className="text-xs text-muted-foreground">
          Agent
        </p>

        <p className="font-medium">
          {label}
        </p>
      </div>
    </div>
  );
}

function ResultMetric({
  label,
  value,
}: {
  label: string;
  value: string | number;
}) {
  return (
    <div className="rounded-lg border p-4">
      <p className="text-sm text-muted-foreground">
        {label}
      </p>

      <p className="mt-2 text-2xl font-bold">
        {value}
      </p>
    </div>
  );
}

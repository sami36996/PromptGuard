"use client";

import { FormEvent, useState } from "react";
import {
  Bot,
  CheckCircle2,
  Loader2,
  Send,
  ShieldAlert,
  User,
} from "lucide-react";

import { sendChatMessage } from "@/lib/api/testing";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";

type ChatResult = {
  decision?: string;
  score?: number;
  findings?: string[];
  response?: string;
  llm_error?: string;
};

export default function UserToAgentPage() {
  const [prompt, setPrompt] = useState("");
  const [result, setResult] = useState<ChatResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!prompt.trim()) {
      return;
    }

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const response = await sendChatMessage({
        prompt: prompt.trim(),
      });

      setResult(response);
    } catch (err) {
      console.error("Failed to send chat message:", err);

      setError(
        err instanceof Error
          ? err.message
          : "Failed to process the request.",
      );
    } finally {
      setLoading(false);
    }
  }

  const decision = result?.decision?.toLowerCase();

  return (
    <div className="mx-auto max-w-5xl space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">
          User → Agent
        </h1>

        <p className="text-muted-foreground">
          Test how PromptGuard analyzes user prompts before they reach an AI
          agent.
        </p>
      </div>

      {/* Prompt Input */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="size-5" />
            Send a User Prompt
          </CardTitle>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <Textarea
              value={prompt}
              onChange={(event) => setPrompt(event.target.value)}
              placeholder="Enter a prompt to test..."
              className="min-h-40 resize-y"
              disabled={loading}
            />

            <div className="flex items-center justify-between gap-4">
              <p className="text-xs text-muted-foreground">
                The prompt will be analyzed by the PromptGuard security
                gateway.
              </p>

              <Button
                type="submit"
                disabled={loading || !prompt.trim()}
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 size-4 animate-spin" />
                    Analyzing...
                  </>
                ) : (
                  <>
                    <Send className="mr-2 size-4" />
                    Analyze Prompt
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
              <p className="font-medium">Request failed</p>

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
              Analysis Result
            </CardTitle>
          </CardHeader>

          <CardContent className="space-y-6">
            {/* Decision */}
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
                label="Findings"
                value={result.findings?.length ?? 0}
              />
            </div>

            {/* Status */}
            <div className="flex items-center gap-3 border-t pt-6">
              {decision === "block" ? (
                <ShieldAlert className="size-5 text-destructive" />
              ) : (
                <CheckCircle2 className="size-5 text-primary" />
              )}

              <div className="flex items-center gap-3">
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
            </div>

            {result.llm_error && (
              <div className="border-t pt-6">
                <p className="font-medium">Model reply unavailable</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  {result.llm_error}
                </p>
              </div>
            )}

            {result.response && (
              <div className="border-t pt-6">
                <h3 className="mb-3 text-sm font-medium">
                  Model Response
                </h3>
                <div className="rounded-lg border bg-muted/30 p-3 text-sm whitespace-pre-wrap">
                  {result.response}
                </div>
              </div>
            )}

            {/* Findings */}
            {result.findings && result.findings.length > 0 && (
              <div className="border-t pt-6">
                <h3 className="mb-3 text-sm font-medium">
                  Findings
                </h3>

                <div className="space-y-2">
                  {result.findings.map((finding, index) => (
                    <div
                      key={`${finding}-${index}`}
                      className="rounded-lg border bg-muted/30 p-3 text-sm"
                    >
                      {finding}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Raw Response */}
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

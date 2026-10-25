"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Check, Copy, KeyRound, ShieldCheck } from "lucide-react";

import {
  registerAgent,
  type RegisterAgentRequest,
  type RegisteredAgentResponse,
} from "@/lib/api/agents";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

export default function RegisterAgentPage() {
  const router = useRouter();

  const [form, setForm] = useState<RegisterAgentRequest>({
    agent_name: "",
    agent_type: "",
    organization: "",
    description: "",
  });

  const [result, setResult] = useState<RegisteredAgentResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState("");

  function updateField(
    field: keyof RegisterAgentRequest,
    value: string,
  ) {
    setForm((current) => ({
      ...current,
      [field]: value,
    }));
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();

    setLoading(true);
    setError("");

    try {
      const response = await registerAgent(form);
      setResult(response);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Failed to register agent",
      );
    } finally {
      setLoading(false);
    }
  }

  async function copyApiKey() {
    if (!result?.api_key) return;

    await navigator.clipboard.writeText(result.api_key);

    setCopied(true);

    setTimeout(() => {
      setCopied(false);
    }, 2000);
  }

  if (result) {
    return (
      <div className="mx-auto max-w-2xl space-y-6">
        <div>
          <h1 className="text-2xl font-semibold">
            Agent Registered
          </h1>

          <p className="text-muted-foreground">
            Your agent has been successfully registered.
          </p>
        </div>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-primary/10 p-3 text-primary">
                <ShieldCheck className="size-6" />
              </div>

              <div>
                <CardTitle>{result.agent_name}</CardTitle>

                <p className="text-sm text-muted-foreground">
                  Agent ID: {result.agent_id}
                </p>
              </div>
            </div>
          </CardHeader>

          <CardContent className="space-y-6">
            <div className="rounded-lg border border-yellow-500/30 bg-yellow-500/5 p-4">
              <div className="flex items-start gap-3">
                <KeyRound className="mt-0.5 size-5 text-yellow-600" />

                <div>
                  <p className="font-medium">
                    Save your API key now
                  </p>

                  <p className="mt-1 text-sm text-muted-foreground">
                    This key is used to authenticate your agent with PromptGuard.
                    Store it securely.
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">
                API Key
              </label>

              <div className="flex gap-2">
                <Input
                  readOnly
                  value={result.api_key}
                  className="font-mono text-xs"
                />

                <Button
                  type="button"
                  variant="outline"
                  onClick={copyApiKey}
                >
                  {copied ? (
                    <Check className="size-4" />
                  ) : (
                    <Copy className="size-4" />
                  )}
                </Button>
              </div>
            </div>

            <div className="flex gap-3">
              <Button
                onClick={() => router.push("/dashboard/agents")}
              >
                View Agents
              </Button>

              <Button
                variant="outline"
                onClick={() => {
                  setResult(null);
                  setForm({
                    agent_name: "",
                    agent_type: "",
                    organization: "",
                    description: "",
                  });
                }}
              >
                Register Another
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">
          Register Agent
        </h1>

        <p className="text-muted-foreground">
          Connect a new AI agent to your organization's security gateway.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Agent Information</CardTitle>
        </CardHeader>

        <CardContent>
          <form
            onSubmit={handleSubmit}
            className="space-y-5"
          >
            <div className="space-y-2">
              <label
                htmlFor="agent_name"
                className="text-sm font-medium"
              >
                Agent Name
              </label>

              <Input
                id="agent_name"
                placeholder="Customer Support Agent"
                value={form.agent_name}
                onChange={(event) =>
                  updateField("agent_name", event.target.value)
                }
                required
              />
            </div>

            <div className="space-y-2">
              <label
                htmlFor="agent_type"
                className="text-sm font-medium"
              >
                Agent Type
              </label>

              <Input
                id="agent_type"
                placeholder="Customer Support"
                value={form.agent_type}
                onChange={(event) =>
                  updateField("agent_type", event.target.value)
                }
                required
              />
            </div>

            <div className="space-y-2">
              <label
                htmlFor="organization"
                className="text-sm font-medium"
              >
                Organization
              </label>

              <Input
                id="organization"
                placeholder="Your organization"
                value={form.organization}
                onChange={(event) =>
                  updateField("organization", event.target.value)
                }
                required
              />
            </div>

            <div className="space-y-2">
              <label
                htmlFor="description"
                className="text-sm font-medium"
              >
                Description
              </label>

              <textarea
                id="description"
                placeholder="Describe what this agent does..."
                value={form.description}
                onChange={(event) =>
                  updateField("description", event.target.value)
                }
                className="min-h-28 w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary"
                required
              />
            </div>

            {error && (
              <div className="rounded-md border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">
                {error}
              </div>
            )}

            <div className="flex justify-end gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.push("/dashboard/agents")}
              >
                Cancel
              </Button>

              <Button
                type="submit"
                disabled={loading}
              >
                {loading ? "Registering..." : "Register Agent"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
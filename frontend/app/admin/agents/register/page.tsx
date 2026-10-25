"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, CheckCircle2, Copy, Copy as CopyIcon } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";
import { registerAgent } from "@/lib/api/agents";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { PageHeader, Panel } from "@/components/promptguard/ui-bits";
import type { AgentType } from "@/lib/promptguard/types";

const AGENT_TYPES: AgentType[] = [
  "Research",
  "Finance",
  "Customer Support",
  "Data",
  "Orchestrator",
  "Marketing",
];

export default function RegisterAgentPage() {
  const router = useRouter();

  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [copiedKey, setCopiedKey] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    type: "" as AgentType | "",
    organization: "",
    description: "",
  });
  const [registeredAgent, setRegisteredAgent] = useState<
    | { id: string; apiKey: string; name: string; organization: string }
    | undefined
  >(undefined);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    if (!formData.name.trim()) {
      toast.error("Agent name is required");
      return;
    }
    if (!formData.type) {
      toast.error("Agent type is required");
      return;
    }
    if (!formData.organization.trim()) {
      toast.error("Organization is required");
      return;
    }
    if (!formData.description.trim()) {
      toast.error("Description is required");
      return;
    }

    setLoading(true);
    try {
      // Register the agent
      const agent = await registerAgent({
        agent_name: formData.name,
        agent_type: formData.type,
        organization: formData.organization,
        description: formData.description,
      });

      setRegisteredAgent({
        id: agent.agent_id,
        apiKey: agent.api_key,
        name: formData.name,
        organization: formData.organization,
      });
      setSuccess(true);
      toast.success(`Agent "${formData.name}" registered successfully`);
    } catch (error) {
      toast.error("Failed to register agent");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const copyApiKey = () => {
    if (registeredAgent?.apiKey) {
      navigator.clipboard.writeText(registeredAgent.apiKey);
      setCopiedKey(true);
      toast.success("API key copied to clipboard");
      setTimeout(() => setCopiedKey(false), 2000);
    }
  };

  const handleReset = () => {
    setFormData({ name: "", type: "", organization: "", description: "" });
    setRegisteredAgent(undefined);
    setSuccess(false);
  };

  if (success && registeredAgent) {
    return (
      <div>
        <PageHeader
          title="Agent Registered"
          description="Your new agent has been successfully registered with PromptGuard."
        />

        <Panel title="Success" className="mx-auto max-w-md">
          <div className="flex flex-col items-center gap-4 py-6 text-center">
            <div className="flex size-12 items-center justify-center rounded-full bg-safe/15 ring-1 ring-safe/25">
              <CheckCircle2 className="size-6 text-safe" />
            </div>

            <div>
              <h2 className="text-lg font-semibold">{registeredAgent.name}</h2>
              <p className="text-sm text-muted-foreground">
                {registeredAgent.organization}
              </p>
            </div>

            <div className="w-full rounded-lg border border-border bg-muted/40 p-4">
              <p className="text-xs font-medium text-muted-foreground">
                API Key
              </p>
              <div className="mt-2 flex items-center gap-2">
                <code className="flex-1 truncate font-mono text-xs text-foreground">
                  {registeredAgent.apiKey}
                </code>
                <button
                  onClick={copyApiKey}
                  className="inline-flex size-7 items-center justify-center rounded-md border border-border bg-card hover:bg-muted">
                  {copiedKey ? (
                    <CheckCircle2 className="size-4 text-safe" />
                  ) : (
                    <CopyIcon className="size-4 text-muted-foreground" />
                  )}
                </button>
              </div>
              <p className="mt-2 text-xs text-muted-foreground">
                Store this API key securely. You won&apos;t be able to see it
                again.
              </p>
            </div>

            <div className="flex w-full gap-3 pt-2">
              <Button
                variant="outline"
                onClick={handleReset}
                className="flex-1">
                Register Another
              </Button>
              <Button
                onClick={() => router.push("/admin/agents")}
                className="flex-1">
                View All Agents
              </Button>
            </div>
          </div>
        </Panel>
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        title="Register New Agent"
        description="Add a new agent to your PromptGuard deployment. Fill in the details below to get started."
      />

      <Panel title="Agent Registration" className="mx-auto max-w-2xl">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Agent Name */}
          <div>
            <label className="text-sm font-medium">Agent Name *</label>
            <p className="mt-0.5 text-xs text-muted-foreground">
              A unique identifier for your agent
            </p>
            <Input
              type="text"
              placeholder="e.g., Customer Support Bot"
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
              disabled={loading}
              className="mt-2"
            />
          </div>

          {/* Agent Type */}
          <div>
            <label className="text-sm font-medium">Agent Type *</label>
            <p className="mt-0.5 text-xs text-muted-foreground">
              The primary role of this agent
            </p>
            <Select
              value={formData.type}
              onValueChange={(val) =>
                setFormData({ ...formData, type: val as AgentType })
              }
              disabled={loading}>
              <SelectTrigger className="mt-2">
                <SelectValue placeholder="Select an agent type" />
              </SelectTrigger>
              <SelectContent>
                {AGENT_TYPES.map((type) => (
                  <SelectItem key={type} value={type}>
                    {type}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Organization */}
          <div>
            <label className="text-sm font-medium">Organization *</label>
            <p className="mt-0.5 text-xs text-muted-foreground">
              The organization operating this agent
            </p>
            <Input
              type="text"
              placeholder="e.g., Acme Corporation"
              value={formData.organization}
              onChange={(e) =>
                setFormData({ ...formData, organization: e.target.value })
              }
              disabled={loading}
              className="mt-2"
            />
          </div>

          {/* Description */}
          <div>
            <label className="text-sm font-medium">Description *</label>
            <p className="mt-0.5 text-xs text-muted-foreground">
              What does this agent do?
            </p>
            <Textarea
              placeholder="Describe the agent's purpose and responsibilities..."
              value={formData.description}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
              disabled={loading}
              className="mt-2 min-h-[120px]"
            />
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4">
  <Link
    href="/admin/agents"
    className="inline-flex h-9 items-center justify-center gap-2 rounded-md border border-border px-4 text-sm font-medium hover:bg-muted"
  >
    <ArrowLeft className="size-4" />
    Cancel
  </Link>

  <button
    type="submit"
    disabled={loading}
    className="flex-1 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50"
  >
    {loading ? "Registering..." : "Register Agent"}
  </button>
</div>
        </form>
      </Panel>
    </div>
  );
}

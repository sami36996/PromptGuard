"use client";

import { useEffect, useState } from "react";
import {
  AlertTriangle,
  CheckCircle2,
  RotateCcw,
  Save,
  ShieldCheck,
} from "lucide-react";

import {
  policyApi,
  type Policy,
} from "@/lib/api/policies";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";

export default function PoliciesPage() {
  const [policy, setPolicy] = useState<Policy>({
    maxRisk: 70,
    maxChainRisk: 70,
    autoBlock: true,
    allowedModels: [],
    blockedKeywords: [],
  });

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [resetting, setResetting] = useState(false);

  const [allowedModelsText, setAllowedModelsText] = useState("");
  const [blockedKeywordsText, setBlockedKeywordsText] = useState("");

  useEffect(() => {
    async function loadPolicy() {
      try {
        const data = await policyApi.get();

        setPolicy(data);
        setAllowedModelsText(data.allowedModels.join(", "));
        setBlockedKeywordsText(data.blockedKeywords.join(", "));
      } catch (error) {
        console.error("Failed to load policy:", error);
        setError(
          error instanceof Error
            ? error.message
            : "Failed to load security policy",
        );
      } finally {
        setLoading(false);
      }
    }

    loadPolicy();
  }, []);

  function updatePolicy<K extends keyof Policy>(
    field: K,
    value: Policy[K],
  ) {
    setPolicy((current) => ({
      ...current,
      [field]: value,
    }));
  }

  async function handleSave() {
    setSaving(true);

    try {
      const updated = await policyApi.update({
        maxRisk: policy.maxRisk,
        maxChainRisk: policy.maxChainRisk,
        autoBlock: policy.autoBlock,
        allowedModels: parseList(allowedModelsText),
        blockedKeywords: parseList(blockedKeywordsText),
      });

      setPolicy(updated);
      setAllowedModelsText(updated.allowedModels.join(", "));
      setBlockedKeywordsText(updated.blockedKeywords.join(", "));
      toast.success("Security policy saved");
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Failed to update security policy",
      );
    } finally {
      setSaving(false);
    }
  }

  async function handleReset() {
    const confirmed = window.confirm(
      "Reset security policy to the default configuration?",
    );

    if (!confirmed) {
      return;
    }

    setResetting(true);

    try {
      const reset = await policyApi.reset();

      setPolicy(reset);
      setAllowedModelsText(reset.allowedModels.join(", "));
      setBlockedKeywordsText(reset.blockedKeywords.join(", "));
      toast.success("Security policy reset");
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Failed to reset security policy",
      );
    } finally {
      setResetting(false);
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-semibold">
            Security Policies
          </h1>

          <p className="text-muted-foreground">
            Configure how PromptGuard evaluates and responds to threats.
          </p>
        </div>

        <Card>
          <CardContent className="p-6">
            <div className="h-32 animate-pulse rounded bg-muted" />
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-semibold">
            Security Policies
          </h1>
          <p className="text-muted-foreground">
            Configure how PromptGuard evaluates and responds to threats.
          </p>
        </div>
        <Card className="border-destructive/30">
          <CardContent className="p-6">
            <p className="font-medium">Unable to load policy</p>
            <p className="mt-1 text-sm text-muted-foreground">
              {error}
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            Security Policies
          </h1>

          <p className="text-muted-foreground">
            Configure how PromptGuard evaluates and responds to threats.
          </p>
        </div>

        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={handleReset}
            disabled={resetting}
          >
            <RotateCcw className="mr-2 size-4" />
            {resetting ? "Resetting..." : "Reset"}
          </Button>

          <Button
            onClick={handleSave}
            disabled={saving}
          >
            <Save className="mr-2 size-4" />
            {saving ? "Saving..." : "Save Changes"}
          </Button>
        </div>
      </div>

      {/* Risk Thresholds */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ShieldCheck className="size-5" />
            Risk Thresholds
          </CardTitle>
        </CardHeader>

        <CardContent className="space-y-8">
          <ThresholdControl
            label="Maximum Prompt Risk"
            description="Prompts above this score are considered high risk."
            value={policy.maxRisk}
            onChange={(value) =>
              updatePolicy("maxRisk", value)
            }
          />

          <ThresholdControl
            label="Maximum Chain Risk"
            description="Maximum acceptable risk for agent-to-agent communication chains."
            value={policy.maxChainRisk}
            onChange={(value) =>
              updatePolicy("maxChainRisk", value)
            }
          />
        </CardContent>
      </Card>

      {/* Automated Response */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="size-5" />
            Automated Response
          </CardTitle>
        </CardHeader>

        <CardContent>
          <div className="flex items-center justify-between rounded-lg border p-4">
            <div>
              <p className="font-medium">
                Automatic Blocking
              </p>

              <p className="mt-1 text-sm text-muted-foreground">
                Automatically block prompts that exceed the configured risk threshold.
              </p>
            </div>

            <Switch
              checked={policy.autoBlock}
              onCheckedChange={(checked) =>
                updatePolicy("autoBlock", checked)
              }
            />
          </div>
        </CardContent>
      </Card>

      {/* Model and Keyword Controls */}
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Allowed Models</CardTitle>
          </CardHeader>

          <CardContent className="space-y-3">
            <Label htmlFor="allowed-models">
              Model identifiers
            </Label>

            <Input
              id="allowed-models"
              value={allowedModelsText}
              onChange={(event) =>
                setAllowedModelsText(event.target.value)
              }
              placeholder="gpt-4, claude-3, llama-3"
            />

            <p className="text-xs text-muted-foreground">
              Separate multiple models with commas.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Blocked Keywords</CardTitle>
          </CardHeader>

          <CardContent className="space-y-3">
            <Label htmlFor="blocked-keywords">
              Keywords and phrases
            </Label>

            <Input
              id="blocked-keywords"
              value={blockedKeywordsText}
              onChange={(event) =>
                setBlockedKeywordsText(event.target.value)
              }
              placeholder="malware, credential theft, exploit"
            />

            <p className="text-xs text-muted-foreground">
              Separate multiple keywords with commas.
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Current State */}
      <Card>
        <CardContent className="flex items-center gap-3 p-6">
          <CheckCircle2 className="size-5 text-primary" />

          <div>
            <p className="font-medium">
              Policy configuration ready
            </p>

            <p className="text-sm text-muted-foreground">
              Changes will apply to security analysis after saving.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function ThresholdControl({
  label,
  description,
  value,
  onChange,
}: {
  label: string;
  description: string;
  value: number;
  onChange: (value: number) => void;
}) {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <p className="font-medium">
            {label}
          </p>

          <p className="text-sm text-muted-foreground">
            {description}
          </p>
        </div>

        <span className="text-2xl font-bold">
          {value}
        </span>
      </div>

      <Input
        type="range"
        min={0}
        max={100}
        value={value}
        onChange={(event) =>
          onChange(Number(event.target.value))
        }
      />

      <div className="flex justify-between text-xs text-muted-foreground">
        <span>0 — Low</span>
        <span>100 — Critical</span>
      </div>
    </div>
  );
}

function parseList(value: string): string[] {
  return value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}
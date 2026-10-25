"use client";

import { useEffect, useState } from "react";
import {
  Copy,
  KeyRound,
  Plus,
  RefreshCw,
  Trash2,
} from "lucide-react";

import {
  createApiKey,
  getApiKeys,
  revokeApiKey,
  type ApiKey,
} from "@/lib/api/api-keys";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

export default function ApiKeysPage() {
  const [keys, setKeys] = useState<ApiKey[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [name, setName] = useState("");
  const [newKey, setNewKey] = useState<string | null>(null);

  async function loadKeys() {
    try {
      const data = await getApiKeys();
      setKeys(data);
    } catch (error) {
      console.error("Failed to load API keys:", error);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadKeys();
  }, []);

  async function handleCreate() {
    setCreating(true);

    try {
      const created = await createApiKey({
        name: name.trim() || undefined,
      });

      if (created.api_key) {
        setNewKey(created.api_key);
      }

      setName("");
      await loadKeys();
    } catch (error) {
      console.error("Failed to create API key:", error);
    } finally {
      setCreating(false);
    }
  }

  async function handleRevoke(id: number | string) {
    const confirmed = window.confirm(
      "Are you sure you want to revoke this API key?",
    );

    if (!confirmed) {
      return;
    }

    try {
      await revokeApiKey(id);
      setKeys((current) =>
        current.filter((key) => key.id !== id),
      );
    } catch (error) {
      console.error("Failed to revoke API key:", error);
    }
  }

  async function copyKey(value: string) {
    await navigator.clipboard.writeText(value);
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">
          API Keys
        </h1>

        <p className="text-muted-foreground">
          Manage credentials used to connect your AI agents to PromptGuard.
        </p>
      </div>

      {/* Create */}
      <Card>
        <CardHeader>
          <CardTitle>Create API Key</CardTitle>
        </CardHeader>

        <CardContent className="space-y-4">
          <div className="flex flex-col gap-3 sm:flex-row">
            <Input
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="Key name (optional)"
              className="max-w-md"
            />

            <Button
              onClick={handleCreate}
              disabled={creating}
            >
              {creating ? (
                <RefreshCw className="mr-2 size-4 animate-spin" />
              ) : (
                <Plus className="mr-2 size-4" />
              )}

              {creating ? "Creating..." : "Generate Key"}
            </Button>
          </div>

          {newKey && (
            <div className="rounded-lg border border-primary/30 bg-primary/5 p-4">
              <p className="text-sm font-medium">
                Your new API key
              </p>

              <p className="mt-1 text-xs text-muted-foreground">
                Copy this key now. It may not be shown again.
              </p>

              <div className="mt-3 flex items-center gap-2">
                <code className="min-w-0 flex-1 overflow-x-auto rounded bg-background p-3 text-xs">
                  {newKey}
                </code>

                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => copyKey(newKey)}
                >
                  <Copy className="size-4" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Existing keys */}
      <Card>
        <CardHeader>
          <CardTitle>Active API Keys</CardTitle>
        </CardHeader>

        <CardContent className="p-0">
          {loading ? (
            <div className="p-6 text-sm text-muted-foreground">
              Loading API keys...
            </div>
          ) : keys.length === 0 ? (
            <div className="p-12 text-center">
              <KeyRound className="mx-auto mb-4 size-10 text-muted-foreground" />

              <h3 className="font-semibold">
                No API keys
              </h3>

              <p className="mt-1 text-sm text-muted-foreground">
                Generate an API key to connect your agents.
              </p>
            </div>
          ) : (
            <div className="divide-y">
              {keys.map((apiKey) => (
                <ApiKeyRow
                  key={apiKey.id}
                  apiKey={apiKey}
                  onRevoke={handleRevoke}
                />
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function ApiKeyRow({
  apiKey,
  onRevoke,
}: {
  apiKey: ApiKey;
  onRevoke: (id: number | string) => void;
}) {
  return (
    <div className="flex flex-col gap-4 p-6 md:flex-row md:items-center md:justify-between">
      <div className="flex items-center gap-4">
        <div className="flex size-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
          <KeyRound className="size-5" />
        </div>

        <div>
          <p className="font-medium">
            {apiKey.name || "Unnamed API Key"}
          </p>

          <p className="font-mono text-xs text-muted-foreground">
            {apiKey.key_prefix || "••••••••"}
          </p>

          <p className="mt-1 text-xs text-muted-foreground">
            Created{" "}
            {apiKey.created_at
              ? formatDate(apiKey.created_at)
              : "Unknown"}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <Badge variant="secondary">
          Active
        </Badge>

        <Button
          variant="destructive"
          size="icon"
          onClick={() => onRevoke(apiKey.id)}
        >
          <Trash2 className="size-4" />
        </Button>
      </div>
    </div>
  );
}

function formatDate(value: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleString();
}
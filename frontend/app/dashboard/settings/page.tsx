"use client";

import { useState } from "react";
import { useEffect } from "react";
import {
  Building2,
  Check,
  Lock,
  Save,
  ShieldCheck,
  User,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { useCompany } from "@/hooks/useCompany";
import { updateMyCompany } from "@/lib/api/company";
import {
  changePassword,
  getMe,
  updateMe,
} from "@/lib/api/users";

export default function SettingsPage() {
  const { company, refresh } = useCompany();
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");

  const [settings, setSettings] = useState({
    companyName: "Organization",
    companyEmail: "",
    administratorName: "Company Administrator",
    administratorEmail: "",
    emailAlerts: true,
    highRiskAlerts: true,
    quarantineAlerts: true,
  });

  useEffect(() => {
    if (!company) return;
    setSettings((current) => ({
      ...current,
      companyName: company.name,
      companyEmail: company.email ?? "",
      emailAlerts: company.email_alerts ?? current.emailAlerts,
      highRiskAlerts: company.high_risk_alerts ?? current.highRiskAlerts,
      quarantineAlerts: company.quarantine_alerts ?? current.quarantineAlerts,
    }));
  }, [company]);

  useEffect(() => {
    async function loadProfile() {
      try {
        const user = await getMe();
        setSettings((current) => ({
          ...current,
          administratorName: user.full_name ?? "",
          administratorEmail: user.email,
        }));
      } catch (error) {
        toast.error(
          error instanceof Error
            ? error.message
            : "Failed to load administrator profile",
        );
      }
    }

    void loadProfile();
  }, []);

  function updateSetting(
    key: keyof typeof settings,
    value: string | boolean,
  ) {
    setSettings((current) => ({
      ...current,
      [key]: value,
    }));

    setSaved(false);
  }

  async function handleSave() {
    try {
      setSaving(true);
      await updateMyCompany({
        name: settings.companyName,
        email: settings.companyEmail || null,
        email_alerts: settings.emailAlerts,
        high_risk_alerts: settings.highRiskAlerts,
        quarantine_alerts: settings.quarantineAlerts,
      });
      await updateMe({
        full_name: settings.administratorName,
        email: settings.administratorEmail,
      });
      await refresh();
      setSaved(true);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to save settings",
      );
    } finally {
      setSaving(false);
    }
  }

  async function handleChangePassword() {
    if (!currentPassword || !newPassword) {
      toast.error("Enter the current password and a new password");
      return;
    }

    try {
      setChangingPassword(true);
      await changePassword(currentPassword, newPassword);
      setCurrentPassword("");
      setNewPassword("");
      toast.success("Password updated");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to change password",
      );
    } finally {
      setChangingPassword(false);
    }
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">
          Settings
        </h1>

        <p className="text-muted-foreground">
          Manage your organization and PromptGuard security preferences.
        </p>
      </div>

      {/* Organization */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-primary/10 p-3 text-primary">
              <Building2 className="size-5" />
            </div>

            <div>
              <CardTitle>Organization</CardTitle>

              <CardDescription>
                Manage your company information.
              </CardDescription>
            </div>
          </div>
        </CardHeader>

        <CardContent className="grid gap-6 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="companyName">
              Organization Name
            </Label>

            <Input
              id="companyName"
              value={settings.companyName}
              onChange={(event) =>
                updateSetting(
                  "companyName",
                  event.target.value,
                )
              }
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="companyEmail">
              Organization Email
            </Label>

            <Input
              id="companyEmail"
              type="email"
              value={settings.companyEmail}
              onChange={(event) =>
                updateSetting(
                  "companyEmail",
                  event.target.value,
                )
              }
              placeholder="security@company.com"
            />
          </div>
        </CardContent>
      </Card>

      {/* Administrator */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-primary/10 p-3 text-primary">
              <User className="size-5" />
            </div>

            <div>
              <CardTitle>Administrator Profile</CardTitle>

              <CardDescription>
                Manage the account administrator information.
              </CardDescription>
            </div>
          </div>
        </CardHeader>

        <CardContent className="grid gap-6 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="administratorName">
              Full Name
            </Label>

            <Input
              id="administratorName"
              value={settings.administratorName}
              onChange={(event) =>
                updateSetting(
                  "administratorName",
                  event.target.value,
                )
              }
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="administratorEmail">
              Email Address
            </Label>

            <Input
              id="administratorEmail"
              type="email"
              value={settings.administratorEmail}
              onChange={(event) =>
                updateSetting(
                  "administratorEmail",
                  event.target.value,
                )
              }
              placeholder="admin@company.com"
            />
          </div>
        </CardContent>
      </Card>

      {/* Notifications */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-primary/10 p-3 text-primary">
              <ShieldCheck className="size-5" />
            </div>

            <div>
              <CardTitle>Security Notifications</CardTitle>

              <CardDescription>
                Choose which security events should trigger notifications.
              </CardDescription>
            </div>
          </div>
        </CardHeader>

        <CardContent className="divide-y">
          <SettingRow
            title="Email Notifications"
            description="Receive security notifications by email."
            checked={settings.emailAlerts}
            onCheckedChange={(value) =>
              updateSetting("emailAlerts", value)
            }
          />

          <SettingRow
            title="High-Risk Activity"
            description="Notify when high-risk prompts or attacks are detected."
            checked={settings.highRiskAlerts}
            onCheckedChange={(value) =>
              updateSetting("highRiskAlerts", value)
            }
          />

          <SettingRow
            title="Agent Quarantine"
            description="Notify when an agent is automatically quarantined."
            checked={settings.quarantineAlerts}
            onCheckedChange={(value) =>
              updateSetting("quarantineAlerts", value)
            }
          />
        </CardContent>
      </Card>

      {/* Security */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-primary/10 p-3 text-primary">
              <Lock className="size-5" />
            </div>

            <div>
              <CardTitle>Account Security</CardTitle>

              <CardDescription>
                Manage authentication and account security.
              </CardDescription>
            </div>
          </div>
        </CardHeader>

        <CardContent className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="currentPassword">Current password</Label>
            <Input
              id="currentPassword"
              type="password"
              value={currentPassword}
              onChange={(event) => setCurrentPassword(event.target.value)}
              autoComplete="current-password"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="newPassword">New password</Label>
            <Input
              id="newPassword"
              type="password"
              value={newPassword}
              onChange={(event) => setNewPassword(event.target.value)}
              autoComplete="new-password"
            />
          </div>
          <div className="md:col-span-2">
            <Button
              variant="outline"
              type="button"
              onClick={handleChangePassword}
              disabled={changingPassword}
            >
              {changingPassword ? "Updating..." : "Change Password"}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Save */}
      <div className="flex items-center justify-end gap-3">
        {saved && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Check className="size-4" />
            Changes saved
          </div>
        )}

        <Button onClick={handleSave} disabled={saving}>
          <Save className="mr-2 size-4" />
          {saving ? "Saving..." : "Save Changes"}
        </Button>
      </div>
    </div>
  );
}

function SettingRow({
  title,
  description,
  checked,
  onCheckedChange,
  disabled = false,
}: {
  title: string;
  description: string;
  checked: boolean;
  onCheckedChange: (value: boolean) => void;
  disabled?: boolean;
}) {
  return (
    <div className="flex items-center justify-between gap-6 py-4 first:pt-0 last:pb-0">
      <div>
        <p className="text-sm font-medium">
          {title}
        </p>

        <p className="mt-1 text-sm text-muted-foreground">
          {description}
        </p>
      </div>

      <Switch
        checked={checked}
        onCheckedChange={onCheckedChange}
        disabled={disabled}
      />
    </div>
  );
}
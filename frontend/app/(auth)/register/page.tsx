"use client";
// app/(auth)/register/page.tsx

import { RegisterForm } from "@/components/auth/register-form";


import { FormEvent, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight, ShieldCheck } from "lucide-react";
import { toast } from "sonner";

import { authApi } from "@/lib/api/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function RegisterPage() {
  const router = useRouter();

  const [loading, setLoading] = useState(false);

  const [form, setForm] = useState({
    full_name: "",
    company_name: "",
    email: "",
    password: "",
  });

  function updateField(
    field: keyof typeof form,
    value: string
  ) {
    setForm((previous) => ({
      ...previous,
      [field]: value,
    }));
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();

    if (!form.full_name.trim()) {
      toast.error("Full name is required");
      return;
    }

    if (!form.company_name.trim()) {
      toast.error("Company name is required");
      return;
    }

    if (!form.email.trim()) {
      toast.error("Email is required");
      return;
    }

    if (form.password.length < 8) {
      toast.error("Password must be at least 8 characters");
      return;
    }

    try {
      setLoading(true);

      await authApi.register({
        full_name: form.full_name,
        company_name: form.company_name,
        email: form.email,
        password: form.password,
      });

      toast.success("Company account created successfully");

      router.push("/dashboard");
    } catch (error) {
      console.error(error);

      toast.error(
        error instanceof Error
          ? error.message
          : "Registration failed"
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-dvh bg-background">
      <div className="mx-auto flex min-h-dvh max-w-md items-center px-6 py-12">
        <div className="w-full">
          <div className="mb-8 text-center">
            <Link
              href="/"
              className="mb-6 inline-flex items-center gap-2"
            >
              <div className="flex size-10 items-center justify-center rounded-xl bg-primary/15 text-primary">
                <ShieldCheck className="size-5" />
              </div>

              <div className="text-left">
                <p className="font-semibold">
                  PromptGuard
                </p>

                <p className="text-xs text-muted-foreground">
                  AI Security Gateway
                </p>
              </div>
            </Link>

            <h1 className="text-2xl font-semibold">
              Create your company account
            </h1>

            <p className="mt-2 text-sm text-muted-foreground">
              Protect your AI agents and LLM applications.
            </p>
          </div>

          <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
            <form
              onSubmit={handleSubmit}
              className="space-y-5"
            >
              <div>
                <label className="text-sm font-medium">
                  Full name
                </label>

                <Input
                  className="mt-2"
                  placeholder="John Doe"
                  value={form.full_name}
                  onChange={(event) =>
                    updateField(
                      "full_name",
                      event.target.value
                    )
                  }
                  disabled={loading}
                />
              </div>

              <div>
                <label className="text-sm font-medium">
                  Company name
                </label>

                <Input
                  className="mt-2"
                  placeholder="Acme AI"
                  value={form.company_name}
                  onChange={(event) =>
                    updateField(
                      "company_name",
                      event.target.value
                    )
                  }
                  disabled={loading}
                />
              </div>

              <div>
                <label className="text-sm font-medium">
                  Work email
                </label>

                <Input
                  className="mt-2"
                  type="email"
                  placeholder="you@company.com"
                  value={form.email}
                  onChange={(event) =>
                    updateField(
                      "email",
                      event.target.value
                    )
                  }
                  disabled={loading}
                />
              </div>

              <div>
                <label className="text-sm font-medium">
                  Password
                </label>

                <Input
                  className="mt-2"
                  type="password"
                  placeholder="At least 8 characters"
                  value={form.password}
                  onChange={(event) =>
                    updateField(
                      "password",
                      event.target.value
                    )
                  }
                  disabled={loading}
                />
              </div>

              <Button
                type="submit"
                className="w-full"
                disabled={loading}
              >
                {loading
                  ? "Creating account..."
                  : "Create company account"}

                {!loading && (
                  <ArrowRight className="ml-2 size-4" />
                )}
              </Button>
            </form>
          </div>

          <p className="mt-6 text-center text-sm text-muted-foreground">
            Already have an account?{" "}
            <Link
              href="/login"
              className="font-medium text-primary hover:underline"
            >
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </main>
  );
}
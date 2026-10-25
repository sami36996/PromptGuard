"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight, ShieldCheck } from "lucide-react";
import { toast } from "sonner";

import { authApi } from "@/lib/api/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function LoginForm() {
  const router = useRouter();

  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!email.trim() || !password) {
      toast.error("Email and password are required");
      return;
    }

    try {
      setLoading(true);

      await authApi.login({
        email,
        password,
      });

      toast.success("Welcome back");
      router.push("/dashboard");
    } catch (error) {
      console.error(error);

      toast.error(
        error instanceof Error
          ? error.message
          : "Invalid email or password"
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
                <p className="font-semibold">PromptGuard</p>
                <p className="text-xs text-muted-foreground">
                  AI Security Gateway
                </p>
              </div>
            </Link>

            <h1 className="text-2xl font-semibold">
              Welcome back
            </h1>

            <p className="mt-2 text-sm text-muted-foreground">
              Sign in to your company security console.
            </p>
          </div>

          <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="text-sm font-medium">
                  Email
                </label>

                <Input
                  className="mt-2"
                  type="email"
                  placeholder="you@company.com"
                  value={email}
                  onChange={(event) =>
                    setEmail(event.target.value)
                  }
                  disabled={loading}
                  required
                />
              </div>

              <div>
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium">
                    Password
                  </label>

                  <span className="text-xs text-muted-foreground">
                    Password reset coming soon
                  </span>
                </div>

                <Input
                  className="mt-2"
                  type="password"
                  placeholder="Your password"
                  value={password}
                  onChange={(event) =>
                    setPassword(event.target.value)
                  }
                  disabled={loading}
                  required
                />
              </div>

              <Button
                type="submit"
                className="w-full"
                disabled={loading}
              >
                {loading ? (
                  "Signing in..."
                ) : (
                  <>
                    Sign in
                    <ArrowRight className="ml-2 size-4" />
                  </>
                )}
              </Button>
            </form>
          </div>

          <p className="mt-6 text-center text-sm text-muted-foreground">
            New to PromptGuard?{" "}
            <Link
              href="/register"
              className="font-medium text-primary hover:underline"
            >
              Create a company account
            </Link>
          </p>
        </div>
      </div>
    </main>
  );
}
import Link from "next/link";
import {
  ArrowRight,
  Check,
  ShieldCheck,
  Terminal,
  Activity,
  Network,
  Lock,
  Zap,
  Bot,
  ChevronRight,
} from "lucide-react";

const features = [
  {
    icon: ShieldCheck,
    title: "Prompt Injection Protection",
    description:
      "Detect and block malicious instructions, jailbreaks, data extraction attempts, and prompt manipulation before they reach your models.",
  },
  {
    icon: Network,
    title: "Agent-to-Agent Security",
    description:
      "Monitor communication between AI agents and analyze entire message chains for coordinated attacks and cascading risk.",
  },
  {
    icon: Activity,
    title: "Real-Time Threat Detection",
    description:
      "Every request is analyzed in real time with risk scoring, threat classification, and actionable security decisions.",
  },
  {
    icon: Lock,
    title: "Automated Enforcement",
    description:
      "Automatically allow, review, block, or quarantine agents based on configurable security policies and trust scores.",
  },
  {
    icon: Bot,
    title: "Agent Trust Scoring",
    description:
      "Continuously evaluate agent behavior and maintain a dynamic trust posture across your AI infrastructure.",
  },
  {
    icon: Zap,
    title: "API-First Integration",
    description:
      "Add a security layer to your existing AI applications without rebuilding your agents or changing your model provider.",
  },
];

const steps = [
  {
    number: "01",
    title: "Connect your agents",
    description:
      "Register your AI agents and integrate PromptGuard using a simple API request.",
  },
  {
    number: "02",
    title: "Inspect every message",
    description:
      "PromptGuard analyzes prompts, responses, and agent-to-agent communication in real time.",
  },
  {
    number: "03",
    title: "Enforce your policy",
    description:
      "Allow safe requests, review suspicious activity, block threats, and quarantine compromised agents.",
  },
];

const plans = [
  {
    name: "Developer",
    description: "For testing and small AI applications.",
    price: "Free",
    features: [
      "Basic prompt protection",
      "API access",
      "Agent registration",
      "Security logs",
    ],
    cta: "Start building",
    href: "/register",
  },
  {
    name: "Professional",
    description: "For teams running AI agents in production.",
    price: "Custom",
    features: [
      "Advanced threat detection",
      "Agent-to-agent chain analysis",
      "Trust scoring",
      "Automated quarantine",
      "Advanced analytics",
    ],
    cta: "Get started",
    href: "/register",
    featured: true,
  },
  {
    name: "Enterprise",
    description: "For organizations securing AI at scale.",
    price: "Let's talk",
    features: [
      "Everything in Professional",
      "Custom security policies",
      "Enterprise support",
      "Custom integrations",
      "Dedicated infrastructure",
    ],
    cta: "Contact sales",
    href: "/register",
  },
];

export default function HomePage() {
  return (
    <main className="min-h-dvh overflow-hidden">
      {/* Background grid */}
      <div
        aria-hidden
        className="pointer-events-none fixed inset-0 opacity-[0.12]"
        style={{
          backgroundImage:
            "linear-gradient(to right, var(--border) 1px, transparent 1px), linear-gradient(to bottom, var(--border) 1px, transparent 1px)",
          backgroundSize: "48px 48px",
        }}
      />

      {/* Glow */}
      <div
        aria-hidden
        className="pointer-events-none absolute left-1/2 top-0 h-[500px] w-[900px] -translate-x-1/2 rounded-full opacity-20 blur-3xl"
        style={{
          background:
            "radial-gradient(circle, var(--primary), transparent 65%)",
        }}
      />

      <div className="relative">
        {/* Navbar */}
        <header className="border-b border-border/60">
          <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-5">
            <Link href="/" className="flex items-center gap-3">
              <div className="flex size-9 items-center justify-center rounded-xl bg-primary/15 text-primary ring-1 ring-primary/30">
                <ShieldCheck className="size-5" />
              </div>

              <div>
                <p className="text-sm font-semibold tracking-tight">
                  PromptGuard
                </p>
                <p className="text-[10px] text-muted-foreground">
                  AI Security Gateway
                </p>
              </div>
            </Link>

            <nav className="hidden items-center gap-8 text-sm text-muted-foreground md:flex">
              <a href="#product" className="transition-colors hover:text-foreground">
                Product
              </a>

              <a href="#how-it-works" className="transition-colors hover:text-foreground">
                How it works
              </a>

              <a href="#developers" className="transition-colors hover:text-foreground">
                Developers
              </a>

              <a href="#pricing" className="transition-colors hover:text-foreground">
                Pricing
              </a>

              <Link
                href="/developer"
                className="transition-colors hover:text-foreground"
              >
                Docs
              </Link>
            </nav>

            <div className="flex items-center gap-3">
              <Link
                href="/login"
                className="hidden text-sm font-medium text-muted-foreground hover:text-foreground sm:block"
              >
                Sign in
              </Link>

              <Link
                href="/register"
                className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90"
              >
                Get started
                <ArrowRight className="size-4" />
              </Link>
            </div>
          </div>
        </header>

        {/* Hero */}
        <section className="mx-auto max-w-7xl px-6 pb-24 pt-24 md:pb-32 md:pt-32">
          <div className="grid items-center gap-16 lg:grid-cols-[1.05fr_0.95fr]">
            <div>
              <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-3 py-1.5 text-xs font-medium text-primary">
                <span className="size-1.5 animate-pulse rounded-full bg-safe" />
                AI security infrastructure for production
              </div>

              <h1 className="max-w-4xl text-balance text-5xl font-semibold tracking-tight md:text-7xl">
                The security layer for the{" "}
                <span className="text-primary">agentic AI era.</span>
              </h1>

              <p className="mt-7 max-w-2xl text-pretty text-lg leading-relaxed text-muted-foreground md:text-xl">
                PromptGuard protects your AI agents and LLM applications from
                prompt injection, jailbreaks, malicious agent communication, and
                cascading security threats.
              </p>

              <div className="mt-9 flex flex-wrap gap-4">
                <Link
                  href="/register"
                  className="inline-flex items-center gap-2 rounded-lg bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90"
                >
                  Start protecting your AI
                  <ArrowRight className="size-4" />
                </Link>

                <Link
                  href="/developer"
                  className="inline-flex items-center gap-2 rounded-lg border border-border bg-card/60 px-5 py-3 text-sm font-semibold transition-colors hover:bg-accent"
                >
                  Read the documentation
                  <ChevronRight className="size-4" />
                </Link>
              </div>

              <div className="mt-10 flex flex-wrap gap-x-8 gap-y-3 text-sm text-muted-foreground">
                <div className="flex items-center gap-2">
                  <Check className="size-4 text-safe" />
                  API-first
                </div>

                <div className="flex items-center gap-2">
                  <Check className="size-4 text-safe" />
                  Real-time analysis
                </div>

                <div className="flex items-center gap-2">
                  <Check className="size-4 text-safe" />
                  Provider agnostic
                </div>
              </div>
            </div>

            {/* Security dashboard visual */}
            <div className="relative">
              <div className="rounded-2xl border border-border bg-card/80 p-4 shadow-2xl backdrop-blur">
                <div className="flex items-center justify-between border-b border-border pb-4">
                  <div className="flex items-center gap-2">
                    <div className="flex size-8 items-center justify-center rounded-lg bg-primary/15 text-primary">
                      <ShieldCheck className="size-4" />
                    </div>

                    <div>
                      <p className="text-xs font-semibold">PromptGuard</p>
                      <p className="text-[10px] text-muted-foreground">
                        Security Operations
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 text-[10px] text-safe">
                    <span className="size-1.5 animate-pulse rounded-full bg-safe" />
                    Live
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3 py-5">
                  <Metric label="Requests" value="24,891" />
                  <Metric label="Blocked" value="1,247" />
                  <Metric label="Agents" value="38" />
                </div>

                <div className="rounded-xl border border-border bg-background/60 p-4">
                  <div className="mb-4 flex items-center justify-between">
                    <p className="text-xs font-medium">Live security events</p>
                    <Activity className="size-4 text-primary" />
                  </div>

                  <div className="space-y-3">
                    <SecurityEvent
                      type="BLOCKED"
                      title="Prompt injection detected"
                      agent="customer-support-agent"
                      time="12 sec ago"
                    />

                    <SecurityEvent
                      type="REVIEW"
                      title="Suspicious chain behavior"
                      agent="research-agent"
                      time="48 sec ago"
                    />

                    <SecurityEvent
                      type="ALLOWED"
                      title="Request analyzed successfully"
                      agent="finance-agent"
                      time="1 min ago"
                    />
                  </div>
                </div>
              </div>

              <div className="absolute -bottom-5 -left-5 hidden rounded-xl border border-border bg-card px-4 py-3 shadow-xl sm:block">
                <p className="text-[10px] text-muted-foreground">
                  Current system posture
                </p>
                <p className="mt-1 text-sm font-semibold text-safe">
                  Protected
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Problem */}
        <section className="border-y border-border/60 bg-card/30">
          <div className="mx-auto max-w-7xl px-6 py-20 md:py-24">
            <div className="max-w-3xl">
              <p className="text-sm font-semibold text-primary">
                AI systems are becoming interconnected
              </p>

              <h2 className="mt-4 text-3xl font-semibold tracking-tight md:text-5xl">
                More capable agents create a larger attack surface.
              </h2>

              <p className="mt-5 text-lg leading-relaxed text-muted-foreground">
                A single malicious prompt can manipulate an agent. A compromised
                agent can communicate with others. Without a security layer,
                attacks can move through your AI system faster than your team can
                respond.
              </p>
            </div>

            <div className="mt-12 grid gap-4 md:grid-cols-3">
              <ThreatCard
                title="Prompt Injection"
                description="Attackers manipulate model instructions to bypass intended behavior."
              />

              <ThreatCard
                title="Compromised Agents"
                description="A trusted agent can become a path into the rest of your AI infrastructure."
              />

              <ThreatCard
                title="Cascading Attacks"
                description="Malicious behavior can propagate across agent-to-agent communication chains."
              />
            </div>
          </div>
        </section>

        {/* Product features */}
        <section id="product" className="mx-auto max-w-7xl px-6 py-24 md:py-32">
          <div className="max-w-3xl">
            <p className="text-sm font-semibold text-primary">
              One security layer. Every AI interaction.
            </p>

            <h2 className="mt-4 text-3xl font-semibold tracking-tight md:text-5xl">
              Secure your AI infrastructure without rebuilding it.
            </h2>

            <p className="mt-5 text-lg leading-relaxed text-muted-foreground">
              PromptGuard sits between your applications, agents, and models to
              analyze activity and enforce your security policy in real time.
            </p>
          </div>

          <div className="mt-14 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {features.map((feature) => (
              <div
                key={feature.title}
                className="rounded-2xl border border-border bg-card/50 p-6 transition-colors hover:border-primary/40 hover:bg-card"
              >
                <div className="flex size-11 items-center justify-center rounded-xl bg-primary/15 text-primary ring-1 ring-primary/20">
                  <feature.icon className="size-5" />
                </div>

                <h3 className="mt-5 text-lg font-semibold">
                  {feature.title}
                </h3>

                <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* How it works */}
        <section
          id="how-it-works"
          className="border-y border-border/60 bg-card/30"
        >
          <div className="mx-auto max-w-7xl px-6 py-24 md:py-32">
            <div className="text-center">
              <p className="text-sm font-semibold text-primary">
                Simple to integrate
              </p>

              <h2 className="mt-4 text-3xl font-semibold tracking-tight md:text-5xl">
                Security that works at the speed of your AI.
              </h2>
            </div>

            <div className="mt-16 grid gap-8 md:grid-cols-3">
              {steps.map((step) => (
                <div key={step.number} className="relative">
                  <p className="text-5xl font-semibold text-primary/30">
                    {step.number}
                  </p>

                  <h3 className="mt-5 text-xl font-semibold">{step.title}</h3>

                  <p className="mt-3 leading-relaxed text-muted-foreground">
                    {step.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Developer section */}
        <section id="developers" className="mx-auto max-w-7xl px-6 py-24 md:py-32">
          <div className="grid items-center gap-12 lg:grid-cols-2">
            <div>
              <p className="text-sm font-semibold text-primary">
                Built for developers
              </p>

              <h2 className="mt-4 text-3xl font-semibold tracking-tight md:text-5xl">
                Add AI security with a few lines of code.
              </h2>

              <p className="mt-5 text-lg leading-relaxed text-muted-foreground">
                Connect your existing AI applications to PromptGuard through a
                simple API. Keep your models, providers, and application logic.
                Add the security layer where it belongs.
              </p>

              <Link
                href="/developer"
                className="mt-7 inline-flex items-center gap-2 text-sm font-semibold text-primary hover:underline"
              >
                Explore the quickstart
                <ArrowRight className="size-4" />
              </Link>
            </div>

            <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-2xl">
              <div className="flex items-center gap-2 border-b border-border px-4 py-3">
                <Terminal className="size-4 text-primary" />
                <span className="text-xs text-muted-foreground">
                  Example request
                </span>
              </div>

              <pre className="overflow-x-auto p-6 text-xs leading-7 text-muted-foreground">
                <code>{`curl -X POST https://api.promptguard.ai/v1/guard \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{
    "agent_id": "customer-support-agent",
    "prompt": "Process this customer request..."
  }'`}</code>
              </pre>
            </div>
          </div>
        </section>

        {/* Pricing */}
        <section id="pricing" className="border-y border-border/60 bg-card/30">
          <div className="mx-auto max-w-7xl px-6 py-24 md:py-32">
            <div className="text-center">
              <p className="text-sm font-semibold text-primary">Pricing</p>

              <h2 className="mt-4 text-3xl font-semibold tracking-tight md:text-5xl">
                Start small. Scale securely.
              </h2>

              <p className="mx-auto mt-5 max-w-2xl text-lg text-muted-foreground">
                Choose the security capabilities that fit your AI infrastructure
                today and scale as your deployment grows.
              </p>
            </div>

            <div className="mt-14 grid gap-5 lg:grid-cols-3">
              {plans.map((plan) => (
                <div
                  key={plan.name}
                  className={`rounded-2xl border p-7 ${
                    plan.featured
                      ? "border-primary bg-primary/5 ring-1 ring-primary/20"
                      : "border-border bg-card/50"
                  }`}
                >
                  {plan.featured && (
                    <span className="inline-flex rounded-full bg-primary px-3 py-1 text-xs font-semibold text-primary-foreground">
                      Most popular
                    </span>
                  )}

                  <h3 className="mt-5 text-xl font-semibold">{plan.name}</h3>

                  <p className="mt-2 min-h-12 text-sm text-muted-foreground">
                    {plan.description}
                  </p>

                  <p className="mt-6 text-3xl font-semibold">{plan.price}</p>

                  <div className="my-7 h-px bg-border" />

                  <ul className="space-y-3">
                    {plan.features.map((feature) => (
                      <li
                        key={feature}
                        className="flex items-start gap-2 text-sm"
                      >
                        <Check className="mt-0.5 size-4 shrink-0 text-safe" />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>

                  <Link
                    href={plan.href}
                    className={`mt-8 flex items-center justify-center gap-2 rounded-lg px-4 py-3 text-sm font-semibold ${
                      plan.featured
                        ? "bg-primary text-primary-foreground hover:opacity-90"
                        : "border border-border hover:bg-accent"
                    }`}
                  >
                    {plan.cta}
                    <ArrowRight className="size-4" />
                  </Link>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Final CTA */}
        <section className="mx-auto max-w-7xl px-6 py-24 md:py-32">
          <div className="relative overflow-hidden rounded-3xl border border-primary/30 bg-primary/10 px-6 py-16 text-center md:px-12">
            <div className="relative mx-auto max-w-3xl">
              <ShieldCheck className="mx-auto size-10 text-primary" />

              <h2 className="mt-6 text-3xl font-semibold tracking-tight md:text-5xl">
                Build boldly. Secure by default.
              </h2>

              <p className="mx-auto mt-5 max-w-2xl text-lg text-muted-foreground">
                Give your AI agents the security layer they need to operate
                safely in production.
              </p>

              <div className="mt-8 flex flex-wrap justify-center gap-4">
                <Link
                  href="/register"
                  className="inline-flex items-center gap-2 rounded-lg bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground hover:opacity-90"
                >
                  Get started
                  <ArrowRight className="size-4" />
                </Link>

                <Link
                  href="/developer"
                  className="inline-flex items-center gap-2 rounded-lg border border-border bg-background/50 px-5 py-3 text-sm font-semibold hover:bg-background"
                >
                  Read the docs
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className="border-t border-border/60">
          <div className="mx-auto flex max-w-7xl flex-col gap-5 px-6 py-8 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-2">
              <ShieldCheck className="size-4 text-primary" />
              <span>PromptGuard</span>
            </div>

            <p>AI Security Gateway</p>

            <div className="flex gap-5">
              <Link href="/developer" className="hover:text-foreground">
                Documentation
              </Link>

              <Link href="/login" className="hover:text-foreground">
                Sign in
              </Link>
            </div>
          </div>
        </footer>
      </div>
    </main>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-border bg-background/50 p-3">
      <p className="text-[10px] text-muted-foreground">{label}</p>
      <p className="mt-1 text-lg font-semibold">{value}</p>
    </div>
  );
}

function SecurityEvent({
  type,
  title,
  agent,
  time,
}: {
  type: "BLOCKED" | "REVIEW" | "ALLOWED";
  title: string;
  agent: string;
  time: string;
}) {
  const styles = {
    BLOCKED: "text-blocked bg-blocked/10",
    REVIEW: "text-review bg-review/10",
    ALLOWED: "text-safe bg-safe/10",
  };

  return (
    <div className="flex items-center gap-3">
      <span
        className={`rounded-md px-2 py-1 text-[9px] font-semibold ${styles[type]}`}
      >
        {type}
      </span>

      <div className="min-w-0 flex-1">
        <p className="truncate text-xs font-medium">{title}</p>
        <p className="truncate text-[10px] text-muted-foreground">{agent}</p>
      </div>

      <span className="shrink-0 text-[10px] text-muted-foreground">
        {time}
      </span>
    </div>
  );
}

function ThreatCard({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div className="rounded-2xl border border-border bg-background/40 p-6">
      <div className="mb-5 size-2 rounded-full bg-blocked" />
      <h3 className="text-lg font-semibold">{title}</h3>
      <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
        {description}
      </p>
    </div>
  );
}
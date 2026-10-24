import Link from "next/link";
import { Check, Layers, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/theme/theme-toggle";

export default function PricingPage() {
  const plans = [
    {
      name: "Community / Starter",
      price: "$0",
      description: "Ideal for individual developers, open-source maintainers, and small study groups.",
      features: [
        "Up to 3 collaborative workspaces",
        "Unlimited documents and folders",
        "Real-time CRDT multi-user editing",
        "Live presence & remote cursor awareness",
        "30 days version history snapshots",
        "Standard community support",
      ],
      cta: "Get Started Free",
      href: "/sign-up",
      highlighted: false,
    },
    {
      name: "Pro Team",
      price: "$12",
      period: "per user / month",
      description: "Designed for fast-moving engineering teams and product pods requiring deep governance.",
      features: [
        "Unlimited workspaces & members",
        "Unlimited document version retention",
        "Granular RBAC (Owner, Editor, Commenter, Viewer)",
        "Time-bound, revocable share links with password protection",
        "Full-text search across all workspaces",
        "Priority WebSocket collaboration bandwidth",
        "Comprehensive audit event export",
      ],
      cta: "Start 14-Day Pro Trial",
      href: "/sign-up",
      highlighted: true,
    },
    {
      name: "Enterprise",
      price: "Custom",
      description: "Dedicated infrastructure, zero-trust isolation, and enterprise compliance guarantees.",
      features: [
        "Custom deployment (Self-hosted or Private Cloud)",
        "Single Sign-On (SAML / Okta / Azure AD)",
        "Dedicated isolated PostgreSQL & WebSocket cluster",
        "Custom data retention & deletion policies",
        "99.99% uptime SLA with 24/7 dedicated engineer",
        "SOC2 Type II & GDPR compliance reports",
      ],
      cta: "Contact Enterprise Sales",
      href: "/sign-in",
      highlighted: false,
    },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground selection:bg-primary/20">
      <header className="border-b border-border/60 bg-background/80 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="h-9 w-9 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
              <Layers className="h-5 w-5" />
            </div>
            <span className="text-lg font-bold tracking-tight text-foreground">
              SyncSpace
            </span>
          </Link>

          <div className="flex items-center gap-3">
            <ThemeToggle />
            <Link href="/sign-in">
              <Button variant="ghost" size="sm">
                Sign In
              </Button>
            </Link>
            <Link href="/sign-up">
              <Button size="sm">Get Started</Button>
            </Link>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-24">
        <div className="text-center max-w-3xl mx-auto mb-16 space-y-4">
          <h1 className="text-4xl font-extrabold tracking-tight text-foreground sm:text-5xl">
            Simple, Transparent Pricing
          </h1>
          <p className="text-lg text-muted-foreground">
            No credit card required for our Free tier. Upgrade anytime as your collaborative documentation scales.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-stretch">
          {plans.map((plan) => (
            <div
              key={plan.name}
              className={`rounded-2xl border flex flex-col justify-between p-8 transition-all ${
                plan.highlighted
                  ? "border-primary shadow-xl bg-card relative ring-2 ring-primary/20"
                  : "border-border bg-card shadow-sm hover:border-border/80"
              }`}
            >
              {plan.highlighted && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-primary text-primary-foreground text-xs font-semibold tracking-wider uppercase">
                  Most Popular
                </div>
              )}

              <div className="space-y-6">
                <div>
                  <h3 className="text-xl font-bold text-foreground">
                    {plan.name}
                  </h3>
                  <p className="text-xs text-muted-foreground mt-2 leading-relaxed">
                    {plan.description}
                  </p>
                </div>

                <div className="flex items-baseline gap-1">
                  <span className="text-4xl font-extrabold text-foreground tracking-tight">
                    {plan.price}
                  </span>
                  {plan.period && (
                    <span className="text-xs text-muted-foreground">
                      {plan.period}
                    </span>
                  )}
                </div>

                <ul className="space-y-3 border-t border-border pt-6 text-xs text-muted-foreground">
                  {plan.features.map((feat) => (
                    <li key={feat} className="flex items-start gap-2.5">
                      <Check className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                      <span>{feat}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="pt-8">
                <Link href={plan.href}>
                  <Button
                    variant={plan.highlighted ? "default" : "outline"}
                    className="w-full font-medium gap-1.5"
                  >
                    <span>{plan.cta}</span>
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </Link>
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}

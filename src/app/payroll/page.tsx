import Link from "next/link";
import {
  CheckCircle,
  Shield,
  Clock,
  Users,
  DollarSign,
  ArrowRight,
  FileText,
  Calculator,
} from "lucide-react";

export const metadata = {
  title: "Payroll Services | BookkeeperAI",
  description:
    "AI-powered payroll processing for Canadian businesses. Automated tax calculations, direct deposits, and compliance reporting.",
};

const features = [
  {
    icon: Calculator,
    title: "Automated Tax Calculations",
    description:
      "CPP, EI, federal & provincial tax deductions calculated automatically with every pay run.",
  },
  {
    icon: Clock,
    title: "Scheduled Pay Runs",
    description:
      "Set up weekly, bi-weekly, semi-monthly, or monthly pay schedules that run automatically.",
  },
  {
    icon: FileText,
    title: "Compliance Reports",
    description:
      "T4s, ROEs, and all required CRA filings generated and ready to submit.",
  },
  {
    icon: Users,
    title: "Employee Self-Service",
    description:
      "Employees can view pay stubs, T4s, and update personal info through their own portal.",
  },
  {
    icon: Shield,
    title: "CRA Compliant",
    description:
      "Stay compliant with all federal and provincial payroll regulations, updated automatically.",
  },
  {
    icon: DollarSign,
    title: "Direct Deposit",
    description:
      "Employees get paid directly to their bank accounts. No checks to print or mail.",
  },
];

const plans = [
  {
    name: "Payroll Starter",
    price: "$40",
    period: "/month",
    description: "For small teams up to 10 employees",
    features: [
      "Up to 10 employees",
      "Unlimited pay runs",
      "Basic tax calculations",
      "Pay stub generation",
      "Email support",
    ],
  },
  {
    name: "Payroll Pro",
    price: "$80",
    period: "/month",
    description: "For growing businesses up to 50 employees",
    popular: true,
    features: [
      "Up to 50 employees",
      "Unlimited pay runs",
      "Full tax calculations (CPP, EI, etc.)",
      "T4 & ROE generation",
      "Direct deposit",
      "Employee self-service portal",
      "Priority support",
    ],
  },
  {
    name: "Payroll Enterprise",
    price: "Custom",
    period: "",
    description: "For large organizations with 50+ employees",
    features: [
      "Unlimited employees",
      "Multi-province payroll",
      "Custom pay structures",
      "API access",
      "Dedicated account manager",
      "Custom integrations",
      "SLA guarantee",
    ],
  },
];

export default function PayrollPage() {
  return (
    <main className="min-h-screen bg-navy-950">
      {/* Hero */}
      <section className="relative overflow-hidden px-6 py-24 text-center">
        <div className="absolute inset-0 gradient-mesh opacity-50" />
        <div className="relative z-10 mx-auto max-w-3xl">
          <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-teal-500/10">
            <DollarSign className="h-8 w-8 text-teal-400" />
          </div>
          <h1 className="text-4xl font-bold text-white sm:text-5xl">
            Payroll Made{" "}
            <span className="text-gradient">Simple</span>
          </h1>
          <p className="mt-6 text-lg text-slate-400">
            AI-powered payroll processing for Canadian businesses. Automated tax
            calculations, direct deposits, and compliance reporting - all in one
            place.
          </p>
          <div className="mt-8 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Link
              href="/get-started"
              className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-teal-500 to-teal-400 px-8 py-3.5 font-semibold text-navy-950 transition-all hover:brightness-110"
            >
              Start Free Trial
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href="/contact"
              className="rounded-xl border border-navy-600 px-8 py-3.5 font-semibold text-white transition-colors hover:bg-navy-800"
            >
              Talk to Sales
            </Link>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="mx-auto max-w-6xl px-6 py-20">
        <h2 className="text-center text-3xl font-bold text-white">
          Everything You Need for Payroll
        </h2>
        <p className="mt-4 text-center text-slate-400">
          From onboarding to year-end, we handle it all.
        </p>
        <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((feature) => {
            const Icon = feature.icon;
            return (
              <div key={feature.title} className="glass-card rounded-xl p-6">
                <div className="rounded-lg bg-teal-500/10 p-3 w-fit">
                  <Icon className="h-6 w-6 text-teal-400" />
                </div>
                <h3 className="mt-4 text-lg font-semibold text-white">
                  {feature.title}
                </h3>
                <p className="mt-2 text-sm text-slate-400">
                  {feature.description}
                </p>
              </div>
            );
          })}
        </div>
      </section>

      {/* Pricing */}
      <section className="mx-auto max-w-6xl px-6 py-20">
        <h2 className="text-center text-3xl font-bold text-white">
          Payroll Plans
        </h2>
        <p className="mt-4 text-center text-slate-400">
          Simple, transparent pricing. 14-day free trial on all plans.
        </p>
        <div className="mt-12 grid gap-6 lg:grid-cols-3">
          {plans.map((plan) => (
            <div
              key={plan.name}
              className={`glass-card rounded-2xl p-8 ${
                plan.popular
                  ? "border-teal-400/30 ring-1 ring-teal-400/20"
                  : ""
              }`}
            >
              {plan.popular && (
                <span className="mb-4 inline-block rounded-full bg-teal-500/10 px-3 py-1 text-xs font-semibold text-teal-400">
                  Most Popular
                </span>
              )}
              <h3 className="text-xl font-bold text-white">{plan.name}</h3>
              <p className="mt-1 text-sm text-slate-400">{plan.description}</p>
              <div className="mt-4">
                <span className="text-4xl font-bold text-white">
                  {plan.price}
                </span>
                <span className="text-slate-400">{plan.period}</span>
              </div>
              <ul className="mt-6 space-y-3">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-center gap-3 text-sm text-slate-300">
                    <CheckCircle className="h-4 w-4 shrink-0 text-teal-400" />
                    {feature}
                  </li>
                ))}
              </ul>
              <Link
                href="/get-started"
                className={`mt-8 flex w-full items-center justify-center rounded-xl py-3 font-semibold transition-all ${
                  plan.popular
                    ? "bg-gradient-to-r from-teal-500 to-teal-400 text-navy-950 hover:brightness-110"
                    : "border border-navy-600 text-white hover:bg-navy-800"
                }`}
              >
                {plan.price === "Custom" ? "Contact Sales" : "Start Free Trial"}
              </Link>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="mx-auto max-w-3xl px-6 py-20 text-center">
        <h2 className="text-3xl font-bold text-white">
          Ready to Simplify Your Payroll?
        </h2>
        <p className="mt-4 text-slate-400">
          Join hundreds of Canadian businesses using BookkeeperAI for hassle-free payroll.
        </p>
        <Link
          href="/get-started"
          className="mt-8 inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-teal-500 to-teal-400 px-8 py-3.5 font-semibold text-navy-950 transition-all hover:brightness-110"
        >
          Get Started for Free
          <ArrowRight className="h-4 w-4" />
        </Link>
      </section>

      {/* Footer link */}
      <div className="border-t border-navy-800 py-6 text-center">
        <Link href="/" className="text-sm text-slate-500 hover:text-teal-400">
          &larr; Back to BookkeeperAI Home
        </Link>
      </div>
    </main>
  );
}

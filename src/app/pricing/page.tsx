"use client";

import { useState } from "react";
import Link from "next/link";
import { Check, ChevronDown, ChevronUp } from "lucide-react";
import Navbar from "@/components/landing/Navbar";
import Footer from "@/components/landing/Footer";
import { CPA_PRICING, DIRECT_PRICING } from "@/lib/constants";

function PricingCard({
  plan,
}: {
  plan: (typeof CPA_PRICING)[number] | (typeof DIRECT_PRICING)[number];
}) {
  return (
    <div
      className={`relative rounded-2xl p-8 transition-all duration-300 ${
        plan.highlighted
          ? "glass-card border-teal-400/30 glow-teal scale-105"
          : "glass-card hover:border-teal-400/20"
      }`}
    >
      {plan.highlighted && (
        <div className="absolute -top-4 left-1/2 -translate-x-1/2 rounded-full bg-gradient-to-r from-teal-500 to-cyan-400 px-4 py-1 text-xs font-bold text-navy-950">
          MOST POPULAR
        </div>
      )}
      <h3 className="text-xl font-bold text-white">{plan.name}</h3>
      <div className="mt-4 flex items-baseline gap-1">
        <span className="text-4xl font-bold text-gradient">{plan.price}</span>
        <span className="text-sm text-slate-400">{plan.period}</span>
      </div>
      <p className="mt-2 text-sm text-slate-400">{plan.entities}</p>
      {"bestFor" in plan && (
        <p className="mt-1 text-xs text-teal-400/70">Best for: {plan.bestFor}</p>
      )}
      <ul className="mt-6 space-y-3">
        {plan.features.map((feature) => (
          <li key={feature} className="flex items-start gap-3 text-sm text-slate-300">
            <Check className="mt-0.5 h-4 w-4 shrink-0 text-teal-400" />
            {feature}
          </li>
        ))}
      </ul>
      <Link
        href="/contact"
        className={`mt-8 block rounded-xl py-3 text-center text-sm font-semibold transition-all ${
          plan.highlighted
            ? "bg-gradient-to-r from-teal-500 to-teal-400 text-navy-950 hover:brightness-110"
            : "border border-teal-400/20 text-teal-400 hover:bg-teal-400/10"
        }`}
      >
        Get Started
      </Link>
    </div>
  );
}

function FAQItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="glass-card rounded-xl">
      <button
        onClick={() => setOpen(!open)}
        className="flex w-full items-center justify-between px-6 py-4 text-left"
      >
        <span className="font-medium text-white">{q}</span>
        {open ? (
          <ChevronUp className="h-5 w-5 text-teal-400" />
        ) : (
          <ChevronDown className="h-5 w-5 text-slate-500" />
        )}
      </button>
      {open && <div className="px-6 pb-4 text-sm leading-relaxed text-slate-400">{a}</div>}
    </div>
  );
}

const faqs = [
  {
    q: "What is included in the bookkeeping service?",
    a: "Every plan includes bank reconciliation, transaction categorization, financial statement preparation (P&L, Balance Sheet, Cash Flow), and document management. Higher tiers add payroll, AI analytics, and dedicated team support.",
  },
  {
    q: "How does the 3-day SLA work?",
    a: "Once you upload your documents, our team (powered by AI + expert accountants) processes your books within 3 business days. Our India-based team works overnight in your timezone, so you wake up to clean books.",
  },
  {
    q: "Can I switch plans later?",
    a: "Absolutely. You can upgrade or downgrade at any time. Changes take effect on your next billing cycle. Enterprise clients get custom pricing based on volume.",
  },
  {
    q: "What accounting software do you support?",
    a: "We integrate with QuickBooks Online, QuickBooks Desktop, Xero, and Zoho Books. Our team works directly in your existing software - no migration needed.",
  },
  {
    q: "Is there a free trial?",
    a: "Yes! We offer a 14-day free trial for all plans. No credit card required. We'll process one month of bookkeeping during the trial so you can see the quality firsthand.",
  },
  {
    q: "How is my data secured?",
    a: "All data is encrypted with AES-256 at rest and TLS 1.3 in transit. We're on the path to SOC 2 Type II certification. Role-based access controls ensure only authorized personnel see your data.",
  },
];

export default function PricingPage() {
  const [tab, setTab] = useState<"cpa" | "business">("cpa");

  return (
    <main className="min-h-screen bg-navy-950">
      <Navbar />

      <section className="relative pt-32 pb-20">
        <div className="absolute inset-0 gradient-mesh" />
        <div className="relative mx-auto max-w-7xl px-6">
          <div className="text-center">
            <h1 className="text-4xl font-bold sm:text-5xl">
              Simple, Transparent <span className="text-gradient">Pricing</span>
            </h1>
            <p className="mx-auto mt-4 max-w-2xl text-lg text-slate-400">
              Choose the plan that fits your practice. All plans include AI-powered
              bookkeeping, document management, and our 3-day SLA guarantee.
            </p>
          </div>

          <div className="mx-auto mt-10 flex max-w-sm rounded-xl bg-navy-800/50 p-1">
            <button
              onClick={() => setTab("cpa")}
              className={`flex-1 rounded-lg py-2.5 text-sm font-medium transition-all ${
                tab === "cpa"
                  ? "bg-teal-500 text-navy-950"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              For CPA Firms
            </button>
            <button
              onClick={() => setTab("business")}
              className={`flex-1 rounded-lg py-2.5 text-sm font-medium transition-all ${
                tab === "business"
                  ? "bg-teal-500 text-navy-950"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              For Businesses
            </button>
          </div>

          <div className="mt-12 grid gap-8 md:grid-cols-3">
            {(tab === "cpa" ? CPA_PRICING : DIRECT_PRICING).map((plan) => (
              <PricingCard key={plan.name} plan={plan} />
            ))}
          </div>

          <div className="mt-20 text-center">
            <h2 className="text-2xl font-bold text-white">Add-On Services</h2>
            <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {[
                { name: "Payroll Processing", price: "CAD $99/mo + $5/employee", margin: "~65% margin" },
                { name: "Tax Filing Support", price: "CAD $199/filing", margin: "~70% margin" },
                { name: "AI Financial Analysis", price: "CAD $149/mo", margin: "~80% margin" },
                { name: "Custom Setup", price: "CAD $499 one-time", margin: "~75% margin" },
              ].map((addon) => (
                <div key={addon.name} className="glass-card rounded-xl p-6 text-center">
                  <h3 className="font-semibold text-white">{addon.name}</h3>
                  <p className="mt-2 text-lg font-bold text-teal-400">{addon.price}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-20">
            <h2 className="mb-8 text-center text-2xl font-bold text-white">
              Frequently Asked Questions
            </h2>
            <div className="mx-auto max-w-3xl space-y-3">
              {faqs.map((faq) => (
                <FAQItem key={faq.q} q={faq.q} a={faq.a} />
              ))}
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </main>
  );
}

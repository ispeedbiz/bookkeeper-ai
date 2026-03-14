"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import {
  LayoutDashboard,
  Layers,
  Users,
  GitPullRequest,
  Palette,
  BarChart3,
  ArrowRight,
} from "lucide-react";

const FEATURES = [
  {
    icon: LayoutDashboard,
    title: "Unified Client View",
    description: "See all client entities, statuses, and deadlines in a single powerful dashboard.",
  },
  {
    icon: Layers,
    title: "Bulk Operations",
    description: "Run reconciliations, reports, and categorizations across multiple clients at once.",
  },
  {
    icon: Users,
    title: "Staff Assignment",
    description: "Assign your team or our accountants to specific clients with role-based access.",
  },
  {
    icon: GitPullRequest,
    title: "Review Workflows",
    description: "Multi-level review and approval flows that match your firm's quality standards.",
  },
  {
    icon: Palette,
    title: "White-Label Option",
    description: "Deliver bookkeeping under your brand. Clients never know about the magic behind it.",
  },
  {
    icon: BarChart3,
    title: "Revenue Analytics",
    description: "Track profitability per client, utilization rates, and revenue forecasts in real time.",
  },
];

export default function ForCPAs() {
  return (
    <section id="for-cpas" className="relative py-24 sm:py-32 overflow-hidden">
      <div className="absolute inset-0 bg-[#050a18]" />
      <div className="absolute top-0 right-0 h-[500px] w-[500px] rounded-full bg-teal-500/[0.04] blur-[120px]" />
      <div className="absolute bottom-0 left-1/4 h-[400px] w-[400px] rounded-full bg-amber-500/[0.03] blur-[100px]" />

      <div className="relative mx-auto max-w-7xl px-6 lg:px-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mx-auto max-w-2xl text-center"
        >
          <span className="inline-block rounded-full border border-amber-400/20 bg-amber-400/[0.08] px-4 py-1.5 text-xs font-semibold tracking-wider text-amber-400 uppercase">
            For CPA Firms
          </span>
          <h2 className="mt-6 text-3xl sm:text-4xl lg:text-5xl font-bold text-white tracking-tight">
            Built for CPA Firms{" "}
            <span className="bg-gradient-to-r from-amber-300 to-amber-400 bg-clip-text text-transparent">
              That Want to Scale
            </span>
          </h2>
          <p className="mt-4 text-lg text-slate-400 leading-relaxed">
            Stop losing margins to manual bookkeeping. Our platform gives your firm leverage to grow
            without proportionally growing headcount.
          </p>
        </motion.div>

        {/* Features Grid */}
        <div className="mt-16 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((feature, i) => {
            const Icon = feature.icon;
            return (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.08 }}
                className="group relative rounded-2xl border border-white/[0.06] bg-white/[0.02] p-6 backdrop-blur-sm transition-all duration-300 hover:border-amber-400/15 hover:bg-white/[0.04]"
              >
                <div className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-amber-400/15 to-amber-400/5 text-amber-400 transition-colors group-hover:from-amber-400/25 group-hover:to-amber-400/10">
                  <Icon className="h-5 w-5" />
                </div>
                <h3 className="mt-4 text-base font-semibold text-white">{feature.title}</h3>
                <p className="mt-2 text-sm text-slate-400 leading-relaxed">
                  {feature.description}
                </p>
              </motion.div>
            );
          })}
        </div>

        {/* CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.4 }}
          className="mt-12 text-center"
        >
          <Link
            href="/get-started?type=cpa"
            className="group inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-teal-500 to-teal-400 px-8 py-4 text-base font-semibold text-[#050a18] shadow-[0_0_30px_rgba(45,212,191,0.25)] transition-all hover:shadow-[0_0_40px_rgba(45,212,191,0.4)] hover:brightness-110"
          >
            Start Your Free CPA Trial
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
          </Link>
          <p className="mt-3 text-sm text-slate-500">No credit card required. 14-day free trial.</p>
        </motion.div>
      </div>
    </section>
  );
}

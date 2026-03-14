"use client";

import { motion } from "framer-motion";
import { UserPlus, Upload, BookCheck } from "lucide-react";

const STEPS = [
  {
    number: "01",
    title: "Sign Up & Connect",
    description:
      "Create your account in minutes. Connect your QuickBooks, Xero, or preferred accounting software securely.",
    icon: UserPlus,
    color: "teal",
    gradient: "from-teal-500 to-teal-400",
    glow: "rgba(45, 212, 191, 0.2)",
    bg: "from-teal-500/20 to-teal-500/5",
  },
  {
    number: "02",
    title: "Upload Documents",
    description:
      "Drop your receipts, invoices, and bank statements. Our AI instantly categorizes and matches transactions.",
    icon: Upload,
    color: "cyan",
    gradient: "from-cyan-400 to-cyan-300",
    glow: "rgba(34, 211, 238, 0.2)",
    bg: "from-cyan-500/20 to-cyan-500/5",
  },
  {
    number: "03",
    title: "Get Clean Books",
    description:
      "Receive accurate, reconciled books within 3 business days. Review, approve, and focus on growing your business.",
    icon: BookCheck,
    color: "amber",
    gradient: "from-amber-400 to-amber-300",
    glow: "rgba(251, 191, 36, 0.2)",
    bg: "from-amber-500/20 to-amber-500/5",
  },
];

export default function HowItWorks() {
  return (
    <section className="relative py-24 sm:py-32 overflow-hidden">
      <div className="absolute inset-0 bg-[#050a18]" />
      <div className="absolute bottom-0 left-0 h-[400px] w-[400px] rounded-full bg-teal-500/[0.03] blur-[120px]" />

      <div className="relative mx-auto max-w-7xl px-6 lg:px-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mx-auto max-w-2xl text-center"
        >
          <span className="inline-block rounded-full border border-teal-400/20 bg-teal-400/[0.08] px-4 py-1.5 text-xs font-semibold tracking-wider text-teal-300 uppercase">
            How It Works
          </span>
          <h2 className="mt-6 text-3xl sm:text-4xl lg:text-5xl font-bold text-white tracking-tight">
            Three Steps to{" "}
            <span className="bg-gradient-to-r from-teal-300 to-amber-400 bg-clip-text text-transparent">
              Perfect Books
            </span>
          </h2>
          <p className="mt-4 text-lg text-slate-400 leading-relaxed">
            Get started in minutes, not weeks. Our streamlined onboarding gets you up and running fast.
          </p>
        </motion.div>

        {/* Steps */}
        <div className="mt-20 grid gap-8 lg:grid-cols-3 lg:gap-6">
          {STEPS.map((step, i) => {
            const Icon = step.icon;
            return (
              <motion.div
                key={step.number}
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: i * 0.15 }}
                className="relative"
              >
                {/* Connecting line (desktop only) */}
                {i < STEPS.length - 1 && (
                  <div className="hidden lg:block absolute top-16 left-[60%] w-[80%] h-px">
                    <motion.div
                      initial={{ scaleX: 0 }}
                      whileInView={{ scaleX: 1 }}
                      viewport={{ once: true }}
                      transition={{ duration: 0.8, delay: 0.5 + i * 0.2 }}
                      className="h-full bg-gradient-to-r from-white/10 to-white/[0.03] origin-left"
                    />
                    <motion.div
                      initial={{ opacity: 0 }}
                      whileInView={{ opacity: 1 }}
                      viewport={{ once: true }}
                      transition={{ delay: 1 + i * 0.2 }}
                      className="absolute right-0 top-1/2 -translate-y-1/2 h-2 w-2 rounded-full bg-white/10"
                    />
                  </div>
                )}

                {/* Card */}
                <div className="relative rounded-2xl border border-white/[0.06] bg-white/[0.02] p-8 backdrop-blur-sm h-full">
                  {/* Number + Icon row */}
                  <div className="flex items-center gap-4">
                    <div
                      className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br ${step.bg}`}
                      style={{ boxShadow: `0 0 30px ${step.glow}` }}
                    >
                      <Icon className="h-7 w-7" style={{ color: step.glow.replace("0.2", "1") }} />
                    </div>
                    <span className="text-5xl font-bold text-white/[0.06] select-none">
                      {step.number}
                    </span>
                  </div>

                  <h3 className="mt-6 text-xl font-semibold text-white">{step.title}</h3>
                  <p className="mt-3 text-sm text-slate-400 leading-relaxed">{step.description}</p>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

"use client";

import { motion } from "framer-motion";
import { ShieldCheck, Lock, Award, CheckCircle } from "lucide-react";

const BADGES = [
  { icon: CheckCircle, label: "QuickBooks Certified" },
  { icon: Award, label: "Xero Partner" },
  { icon: ShieldCheck, label: "SOC 2 Compliant" },
  { icon: Lock, label: "256-bit Encrypted" },
];

const LOGOS = [
  "Deloitte & Co.",
  "Grant Thornton",
  "BDO Canada",
  "MNP LLP",
  "KPMG",
  "RSM Canada",
  "Baker Tilly",
  "Crowe LLP",
  "Marcum LLP",
  "Cherry Bekaert",
];

export default function TrustBar() {
  return (
    <section className="relative border-y border-white/[0.04] bg-[#050a18] py-12 overflow-hidden">
      {/* Subtle gradient */}
      <div className="absolute inset-0 bg-gradient-to-r from-teal-500/[0.02] via-transparent to-teal-500/[0.02]" />

      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        {/* Title */}
        <motion.p
          initial={{ opacity: 0, y: 10 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center text-xs font-semibold tracking-[0.25em] text-slate-500 uppercase"
        >
          Trusted by 500+ CPAs Across North America
        </motion.p>

        {/* Badges */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.15 }}
          className="mt-8 flex flex-wrap items-center justify-center gap-4 sm:gap-6"
        >
          {BADGES.map((badge) => (
            <div
              key={badge.label}
              className="inline-flex items-center gap-2 rounded-full border border-white/[0.06] bg-white/[0.02] px-4 py-2 text-sm font-medium text-slate-400 backdrop-blur-sm"
            >
              <badge.icon className="h-4 w-4 text-teal-400" />
              {badge.label}
            </div>
          ))}
        </motion.div>

        {/* Scrolling Logos */}
        <div className="relative mt-10">
          {/* Fade edges */}
          <div className="pointer-events-none absolute left-0 top-0 z-10 h-full w-24 bg-gradient-to-r from-[#050a18] to-transparent" />
          <div className="pointer-events-none absolute right-0 top-0 z-10 h-full w-24 bg-gradient-to-l from-[#050a18] to-transparent" />

          <div className="flex overflow-hidden">
            <motion.div
              animate={{ x: [0, -1920] }}
              transition={{
                x: { repeat: Infinity, repeatType: "loop", duration: 30, ease: "linear" },
              }}
              className="flex shrink-0 gap-12 items-center"
            >
              {[...LOGOS, ...LOGOS].map((name, i) => (
                <span
                  key={`${name}-${i}`}
                  className="whitespace-nowrap text-sm font-semibold text-slate-600/60 tracking-wide"
                >
                  {name}
                </span>
              ))}
            </motion.div>
            <motion.div
              animate={{ x: [0, -1920] }}
              transition={{
                x: { repeat: Infinity, repeatType: "loop", duration: 30, ease: "linear" },
              }}
              className="flex shrink-0 gap-12 items-center ml-12"
            >
              {[...LOGOS, ...LOGOS].map((name, i) => (
                <span
                  key={`${name}-dup-${i}`}
                  className="whitespace-nowrap text-sm font-semibold text-slate-600/60 tracking-wide"
                >
                  {name}
                </span>
              ))}
            </motion.div>
          </div>
        </div>
      </div>
    </section>
  );
}

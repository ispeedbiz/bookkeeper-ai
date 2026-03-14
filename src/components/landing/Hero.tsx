"use client";

import { useRef } from "react";
import Link from "next/link";
import { motion, useInView } from "framer-motion";
import { ArrowRight, Building2, Briefcase } from "lucide-react";
import { STATS } from "@/lib/constants";

function AnimatedCounter({ value, label, index }: { value: string; label: string; index: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.6, delay: 0.6 + index * 0.1 }}
      className="relative text-center px-6"
    >
      <div className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-teal-300 to-teal-400 bg-clip-text text-transparent">
        {value}
      </div>
      <div className="mt-1 text-xs sm:text-sm text-slate-400 font-medium">{label}</div>
    </motion.div>
  );
}

export default function Hero() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true });

  return (
    <section
      ref={ref}
      className="relative min-h-screen flex items-center justify-center overflow-hidden pt-20"
    >
      {/* Gradient Mesh Background */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute inset-0 bg-[#050a18]" />
        <div className="absolute top-0 left-1/4 h-[600px] w-[600px] rounded-full bg-teal-500/[0.07] blur-[120px] animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 h-[500px] w-[500px] rounded-full bg-cyan-500/[0.05] blur-[100px] animate-pulse [animation-delay:2s]" />
        <div className="absolute top-1/3 right-1/3 h-[400px] w-[400px] rounded-full bg-amber-500/[0.04] blur-[100px] animate-pulse [animation-delay:4s]" />
        {/* Grain overlay */}
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='1'/%3E%3C/svg%3E")`,
          }}
        />
        {/* Grid pattern */}
        <div
          className="absolute inset-0 opacity-[0.04]"
          style={{
            backgroundImage:
              "linear-gradient(rgba(255,255,255,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.05) 1px, transparent 1px)",
            backgroundSize: "60px 60px",
          }}
        />
      </div>

      <div className="mx-auto max-w-7xl px-6 py-24 sm:py-32 lg:px-8">
        <div className="mx-auto max-w-4xl text-center">
          {/* Badge */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.6 }}
            className="mb-8 inline-flex items-center gap-2 rounded-full border border-teal-400/20 bg-teal-400/[0.08] px-4 py-1.5 text-sm font-medium text-teal-300"
          >
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-teal-400 opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-teal-400" />
            </span>
            AI-Powered Bookkeeping Platform
          </motion.div>

          {/* Headline */}
          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.7, delay: 0.15 }}
            className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight text-white leading-[1.1]"
          >
            Your AI Bookkeeper
            <br />
            <span className="bg-gradient-to-r from-teal-300 via-teal-400 to-cyan-400 bg-clip-text text-transparent">
              That Never Sleeps
            </span>
          </motion.h1>

          {/* Subtitle */}
          <motion.p
            initial={{ opacity: 0, y: 30 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.7, delay: 0.3 }}
            className="mt-6 text-lg sm:text-xl text-slate-400 max-w-2xl mx-auto leading-relaxed"
          >
            AI intelligence meets expert accountants. Clean books delivered in{" "}
            <span className="text-teal-300 font-semibold">3 business days</span>,
            starting at{" "}
            <span className="text-amber-400 font-semibold">CAD $249/mo</span>.
            Built for CPA firms and growing businesses across North America.
          </motion.p>

          {/* CTAs */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.7, delay: 0.45 }}
            className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4"
          >
            <Link
              href="/get-started?type=cpa"
              className="group inline-flex w-full sm:w-auto items-center justify-center gap-3 rounded-xl bg-gradient-to-r from-teal-500 to-teal-400 px-8 py-4 text-base font-semibold text-[#050a18] shadow-[0_0_30px_rgba(45,212,191,0.3)] transition-all hover:shadow-[0_0_40px_rgba(45,212,191,0.5)] hover:brightness-110"
            >
              <Building2 className="h-5 w-5" />
              I&apos;m a CPA Firm
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
            </Link>
            <Link
              href="/get-started?type=business"
              className="group inline-flex w-full sm:w-auto items-center justify-center gap-3 rounded-xl border border-white/15 bg-white/[0.04] px-8 py-4 text-base font-semibold text-white backdrop-blur-sm transition-all hover:border-white/25 hover:bg-white/[0.08]"
            >
              <Briefcase className="h-5 w-5" />
              I&apos;m a Business Owner
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
            </Link>
          </motion.div>
        </div>

        {/* Stats */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, delay: 0.5 }}
          className="mx-auto mt-20 max-w-3xl"
        >
          <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-6 backdrop-blur-xl">
            <div className="grid grid-cols-2 gap-6 sm:grid-cols-4 divide-x divide-white/[0.06] [&>*:first-child]:border-0 [&>*:nth-child(3)]:border-0 sm:[&>*:nth-child(3)]:border-l">
              {STATS.map((stat, i) => (
                <AnimatedCounter
                  key={stat.label}
                  value={stat.value}
                  label={stat.label}
                  index={i}
                />
              ))}
            </div>
          </div>
        </motion.div>
      </div>

      {/* Bottom fade */}
      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-[#050a18] to-transparent" />
    </section>
  );
}

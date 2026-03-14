"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { ArrowRight, CheckCircle, Loader2 } from "lucide-react";

export default function CTASection() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success">("idle");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    setStatus("loading");
    // Simulate API call
    await new Promise((r) => setTimeout(r, 1500));
    setStatus("success");
    setEmail("");
    setTimeout(() => setStatus("idle"), 4000);
  };

  return (
    <section className="relative py-24 sm:py-32 overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 bg-[#050a18]" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-[700px] w-[700px] rounded-full bg-teal-500/[0.06] blur-[150px]" />
      <div className="absolute top-1/4 right-1/4 h-[300px] w-[300px] rounded-full bg-amber-500/[0.04] blur-[100px]" />
      {/* Grain */}
      <div
        className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='1'/%3E%3C/svg%3E")`,
        }}
      />

      <div className="relative mx-auto max-w-7xl px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mx-auto max-w-2xl text-center"
        >
          {/* Badge */}
          <span className="inline-block rounded-full border border-amber-400/20 bg-amber-400/[0.08] px-4 py-1.5 text-xs font-semibold tracking-wider text-amber-400 uppercase">
            Get Started Today
          </span>

          <h2 className="mt-6 text-3xl sm:text-4xl lg:text-5xl font-bold text-white tracking-tight">
            Start Your Free{" "}
            <span className="bg-gradient-to-r from-teal-300 to-teal-400 bg-clip-text text-transparent">
              14-Day Trial
            </span>
          </h2>

          <p className="mt-4 text-lg text-slate-400 leading-relaxed">
            No credit card required. Full access to all features. Cancel anytime.
            See why 500+ CPA firms trust BookkeeperAI.
          </p>

          {/* Form */}
          <form onSubmit={handleSubmit} className="mt-10 flex flex-col sm:flex-row gap-3 max-w-lg mx-auto">
            <div className="relative flex-1">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your work email"
                required
                className="w-full rounded-xl border border-white/[0.08] bg-white/[0.04] px-5 py-4 text-sm text-white placeholder:text-slate-500 backdrop-blur-sm outline-none transition-all focus:border-teal-400/30 focus:bg-white/[0.06] focus:ring-1 focus:ring-teal-400/20"
              />
            </div>
            <button
              type="submit"
              disabled={status === "loading" || status === "success"}
              className="group inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-teal-500 to-teal-400 px-7 py-4 text-sm font-semibold text-[#050a18] shadow-[0_0_30px_rgba(45,212,191,0.25)] transition-all hover:shadow-[0_0_40px_rgba(45,212,191,0.4)] hover:brightness-110 disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {status === "loading" ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Sending...
                </>
              ) : status === "success" ? (
                <>
                  <CheckCircle className="h-4 w-4" />
                  Check Your Email!
                </>
              ) : (
                <>
                  Start Free Trial
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                </>
              )}
            </button>
          </form>

          {/* Trust signals */}
          <div className="mt-6 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-xs text-slate-500">
            <span className="inline-flex items-center gap-1.5">
              <CheckCircle className="h-3.5 w-3.5 text-teal-400/60" />
              14-day free trial
            </span>
            <span className="inline-flex items-center gap-1.5">
              <CheckCircle className="h-3.5 w-3.5 text-teal-400/60" />
              No credit card required
            </span>
            <span className="inline-flex items-center gap-1.5">
              <CheckCircle className="h-3.5 w-3.5 text-teal-400/60" />
              Cancel anytime
            </span>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

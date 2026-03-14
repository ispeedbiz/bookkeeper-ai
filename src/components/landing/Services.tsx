"use client";

import { motion } from "framer-motion";
import {
  BookOpen,
  CheckCircle,
  DollarSign,
  Globe,
  Brain,
  FileText,
  Shield,
  Truck,
  type LucideIcon,
} from "lucide-react";
import { SERVICES } from "@/lib/constants";

const ICON_MAP: Record<string, LucideIcon> = {
  BookOpen,
  CheckCircle,
  DollarSign,
  Globe,
  Brain,
  FileText,
  Shield,
  Truck,
};

export default function Services() {
  return (
    <section id="services" className="relative py-24 sm:py-32 overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 bg-[#050a18]" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-[600px] w-[600px] rounded-full bg-teal-500/[0.04] blur-[150px]" />

      <div className="relative mx-auto max-w-7xl px-6 lg:px-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mx-auto max-w-2xl text-center"
        >
          <span className="inline-block rounded-full border border-teal-400/20 bg-teal-400/[0.08] px-4 py-1.5 text-xs font-semibold tracking-wider text-teal-300 uppercase">
            Our Services
          </span>
          <h2 className="mt-6 text-3xl sm:text-4xl lg:text-5xl font-bold text-white tracking-tight">
            Everything Your Books Need,{" "}
            <span className="bg-gradient-to-r from-teal-300 to-cyan-400 bg-clip-text text-transparent">
              Under One Roof
            </span>
          </h2>
          <p className="mt-4 text-lg text-slate-400 leading-relaxed">
            Comprehensive bookkeeping services powered by AI and delivered by experienced accountants.
          </p>
        </motion.div>

        {/* Grid */}
        <div className="mt-16 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {SERVICES.map((service, i) => {
            const Icon = ICON_MAP[service.icon] || BookOpen;
            return (
              <motion.div
                key={service.title}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.08 }}
                className="group relative rounded-2xl border border-white/[0.06] bg-white/[0.02] p-6 backdrop-blur-sm transition-all duration-300 hover:border-teal-400/20 hover:bg-white/[0.04] hover:shadow-[0_0_40px_rgba(45,212,191,0.06)]"
              >
                {/* Icon */}
                <div className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-teal-500/20 to-teal-500/5 text-teal-400 transition-colors group-hover:from-teal-500/30 group-hover:to-teal-500/10">
                  <Icon className="h-6 w-6" />
                </div>

                {/* Content */}
                <h3 className="mt-4 text-lg font-semibold text-white">{service.title}</h3>
                <p className="mt-2 text-sm text-slate-400 leading-relaxed">
                  {service.description}
                </p>

                {/* Experience badge */}
                <div className="mt-4 inline-flex items-center gap-1.5 rounded-full bg-amber-400/[0.08] px-3 py-1 text-xs font-medium text-amber-400">
                  <span className="h-1 w-1 rounded-full bg-amber-400" />
                  {service.experience}
                </div>

                {/* Hover glow */}
                <div className="pointer-events-none absolute inset-0 rounded-2xl opacity-0 transition-opacity duration-500 group-hover:opacity-100">
                  <div className="absolute -inset-px rounded-2xl bg-gradient-to-br from-teal-400/[0.08] to-transparent" />
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

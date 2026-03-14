"use client";

import { motion } from "framer-motion";
import { Star, Quote } from "lucide-react";

const TESTIMONIALS = [
  {
    quote:
      "BookkeeperAI transformed how we handle client bookkeeping. We've scaled from 30 to 120 clients without hiring a single additional bookkeeper. The AI categorization alone saves us 15 hours per week.",
    name: "Sarah Mitchell",
    title: "Managing Partner",
    firm: "Mitchell & Associates CPA",
    location: "Toronto, ON",
    rating: 5,
  },
  {
    quote:
      "The 3-day SLA is real. We used to spend a week on month-end close for each client. Now it's done in 3 business days with higher accuracy. Our clients love the consistency.",
    name: "David Chen",
    title: "Senior Partner",
    firm: "Chen Accounting Group",
    location: "Vancouver, BC",
    rating: 5,
  },
  {
    quote:
      "We were skeptical about outsourcing, but the white-label option sealed it. Our clients have no idea, and we've increased our margins by 40%. The review workflows give us full control.",
    name: "Rachel Torres",
    title: "Founder",
    firm: "Precision Bookkeeping CPA",
    location: "Calgary, AB",
    rating: 5,
  },
  {
    quote:
      "As a solo practitioner, I was drowning in bookkeeping work. BookkeeperAI let me focus on advisory services instead. My revenue is up 60% since I started using them.",
    name: "Michael Park",
    title: "CPA, CGA",
    firm: "Park Financial Services",
    location: "Montreal, QC",
    rating: 5,
  },
  {
    quote:
      "The bulk operations feature is a game-changer during tax season. Running reconciliations across 50 clients in parallel? That used to be a nightmare. Now it's one click.",
    name: "Jennifer Walsh",
    title: "Director of Operations",
    firm: "Walsh & Partners LLP",
    location: "Ottawa, ON",
    rating: 5,
  },
  {
    quote:
      "Integration with QuickBooks and Xero was seamless. The AI picks up categorization patterns within the first month and gets smarter over time. Truly impressive technology.",
    name: "Robert Kim",
    title: "Partner",
    firm: "KimCo Accounting",
    location: "Edmonton, AB",
    rating: 5,
  },
];

export default function Testimonials() {
  return (
    <section className="relative py-24 sm:py-32 overflow-hidden">
      <div className="absolute inset-0 bg-[#050a18]" />
      <div className="absolute top-1/4 left-0 h-[400px] w-[400px] rounded-full bg-teal-500/[0.03] blur-[100px]" />

      <div className="relative mx-auto max-w-7xl px-6 lg:px-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mx-auto max-w-2xl text-center"
        >
          <span className="inline-block rounded-full border border-teal-400/20 bg-teal-400/[0.08] px-4 py-1.5 text-xs font-semibold tracking-wider text-teal-300 uppercase">
            Testimonials
          </span>
          <h2 className="mt-6 text-3xl sm:text-4xl lg:text-5xl font-bold text-white tracking-tight">
            Trusted by{" "}
            <span className="bg-gradient-to-r from-teal-300 to-cyan-400 bg-clip-text text-transparent">
              Leading CPA Firms
            </span>
          </h2>
          <p className="mt-4 text-lg text-slate-400">
            See what our partners are saying about BookkeeperAI.
          </p>
        </motion.div>

        {/* Testimonial Grid */}
        <div className="mt-16 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {TESTIMONIALS.map((t, i) => (
            <motion.div
              key={t.name}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.08 }}
              className="group relative rounded-2xl border border-white/[0.06] bg-white/[0.02] p-6 backdrop-blur-sm transition-all duration-300 hover:border-white/[0.1] hover:bg-white/[0.04]"
            >
              {/* Quote icon */}
              <Quote className="h-8 w-8 text-teal-400/20" />

              {/* Stars */}
              <div className="mt-3 flex gap-0.5">
                {Array.from({ length: t.rating }).map((_, idx) => (
                  <Star
                    key={idx}
                    className="h-4 w-4 fill-amber-400 text-amber-400"
                  />
                ))}
              </div>

              {/* Quote text */}
              <p className="mt-4 text-sm text-slate-300 leading-relaxed">
                &ldquo;{t.quote}&rdquo;
              </p>

              {/* Author */}
              <div className="mt-6 flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-teal-500/20 to-teal-500/5 text-sm font-bold text-teal-300">
                  {t.name
                    .split(" ")
                    .map((n) => n[0])
                    .join("")}
                </div>
                <div>
                  <p className="text-sm font-semibold text-white">{t.name}</p>
                  <p className="text-xs text-slate-500">
                    {t.title}, {t.firm}
                  </p>
                  <p className="text-xs text-slate-600">{t.location}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

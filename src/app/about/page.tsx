import {
  Users,
  Eye,
  Heart,
  Cpu,
  Clock,
  TrendingUp,
  MapPin,
  GraduationCap,
} from "lucide-react";
import Navbar from "@/components/landing/Navbar";
import Footer from "@/components/landing/Footer";
import { TEAM } from "@/lib/constants";

const values = [
  {
    icon: Users,
    title: "Your Extension",
    desc: "As YOUR offshore office, we handle the dirty, repetitive, and high-risk operational work.",
  },
  {
    icon: Eye,
    title: "Transparency First",
    desc: "Clear reporting, no black boxes. You see exactly what we do and how we do it.",
  },
  {
    icon: Heart,
    title: "Client First Ethics",
    desc: "We always act in the best interest of your business. Period.",
  },
  {
    icon: Cpu,
    title: "ERP Agnostic",
    desc: "We work with your existing systems - QuickBooks, Xero, Zoho - not against them.",
  },
  {
    icon: Clock,
    title: "TimeZone Alignment",
    desc: "With night-time Due Diligence, you wake up to updated numbers and insights.",
  },
  {
    icon: TrendingUp,
    title: "Proven Scale",
    desc: "Our clients have achieved up to 10X growth with our operational support.",
  },
];

const milestones = [
  { year: "2006", event: "Hardik Mehta begins reconciliation and accounting career" },
  { year: "2012", event: "SMS360S founded - remote offshore services for US businesses" },
  { year: "2012", event: "Partnership with Sharda Paper, INC begins" },
  { year: "2024", event: "Amit Amin Group of Companies partnership" },
  { year: "2025", event: "Jash Packaging & Trishula (EATMEE) partnerships" },
  { year: "2026", event: "BookkeeperAI platform launched - AI meets offshore excellence" },
];

export default function AboutPage() {
  return (
    <main className="min-h-screen bg-navy-950">
      <Navbar />

      <section className="relative pt-32 pb-20">
        <div className="absolute inset-0 gradient-mesh" />
        <div className="relative mx-auto max-w-7xl px-6">
          <div className="mx-auto max-w-3xl text-center">
            <h1 className="text-4xl font-bold sm:text-5xl">
              About <span className="text-gradient">BookkeeperAI</span>
            </h1>
            <p className="mt-6 text-lg leading-relaxed text-slate-400">
              We are a young company based out of Ahmedabad, with a decade of experience
              enabling American businesses prosper and multiply. Our purpose is to analyse
              and address any issues that disrupt your daily business operations.
            </p>
          </div>

          {/* Founding Team */}
          <div className="mt-20">
            <h2 className="mb-10 text-center text-2xl font-bold text-white">
              Founding Team
            </h2>
            <div className="grid gap-8 md:grid-cols-2">
              {TEAM.map((member) => (
                <div
                  key={member.name}
                  className="glass-card rounded-2xl p-8 transition-all duration-300 hover:border-teal-400/25"
                >
                  <div className="flex items-start gap-4">
                    <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-teal-500/10">
                      <GraduationCap className="h-7 w-7 text-teal-400" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-white">{member.name}</h3>
                      <p className="text-teal-400">{member.role}</p>
                      <p className="mt-1 text-sm text-slate-400">
                        {member.credentials}
                      </p>
                      <div className="mt-1 flex items-center gap-1 text-sm text-slate-500">
                        <MapPin className="h-3 w-3" />
                        {member.location}
                      </div>
                    </div>
                  </div>
                  <ul className="mt-6 space-y-2">
                    {member.focus.map((item) => (
                      <li
                        key={item}
                        className="flex items-center gap-2 text-sm text-slate-300"
                      >
                        <span className="h-1.5 w-1.5 rounded-full bg-teal-400" />
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>

          {/* Values */}
          <div className="mt-20">
            <h2 className="mb-10 text-center text-2xl font-bold text-white">
              Our Values
            </h2>
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {values.map((v) => (
                <div
                  key={v.title}
                  className="glass-card rounded-xl p-6 transition-all duration-300 hover:border-teal-400/25"
                >
                  <v.icon className="h-8 w-8 text-teal-400" />
                  <h3 className="mt-4 text-lg font-semibold text-white">{v.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-slate-400">{v.desc}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Drucker Quote */}
          <div className="mt-20 glass-card rounded-2xl p-10 text-center">
            <blockquote className="font-serif text-2xl italic text-white sm:text-3xl">
              &ldquo;What gets measured gets managed.&rdquo;
            </blockquote>
            <cite className="mt-4 block text-gold-400">— Peter Drucker</cite>
            <p className="mx-auto mt-4 max-w-xl text-sm text-slate-400">
              An Offshore Command Center strengthens every performance metric - inventory,
              receivables, costs, and compliance - while owners focus on customers and growth.
            </p>
          </div>

          {/* Timeline */}
          <div className="mt-20">
            <h2 className="mb-10 text-center text-2xl font-bold text-white">
              Our Journey
            </h2>
            <div className="mx-auto max-w-2xl space-y-0">
              {milestones.map((m, i) => (
                <div key={`${m.year}-${i}`} className="flex gap-6">
                  <div className="flex flex-col items-center">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-teal-400/30 bg-teal-500/10 text-sm font-bold text-teal-400">
                      {m.year.slice(-2)}
                    </div>
                    {i < milestones.length - 1 && (
                      <div className="w-px flex-1 bg-gradient-to-b from-teal-400/30 to-transparent" />
                    )}
                  </div>
                  <div className="pb-10">
                    <span className="text-sm font-bold text-teal-400">{m.year}</span>
                    <p className="mt-1 text-slate-300">{m.event}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </main>
  );
}

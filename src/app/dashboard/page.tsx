"use client";

import {
  FileText,
  Clock,
  CheckCircle,
  AlertTriangle,
  Upload,
  BarChart3,
  MessageSquare,
  TrendingUp,
  TrendingDown,
  DollarSign,
  ArrowUpRight,
} from "lucide-react";
import Sidebar from "@/components/dashboard/Sidebar";

const statusCards = [
  { label: "Documents Pending", value: "12", icon: FileText, color: "text-gold-400", bg: "bg-gold-400/10" },
  { label: "In Processing", value: "8", icon: Clock, color: "text-cyan-400", bg: "bg-cyan-400/10" },
  { label: "Completed", value: "45", icon: CheckCircle, color: "text-teal-400", bg: "bg-teal-400/10" },
  { label: "Alerts", value: "3", icon: AlertTriangle, color: "text-coral-400", bg: "bg-coral-400/10" },
];

const financials = [
  { label: "Revenue (MTD)", value: "$142,500", change: "+12.3%", up: true, icon: DollarSign },
  { label: "Expenses (MTD)", value: "$89,200", change: "+5.1%", up: true, icon: TrendingUp },
  { label: "Net Income", value: "$53,300", change: "+18.7%", up: true, icon: TrendingDown },
];

const activities = [
  { text: "March bank reconciliation completed", time: "2 hours ago", type: "success" },
  { text: "3 invoices categorized by AI", time: "4 hours ago", type: "info" },
  { text: "Missing receipt flagged for Feb expense", time: "1 day ago", type: "warning" },
  { text: "February P&L report ready", time: "2 days ago", type: "success" },
  { text: "New payroll processing started", time: "3 days ago", type: "info" },
];

export default function DashboardPage() {
  return (
    <div className="flex min-h-screen bg-navy-950">
      <Sidebar active="Overview" />

      <main className="ml-64 flex-1 p-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-white">
            Welcome back, <span className="text-teal-400">Demo User</span>
          </h1>
          <p className="mt-1 text-slate-400">
            Here&apos;s what&apos;s happening with your books today.
          </p>
        </div>

        {/* Status Cards */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {statusCards.map((card) => (
            <div key={card.label} className="glass-card rounded-xl p-5">
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-400">{card.label}</span>
                <div className={`rounded-lg p-2 ${card.bg}`}>
                  <card.icon className={`h-4 w-4 ${card.color}`} />
                </div>
              </div>
              <p className="mt-3 text-3xl font-bold text-white">{card.value}</p>
            </div>
          ))}
        </div>

        {/* Financial Summary */}
        <div className="mt-8 grid gap-4 lg:grid-cols-3">
          {financials.map((f) => (
            <div key={f.label} className="glass-card rounded-xl p-5">
              <div className="flex items-center gap-3">
                <div className="rounded-lg bg-teal-500/10 p-2">
                  <f.icon className="h-5 w-5 text-teal-400" />
                </div>
                <span className="text-sm text-slate-400">{f.label}</span>
              </div>
              <div className="mt-3 flex items-baseline gap-3">
                <span className="text-2xl font-bold text-white">{f.value}</span>
                <span
                  className={`flex items-center gap-0.5 text-sm font-medium ${
                    f.up ? "text-teal-400" : "text-coral-400"
                  }`}
                >
                  <ArrowUpRight className="h-3 w-3" />
                  {f.change}
                </span>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-8 grid gap-8 lg:grid-cols-5">
          {/* Quick Actions */}
          <div className="lg:col-span-2">
            <h2 className="mb-4 text-lg font-semibold text-white">Quick Actions</h2>
            <div className="space-y-3">
              {[
                { label: "Upload Document", icon: Upload, color: "bg-teal-500/10 text-teal-400" },
                { label: "View Reports", icon: BarChart3, color: "bg-cyan-400/10 text-cyan-400" },
                { label: "Message Bookkeeper", icon: MessageSquare, color: "bg-gold-400/10 text-gold-400" },
              ].map((action) => (
                <button
                  key={action.label}
                  className="flex w-full items-center gap-4 rounded-xl border border-navy-700/50 bg-navy-900/50 px-5 py-4 text-left transition-all hover:border-teal-400/20 hover:bg-navy-800/50"
                >
                  <div className={`rounded-lg p-2 ${action.color}`}>
                    <action.icon className="h-5 w-5" />
                  </div>
                  <span className="font-medium text-white">{action.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Recent Activity */}
          <div className="lg:col-span-3">
            <h2 className="mb-4 text-lg font-semibold text-white">
              Recent Activity
            </h2>
            <div className="glass-card rounded-xl divide-y divide-navy-700/30">
              {activities.map((activity, i) => (
                <div key={i} className="flex items-start gap-3 px-5 py-4">
                  <div
                    className={`mt-1 h-2 w-2 shrink-0 rounded-full ${
                      activity.type === "success"
                        ? "bg-teal-400"
                        : activity.type === "warning"
                          ? "bg-gold-400"
                          : "bg-cyan-400"
                    }`}
                  />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm text-white">{activity.text}</p>
                    <p className="mt-0.5 text-xs text-slate-500">{activity.time}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Processing Pipeline */}
        <div className="mt-8">
          <h2 className="mb-4 text-lg font-semibold text-white">
            Bookkeeping Pipeline - March 2026
          </h2>
          <div className="glass-card rounded-xl p-6">
            <div className="flex items-center justify-between">
              {[
                { step: "Documents Received", count: 12, active: true },
                { step: "AI Processing", count: 5, active: true },
                { step: "Bookkeeper Review", count: 3, active: false },
                { step: "QA Check", count: 0, active: false },
                { step: "Complete", count: 45, active: false },
              ].map((s, i) => (
                <div key={s.step} className="flex items-center">
                  <div className="text-center">
                    <div
                      className={`mx-auto flex h-12 w-12 items-center justify-center rounded-full text-sm font-bold ${
                        s.active
                          ? "bg-teal-500 text-navy-950"
                          : s.count > 0
                            ? "bg-teal-500/20 text-teal-400"
                            : "bg-navy-800 text-slate-500"
                      }`}
                    >
                      {s.count}
                    </div>
                    <p className="mt-2 max-w-[100px] text-xs text-slate-400">
                      {s.step}
                    </p>
                  </div>
                  {i < 4 && (
                    <div className="mx-2 h-px w-12 bg-gradient-to-r from-teal-400/30 to-navy-700 lg:w-20" />
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

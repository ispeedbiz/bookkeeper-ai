"use client";

import { useEffect, useState, useCallback } from "react";
import AdminSidebar from "@/components/admin/AdminSidebar";
import {
  Loader2,
  TrendingUp,
  Users,
  FileText,
  DollarSign,
  Brain,
  Briefcase,
} from "lucide-react";

interface Stats {
  total_users: number;
  active_subscriptions: number;
  total_documents: number;
  documents_by_status: Record<string, number>;
  recent_signups: number;
  total_entities: number;
  ai_analyzed_documents: number;
  total_transactions: number;
}

export default function AdminAnalytics() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  const loadStats = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/stats");
      if (res.ok) {
        const data = await res.json();
        setStats(data);
      }
    } catch (err) {
      console.error("Failed to load stats:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadStats();
  }, [loadStats]);

  // Simulated monthly growth data
  const monthlyData = [
    { month: "Apr", users: 0, docs: 0, revenue: 0 },
    { month: "May", users: 2, docs: 5, revenue: 150 },
    { month: "Jun", users: 5, docs: 12, revenue: 450 },
    { month: "Jul", users: 8, docs: 25, revenue: 800 },
    { month: "Aug", users: 12, docs: 40, revenue: 1200 },
    { month: "Sep", users: 16, docs: 55, revenue: 1800 },
    { month: "Oct", users: 18, docs: 70, revenue: 2200 },
    { month: "Nov", users: 20, docs: 85, revenue: 2800 },
    { month: "Dec", users: 22, docs: 95, revenue: 3200 },
    { month: "Jan", users: 25, docs: 110, revenue: 3800 },
    { month: "Feb", users: 28, docs: 130, revenue: 4500 },
    { month: "Mar", users: stats?.total_users || 30, docs: stats?.total_documents || 150, revenue: 5200 },
  ];

  const maxUsers = Math.max(...monthlyData.map((d) => d.users), 1);
  const maxRevenue = Math.max(...monthlyData.map((d) => d.revenue), 1);

  return (
    <div className="flex min-h-screen bg-navy-950">
      <AdminSidebar active="Analytics" />
      <main className="ml-64 flex-1 p-8">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-white">Analytics</h1>
          <p className="mt-1 text-slate-400">
            Platform growth metrics and performance insights.
          </p>
        </div>

        {loading ? (
          <div className="flex h-64 items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-teal-400" />
          </div>
        ) : (
          <>
            {/* Key Metrics */}
            <div className="mb-8 grid grid-cols-2 gap-4 lg:grid-cols-4">
              {[
                {
                  label: "Total Users",
                  value: stats?.total_users || 0,
                  icon: Users,
                  color: "text-teal-400",
                  bg: "bg-teal-500/10",
                  change: `+${stats?.recent_signups || 0} this month`,
                },
                {
                  label: "Active Subscriptions",
                  value: stats?.active_subscriptions || 0,
                  icon: DollarSign,
                  color: "text-cyan-400",
                  bg: "bg-cyan-400/10",
                  change: "paid + trialing",
                },
                {
                  label: "AI Analyzed",
                  value: stats?.ai_analyzed_documents || 0,
                  icon: Brain,
                  color: "text-gold-400",
                  bg: "bg-gold-400/10",
                  change: `of ${stats?.total_documents || 0} documents`,
                },
                {
                  label: "Transactions",
                  value: stats?.total_transactions || 0,
                  icon: Briefcase,
                  color: "text-teal-400",
                  bg: "bg-teal-400/10",
                  change: "AI-extracted",
                },
              ].map((metric) => (
                <div key={metric.label} className="glass-card rounded-xl p-5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-slate-500">{metric.label}</span>
                    <div className={`rounded-lg p-2 ${metric.bg}`}>
                      <metric.icon className={`h-4 w-4 ${metric.color}`} />
                    </div>
                  </div>
                  <p className="mt-2 text-3xl font-bold text-white">{metric.value.toLocaleString()}</p>
                  <p className="mt-1 text-xs text-slate-500">{metric.change}</p>
                </div>
              ))}
            </div>

            {/* Charts */}
            <div className="grid gap-8 lg:grid-cols-2">
              {/* User Growth */}
              <div className="glass-card rounded-xl p-6">
                <h3 className="mb-4 flex items-center gap-2 text-lg font-semibold text-white">
                  <TrendingUp className="h-5 w-5 text-teal-400" />
                  User Growth (12 Months)
                </h3>
                <div className="flex h-48 items-end justify-between gap-1">
                  {monthlyData.map((d, i) => (
                    <div key={i} className="flex flex-1 flex-col items-center gap-1">
                      <div
                        className="w-full rounded-t bg-gradient-to-t from-teal-500/10 to-teal-400/60"
                        style={{ height: `${(d.users / maxUsers) * 100}%`, minHeight: "2px" }}
                      />
                      <span className="text-[10px] text-slate-600">{d.month}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Revenue Growth */}
              <div className="glass-card rounded-xl p-6">
                <h3 className="mb-4 flex items-center gap-2 text-lg font-semibold text-white">
                  <DollarSign className="h-5 w-5 text-teal-400" />
                  Revenue Growth (12 Months)
                </h3>
                <div className="flex h-48 items-end justify-between gap-1">
                  {monthlyData.map((d, i) => (
                    <div key={i} className="flex flex-1 flex-col items-center gap-1">
                      <div
                        className="w-full rounded-t bg-gradient-to-t from-cyan-500/10 to-cyan-400/60"
                        style={{ height: `${(d.revenue / maxRevenue) * 100}%`, minHeight: "2px" }}
                      />
                      <span className="text-[10px] text-slate-600">{d.month}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Document Types */}
              <div className="glass-card rounded-xl p-6">
                <h3 className="mb-4 flex items-center gap-2 text-lg font-semibold text-white">
                  <FileText className="h-5 w-5 text-teal-400" />
                  Documents by Status
                </h3>
                <div className="space-y-4">
                  {Object.entries(stats?.documents_by_status || {}).map(([status, count]) => {
                    const total = stats?.total_documents || 1;
                    const pct = Math.round(((count as number) / total) * 100);
                    return (
                      <div key={status}>
                        <div className="flex justify-between text-sm mb-1">
                          <span className="text-slate-400 capitalize">{status}</span>
                          <span className="text-white font-medium">{count as number} ({pct}%)</span>
                        </div>
                        <div className="h-2 rounded-full bg-navy-800">
                          <div
                            className={`h-2 rounded-full ${
                              status === "approved"
                                ? "bg-teal-400"
                                : status === "processing"
                                  ? "bg-cyan-400"
                                  : status === "rejected"
                                    ? "bg-coral-400"
                                    : "bg-gold-400"
                            }`}
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                  {Object.keys(stats?.documents_by_status || {}).length === 0 && (
                    <p className="text-sm text-slate-500 text-center py-8">No documents yet</p>
                  )}
                </div>
              </div>

              {/* AI Performance */}
              <div className="glass-card rounded-xl p-6">
                <h3 className="mb-4 flex items-center gap-2 text-lg font-semibold text-white">
                  <Brain className="h-5 w-5 text-cyan-400" />
                  AI Performance
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="rounded-xl bg-navy-800/50 p-4 text-center">
                    <p className="text-3xl font-bold text-cyan-400">
                      {stats?.total_documents
                        ? Math.round(((stats.ai_analyzed_documents || 0) / stats.total_documents) * 100)
                        : 0}%
                    </p>
                    <p className="text-xs text-slate-500 mt-1">Analysis Rate</p>
                  </div>
                  <div className="rounded-xl bg-navy-800/50 p-4 text-center">
                    <p className="text-3xl font-bold text-teal-400">
                      {stats?.total_transactions || 0}
                    </p>
                    <p className="text-xs text-slate-500 mt-1">Extracted Transactions</p>
                  </div>
                  <div className="rounded-xl bg-navy-800/50 p-4 text-center">
                    <p className="text-3xl font-bold text-gold-400">
                      {stats?.ai_analyzed_documents || 0}
                    </p>
                    <p className="text-xs text-slate-500 mt-1">Docs Analyzed</p>
                  </div>
                  <div className="rounded-xl bg-navy-800/50 p-4 text-center">
                    <p className="text-3xl font-bold text-white">~2s</p>
                    <p className="text-xs text-slate-500 mt-1">Avg Analysis Time</p>
                  </div>
                </div>
              </div>
            </div>
          </>
        )}
      </main>
    </div>
  );
}

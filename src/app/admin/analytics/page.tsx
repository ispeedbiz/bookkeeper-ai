"use client";

import { useEffect, useState, useCallback } from "react";
import AdminSidebar from "@/components/admin/AdminSidebar";
import {
  Loader2,
  TrendingUp,
  TrendingDown,
  Users,
  FileText,
  DollarSign,
  Brain,
  Briefcase,
  PieChart,
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

interface RevenueData {
  mrr: number;
  arpu: number;
  churn_rate: number;
  active_subscriptions: number;
  total_subscriptions: number;
  cancelled_subscriptions: number;
  revenue_by_plan: Record<string, { count: number; revenue: number }>;
  monthly_revenue: { month: string; revenue: number; subscriptions: number }[];
}

export default function AdminAnalytics() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [revenue, setRevenue] = useState<RevenueData | null>(null);
  const [loading, setLoading] = useState(true);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [statsRes, revenueRes] = await Promise.all([
        fetch("/api/admin/stats"),
        fetch("/api/admin/revenue"),
      ]);

      if (statsRes.ok) {
        const data = await statsRes.json();
        setStats(data);
      }
      if (revenueRes.ok) {
        const data = await revenueRes.json();
        setRevenue(data);
      }
    } catch (err) {
      console.error("Failed to load analytics:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const maxRevenue = revenue?.monthly_revenue
    ? Math.max(...revenue.monthly_revenue.map((d) => d.revenue), 1)
    : 1;

  const planColors: Record<string, string> = {
    starter: "bg-teal-400",
    professional: "bg-cyan-400",
    enterprise: "bg-gold-400",
    free: "bg-slate-500",
  };

  return (
    <div className="flex min-h-screen bg-navy-950">
      <AdminSidebar active="Analytics" />
      <main className="ml-64 flex-1 p-8">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-white">Analytics</h1>
          <p className="mt-1 text-slate-400">
            Platform growth metrics, revenue insights, and performance data.
          </p>
        </div>

        {loading ? (
          <div className="flex h-64 items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-teal-400" />
          </div>
        ) : (
          <>
            {/* Revenue Metrics */}
            <div className="mb-8 grid grid-cols-2 gap-4 lg:grid-cols-4">
              <div className="glass-card rounded-xl p-5">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-slate-500">Monthly Recurring Revenue</span>
                  <div className="rounded-lg bg-teal-500/10 p-2">
                    <DollarSign className="h-4 w-4 text-teal-400" />
                  </div>
                </div>
                <p className="mt-2 text-3xl font-bold text-white">
                  ${(revenue?.mrr || 0).toLocaleString()}
                </p>
                <p className="mt-1 text-xs text-slate-500">
                  {revenue?.active_subscriptions || 0} active subscriptions
                </p>
              </div>

              <div className="glass-card rounded-xl p-5">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-slate-500">Churn Rate</span>
                  <div className="rounded-lg bg-coral-400/10 p-2">
                    <TrendingDown className="h-4 w-4 text-coral-400" />
                  </div>
                </div>
                <p className="mt-2 text-3xl font-bold text-white">
                  {revenue?.churn_rate || 0}%
                </p>
                <p className="mt-1 text-xs text-slate-500">
                  {revenue?.cancelled_subscriptions || 0} cancelled of{" "}
                  {revenue?.total_subscriptions || 0} total
                </p>
              </div>

              <div className="glass-card rounded-xl p-5">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-slate-500">ARPU</span>
                  <div className="rounded-lg bg-cyan-400/10 p-2">
                    <Users className="h-4 w-4 text-cyan-400" />
                  </div>
                </div>
                <p className="mt-2 text-3xl font-bold text-white">
                  ${revenue?.arpu || 0}
                </p>
                <p className="mt-1 text-xs text-slate-500">
                  Average Revenue Per User
                </p>
              </div>

              <div className="glass-card rounded-xl p-5">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-slate-500">Total Users</span>
                  <div className="rounded-lg bg-gold-400/10 p-2">
                    <Users className="h-4 w-4 text-gold-400" />
                  </div>
                </div>
                <p className="mt-2 text-3xl font-bold text-white">
                  {stats?.total_users || 0}
                </p>
                <p className="mt-1 text-xs text-slate-500">
                  +{stats?.recent_signups || 0} this month
                </p>
              </div>
            </div>

            {/* Charts */}
            <div className="grid gap-8 lg:grid-cols-2">
              {/* Revenue Trend Chart */}
              <div className="glass-card rounded-xl p-6">
                <h3 className="mb-4 flex items-center gap-2 text-lg font-semibold text-white">
                  <TrendingUp className="h-5 w-5 text-teal-400" />
                  Revenue Trend (12 Months)
                </h3>
                <div className="flex h-48 items-end justify-between gap-1">
                  {(revenue?.monthly_revenue || []).map((d, i) => (
                    <div key={i} className="group relative flex flex-1 flex-col items-center gap-1">
                      <div className="absolute -top-8 hidden rounded bg-navy-700 px-2 py-1 text-[10px] text-white group-hover:block">
                        ${d.revenue.toLocaleString()}
                      </div>
                      <div
                        className="w-full rounded-t bg-gradient-to-t from-teal-500/10 to-teal-400/60 transition-all hover:from-teal-500/20 hover:to-teal-400/80"
                        style={{
                          height: `${(d.revenue / maxRevenue) * 100}%`,
                          minHeight: "2px",
                        }}
                      />
                      <span className="text-[10px] text-slate-600">{d.month}</span>
                    </div>
                  ))}
                </div>
                {(!revenue?.monthly_revenue || revenue.monthly_revenue.length === 0) && (
                  <p className="py-8 text-center text-sm text-slate-500">No revenue data available</p>
                )}
              </div>

              {/* Revenue by Plan */}
              <div className="glass-card rounded-xl p-6">
                <h3 className="mb-4 flex items-center gap-2 text-lg font-semibold text-white">
                  <PieChart className="h-5 w-5 text-cyan-400" />
                  Revenue by Plan
                </h3>
                <div className="space-y-4">
                  {Object.entries(revenue?.revenue_by_plan || {}).map(
                    ([plan, data]) => {
                      const pct =
                        revenue?.mrr && revenue.mrr > 0
                          ? Math.round((data.revenue / revenue.mrr) * 100)
                          : 0;
                      const colorClass =
                        planColors[plan.toLowerCase()] || "bg-slate-400";
                      return (
                        <div key={plan}>
                          <div className="mb-1 flex justify-between text-sm">
                            <span className="capitalize text-slate-400">
                              {plan}{" "}
                              <span className="text-slate-600">
                                ({data.count} users)
                              </span>
                            </span>
                            <span className="font-medium text-white">
                              ${data.revenue.toLocaleString()}/mo ({pct}%)
                            </span>
                          </div>
                          <div className="h-2 rounded-full bg-navy-800">
                            <div
                              className={`h-2 rounded-full ${colorClass}`}
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                        </div>
                      );
                    }
                  )}
                  {Object.keys(revenue?.revenue_by_plan || {}).length === 0 && (
                    <p className="py-8 text-center text-sm text-slate-500">
                      No subscription data yet
                    </p>
                  )}
                </div>
              </div>

              {/* Document Types */}
              <div className="glass-card rounded-xl p-6">
                <h3 className="mb-4 flex items-center gap-2 text-lg font-semibold text-white">
                  <FileText className="h-5 w-5 text-teal-400" />
                  Documents by Status
                </h3>
                <div className="space-y-4">
                  {Object.entries(stats?.documents_by_status || {}).map(
                    ([status, count]) => {
                      const total = stats?.total_documents || 1;
                      const pct = Math.round(
                        ((count as number) / total) * 100
                      );
                      return (
                        <div key={status}>
                          <div className="mb-1 flex justify-between text-sm">
                            <span className="capitalize text-slate-400">
                              {status}
                            </span>
                            <span className="font-medium text-white">
                              {count as number} ({pct}%)
                            </span>
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
                    }
                  )}
                  {Object.keys(stats?.documents_by_status || {}).length ===
                    0 && (
                    <p className="py-8 text-center text-sm text-slate-500">
                      No documents yet
                    </p>
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
                        ? Math.round(
                            ((stats.ai_analyzed_documents || 0) /
                              stats.total_documents) *
                              100
                          )
                        : 0}
                      %
                    </p>
                    <p className="mt-1 text-xs text-slate-500">Analysis Rate</p>
                  </div>
                  <div className="rounded-xl bg-navy-800/50 p-4 text-center">
                    <p className="text-3xl font-bold text-teal-400">
                      {stats?.total_transactions || 0}
                    </p>
                    <p className="mt-1 text-xs text-slate-500">
                      Extracted Transactions
                    </p>
                  </div>
                  <div className="rounded-xl bg-navy-800/50 p-4 text-center">
                    <p className="text-3xl font-bold text-gold-400">
                      {stats?.ai_analyzed_documents || 0}
                    </p>
                    <p className="mt-1 text-xs text-slate-500">Docs Analyzed</p>
                  </div>
                  <div className="rounded-xl bg-navy-800/50 p-4 text-center">
                    <p className="text-3xl font-bold text-white">~2s</p>
                    <p className="mt-1 text-xs text-slate-500">
                      Avg Analysis Time
                    </p>
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

"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import {
  FileText,
  Clock,
  CheckCircle,
  AlertTriangle,
  Upload,
  BarChart3,
  MessageSquare,
  CreditCard,
  ArrowUpRight,
  Loader2,
  Brain,
} from "lucide-react";
import Sidebar from "@/components/dashboard/Sidebar";
import { createClient } from "@/lib/supabase/client";
import { useRealtimeSubscription } from "@/hooks/useRealtimeSubscription";

interface Profile {
  id: string;
  full_name: string | null;
  email: string;
}

interface DocumentCounts {
  uploaded: number;
  processing: number;
  reviewed: number;
  approved: number;
  rejected: number;
}

interface Activity {
  id: string;
  type: string;
  description: string;
  created_at: string;
}

interface Subscription {
  plan: string | null;
  status: string | null;
  trial_ends_at: string | null;
  current_period_end: string | null;
}

export default function DashboardPage() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [docCounts, setDocCounts] = useState<DocumentCounts>({
    uploaded: 0,
    processing: 0,
    reviewed: 0,
    approved: 0,
    rejected: 0,
  });
  const [activities, setActivities] = useState<Activity[]>([]);
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchDashboardData = useCallback(async () => {
    const supabase = createClient();
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (!user) return;
        setUserId(user.id);

        // Fetch profile
        const { data: profileData } = await supabase
          .from("profiles")
          .select("id, full_name, email")
          .eq("id", user.id)
          .single();

        if (profileData) {
          setProfile(profileData);
        } else {
          setProfile({
            id: user.id,
            full_name: user.user_metadata?.full_name || null,
            email: user.email || "",
          });
        }

        // Fetch user's entities
        const { data: entities } = await supabase
          .from("entities")
          .select("id")
          .eq("user_id", user.id);

        const entityIds = entities?.map((e) => e.id) || [];

        // Fetch document counts by status
        if (entityIds.length > 0) {
          const { data: docs } = await supabase
            .from("documents")
            .select("status")
            .in("entity_id", entityIds);

          if (docs) {
            const counts: DocumentCounts = {
              uploaded: 0,
              processing: 0,
              reviewed: 0,
              approved: 0,
              rejected: 0,
            };
            docs.forEach((doc) => {
              const status = doc.status as keyof DocumentCounts;
              if (status in counts) {
                counts[status]++;
              }
            });
            setDocCounts(counts);
          }
        }

        // Fetch recent activities
        const { data: activityData } = await supabase
          .from("activities")
          .select("id, type, description, created_at")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false })
          .limit(10);

        if (activityData) {
          setActivities(activityData);
        }

        // Fetch subscription
        const { data: subData } = await supabase
          .from("subscriptions")
          .select("plan, status, trial_ends_at, current_period_end")
          .eq("user_id", user.id)
          .single();

        if (subData) {
          setSubscription(subData);
        }
      } catch (error) {
        console.error("Error fetching dashboard data:", error);
      } finally {
        setLoading(false);
      }
  }, []);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  // Realtime: auto-refresh when documents change
  useRealtimeSubscription<{ id: string; status: string; user_id: string }>({
    table: "documents",
    filter: userId ? `user_id=eq.${userId}` : undefined,
    onInsert: () => fetchDashboardData(),
    onUpdate: () => fetchDashboardData(),
    enabled: !loading && !!userId,
  });

  // Realtime: live activity feed
  useRealtimeSubscription<Activity>({
    table: "activities",
    filter: userId ? `user_id=eq.${userId}` : undefined,
    onInsert: (activity) => {
      setActivities((prev) => [activity, ...prev].slice(0, 10));
    },
    enabled: !loading && !!userId,
  });

  const totalDocs =
    docCounts.uploaded +
    docCounts.processing +
    docCounts.reviewed +
    docCounts.approved +
    docCounts.rejected;

  const pendingCount = docCounts.uploaded;
  const processingCount = docCounts.processing;
  const completedCount = docCounts.approved + docCounts.reviewed;
  const alertCount = docCounts.rejected;

  const statusCards = [
    {
      label: "Documents Pending",
      value: pendingCount,
      icon: FileText,
      color: "text-gold-400",
      bg: "bg-gold-400/10",
    },
    {
      label: "In Processing",
      value: processingCount,
      icon: Clock,
      color: "text-cyan-400",
      bg: "bg-cyan-400/10",
    },
    {
      label: "Completed",
      value: completedCount,
      icon: CheckCircle,
      color: "text-teal-400",
      bg: "bg-teal-400/10",
    },
    {
      label: "Alerts",
      value: alertCount,
      icon: AlertTriangle,
      color: "text-coral-400",
      bg: "bg-coral-400/10",
    },
  ];

  function formatTimeAgo(dateStr: string): string {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins} min ago`;
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? "s" : ""} ago`;
    if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? "s" : ""} ago`;
    return date.toLocaleDateString();
  }

  function getActivityType(type: string): "success" | "warning" | "info" {
    if (type === "document_approved" || type === "document_reviewed") return "success";
    if (type === "document_rejected") return "warning";
    return "info";
  }

  function formatPlan(plan: string | null): string {
    if (!plan) return "Free";
    return plan.charAt(0).toUpperCase() + plan.slice(1);
  }

  function formatSubscriptionStatus(status: string | null): string {
    if (!status) return "Inactive";
    return status.charAt(0).toUpperCase() + status.slice(1);
  }

  const currentMonth = new Date().toLocaleString("default", {
    month: "long",
    year: "numeric",
  });

  if (loading) {
    return (
      <div className="flex min-h-screen bg-navy-950">
        <Sidebar active="Overview" />
        <main className="ml-64 flex flex-1 items-center justify-center p-8">
          <div className="flex flex-col items-center gap-4">
            <Loader2 className="h-8 w-8 animate-spin text-teal-400" />
            <p className="text-slate-400">Loading your dashboard...</p>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-navy-950">
      <Sidebar active="Overview" />

      <main className="ml-64 flex-1 p-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-white">
            Welcome back,{" "}
            <span className="text-teal-400">
              {profile?.full_name || profile?.email?.split("@")[0] || "there"}
            </span>
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

        {/* Subscription Summary */}
        <div className="mt-8 grid gap-4 lg:grid-cols-3">
          <div className="glass-card rounded-xl p-5">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-teal-500/10 p-2">
                <CreditCard className="h-5 w-5 text-teal-400" />
              </div>
              <span className="text-sm text-slate-400">Current Plan</span>
            </div>
            <div className="mt-3 flex items-baseline gap-3">
              <span className="text-2xl font-bold text-white">
                {formatPlan(subscription?.plan ?? null)}
              </span>
              <span className="flex items-center gap-0.5 text-sm font-medium text-teal-400">
                <ArrowUpRight className="h-3 w-3" />
                Active
              </span>
            </div>
          </div>
          <div className="glass-card rounded-xl p-5">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-cyan-400/10 p-2">
                <FileText className="h-5 w-5 text-cyan-400" />
              </div>
              <span className="text-sm text-slate-400">Total Documents</span>
            </div>
            <div className="mt-3 flex items-baseline gap-3">
              <span className="text-2xl font-bold text-white">{totalDocs}</span>
              <span className="text-sm text-slate-400">all time</span>
            </div>
          </div>
          <div className="glass-card rounded-xl p-5">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-gold-400/10 p-2">
                <Clock className="h-5 w-5 text-gold-400" />
              </div>
              <span className="text-sm text-slate-400">Subscription Status</span>
            </div>
            <div className="mt-3 flex items-baseline gap-3">
              <span className="text-2xl font-bold text-white">
                {formatSubscriptionStatus(subscription?.status ?? null)}
              </span>
              {subscription?.trial_ends_at && (
                <span className="text-sm text-gold-400">
                  Trial ends{" "}
                  {new Date(subscription.trial_ends_at).toLocaleDateString()}
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="mt-8 grid gap-8 lg:grid-cols-5">
          {/* Quick Actions */}
          <div className="lg:col-span-2">
            <h2 className="mb-4 text-lg font-semibold text-white">
              Quick Actions
            </h2>
            <div className="space-y-3">
              <Link
                href="/dashboard/documents"
                className="flex w-full items-center gap-4 rounded-xl border border-navy-700/50 bg-navy-900/50 px-5 py-4 text-left transition-all hover:border-teal-400/20 hover:bg-navy-800/50"
              >
                <div className="rounded-lg bg-teal-500/10 p-2 text-teal-400">
                  <Upload className="h-5 w-5" />
                </div>
                <span className="font-medium text-white">Upload Document</span>
              </Link>
              <button className="flex w-full items-center gap-4 rounded-xl border border-navy-700/50 bg-navy-900/50 px-5 py-4 text-left transition-all hover:border-teal-400/20 hover:bg-navy-800/50">
                <div className="rounded-lg bg-cyan-400/10 p-2 text-cyan-400">
                  <BarChart3 className="h-5 w-5" />
                </div>
                <span className="font-medium text-white">View Reports</span>
              </button>
              <button className="flex w-full items-center gap-4 rounded-xl border border-navy-700/50 bg-navy-900/50 px-5 py-4 text-left transition-all hover:border-teal-400/20 hover:bg-navy-800/50">
                <div className="rounded-lg bg-gold-400/10 p-2 text-gold-400">
                  <MessageSquare className="h-5 w-5" />
                </div>
                <span className="font-medium text-white">
                  Message Bookkeeper
                </span>
              </button>
            </div>
          </div>

          {/* Recent Activity */}
          <div className="lg:col-span-3">
            <h2 className="mb-4 text-lg font-semibold text-white">
              Recent Activity
            </h2>
            <div className="glass-card divide-y divide-navy-700/30 rounded-xl">
              {activities.length === 0 ? (
                <div className="px-5 py-8 text-center">
                  <p className="text-sm text-slate-400">
                    No recent activity yet. Upload your first document to get
                    started.
                  </p>
                </div>
              ) : (
                activities.map((activity) => (
                  <div
                    key={activity.id}
                    className="flex items-start gap-3 px-5 py-4"
                  >
                    <div
                      className={`mt-1 h-2 w-2 shrink-0 rounded-full ${
                        getActivityType(activity.type) === "success"
                          ? "bg-teal-400"
                          : getActivityType(activity.type) === "warning"
                            ? "bg-gold-400"
                            : "bg-cyan-400"
                      }`}
                    />
                    <div className="min-w-0 flex-1">
                      <p className="text-sm text-white">
                        {activity.description}
                      </p>
                      <p className="mt-0.5 text-xs text-slate-500">
                        {formatTimeAgo(activity.created_at)}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Processing Pipeline */}
        <div className="mt-8">
          <h2 className="mb-4 text-lg font-semibold text-white">
            Bookkeeping Pipeline - {currentMonth}
          </h2>
          <div className="glass-card rounded-xl p-6">
            <div className="flex items-center justify-between">
              {[
                {
                  step: "Documents Received",
                  count: docCounts.uploaded,
                  active: docCounts.uploaded > 0,
                },
                {
                  step: "AI Processing",
                  count: docCounts.processing,
                  active: docCounts.processing > 0,
                },
                {
                  step: "Bookkeeper Review",
                  count: docCounts.reviewed,
                  active: false,
                },
                {
                  step: "QA Check",
                  count: 0,
                  active: false,
                },
                {
                  step: "Complete",
                  count: docCounts.approved,
                  active: false,
                },
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

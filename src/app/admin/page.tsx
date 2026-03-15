"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createBrowserClient } from "@supabase/ssr";
import {
  LayoutDashboard,
  Users,
  FileText,
  BarChart3,
  Settings,
  Briefcase,
  AlertTriangle,
  DollarSign,
  TrendingUp,
  CheckCircle,
  Clock,
  LogOut,
  User,
  ListTodo,
  Bell,
  Shield,
  Loader2,
} from "lucide-react";

interface AdminStats {
  total_users: number;
  active_subscriptions: number;
  total_documents: number;
  documents_by_status: Record<string, number>;
  recent_signups: number;
  total_entities: number;
}

interface Activity {
  id: string;
  type: string;
  description: string;
  created_at: string;
  metadata: Record<string, unknown> | null;
}

const team = [
  { name: "Priya Sharma", tasks: 45, accuracy: "98.5%", status: "Active", load: 85 },
  { name: "Rahul Mehta", tasks: 38, accuracy: "97.2%", status: "Active", load: 72 },
  { name: "Anjali Kumar", tasks: 42, accuracy: "99.1%", status: "Active", load: 90 },
  { name: "Vikram Patel", tasks: 35, accuracy: "96.8%", status: "Break", load: 0 },
  { name: "Neha Desai", tasks: 40, accuracy: "98.0%", status: "Active", load: 78 },
];

const sideNavItems = [
  { label: "Dashboard", icon: LayoutDashboard, active: true, href: "/admin" },
  { label: "Work Queue", icon: ListTodo, active: false, href: "/admin/work-queue" },
  { label: "Clients", icon: Users, active: false, href: "/admin/users" },
  { label: "Team", icon: Briefcase, active: false, href: "/admin/team" },
  { label: "Documents", icon: FileText, active: false, href: "/admin/documents" },
  { label: "Analytics", icon: BarChart3, active: false, href: "/admin/analytics" },
  { label: "Notifications", icon: Bell, active: false, href: "/admin/notifications" },
  { label: "Security", icon: Shield, active: false, href: "/admin/security" },
  { label: "Settings", icon: Settings, active: false, href: "/admin/settings" },
];

const statusColorMap: Record<string, string> = {
  received: "border-gold-400",
  processing: "border-cyan-400",
  review: "border-teal-400",
  approved: "border-teal-500",
  complete: "border-teal-500",
  rejected: "border-coral-400",
};

const priorityFromType: Record<string, { label: string; style: string }> = {
  account_created: { label: "Info", style: "bg-teal-400/10 text-teal-400" },
  login: { label: "Info", style: "bg-teal-400/10 text-teal-400" },
  document_uploaded: { label: "Info", style: "bg-cyan-400/10 text-cyan-400" },
  document_status_changed: { label: "Medium", style: "bg-gold-400/10 text-gold-400" },
  subscription_created: { label: "Info", style: "bg-teal-400/10 text-teal-400" },
  subscription_cancelled: { label: "High", style: "bg-coral-400/10 text-coral-400" },
  payment_received: { label: "Info", style: "bg-teal-400/10 text-teal-400" },
  entity_created: { label: "Info", style: "bg-cyan-400/10 text-cyan-400" },
  profile_updated: { label: "Low", style: "bg-slate-400/10 text-slate-400" },
  message_sent: { label: "Medium", style: "bg-gold-400/10 text-gold-400" },
};

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

export default function AdminDashboard() {
  const router = useRouter();
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const [userProfile, setUserProfile] = useState<{
    full_name: string;
    email: string;
  } | null>(null);

  const supabase = useMemo(() => createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  ), []);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      // Fetch user profile
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("full_name, email")
          .eq("id", user.id)
          .single();
        if (profile) setUserProfile(profile);
      }

      // Fetch stats from API
      const statsRes = await fetch("/api/admin/stats");
      if (statsRes.ok) {
        const data = await statsRes.json();
        setStats(data);
      }

      // Fetch recent activities
      const { data: activitiesData } = await supabase
        .from("activities")
        .select("id, type, description, created_at, metadata")
        .order("created_at", { ascending: false })
        .limit(10);
      if (activitiesData) {
        setActivities(activitiesData as Activity[]);
      }
    } catch (err) {
      console.error("Failed to load admin data:", err);
    } finally {
      setLoading(false);
    }
  }, [supabase]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    await supabase.auth.signOut();
    router.push("/login");
  };

  // Build work queue from documents_by_status
  const workQueue = stats
    ? [
        {
          stage: "Received",
          count: stats.documents_by_status["received"] || 0,
          color: "border-gold-400",
        },
        {
          stage: "Processing",
          count: stats.documents_by_status["processing"] || 0,
          color: "border-cyan-400",
        },
        {
          stage: "Review",
          count: stats.documents_by_status["review"] || 0,
          color: "border-teal-400",
        },
        {
          stage: "Complete",
          count:
            (stats.documents_by_status["approved"] || 0) +
            (stats.documents_by_status["complete"] || 0),
          color: "border-teal-500",
        },
      ]
    : [];

  const kpis = stats
    ? [
        {
          label: "Total Users",
          value: stats.total_users.toLocaleString(),
          icon: Users,
          change: `+${stats.recent_signups} (30d)`,
          color: "text-teal-400",
          bg: "bg-teal-500/10",
        },
        {
          label: "Active Subs",
          value: stats.active_subscriptions.toLocaleString(),
          icon: DollarSign,
          change: "",
          color: "text-cyan-400",
          bg: "bg-cyan-400/10",
        },
        {
          label: "Documents",
          value: stats.total_documents.toLocaleString(),
          icon: FileText,
          change: "",
          color: "text-gold-400",
          bg: "bg-gold-400/10",
        },
        {
          label: "Entities",
          value: stats.total_entities.toLocaleString(),
          icon: Briefcase,
          change: "",
          color: "text-cyan-400",
          bg: "bg-cyan-400/10",
        },
        {
          label: "Recent Signups",
          value: stats.recent_signups.toLocaleString(),
          icon: TrendingUp,
          change: "last 30 days",
          color: "text-teal-400",
          bg: "bg-teal-400/10",
        },
        {
          label: "SLA Score",
          value: "97.8%",
          icon: CheckCircle,
          change: "+1.3%",
          color: "text-teal-400",
          bg: "bg-teal-400/10",
        },
      ]
    : [];

  return (
    <div className="flex min-h-screen bg-navy-950">
      {/* Sidebar */}
      <aside className="fixed left-0 top-0 z-40 flex h-screen w-64 flex-col border-r border-navy-700/50 bg-navy-900/95 backdrop-blur-md">
        <div className="flex h-16 items-center border-b border-navy-700/50 px-6">
          <Link href="/" className="text-lg font-bold text-gradient">
            BookkeeperAI
          </Link>
          <span className="ml-2 rounded bg-coral-400/10 px-2 py-0.5 text-xs font-medium text-coral-400">
            Admin
          </span>
        </div>
        <nav className="flex-1 overflow-y-auto p-3">
          <ul className="space-y-1">
            {sideNavItems.map((item) => (
              <li key={item.label}>
                <Link
                  href={item.href}
                  className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all ${
                    item.active
                      ? "bg-teal-500/10 text-teal-400"
                      : "text-slate-400 hover:bg-navy-800 hover:text-white"
                  }`}
                >
                  <item.icon className="h-5 w-5" />
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
        <div className="border-t border-navy-700/50 p-3">
          <div className="flex items-center gap-3 px-3 py-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-coral-400/20">
              <User className="h-4 w-4 text-coral-400" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-white">
                {userProfile?.full_name || "Admin User"}
              </p>
              <p className="truncate text-xs text-slate-500">
                {userProfile?.email || "admin@demo.com"}
              </p>
            </div>
            <button
              onClick={handleLogout}
              className="text-slate-500 hover:text-coral-400"
              title="Sign out"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="ml-0 flex-1 p-4 pt-16 lg:ml-64 lg:p-8 lg:pt-8">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-white">Admin Command Center</h1>
          <p className="mt-1 text-slate-400">
            BookkeeperAI Operations Dashboard - Real-time platform metrics.
          </p>
        </div>

        {loading ? (
          <div className="flex h-64 items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-teal-400" />
            <span className="ml-3 text-slate-400">Loading dashboard data...</span>
          </div>
        ) : (
          <>
            {/* KPIs */}
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
              {kpis.map((kpi) => (
                <div key={kpi.label} className="glass-card rounded-xl p-4">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-slate-500">{kpi.label}</span>
                    <div className={`rounded-lg p-1.5 ${kpi.bg}`}>
                      <kpi.icon className={`h-3.5 w-3.5 ${kpi.color}`} />
                    </div>
                  </div>
                  <p className="mt-2 text-lg font-bold text-white">{kpi.value}</p>
                  {kpi.change && (
                    <p className="mt-0.5 text-xs text-teal-400">{kpi.change}</p>
                  )}
                </div>
              ))}
            </div>

            {/* Work Queue Kanban */}
            <div className="mt-8">
              <h2 className="mb-4 text-lg font-semibold text-white">Work Queue</h2>
              <div className="grid gap-4 lg:grid-cols-4">
                {workQueue.map((col) => (
                  <div
                    key={col.stage}
                    className={`glass-card rounded-xl border-t-2 ${col.color}`}
                  >
                    <div className="flex items-center justify-between px-4 pt-4">
                      <h3 className="text-sm font-semibold text-white">
                        {col.stage}
                      </h3>
                      <span className="rounded-full bg-navy-800 px-2.5 py-0.5 text-xs font-medium text-slate-400">
                        {col.count}
                      </span>
                    </div>
                    <div className="p-4">
                      {col.count === 0 ? (
                        <p className="text-center text-xs text-slate-500">
                          No documents
                        </p>
                      ) : (
                        <Link
                          href="/admin/work-queue"
                          className="block w-full rounded-lg border border-dashed border-navy-700 py-2 text-center text-xs text-slate-500 hover:border-teal-400/30 hover:text-teal-400"
                        >
                          View all {col.count} items
                        </Link>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-8 grid gap-8 lg:grid-cols-5">
              {/* Team Performance */}
              <div className="lg:col-span-3">
                <h2 className="mb-4 text-lg font-semibold text-white">
                  Team Performance (SMS360S)
                </h2>
                <div className="glass-card overflow-hidden rounded-xl">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-navy-700/50">
                        <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-500">
                          Name
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-500">
                          Tasks (MTD)
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-500">
                          Accuracy
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-500">
                          Status
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-500">
                          Load
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-navy-700/30">
                      {team.map((member) => (
                        <tr
                          key={member.name}
                          className="transition-colors hover:bg-navy-800/30"
                        >
                          <td className="px-4 py-3 text-sm font-medium text-white">
                            {member.name}
                          </td>
                          <td className="px-4 py-3 text-sm text-slate-400">
                            {member.tasks}
                          </td>
                          <td className="px-4 py-3 text-sm text-teal-400">
                            {member.accuracy}
                          </td>
                          <td className="px-4 py-3">
                            <span
                              className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${
                                member.status === "Active"
                                  ? "bg-teal-500/10 text-teal-400"
                                  : "bg-gold-400/10 text-gold-400"
                              }`}
                            >
                              {member.status}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2">
                              <div className="h-1.5 w-20 rounded-full bg-navy-800">
                                <div
                                  className={`h-1.5 rounded-full ${
                                    member.load > 85
                                      ? "bg-coral-400"
                                      : member.load > 60
                                        ? "bg-gold-400"
                                        : "bg-teal-400"
                                  }`}
                                  style={{ width: `${member.load}%` }}
                                />
                              </div>
                              <span className="text-xs text-slate-500">
                                {member.load}%
                              </span>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Recent Alerts */}
              <div className="lg:col-span-2">
                <h2 className="mb-4 text-lg font-semibold text-white">
                  Recent Alerts
                </h2>
                <div className="space-y-3">
                  {activities.length === 0 ? (
                    <div className="glass-card rounded-xl p-6 text-center">
                      <p className="text-sm text-slate-500">
                        No recent activity
                      </p>
                    </div>
                  ) : (
                    activities.map((activity) => {
                      const priority =
                        priorityFromType[activity.type] ||
                        priorityFromType.login;
                      return (
                        <div
                          key={activity.id}
                          className="glass-card rounded-xl p-4"
                        >
                          <div className="flex items-start justify-between">
                            <span
                              className={`rounded-full px-2 py-0.5 text-xs font-medium ${priority.style}`}
                            >
                              {priority.label}
                            </span>
                            <span className="text-xs text-slate-500">
                              {timeAgo(activity.created_at)}
                            </span>
                          </div>
                          <p className="mt-2 text-sm text-slate-300">
                            {activity.description}
                          </p>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            </div>

            {/* Revenue + SLA Charts Placeholder */}
            <div className="mt-8 grid gap-8 lg:grid-cols-2">
              <div className="glass-card rounded-xl p-6">
                <h3 className="mb-4 flex items-center gap-2 text-lg font-semibold text-white">
                  <DollarSign className="h-5 w-5 text-teal-400" />
                  Revenue (12 Months)
                </h3>
                <div className="flex h-48 items-end justify-between gap-1">
                  {[33, 55, 85, 113, 145, 175, 200, 227, 255, 290, 320, 348].map(
                    (v, i) => (
                      <div
                        key={i}
                        className="flex-1 rounded-t bg-gradient-to-t from-teal-500/10 to-teal-400/50"
                        style={{ height: `${(v / 348) * 100}%` }}
                      />
                    )
                  )}
                </div>
                <div className="mt-2 flex justify-between text-xs text-slate-500">
                  <span>Month 1</span>
                  <span>Month 6</span>
                  <span>Month 12</span>
                </div>
              </div>

              <div className="glass-card rounded-xl p-6">
                <h3 className="mb-4 flex items-center gap-2 text-lg font-semibold text-white">
                  <Clock className="h-5 w-5 text-teal-400" />
                  SLA Performance
                </h3>
                <div className="flex h-48 items-end justify-between gap-2">
                  {[95, 96, 94, 97, 98, 96, 97, 99, 97, 98, 98, 98].map(
                    (v, i) => (
                      <div key={i} className="flex flex-1 flex-col items-center">
                        <div
                          className={`w-full rounded-t ${
                            v >= 97
                              ? "bg-teal-400/60"
                              : v >= 95
                                ? "bg-gold-400/60"
                                : "bg-coral-400/60"
                          }`}
                          style={{ height: `${((v - 90) / 10) * 100}%` }}
                        />
                      </div>
                    )
                  )}
                </div>
                <div className="mt-2 flex justify-between text-xs text-slate-500">
                  <span>Month 1</span>
                  <span>Target: 97%</span>
                  <span>Month 12</span>
                </div>
              </div>
            </div>
          </>
        )}
      </main>
    </div>
  );
}

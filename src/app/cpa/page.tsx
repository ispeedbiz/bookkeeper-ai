"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import {
  LayoutDashboard,
  Users,
  FileText,
  BarChart3,
  Settings,
  Search,
  Filter,
  MoreVertical,
  ChevronRight,
  TrendingUp,
  CheckCircle,
  Clock,
  LogOut,
  User,
  Building2,
  Loader2,
  Brain,
  RefreshCw,
  AlertTriangle,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useRealtimeSubscription } from "@/hooks/useRealtimeSubscription";

interface ClientEntity {
  id: string;
  name: string;
  type: string;
  status: string;
  industry: string | null;
  quickbooks_id: string | null;
  xero_id: string | null;
  created_at: string;
  updated_at: string;
  user_id: string;
  user_email: string;
  user_name: string;
  document_count: number;
  pending_docs: number;
  processing_docs: number;
  completed_docs: number;
}

interface DashboardStats {
  totalClients: number;
  totalEntities: number;
  totalDocuments: number;
  pendingDocuments: number;
  processingDocuments: number;
  completedDocuments: number;
  rejectedDocuments: number;
  activeSubscriptions: number;
  aiAnalyzedDocs: number;
}

interface RecentActivity {
  id: string;
  type: string;
  description: string;
  created_at: string;
}

const sideNavItems = [
  { label: "Overview", icon: LayoutDashboard, active: true },
  { label: "Clients", icon: Users, active: false },
  { label: "Documents", icon: FileText, active: false },
  { label: "Analytics", icon: BarChart3, active: false },
  { label: "Team", icon: Building2, active: false },
  { label: "Settings", icon: Settings, active: false },
];

export default function CPADashboard() {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<DashboardStats>({
    totalClients: 0,
    totalEntities: 0,
    totalDocuments: 0,
    pendingDocuments: 0,
    processingDocuments: 0,
    completedDocuments: 0,
    rejectedDocuments: 0,
    activeSubscriptions: 0,
    aiAnalyzedDocs: 0,
  });
  const [clients, setClients] = useState<ClientEntity[]>([]);
  const [activities, setActivities] = useState<RecentActivity[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [profile, setProfile] = useState<{ full_name: string; email: string } | null>(null);

  const fetchDashboardData = useCallback(async () => {
    const supabase = createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    // Fetch admin/CPA profile
    const { data: profileData } = await supabase
      .from("profiles")
      .select("full_name, email, role")
      .eq("id", user.id)
      .single();

    if (profileData) {
      setProfile({ full_name: profileData.full_name, email: profileData.email });
    }

    // Check if user is admin or CPA
    const isAdminOrCPA =
      profileData?.role === "admin" || profileData?.role === "cpa";

    if (!isAdminOrCPA) {
      setLoading(false);
      return;
    }

    // Fetch all entities (admin sees all)
    const { data: allEntities } = await supabase
      .from("entities")
      .select("*")
      .order("updated_at", { ascending: false });

    // Fetch all documents for stats
    const { data: allDocs } = await supabase
      .from("documents")
      .select("status, ai_analyzed_at, entity_id");

    // Fetch subscriptions
    const { data: allSubs } = await supabase
      .from("subscriptions")
      .select("status");

    // Fetch recent activities (across all users)
    const { data: recentActivities } = await supabase
      .from("activities")
      .select("id, type, description, created_at")
      .order("created_at", { ascending: false })
      .limit(15);

    // Fetch all profiles for mapping
    const { data: allProfiles } = await supabase
      .from("profiles")
      .select("id, email, full_name");

    const profileMap = new Map(
      (allProfiles || []).map((p) => [p.id, p])
    );

    // Process entities into client view
    const entityList: ClientEntity[] = [];
    const uniqueUsers = new Set<string>();

    if (allEntities) {
      for (const entity of allEntities) {
        const ownerProfile = profileMap.get(entity.user_id);

        // Count documents per entity
        const entityDocs = allDocs?.filter((d) => d.entity_id === entity.id) || [];
        const pending = entityDocs.filter((d) => d.status === "uploaded").length;
        const processing = entityDocs.filter((d) => d.status === "processing").length;
        const completed = entityDocs.filter(
          (d) => d.status === "approved" || d.status === "reviewed"
        ).length;

        uniqueUsers.add(entity.user_id);

        entityList.push({
          id: entity.id,
          name: entity.name,
          type: entity.type,
          status: entity.status,
          industry: entity.industry,
          quickbooks_id: entity.quickbooks_id,
          xero_id: entity.xero_id,
          created_at: entity.created_at,
          updated_at: entity.updated_at,
          user_id: entity.user_id,
          user_email: ownerProfile?.email || "",
          user_name: ownerProfile?.full_name || "",
          document_count: entityDocs.length,
          pending_docs: pending,
          processing_docs: processing,
          completed_docs: completed,
        });
      }
    }

    // Calculate stats
    const docsByStatus = {
      uploaded: 0,
      processing: 0,
      reviewed: 0,
      approved: 0,
      rejected: 0,
    };
    let aiAnalyzed = 0;

    if (allDocs) {
      for (const doc of allDocs) {
        const status = doc.status as keyof typeof docsByStatus;
        if (status in docsByStatus) docsByStatus[status]++;
        if (doc.ai_analyzed_at) aiAnalyzed++;
      }
    }

    const activeSubs =
      allSubs?.filter((s) => s.status === "active" || s.status === "trialing")
        .length || 0;

    setStats({
      totalClients: uniqueUsers.size,
      totalEntities: entityList.length,
      totalDocuments: allDocs?.length || 0,
      pendingDocuments: docsByStatus.uploaded,
      processingDocuments: docsByStatus.processing,
      completedDocuments: docsByStatus.approved + docsByStatus.reviewed,
      rejectedDocuments: docsByStatus.rejected,
      activeSubscriptions: activeSubs,
      aiAnalyzedDocs: aiAnalyzed,
    });

    setClients(entityList);
    setActivities(recentActivities || []);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  // Realtime: listen for document changes
  useRealtimeSubscription<{ id: string; status: string }>({
    table: "documents",
    onInsert: () => fetchDashboardData(),
    onUpdate: () => fetchDashboardData(),
    enabled: !loading,
  });

  // Realtime: listen for new activities
  useRealtimeSubscription<RecentActivity>({
    table: "activities",
    onInsert: (activity) => {
      setActivities((prev) => [activity, ...prev].slice(0, 15));
    },
    enabled: !loading,
  });

  const filteredClients = clients.filter(
    (c) =>
      c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.user_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.user_email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  function formatTimeAgo(dateStr: string): string {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  }

  const kpis = [
    {
      label: "Active Clients",
      value: stats.totalClients,
      icon: Users,
      change: `${stats.totalEntities} entities`,
      color: "text-teal-400",
      bg: "bg-teal-500/10",
    },
    {
      label: "Documents Pending",
      value: stats.pendingDocuments,
      icon: Clock,
      change: `${stats.processingDocuments} processing`,
      color: "text-gold-400",
      bg: "bg-gold-400/10",
    },
    {
      label: "Completed",
      value: stats.completedDocuments,
      icon: CheckCircle,
      change: `${stats.rejectedDocuments} rejected`,
      color: "text-cyan-400",
      bg: "bg-cyan-400/10",
    },
    {
      label: "AI Analyzed",
      value: stats.aiAnalyzedDocs,
      icon: Brain,
      change: `of ${stats.totalDocuments} total`,
      color: "text-purple-400",
      bg: "bg-purple-500/10",
    },
  ];

  if (loading) {
    return (
      <div className="flex min-h-screen bg-navy-950 items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-teal-400" />
          <p className="text-slate-400">Loading CPA Dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-navy-950">
      {/* Sidebar */}
      <aside className="fixed left-0 top-0 z-40 flex h-screen w-64 flex-col border-r border-navy-700/50 bg-navy-900/95 backdrop-blur-md">
        <div className="flex h-16 items-center border-b border-navy-700/50 px-6">
          <Link href="/" className="text-lg font-bold text-gradient">
            BookkeeperAI
          </Link>
          <span className="ml-2 rounded bg-cyan-400/10 px-2 py-0.5 text-xs font-medium text-cyan-400">
            CPA
          </span>
        </div>
        <nav className="flex-1 overflow-y-auto p-3">
          <ul className="space-y-1">
            {sideNavItems.map((item) => (
              <li key={item.label}>
                <button
                  className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all ${
                    item.active
                      ? "bg-teal-500/10 text-teal-400"
                      : "text-slate-400 hover:bg-navy-800 hover:text-white"
                  }`}
                >
                  <item.icon className="h-5 w-5" />
                  {item.label}
                </button>
              </li>
            ))}
          </ul>
        </nav>
        <div className="border-t border-navy-700/50 p-3">
          <div className="flex items-center gap-3 px-3 py-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-cyan-400/20">
              <User className="h-4 w-4 text-cyan-400" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-white">
                {profile?.full_name || "CPA Admin"}
              </p>
              <p className="truncate text-xs text-slate-500">
                {profile?.email || ""}
              </p>
            </div>
            <Link href="/login" className="text-slate-500 hover:text-coral-400">
              <LogOut className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="ml-64 flex-1 p-8">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white">CPA Dashboard</h1>
            <p className="mt-1 text-slate-400">
              Manage all client entities and track document processing in real-time.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={fetchDashboardData}
              className="flex items-center gap-2 rounded-xl border border-navy-700 px-4 py-2.5 text-sm text-slate-400 hover:border-teal-400/30 hover:text-white transition-all"
            >
              <RefreshCw className="h-4 w-4" />
              Refresh
            </button>
            <button className="rounded-xl bg-teal-500 px-5 py-2.5 text-sm font-semibold text-navy-950 transition-all hover:brightness-110">
              + Onboard Client
            </button>
          </div>
        </div>

        {/* KPIs */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {kpis.map((kpi) => (
            <div key={kpi.label} className="glass-card rounded-xl p-5">
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-400">{kpi.label}</span>
                <div className={`rounded-lg p-2 ${kpi.bg}`}>
                  <kpi.icon className={`h-4 w-4 ${kpi.color}`} />
                </div>
              </div>
              <div className="mt-3 flex items-baseline gap-2">
                <span className="text-2xl font-bold text-white">{kpi.value}</span>
                <span className="text-sm text-slate-500">{kpi.change}</span>
              </div>
            </div>
          ))}
        </div>

        {/* Search + Actions */}
        <div className="mt-8 flex items-center gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search clients, entities, emails..."
              className="w-full rounded-xl border border-navy-700 bg-navy-800/50 py-2.5 pl-11 pr-4 text-sm text-white placeholder-slate-500 outline-none focus:border-teal-400/50"
            />
          </div>
          <button className="flex items-center gap-2 rounded-xl border border-navy-700 px-4 py-2.5 text-sm text-slate-400 hover:border-teal-400/30 hover:text-white">
            <Filter className="h-4 w-4" />
            Filter
          </button>
        </div>

        {/* Client/Entity Table */}
        <div className="mt-6 glass-card overflow-hidden rounded-xl">
          <table className="w-full">
            <thead>
              <tr className="border-b border-navy-700/50">
                <th className="px-5 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-500">Entity</th>
                <th className="px-5 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-500">Owner</th>
                <th className="px-5 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-500">Status</th>
                <th className="px-5 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-500">Documents</th>
                <th className="px-5 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-500">Pending</th>
                <th className="px-5 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-500">Integrations</th>
                <th className="px-5 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-500">Updated</th>
                <th className="px-5 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-navy-700/30">
              {filteredClients.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-5 py-12 text-center">
                    <Users className="mx-auto h-8 w-8 text-slate-600" />
                    <p className="mt-3 text-sm text-slate-500">
                      {searchQuery
                        ? "No clients match your search."
                        : "No clients onboarded yet."}
                    </p>
                  </td>
                </tr>
              ) : (
                filteredClients.map((client) => (
                  <tr key={client.id} className="transition-colors hover:bg-navy-800/30">
                    <td className="px-5 py-4">
                      <div>
                        <span className="font-medium text-white">{client.name}</span>
                        {client.industry && (
                          <p className="text-xs text-slate-500">{client.industry}</p>
                        )}
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <div>
                        <p className="text-sm text-white">{client.user_name || "—"}</p>
                        <p className="text-xs text-slate-500">{client.user_email}</p>
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <span
                        className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${
                          client.status === "active"
                            ? "bg-teal-500/10 text-teal-400"
                            : client.status === "onboarding"
                              ? "bg-gold-400/10 text-gold-400"
                              : "bg-slate-500/10 text-slate-400"
                        }`}
                      >
                        {client.status}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-sm text-slate-400">{client.document_count}</td>
                    <td className="px-5 py-4">
                      {client.pending_docs > 0 || client.processing_docs > 0 ? (
                        <div className="flex items-center gap-1.5">
                          {client.pending_docs > 0 && (
                            <span className="inline-flex items-center gap-1 rounded-full bg-gold-400/10 px-2 py-0.5 text-xs font-medium text-gold-400">
                              <AlertTriangle className="h-3 w-3" />
                              {client.pending_docs}
                            </span>
                          )}
                          {client.processing_docs > 0 && (
                            <span className="inline-flex items-center gap-1 rounded-full bg-cyan-400/10 px-2 py-0.5 text-xs font-medium text-cyan-400">
                              <Brain className="h-3 w-3" />
                              {client.processing_docs}
                            </span>
                          )}
                        </div>
                      ) : (
                        <span className="text-sm text-slate-600">—</span>
                      )}
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-1.5">
                        {client.quickbooks_id && (
                          <span className="rounded bg-green-500/10 px-1.5 py-0.5 text-[10px] font-medium text-green-400">QBO</span>
                        )}
                        {client.xero_id && (
                          <span className="rounded bg-blue-500/10 px-1.5 py-0.5 text-[10px] font-medium text-blue-400">Xero</span>
                        )}
                        {!client.quickbooks_id && !client.xero_id && (
                          <span className="text-xs text-slate-600">None</span>
                        )}
                      </div>
                    </td>
                    <td className="px-5 py-4 text-sm text-slate-500">{formatTimeAgo(client.updated_at)}</td>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-2">
                        <button className="text-slate-500 hover:text-teal-400">
                          <ChevronRight className="h-4 w-4" />
                        </button>
                        <button className="text-slate-500 hover:text-white">
                          <MoreVertical className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Bottom: Activity + Pipeline */}
        <div className="mt-8 grid gap-8 lg:grid-cols-2">
          {/* Live Activity Feed */}
          <div className="glass-card rounded-xl p-6">
            <h3 className="mb-4 flex items-center gap-2 text-lg font-semibold text-white">
              <div className="h-2 w-2 rounded-full bg-teal-400 animate-pulse" />
              Live Activity Feed
            </h3>
            <div className="divide-y divide-navy-700/30">
              {activities.length === 0 ? (
                <p className="py-8 text-center text-sm text-slate-500">No recent activity.</p>
              ) : (
                activities.slice(0, 10).map((activity) => (
                  <div key={activity.id} className="flex items-start gap-3 py-3">
                    <div
                      className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${
                        activity.type.includes("approved") || activity.type.includes("reviewed")
                          ? "bg-teal-400"
                          : activity.type.includes("rejected") || activity.type.includes("failed")
                            ? "bg-coral-400"
                            : activity.type.includes("uploaded")
                              ? "bg-cyan-400"
                              : "bg-slate-400"
                      }`}
                    />
                    <div className="min-w-0 flex-1">
                      <p className="text-sm text-white">{activity.description}</p>
                      <p className="mt-0.5 text-xs text-slate-500">{formatTimeAgo(activity.created_at)}</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Processing Pipeline */}
          <div className="glass-card rounded-xl p-6">
            <h3 className="mb-4 flex items-center gap-2 text-lg font-semibold text-white">
              <TrendingUp className="h-5 w-5 text-teal-400" />
              Processing Pipeline
            </h3>
            <div className="space-y-4">
              {[
                { label: "Documents Pending", count: stats.pendingDocuments, total: stats.totalDocuments, color: "bg-gold-400" },
                { label: "AI Processing", count: stats.processingDocuments, total: stats.totalDocuments, color: "bg-purple-400" },
                { label: "Completed", count: stats.completedDocuments, total: stats.totalDocuments, color: "bg-teal-400" },
                { label: "Rejected", count: stats.rejectedDocuments, total: stats.totalDocuments, color: "bg-coral-400" },
              ].map((item) => (
                <div key={item.label}>
                  <div className="mb-1.5 flex items-center justify-between">
                    <span className="text-sm text-slate-400">{item.label}</span>
                    <span className="text-sm font-medium text-white">{item.count}</span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-navy-800">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${item.color}`}
                      style={{ width: `${item.total > 0 ? (item.count / item.total) * 100 : 0}%` }}
                    />
                  </div>
                </div>
              ))}

              <div className="mt-6 border-t border-navy-700/30 pt-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-400">Active Subscriptions</span>
                  <span className="text-sm font-semibold text-white">{stats.activeSubscriptions}</span>
                </div>
                <div className="mt-2 flex items-center justify-between">
                  <span className="text-sm text-slate-400">AI Analysis Rate</span>
                  <span className="text-sm font-semibold text-teal-400">
                    {stats.totalDocuments > 0
                      ? Math.round((stats.aiAnalyzedDocs / stats.totalDocuments) * 100)
                      : 0}%
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

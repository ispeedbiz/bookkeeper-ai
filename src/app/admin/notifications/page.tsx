"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import { createBrowserClient } from "@supabase/ssr";
import AdminSidebar from "@/components/admin/AdminSidebar";
import {
  Loader2,
  Bell,
  UserPlus,
  FileText,
  CreditCard,
  AlertTriangle,
  CheckCircle,
  XCircle,
  MessageSquare,
} from "lucide-react";

interface Activity {
  id: string;
  type: string;
  description: string;
  created_at: string;
  metadata: Record<string, unknown> | null;
  user_id: string;
}

const typeConfig: Record<string, { icon: typeof Bell; color: string; bg: string }> = {
  account_created: { icon: UserPlus, color: "text-teal-400", bg: "bg-teal-500/10" },
  login: { icon: CheckCircle, color: "text-slate-400", bg: "bg-slate-400/10" },
  document_uploaded: { icon: FileText, color: "text-cyan-400", bg: "bg-cyan-400/10" },
  document_status_changed: { icon: AlertTriangle, color: "text-gold-400", bg: "bg-gold-400/10" },
  subscription_created: { icon: CreditCard, color: "text-teal-400", bg: "bg-teal-400/10" },
  subscription_cancelled: { icon: XCircle, color: "text-coral-400", bg: "bg-coral-400/10" },
  payment_received: { icon: CreditCard, color: "text-teal-400", bg: "bg-teal-400/10" },
  entity_created: { icon: CheckCircle, color: "text-cyan-400", bg: "bg-cyan-400/10" },
  profile_updated: { icon: UserPlus, color: "text-slate-400", bg: "bg-slate-400/10" },
  message_sent: { icon: MessageSquare, color: "text-gold-400", bg: "bg-gold-400/10" },
};

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export default function AdminNotifications() {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>("all");

  const supabase = useMemo(() => createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  ), []);

  const loadActivities = useCallback(async () => {
    setLoading(true);
    try {
      let query = supabase
        .from("activities")
        .select("id, type, description, created_at, metadata, user_id")
        .order("created_at", { ascending: false })
        .limit(100);

      if (filter !== "all") {
        query = query.eq("type", filter);
      }

      const { data, error } = await query;
      if (error) {
        console.error("Error loading activities:", error);
      } else if (data) {
        setActivities(data as Activity[]);
      }
    } catch (err) {
      console.error("Failed to load activities:", err);
    } finally {
      setLoading(false);
    }
  }, [supabase, filter]);

  useEffect(() => {
    loadActivities();
  }, [loadActivities]);

  const activityTypes = [
    "all",
    "account_created",
    "document_uploaded",
    "document_status_changed",
    "subscription_created",
    "payment_received",
    "entity_created",
    "profile_updated",
  ];

  return (
    <div className="flex min-h-screen bg-navy-950">
      <AdminSidebar active="Notifications" />
      <main className="ml-0 flex-1 p-4 pt-16 lg:ml-64 lg:p-8 lg:pt-8">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-white">Notifications & Activity</h1>
          <p className="mt-1 text-slate-400">
            Platform-wide activity feed and event log.
          </p>
        </div>

        {/* Filter */}
        <div className="mb-6 flex flex-wrap gap-2">
          {activityTypes.map((t) => (
            <button
              key={t}
              onClick={() => setFilter(t)}
              className={`rounded-full px-3 py-1.5 text-xs font-medium transition-all ${
                filter === t
                  ? "bg-teal-400 text-navy-950"
                  : "bg-navy-800 text-slate-400 hover:bg-navy-700"
              }`}
            >
              {t === "all" ? "All" : t.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="flex h-64 items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-teal-400" />
          </div>
        ) : activities.length === 0 ? (
          <div className="flex h-64 flex-col items-center justify-center glass-card rounded-xl">
            <Bell className="h-12 w-12 text-slate-600" />
            <p className="mt-4 text-slate-400">No notifications</p>
          </div>
        ) : (
          <div className="space-y-2">
            {activities.map((activity) => {
              const config = typeConfig[activity.type] || typeConfig.login;
              const Icon = config.icon;
              return (
                <div
                  key={activity.id}
                  className="glass-card rounded-xl p-4 transition-all hover:border-navy-600"
                >
                  <div className="flex items-start gap-4">
                    <div className={`rounded-lg p-2 mt-0.5 ${config.bg}`}>
                      <Icon className={`h-4 w-4 ${config.color}`} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm text-white">{activity.description}</p>
                      <div className="mt-1 flex items-center gap-3 text-xs text-slate-500">
                        <span>{timeAgo(activity.created_at)}</span>
                        <span className="capitalize">{activity.type.replace(/_/g, " ")}</span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}

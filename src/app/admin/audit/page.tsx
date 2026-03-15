"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import AdminSidebar from "@/components/admin/AdminSidebar";
import { createBrowserClient } from "@supabase/ssr";
import {
  Loader2,
  Search,
  Calendar,
  X,
  ChevronDown,
} from "lucide-react";

interface AuditEntry {
  id: string;
  user_id: string;
  action: string;
  description: string;
  metadata: Record<string, unknown> | null;
  created_at: string;
  user_name: string;
  user_email: string;
}

type ActionType = "login" | "document" | "payment" | "security" | "other";

const ACTION_COLORS: Record<ActionType, string> = {
  login: "bg-slate-400/10 text-slate-400",
  document: "bg-cyan-400/10 text-cyan-400",
  payment: "bg-teal-500/10 text-teal-400",
  security: "bg-coral-400/10 text-coral-400",
  other: "bg-gold-400/10 text-gold-400",
};

const ACTION_TYPES: ActionType[] = ["login", "document", "payment", "security", "other"];

function classifyAction(action: string): ActionType {
  const lower = action.toLowerCase();
  if (lower.includes("login") || lower.includes("logout") || lower.includes("sign")) return "login";
  if (lower.includes("document") || lower.includes("upload") || lower.includes("file")) return "document";
  if (lower.includes("payment") || lower.includes("subscription") || lower.includes("invoice") || lower.includes("billing")) return "payment";
  if (lower.includes("security") || lower.includes("password") || lower.includes("mfa") || lower.includes("role")) return "security";
  return "other";
}

const PAGE_SIZE = 50;

export default function AdminAuditPage() {
  const [entries, setEntries] = useState<AuditEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState<ActionType | null>(null);
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(0);

  const supabase = useMemo(
    () =>
      createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      ),
    []
  );

  const fetchEntries = useCallback(
    async (pageNum: number, append = false) => {
      if (pageNum === 0) setLoading(true);
      else setLoadingMore(true);

      try {
        let query = supabase
          .from("activities")
          .select(
            "id, user_id, action, description, metadata, created_at, profiles!inner(full_name, email)"
          )
          .order("created_at", { ascending: false })
          .range(pageNum * PAGE_SIZE, (pageNum + 1) * PAGE_SIZE - 1);

        if (dateFrom) {
          query = query.gte("created_at", new Date(dateFrom).toISOString());
        }
        if (dateTo) {
          const endDate = new Date(dateTo);
          endDate.setDate(endDate.getDate() + 1);
          query = query.lt("created_at", endDate.toISOString());
        }

        const { data, error } = await query;

        if (error) {
          console.error("Audit fetch error:", error);
          return;
        }

        const mapped: AuditEntry[] = (data || []).map((row: Record<string, unknown>) => {
          const profile = row.profiles as { full_name: string; email: string } | null;
          return {
            id: row.id as string,
            user_id: row.user_id as string,
            action: row.action as string,
            description: row.description as string,
            metadata: row.metadata as Record<string, unknown> | null,
            created_at: row.created_at as string,
            user_name: profile?.full_name || "Unknown",
            user_email: profile?.email || "",
          };
        });

        if (append) {
          setEntries((prev) => [...prev, ...mapped]);
        } else {
          setEntries(mapped);
        }

        setHasMore(mapped.length === PAGE_SIZE);
      } catch (err) {
        console.error("Audit fetch error:", err);
      } finally {
        setLoading(false);
        setLoadingMore(false);
      }
    },
    [supabase, dateFrom, dateTo]
  );

  useEffect(() => {
    setPage(0);
    fetchEntries(0);
  }, [fetchEntries]);

  const handleLoadMore = () => {
    const nextPage = page + 1;
    setPage(nextPage);
    fetchEntries(nextPage, true);
  };

  const filteredEntries = entries.filter((entry) => {
    if (activeFilter && classifyAction(entry.action) !== activeFilter) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return (
        entry.user_name.toLowerCase().includes(q) ||
        entry.user_email.toLowerCase().includes(q) ||
        entry.action.toLowerCase().includes(q) ||
        (entry.description || "").toLowerCase().includes(q)
      );
    }
    return true;
  });

  const clearFilters = () => {
    setActiveFilter(null);
    setSearchQuery("");
    setDateFrom("");
    setDateTo("");
  };

  const hasActiveFilters = activeFilter || searchQuery || dateFrom || dateTo;

  return (
    <div className="flex min-h-screen bg-navy-950">
      <AdminSidebar active="Audit" />

      <main className="ml-0 flex-1 p-4 pt-16 lg:ml-64 lg:p-8 lg:pt-8">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-white">Audit Log</h1>
          <p className="mt-1 text-slate-400">
            Track all user activities and system events.
          </p>
        </div>

        {/* Search & Date Filters */}
        <div className="mb-4 flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-[240px] max-w-md">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
            <input
              type="text"
              placeholder="Search by user, action, or description..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-xl border border-navy-600 bg-navy-800/50 py-2.5 pl-10 pr-4 text-sm text-white placeholder-slate-500 outline-none transition-colors focus:border-teal-400/50"
            />
          </div>

          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-slate-500" />
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className="rounded-xl border border-navy-600 bg-navy-800/50 px-3 py-2 text-sm text-white outline-none transition-colors focus:border-teal-400/50 [color-scheme:dark]"
              placeholder="From"
            />
            <span className="text-slate-500 text-sm">to</span>
            <input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className="rounded-xl border border-navy-600 bg-navy-800/50 px-3 py-2 text-sm text-white outline-none transition-colors focus:border-teal-400/50 [color-scheme:dark]"
              placeholder="To"
            />
          </div>

          {hasActiveFilters && (
            <button
              onClick={clearFilters}
              className="flex items-center gap-1 rounded-lg px-3 py-2 text-xs text-slate-400 hover:text-white transition-colors"
            >
              <X className="h-3 w-3" />
              Clear filters
            </button>
          )}
        </div>

        {/* Action Type Filter Pills */}
        <div className="mb-6 flex flex-wrap gap-2">
          {ACTION_TYPES.map((type) => (
            <button
              key={type}
              onClick={() => setActiveFilter(activeFilter === type ? null : type)}
              className={`rounded-full px-3.5 py-1.5 text-xs font-medium capitalize transition-all ${
                activeFilter === type
                  ? ACTION_COLORS[type] + " ring-1 ring-current"
                  : "bg-navy-800/50 text-slate-500 hover:text-slate-300"
              }`}
            >
              {type}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="flex h-64 items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-teal-400" />
            <span className="ml-3 text-slate-400">Loading audit log...</span>
          </div>
        ) : (
          <>
            <div className="glass-card overflow-hidden rounded-xl">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-navy-700/50">
                    <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-500">
                      Timestamp
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-500">
                      User
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-500">
                      Action
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-500">
                      Description
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-500">
                      IP Address
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-navy-700/30">
                  {filteredEntries.length === 0 ? (
                    <tr>
                      <td
                        colSpan={5}
                        className="px-4 py-12 text-center text-sm text-slate-500"
                      >
                        {hasActiveFilters
                          ? "No activities match your filters."
                          : "No audit entries found."}
                      </td>
                    </tr>
                  ) : (
                    filteredEntries.map((entry) => {
                      const actionType = classifyAction(entry.action);
                      const ip =
                        (entry.metadata?.ip_address as string) ||
                        (entry.metadata?.ip as string) ||
                        "-";
                      return (
                        <tr
                          key={entry.id}
                          className="transition-colors hover:bg-navy-800/30"
                        >
                          <td className="whitespace-nowrap px-4 py-3 text-xs text-slate-500">
                            {new Date(entry.created_at).toLocaleString("en-US", {
                              month: "short",
                              day: "numeric",
                              year: "numeric",
                              hour: "2-digit",
                              minute: "2-digit",
                              second: "2-digit",
                            })}
                          </td>
                          <td className="px-4 py-3">
                            <div>
                              <p className="text-sm font-medium text-white">
                                {entry.user_name}
                              </p>
                              <p className="text-xs text-slate-500">
                                {entry.user_email}
                              </p>
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <span
                              className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${ACTION_COLORS[actionType]}`}
                            >
                              {entry.action}
                            </span>
                          </td>
                          <td className="max-w-xs truncate px-4 py-3 text-sm text-slate-400">
                            {entry.description || "-"}
                          </td>
                          <td className="px-4 py-3 text-xs font-mono text-slate-500">
                            {ip}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {hasMore && !activeFilter && !searchQuery && (
              <div className="mt-6 flex justify-center">
                <button
                  onClick={handleLoadMore}
                  disabled={loadingMore}
                  className="flex items-center gap-2 rounded-xl border border-navy-600 bg-navy-800/50 px-6 py-2.5 text-sm font-medium text-slate-300 transition-colors hover:border-teal-400/50 hover:text-white disabled:opacity-50"
                >
                  {loadingMore ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Loading...
                    </>
                  ) : (
                    <>
                      <ChevronDown className="h-4 w-4" />
                      Load More
                    </>
                  )}
                </button>
              </div>
            )}

            <p className="mt-3 text-center text-xs text-slate-600">
              Showing {filteredEntries.length} entries
            </p>
          </>
        )}
      </main>
    </div>
  );
}

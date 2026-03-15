"use client";

import { useEffect, useState, useCallback } from "react";
import { createBrowserClient } from "@supabase/ssr";
import AdminSidebar from "@/components/admin/AdminSidebar";
import {
  Loader2,
  FileText,
  Download,
  Eye,
  CheckCircle,
  XCircle,
  Clock,
  AlertTriangle,
} from "lucide-react";

interface Document {
  id: string;
  file_name: string;
  file_url: string;
  type: string;
  status: string;
  mime_type: string;
  file_size: number;
  uploaded_at: string;
  ai_document_type: string | null;
  ai_confidence: number | null;
  ai_vendor: string | null;
  ai_total_amount: number | null;
  user: { full_name: string; email: string } | null;
  entity: { name: string } | null;
}

const statusStyles: Record<string, { bg: string; text: string; icon: typeof Clock }> = {
  uploaded: { bg: "bg-gold-400/10", text: "text-gold-400", icon: Clock },
  processing: { bg: "bg-cyan-400/10", text: "text-cyan-400", icon: Loader2 },
  reviewed: { bg: "bg-teal-400/10", text: "text-teal-400", icon: Eye },
  approved: { bg: "bg-teal-500/10", text: "text-teal-500", icon: CheckCircle },
  rejected: { bg: "bg-coral-400/10", text: "text-coral-400", icon: XCircle },
};

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function AdminWorkQueue() {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>("all");
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const loadDocuments = useCallback(async () => {
    setLoading(true);
    try {
      let query = supabase
        .from("documents")
        .select(`
          id, file_name, file_url, type, status, mime_type, file_size, uploaded_at,
          ai_document_type, ai_confidence, ai_vendor, ai_total_amount,
          profiles!documents_user_id_fkey(full_name, email),
          entities!documents_entity_id_fkey(name)
        `)
        .order("uploaded_at", { ascending: false });

      if (filter !== "all") {
        query = query.eq("status", filter);
      }

      const { data, error } = await query.limit(100);

      if (error) {
        console.error("Error loading documents:", error);
        // Fallback: fetch without joins
        const { data: fallbackData } = await supabase
          .from("documents")
          .select("*")
          .order("uploaded_at", { ascending: false })
          .limit(100);

        if (fallbackData) {
          setDocuments(
            fallbackData.map((d) => ({
              ...d,
              user: null,
              entity: null,
            })) as Document[]
          );
        }
      } else if (data) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        setDocuments(data.map((d: any) => ({
          ...d,
          user: d.profiles || null,
          entity: d.entities || null,
        })));
      }
    } catch (err) {
      console.error("Failed to load documents:", err);
    } finally {
      setLoading(false);
    }
  }, [supabase, filter]);

  useEffect(() => {
    loadDocuments();
  }, [loadDocuments]);

  const handleStatusChange = async (docId: string, newStatus: string) => {
    setUpdatingId(docId);
    try {
      const { error } = await supabase
        .from("documents")
        .update({ status: newStatus })
        .eq("id", docId);

      if (!error) {
        setDocuments((prev) =>
          prev.map((d) => (d.id === docId ? { ...d, status: newStatus } : d))
        );
      }
    } catch (err) {
      console.error("Status update error:", err);
    } finally {
      setUpdatingId(null);
    }
  };

  const statusCounts = documents.reduce(
    (acc, d) => {
      acc[d.status] = (acc[d.status] || 0) + 1;
      return acc;
    },
    {} as Record<string, number>
  );

  return (
    <div className="flex min-h-screen bg-navy-950">
      <AdminSidebar active="Work Queue" />
      <main className="ml-64 flex-1 p-8">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-white">Work Queue</h1>
          <p className="mt-1 text-slate-400">
            Review and process incoming client documents.
          </p>
        </div>

        {/* Status Filter Pills */}
        <div className="mb-6 flex flex-wrap gap-2">
          {["all", "uploaded", "processing", "reviewed", "approved", "rejected"].map(
            (s) => (
              <button
                key={s}
                onClick={() => setFilter(s)}
                className={`rounded-full px-4 py-1.5 text-xs font-medium transition-all ${
                  filter === s
                    ? "bg-teal-400 text-navy-950"
                    : "bg-navy-800 text-slate-400 hover:bg-navy-700 hover:text-white"
                }`}
              >
                {s === "all" ? "All" : s.charAt(0).toUpperCase() + s.slice(1)}
                {s === "all"
                  ? ` (${documents.length})`
                  : statusCounts[s]
                    ? ` (${statusCounts[s]})`
                    : ""}
              </button>
            )
          )}
        </div>

        {loading ? (
          <div className="flex h-64 items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-teal-400" />
            <span className="ml-3 text-slate-400">Loading documents...</span>
          </div>
        ) : documents.length === 0 ? (
          <div className="flex h-64 flex-col items-center justify-center glass-card rounded-xl">
            <FileText className="h-12 w-12 text-slate-600" />
            <p className="mt-4 text-slate-400">No documents in queue</p>
          </div>
        ) : (
          <div className="space-y-3">
            {documents
              .filter((d) => filter === "all" || d.status === filter)
              .map((doc) => {
                const style = statusStyles[doc.status] || statusStyles.uploaded;
                const StatusIcon = style.icon;
                return (
                  <div
                    key={doc.id}
                    className="glass-card rounded-xl p-4 transition-all hover:border-navy-600"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4 min-w-0 flex-1">
                        <div className={`rounded-lg p-2 ${style.bg}`}>
                          <StatusIcon className={`h-5 w-5 ${style.text}`} />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-medium text-white">
                            {doc.file_name}
                          </p>
                          <div className="mt-1 flex items-center gap-3 text-xs text-slate-500">
                            <span>{doc.user?.full_name || doc.user?.email || "Unknown user"}</span>
                            <span>&middot;</span>
                            <span>{doc.entity?.name || "No entity"}</span>
                            <span>&middot;</span>
                            <span>{formatFileSize(doc.file_size)}</span>
                            <span>&middot;</span>
                            <span>
                              {new Date(doc.uploaded_at).toLocaleDateString("en-US", {
                                month: "short",
                                day: "numeric",
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                            </span>
                          </div>
                          {doc.ai_vendor && (
                            <div className="mt-1 flex items-center gap-2 text-xs">
                              <span className="rounded bg-cyan-400/10 px-1.5 py-0.5 text-cyan-400">
                                AI: {doc.ai_document_type}
                              </span>
                              <span className="text-slate-500">
                                Vendor: {doc.ai_vendor}
                              </span>
                              {doc.ai_total_amount && (
                                <span className="text-teal-400">
                                  ${doc.ai_total_amount.toLocaleString()}
                                </span>
                              )}
                              <span className="text-slate-600">
                                ({Math.round((doc.ai_confidence || 0) * 100)}% confidence)
                              </span>
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-2 ml-4">
                        <span
                          className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${style.bg} ${style.text}`}
                        >
                          {doc.status}
                        </span>
                        <a
                          href={doc.file_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="rounded-lg p-2 text-slate-400 hover:bg-navy-800 hover:text-white"
                          title="View/Download"
                        >
                          <Download className="h-4 w-4" />
                        </a>
                        {doc.status === "uploaded" && (
                          <button
                            onClick={() => handleStatusChange(doc.id, "processing")}
                            disabled={updatingId === doc.id}
                            className="rounded-lg bg-cyan-400/10 px-3 py-1.5 text-xs font-medium text-cyan-400 hover:bg-cyan-400/20 disabled:opacity-50"
                          >
                            {updatingId === doc.id ? "..." : "Start Review"}
                          </button>
                        )}
                        {doc.status === "processing" || doc.status === "reviewed" ? (
                          <div className="flex gap-1">
                            <button
                              onClick={() => handleStatusChange(doc.id, "approved")}
                              disabled={updatingId === doc.id}
                              className="rounded-lg bg-teal-400/10 px-3 py-1.5 text-xs font-medium text-teal-400 hover:bg-teal-400/20 disabled:opacity-50"
                            >
                              Approve
                            </button>
                            <button
                              onClick={() => handleStatusChange(doc.id, "rejected")}
                              disabled={updatingId === doc.id}
                              className="rounded-lg bg-coral-400/10 px-3 py-1.5 text-xs font-medium text-coral-400 hover:bg-coral-400/20 disabled:opacity-50"
                            >
                              Reject
                            </button>
                          </div>
                        ) : null}
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

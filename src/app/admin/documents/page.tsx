"use client";

import { useEffect, useState, useCallback } from "react";
import { createBrowserClient } from "@supabase/ssr";
import AdminSidebar from "@/components/admin/AdminSidebar";
import {
  Loader2,
  FileText,
  Download,
  Search,
  Brain,
  Eye,
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
  ai_analysis: Record<string, unknown> | null;
  ai_document_type: string | null;
  ai_confidence: number | null;
  ai_vendor: string | null;
  ai_total_amount: number | null;
  ai_currency: string | null;
  user_id: string;
  entity_id: string;
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function AdminDocuments() {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedDoc, setSelectedDoc] = useState<Document | null>(null);

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const loadDocuments = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("documents")
        .select("*")
        .order("uploaded_at", { ascending: false })
        .limit(200);

      if (error) {
        console.error("Error loading documents:", error);
      } else if (data) {
        setDocuments(data as Document[]);
      }
    } catch (err) {
      console.error("Failed to load documents:", err);
    } finally {
      setLoading(false);
    }
  }, [supabase]);

  useEffect(() => {
    loadDocuments();
  }, [loadDocuments]);

  const filteredDocs = documents.filter((d) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      d.file_name.toLowerCase().includes(q) ||
      (d.ai_vendor || "").toLowerCase().includes(q) ||
      (d.ai_document_type || "").toLowerCase().includes(q) ||
      d.type.toLowerCase().includes(q)
    );
  });

  const aiAnalyzedCount = documents.filter((d) => d.ai_analysis).length;

  return (
    <div className="flex min-h-screen bg-navy-950">
      <AdminSidebar active="Documents" />
      <main className="ml-0 flex-1 p-4 pt-16 lg:ml-64 lg:p-8 lg:pt-8">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white">All Documents</h1>
            <p className="mt-1 text-slate-400">
              {documents.length} total &middot; {aiAnalyzedCount} AI analyzed
            </p>
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
            <input
              type="text"
              placeholder="Search documents..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-72 rounded-xl border border-navy-600 bg-navy-800/50 py-2.5 pl-10 pr-4 text-sm text-white placeholder-slate-500 outline-none transition-colors focus:border-teal-400/50"
            />
          </div>
        </div>

        {/* Stats Row */}
        <div className="mb-6 grid grid-cols-5 gap-4">
          {["uploaded", "processing", "reviewed", "approved", "rejected"].map((status) => {
            const count = documents.filter((d) => d.status === status).length;
            return (
              <div key={status} className="glass-card rounded-xl p-4 text-center">
                <p className="text-xs text-slate-500 capitalize">{status}</p>
                <p className="mt-1 text-2xl font-bold text-white">{count}</p>
              </div>
            );
          })}
        </div>

        {loading ? (
          <div className="flex h-64 items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-teal-400" />
          </div>
        ) : (
          <div className="glass-card overflow-hidden rounded-xl">
            <table className="w-full">
              <thead>
                <tr className="border-b border-navy-700/50">
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-500">File</th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-500">Type</th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-500">Status</th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-500">AI Analysis</th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-500">Size</th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-500">Uploaded</th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-500">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-navy-700/30">
                {filteredDocs.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-4 py-12 text-center text-sm text-slate-500">
                      {searchQuery ? "No documents match your search." : "No documents found."}
                    </td>
                  </tr>
                ) : (
                  filteredDocs.map((doc) => (
                    <tr key={doc.id} className="transition-colors hover:bg-navy-800/30">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <FileText className="h-4 w-4 text-slate-500" />
                          <span className="text-sm font-medium text-white truncate max-w-[200px]">
                            {doc.file_name}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm text-slate-400 capitalize">{doc.type}</td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${
                            doc.status === "approved"
                              ? "bg-teal-500/10 text-teal-400"
                              : doc.status === "processing"
                                ? "bg-cyan-400/10 text-cyan-400"
                                : doc.status === "rejected"
                                  ? "bg-coral-400/10 text-coral-400"
                                  : "bg-gold-400/10 text-gold-400"
                          }`}
                        >
                          {doc.status}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        {doc.ai_analysis ? (
                          <div className="flex items-center gap-1.5">
                            <Brain className="h-3.5 w-3.5 text-cyan-400" />
                            <span className="text-xs text-cyan-400">
                              {doc.ai_document_type || "Analyzed"}
                            </span>
                            {doc.ai_total_amount && (
                              <span className="text-xs text-teal-400 ml-1">
                                ${doc.ai_total_amount.toLocaleString()}
                              </span>
                            )}
                          </div>
                        ) : (
                          <span className="text-xs text-slate-600">Not analyzed</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-sm text-slate-500">
                        {formatFileSize(doc.file_size)}
                      </td>
                      <td className="px-4 py-3 text-sm text-slate-500">
                        {new Date(doc.uploaded_at).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                        })}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1">
                          {doc.ai_analysis && (
                            <button
                              onClick={() => setSelectedDoc(doc)}
                              className="rounded-lg p-1.5 text-slate-400 hover:bg-navy-800 hover:text-cyan-400"
                              title="View AI Analysis"
                            >
                              <Eye className="h-4 w-4" />
                            </button>
                          )}
                          <a
                            href={doc.file_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="rounded-lg p-1.5 text-slate-400 hover:bg-navy-800 hover:text-white"
                            title="Download"
                          >
                            <Download className="h-4 w-4" />
                          </a>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* AI Analysis Side Panel */}
        {selectedDoc && (
          <div className="fixed inset-y-0 right-0 z-50 w-96 border-l border-navy-700/50 bg-navy-900 p-6 shadow-2xl overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-white">AI Analysis</h3>
              <button
                onClick={() => setSelectedDoc(null)}
                className="text-slate-400 hover:text-white"
              >
                &times;
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <p className="text-xs text-slate-500">File</p>
                <p className="text-sm text-white">{selectedDoc.file_name}</p>
              </div>
              <div>
                <p className="text-xs text-slate-500">Document Type</p>
                <p className="text-sm text-cyan-400 capitalize">{selectedDoc.ai_document_type}</p>
              </div>
              <div>
                <p className="text-xs text-slate-500">Vendor</p>
                <p className="text-sm text-white">{selectedDoc.ai_vendor || "N/A"}</p>
              </div>
              <div className="flex gap-4">
                <div>
                  <p className="text-xs text-slate-500">Amount</p>
                  <p className="text-sm text-teal-400">
                    {selectedDoc.ai_total_amount
                      ? `$${selectedDoc.ai_total_amount.toLocaleString()} ${selectedDoc.ai_currency || "CAD"}`
                      : "N/A"}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-slate-500">Confidence</p>
                  <p className="text-sm text-white">
                    {selectedDoc.ai_confidence
                      ? `${Math.round(selectedDoc.ai_confidence * 100)}%`
                      : "N/A"}
                  </p>
                </div>
              </div>
              {selectedDoc.ai_analysis && (
                <div>
                  <p className="text-xs text-slate-500 mb-2">Raw Analysis</p>
                  <pre className="rounded-lg bg-navy-950 p-3 text-xs text-slate-300 overflow-auto max-h-96">
                    {JSON.stringify(selectedDoc.ai_analysis, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

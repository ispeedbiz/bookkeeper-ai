"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import {
  Upload,
  FileText,
  Download,
  Trash2,
  Loader2,
  CloudUpload,
  X,
  Brain,
  Sparkles,
  Eye,
} from "lucide-react";
import Sidebar from "@/components/dashboard/Sidebar";
import { createClient } from "@/lib/supabase/client";
import { useRealtimeSubscription } from "@/hooks/useRealtimeSubscription";

interface Entity {
  id: string;
  name: string;
}

interface Document {
  id: string;
  file_name: string;
  type: string;
  status: string;
  file_url: string;
  file_size: number;
  mime_type: string;
  created_at: string;
  entity_id: string;
  ai_analysis?: {
    documentType: string;
    summary: string;
    vendor?: string;
    totalAmount?: number;
    currency?: string;
    transactions?: Array<{
      date: string;
      description: string;
      amount: number;
      category: string;
      type: string;
    }>;
    confidence: number;
  };
  ai_confidence?: number;
  ai_vendor?: string;
  ai_total_amount?: number;
  ai_analyzed_at?: string;
  notes?: string;
}

const DOCUMENT_TYPES = [
  { value: "invoice", label: "Invoice" },
  { value: "receipt", label: "Receipt" },
  { value: "bank_statement", label: "Bank Statement" },
  { value: "tax_form", label: "Tax Form" },
  { value: "payroll", label: "Payroll" },
  { value: "other", label: "Other" },
];

const STATUS_STYLES: Record<string, string> = {
  uploaded: "bg-gold-400/10 text-gold-400",
  processing: "bg-cyan-400/10 text-cyan-400",
  reviewed: "bg-teal-400/10 text-teal-400",
  approved: "bg-teal-500/10 text-teal-500",
  rejected: "bg-coral-400/10 text-coral-400",
};

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export default function DocumentsPage() {
  const [entities, setEntities] = useState<Entity[]>([]);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [selectedEntity, setSelectedEntity] = useState<string>("");
  const [selectedType, setSelectedType] = useState<string>("invoice");
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [dragOver, setDragOver] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [selectedDoc, setSelectedDoc] = useState<Document | null>(null);
  const [analyzingId, setAnalyzingId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchDocuments = useCallback(async () => {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    const { data: entityData } = await supabase
      .from("entities")
      .select("id")
      .eq("user_id", user.id);

    const entityIds = entityData?.map((e) => e.id) || [];
    if (entityIds.length === 0) {
      setDocuments([]);
      return;
    }

    const { data: docs } = await supabase
      .from("documents")
      .select("*")
      .in("entity_id", entityIds)
      .order("created_at", { ascending: false });

    if (docs) {
      setDocuments(docs);
    }
  }, []);

  useEffect(() => {
    const supabase = createClient();

    async function init() {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      const { data: entityData } = await supabase
        .from("entities")
        .select("id, name")
        .eq("user_id", user.id)
        .order("name");

      if (entityData && entityData.length > 0) {
        setEntities(entityData);
        setSelectedEntity(entityData[0].id);
      }

      await fetchDocuments();
      setLoading(false);
    }

    init();
  }, [fetchDocuments]);

  // Realtime: auto-refresh when document status changes (e.g., AI processing complete)
  useRealtimeSubscription<Document>({
    table: "documents",
    onUpdate: (updatedDoc) => {
      setDocuments((prev) =>
        prev.map((d) => (d.id === updatedDoc.id ? { ...d, ...updatedDoc } : d))
      );
      // Update selected doc if it's the one being viewed
      if (selectedDoc?.id === updatedDoc.id) {
        setSelectedDoc((prev) => prev ? { ...prev, ...updatedDoc } : null);
      }
      if (updatedDoc.id === analyzingId) {
        setAnalyzingId(null);
      }
    },
    onInsert: () => fetchDocuments(),
    enabled: !loading,
  });

  async function handleAnalyze(docId: string) {
    setAnalyzingId(docId);
    try {
      const response = await fetch("/api/documents/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ documentId: docId }),
      });
      if (!response.ok) {
        const data = await response.json();
        setUploadError(data.error || "AI analysis failed");
        setAnalyzingId(null);
      }
      // Don't reset analyzingId here — Realtime will do it when status updates
    } catch {
      setUploadError("AI analysis failed. Please try again.");
      setAnalyzingId(null);
    }
  }

  async function handleUpload(file: File) {
    if (!selectedEntity) {
      setUploadError("Please select an entity first.");
      return;
    }

    setUploading(true);
    setUploadError(null);
    setUploadProgress(10);

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("entityId", selectedEntity);
      formData.append("documentType", selectedType);

      setUploadProgress(30);

      const response = await fetch("/api/documents/upload", {
        method: "POST",
        body: formData,
      });

      setUploadProgress(70);

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Upload failed");
      }

      setUploadProgress(100);

      // Refresh documents list
      await fetchDocuments();

      // Reset after short delay to show completion
      setTimeout(() => {
        setUploadProgress(0);
        setUploading(false);
      }, 500);
    } catch (error) {
      console.error("Upload error:", error);
      setUploadError(
        error instanceof Error ? error.message : "Upload failed. Please try again."
      );
      setUploading(false);
      setUploadProgress(0);
    }
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) handleUpload(file);
  }

  function handleDragOver(e: React.DragEvent) {
    e.preventDefault();
    setDragOver(true);
  }

  function handleDragLeave(e: React.DragEvent) {
    e.preventDefault();
    setDragOver(false);
  }

  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) handleUpload(file);
    // Reset input so same file can be selected again
    e.target.value = "";
  }

  async function handleDelete(docId: string) {
    const supabase = createClient();
    const { error } = await supabase
      .from("documents")
      .delete()
      .eq("id", docId);

    if (!error) {
      setDocuments((prev) => prev.filter((d) => d.id !== docId));
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-screen bg-navy-950">
        <Sidebar active="Documents" />
        <main className="ml-64 flex flex-1 items-center justify-center p-8">
          <div className="flex flex-col items-center gap-4">
            <Loader2 className="h-8 w-8 animate-spin text-teal-400" />
            <p className="text-slate-400">Loading documents...</p>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-navy-950">
      <Sidebar active="Documents" />

      <main className="ml-64 flex-1 p-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-white">Documents</h1>
          <p className="mt-1 text-slate-400">
            Upload and manage your financial documents.
          </p>
        </div>

        {/* Upload Zone */}
        <div className="mb-8">
          <div className="mb-4 flex flex-wrap items-end gap-4">
            {/* Entity Selector */}
            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-400">
                Entity
              </label>
              {entities.length > 0 ? (
                <select
                  value={selectedEntity}
                  onChange={(e) => setSelectedEntity(e.target.value)}
                  className="rounded-lg border border-navy-600 bg-navy-800 px-3 py-2 text-sm text-white outline-none focus:border-teal-400/50"
                >
                  {entities.map((entity) => (
                    <option key={entity.id} value={entity.id}>
                      {entity.name}
                    </option>
                  ))}
                </select>
              ) : (
                <div className="rounded-lg border border-navy-600 bg-navy-800 px-3 py-2 text-sm text-slate-500">
                  No entities available
                </div>
              )}
            </div>

            {/* Document Type Selector */}
            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-400">
                Document Type
              </label>
              <select
                value={selectedType}
                onChange={(e) => setSelectedType(e.target.value)}
                className="rounded-lg border border-navy-600 bg-navy-800 px-3 py-2 text-sm text-white outline-none focus:border-teal-400/50"
              >
                {DOCUMENT_TYPES.map((type) => (
                  <option key={type.value} value={type.value}>
                    {type.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Drop Zone */}
          <div
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onClick={() => fileInputRef.current?.click()}
            className={`glass-card relative cursor-pointer rounded-xl border-2 border-dashed p-12 text-center transition-all ${
              dragOver
                ? "border-teal-400 bg-teal-400/5"
                : "border-navy-600 hover:border-teal-400/40"
            } ${uploading ? "pointer-events-none opacity-60" : ""}`}
          >
            <input
              ref={fileInputRef}
              type="file"
              onChange={handleFileSelect}
              className="hidden"
              accept=".pdf,.jpg,.jpeg,.png,.gif,.csv,.xlsx,.xls,.doc,.docx"
            />
            <div className="flex flex-col items-center gap-3">
              {uploading ? (
                <>
                  <Loader2 className="h-10 w-10 animate-spin text-teal-400" />
                  <p className="text-sm font-medium text-white">
                    Uploading...
                  </p>
                  <div className="mx-auto h-2 w-48 overflow-hidden rounded-full bg-navy-700">
                    <div
                      className="h-full rounded-full bg-teal-400 transition-all duration-300"
                      style={{ width: `${uploadProgress}%` }}
                    />
                  </div>
                </>
              ) : (
                <>
                  <CloudUpload
                    className={`h-10 w-10 ${
                      dragOver ? "text-teal-400" : "text-slate-500"
                    }`}
                  />
                  <div>
                    <p className="text-sm font-medium text-white">
                      Drag & drop your file here, or{" "}
                      <span className="text-teal-400">browse</span>
                    </p>
                    <p className="mt-1 text-xs text-slate-500">
                      PDF, images, CSV, Excel, Word documents supported
                    </p>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Upload Error */}
          {uploadError && (
            <div className="mt-3 flex items-center gap-2 rounded-lg bg-coral-400/10 px-4 py-3 text-sm text-coral-400">
              <X className="h-4 w-4 shrink-0" />
              <span>{uploadError}</span>
              <button
                onClick={() => setUploadError(null)}
                className="ml-auto hover:text-white"
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          )}
        </div>

        {/* Documents List */}
        <div>
          <h2 className="mb-4 text-lg font-semibold text-white">
            Your Documents
          </h2>

          {documents.length === 0 ? (
            <div className="glass-card rounded-xl px-6 py-16 text-center">
              <Upload className="mx-auto h-12 w-12 text-slate-600" />
              <p className="mt-4 text-sm font-medium text-slate-400">
                No documents yet. Upload your first document to get started.
              </p>
            </div>
          ) : (
            <div className="glass-card overflow-hidden rounded-xl">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-navy-700/50">
                    <th className="px-5 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-400">
                      File Name
                    </th>
                    <th className="px-5 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-400">
                      Type
                    </th>
                    <th className="px-5 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-400">
                      Status
                    </th>
                    <th className="px-5 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-400">
                      Size
                    </th>
                    <th className="px-5 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-400">
                      Uploaded
                    </th>
                    <th className="px-5 py-3 text-right text-xs font-medium uppercase tracking-wider text-slate-400">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-navy-700/30">
                  {documents.map((doc) => (
                    <tr
                      key={doc.id}
                      className="transition-colors hover:bg-navy-800/30"
                    >
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <FileText className="h-4 w-4 shrink-0 text-slate-500" />
                          <span className="text-sm font-medium text-white">
                            {doc.file_name}
                          </span>
                        </div>
                      </td>
                      <td className="px-5 py-4">
                        <span className="text-sm capitalize text-slate-400">
                          {doc.type?.replace("_", " ") || "Other"}
                        </span>
                      </td>
                      <td className="px-5 py-4">
                        <span
                          className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ${
                            STATUS_STYLES[doc.status] || STATUS_STYLES.uploaded
                          }`}
                        >
                          {doc.status}
                        </span>
                      </td>
                      <td className="px-5 py-4">
                        <span className="text-sm text-slate-400">
                          {formatFileSize(doc.file_size)}
                        </span>
                      </td>
                      <td className="px-5 py-4">
                        <span className="text-sm text-slate-400">
                          {formatDate(doc.created_at)}
                        </span>
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex items-center justify-end gap-1">
                          {doc.ai_analyzed_at ? (
                            <button
                              onClick={() => setSelectedDoc(doc)}
                              className="rounded-lg p-1.5 text-purple-400 transition-colors hover:bg-purple-500/10"
                              title="View AI Analysis"
                            >
                              <Eye className="h-4 w-4" />
                            </button>
                          ) : doc.status === "processing" || analyzingId === doc.id ? (
                            <span className="rounded-lg p-1.5 text-cyan-400" title="AI Processing...">
                              <Loader2 className="h-4 w-4 animate-spin" />
                            </span>
                          ) : (
                            <button
                              onClick={() => handleAnalyze(doc.id)}
                              className="rounded-lg p-1.5 text-slate-500 transition-colors hover:bg-purple-500/10 hover:text-purple-400"
                              title="Run AI Analysis"
                            >
                              <Brain className="h-4 w-4" />
                            </button>
                          )}
                          <a
                            href={doc.file_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="rounded-lg p-1.5 text-slate-500 transition-colors hover:bg-navy-700 hover:text-teal-400"
                            title="Download"
                          >
                            <Download className="h-4 w-4" />
                          </a>
                          <button
                            onClick={() => handleDelete(doc.id)}
                            className="rounded-lg p-1.5 text-slate-500 transition-colors hover:bg-navy-700 hover:text-coral-400"
                            title="Delete"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* AI Analysis Panel (slide-over) */}
        {selectedDoc && selectedDoc.ai_analysis && (
          <div className="fixed inset-0 z-50 flex justify-end">
            <div
              className="absolute inset-0 bg-black/50 backdrop-blur-sm"
              onClick={() => setSelectedDoc(null)}
            />
            <div className="relative w-full max-w-lg overflow-y-auto bg-navy-900 border-l border-navy-700/50 p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="flex items-center gap-2 text-lg font-semibold text-white">
                  <Sparkles className="h-5 w-5 text-purple-400" />
                  AI Analysis
                </h2>
                <button
                  onClick={() => setSelectedDoc(null)}
                  className="rounded-lg p-1.5 text-slate-500 hover:bg-navy-800 hover:text-white"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* Document Info */}
              <div className="glass-card rounded-xl p-4 mb-4">
                <p className="text-sm font-medium text-white">{selectedDoc.file_name}</p>
                <div className="mt-2 flex items-center gap-3 text-xs text-slate-400">
                  <span>Type: <span className="text-teal-400 capitalize">{selectedDoc.ai_analysis.documentType}</span></span>
                  <span>Confidence: <span className="text-teal-400">{Math.round((selectedDoc.ai_analysis.confidence || 0) * 100)}%</span></span>
                </div>
              </div>

              {/* Summary */}
              <div className="mb-4">
                <h3 className="text-sm font-medium text-slate-400 mb-2">Summary</h3>
                <p className="text-sm text-white leading-relaxed">{selectedDoc.ai_analysis.summary}</p>
              </div>

              {/* Key Details */}
              {(selectedDoc.ai_analysis.vendor || selectedDoc.ai_analysis.totalAmount) && (
                <div className="glass-card rounded-xl p-4 mb-4">
                  <h3 className="text-sm font-medium text-slate-400 mb-3">Extracted Details</h3>
                  <div className="space-y-2">
                    {selectedDoc.ai_analysis.vendor && (
                      <div className="flex justify-between text-sm">
                        <span className="text-slate-500">Vendor</span>
                        <span className="text-white font-medium">{selectedDoc.ai_analysis.vendor}</span>
                      </div>
                    )}
                    {selectedDoc.ai_analysis.totalAmount && (
                      <div className="flex justify-between text-sm">
                        <span className="text-slate-500">Total Amount</span>
                        <span className="text-teal-400 font-semibold">
                          ${selectedDoc.ai_analysis.totalAmount.toFixed(2)} {selectedDoc.ai_analysis.currency || "CAD"}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Extracted Transactions */}
              {selectedDoc.ai_analysis.transactions && selectedDoc.ai_analysis.transactions.length > 0 && (
                <div className="mb-4">
                  <h3 className="text-sm font-medium text-slate-400 mb-3">
                    Extracted Transactions ({selectedDoc.ai_analysis.transactions.length})
                  </h3>
                  <div className="space-y-2">
                    {selectedDoc.ai_analysis.transactions.map((t, i) => (
                      <div key={i} className="glass-card rounded-lg p-3">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium text-white">{t.description}</span>
                          <span className={`text-sm font-semibold ${t.type === "credit" ? "text-teal-400" : "text-coral-400"}`}>
                            {t.type === "credit" ? "+" : "-"}${t.amount.toFixed(2)}
                          </span>
                        </div>
                        <div className="mt-1 flex items-center gap-3 text-xs text-slate-500">
                          <span>{t.date}</span>
                          <span className="rounded bg-navy-700 px-1.5 py-0.5">{t.category}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Notes */}
              {selectedDoc.notes && (
                <div>
                  <h3 className="text-sm font-medium text-slate-400 mb-2">Notes</h3>
                  <p className="text-sm text-slate-300">{selectedDoc.notes}</p>
                </div>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

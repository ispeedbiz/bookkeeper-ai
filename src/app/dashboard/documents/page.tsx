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
} from "lucide-react";
import Sidebar from "@/components/dashboard/Sidebar";
import { createClient } from "@/lib/supabase/client";

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
                        <div className="flex items-center justify-end gap-2">
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
      </main>
    </div>
  );
}

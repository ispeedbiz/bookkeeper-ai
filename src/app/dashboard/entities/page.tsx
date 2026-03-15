"use client";

import { useEffect, useState, useCallback } from "react";
import {
  Building2,
  Plus,
  Edit3,
  Trash2,
  Loader2,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Search,
} from "lucide-react";
import Sidebar from "@/components/dashboard/Sidebar";
import { createClient } from "@/lib/supabase/client";

interface Entity {
  id: string;
  name: string;
  type: string;
  status: string;
  created_at: string;
}

export default function EntitiesPage() {
  const supabase = createClient();
  const [entities, setEntities] = useState<Entity[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newEntityName, setNewEntityName] = useState("");
  const [newEntityType, setNewEntityType] = useState("business");
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState("");
  const [toast, setToast] = useState<{ type: "success" | "error"; message: string } | null>(null);

  const showToast = (type: "success" | "error", message: string) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 4000);
  };

  const fetchEntities = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from("entities")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setEntities(data || []);
    } catch (error) {
      console.error("Error fetching entities:", error);
    } finally {
      setLoading(false);
    }
  }, [supabase]);

  useEffect(() => {
    fetchEntities();
  }, [fetchEntities]);

  const handleAddEntity = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEntityName.trim()) return;

    setSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await supabase.from("entities").insert({
        user_id: user.id,
        name: newEntityName.trim(),
        type: newEntityType,
        status: "active",
      });

      if (error) {
        if (error.message.includes("entity_limit")) {
          showToast("error", "Entity limit reached. Upgrade your plan to add more.");
        } else {
          showToast("error", error.message);
        }
      } else {
        showToast("success", "Entity added successfully!");
        setNewEntityName("");
        setShowAddModal(false);
        fetchEntities();
      }
    } catch {
      showToast("error", "Failed to add entity.");
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteEntity = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to delete "${name}"? This cannot be undone.`)) return;

    try {
      const { error } = await supabase.from("entities").delete().eq("id", id);
      if (error) throw error;
      showToast("success", `"${name}" deleted.`);
      fetchEntities();
    } catch {
      showToast("error", "Failed to delete entity.");
    }
  };

  const filtered = entities.filter((e) =>
    e.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="flex min-h-screen bg-navy-950">
      <Sidebar active="Entities" />

      <main className="ml-0 flex-1 p-4 pt-16 lg:ml-64 lg:p-8 lg:pt-8">
        {/* Toast */}
        {toast && (
          <div className={`mb-6 flex items-center gap-3 rounded-xl border px-5 py-4 ${
            toast.type === "success"
              ? "border-teal-400/30 bg-teal-500/10"
              : "border-coral-400/30 bg-coral-400/10"
          }`}>
            {toast.type === "success" ? (
              <CheckCircle className="h-5 w-5 shrink-0 text-teal-400" />
            ) : (
              <AlertTriangle className="h-5 w-5 shrink-0 text-coral-400" />
            )}
            <p className={`text-sm ${toast.type === "success" ? "text-teal-300" : "text-coral-300"}`}>
              {toast.message}
            </p>
            <button onClick={() => setToast(null)} className="ml-auto text-slate-400 hover:text-white">
              <XCircle className="h-4 w-4" />
            </button>
          </div>
        )}

        {/* Header */}
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white">
              <Building2 className="mr-2 inline h-6 w-6 text-teal-400" />
              Entities
            </h1>
            <p className="mt-1 text-slate-400">
              Manage your business entities and organizations.
            </p>
          </div>
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 rounded-xl bg-teal-500 px-5 py-2.5 text-sm font-semibold text-navy-950 transition-colors hover:bg-teal-400"
          >
            <Plus className="h-4 w-4" />
            Add Entity
          </button>
        </div>

        {/* Search */}
        <div className="mb-6">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search entities..."
              className="w-full rounded-xl border border-navy-600 bg-navy-800/50 py-2.5 pl-10 pr-4 text-white placeholder-slate-500 outline-none focus:border-teal-400/50"
            />
          </div>
        </div>

        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="glass-card animate-pulse rounded-xl p-6">
                <div className="flex items-center gap-4">
                  <div className="h-10 w-10 rounded-lg bg-navy-800" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 w-48 rounded bg-navy-800" />
                    <div className="h-3 w-32 rounded bg-navy-800" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="glass-card rounded-xl p-12 text-center">
            <Building2 className="mx-auto h-12 w-12 text-slate-600" />
            <h3 className="mt-4 text-lg font-semibold text-white">
              {search ? "No matching entities" : "No entities yet"}
            </h3>
            <p className="mt-2 text-sm text-slate-400">
              {search
                ? "Try a different search term."
                : "Add your first business entity to get started."}
            </p>
            {!search && (
              <button
                onClick={() => setShowAddModal(true)}
                className="mt-4 inline-flex items-center gap-2 rounded-xl bg-teal-500 px-5 py-2.5 text-sm font-semibold text-navy-950 hover:bg-teal-400"
              >
                <Plus className="h-4 w-4" />
                Add Your First Entity
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map((entity) => (
              <div key={entity.id} className="glass-card flex items-center justify-between rounded-xl p-5">
                <div className="flex items-center gap-4">
                  <div className="rounded-lg bg-teal-500/10 p-2.5">
                    <Building2 className="h-5 w-5 text-teal-400" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-white">{entity.name}</h3>
                    <p className="text-sm text-slate-400">
                      {entity.type} &bull; Added{" "}
                      {new Date(entity.created_at).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${
                    entity.status === "active"
                      ? "bg-teal-500/10 text-teal-400"
                      : "bg-slate-500/10 text-slate-400"
                  }`}>
                    {entity.status}
                  </span>
                  <button className="rounded-lg p-2 text-slate-500 hover:bg-navy-700 hover:text-white">
                    <Edit3 className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => handleDeleteEntity(entity.id, entity.name)}
                    className="rounded-lg p-2 text-slate-500 hover:bg-coral-400/10 hover:text-coral-400"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Add Entity Modal */}
        {showAddModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
            <div className="mx-4 w-full max-w-md rounded-2xl border border-navy-700/50 bg-navy-900 p-6 shadow-2xl">
              <h3 className="text-lg font-bold text-white">Add New Entity</h3>
              <p className="mt-1 text-sm text-slate-400">
                Create a new business entity to organize your bookkeeping.
              </p>
              <form onSubmit={handleAddEntity} className="mt-6 space-y-4">
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-slate-300">
                    Entity Name
                  </label>
                  <input
                    type="text"
                    required
                    value={newEntityName}
                    onChange={(e) => setNewEntityName(e.target.value)}
                    className="w-full rounded-lg border border-navy-600 bg-navy-800 px-4 py-2.5 text-white outline-none focus:border-teal-400/50"
                    placeholder="e.g., Acme Corp"
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-slate-300">
                    Entity Type
                  </label>
                  <select
                    value={newEntityType}
                    onChange={(e) => setNewEntityType(e.target.value)}
                    className="w-full rounded-lg border border-navy-600 bg-navy-800 px-4 py-2.5 text-white outline-none focus:border-teal-400/50"
                  >
                    <option value="business">Business</option>
                    <option value="personal">Personal</option>
                    <option value="nonprofit">Non-Profit</option>
                    <option value="trust">Trust</option>
                  </select>
                </div>
                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      setShowAddModal(false);
                      setNewEntityName("");
                    }}
                    className="flex-1 rounded-lg border border-navy-600 bg-navy-800 px-4 py-2.5 text-sm font-medium text-white hover:bg-navy-700"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={saving || !newEntityName.trim()}
                    className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-teal-500 px-4 py-2.5 text-sm font-semibold text-navy-950 hover:bg-teal-400 disabled:opacity-50"
                  >
                    {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                    Add Entity
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

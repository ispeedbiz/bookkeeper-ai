"use client";

import { useEffect, useState, useCallback } from "react";
import AdminSidebar from "@/components/admin/AdminSidebar";
import {
  Loader2,
  Search,
  ChevronDown,
  Download,
  UserX,
  X,
  AlertTriangle,
  CheckSquare,
  Square,
  MinusSquare,
} from "lucide-react";

interface UserRow {
  id: string;
  full_name: string;
  email: string;
  company_name: string | null;
  role: string;
  created_at: string;
  plan: string;
  subscription_status: string;
  entity_count: number;
}

const roleBadgeStyles: Record<string, string> = {
  client: "bg-teal-500/10 text-teal-400",
  cpa: "bg-cyan-400/10 text-cyan-400",
  admin: "bg-coral-400/10 text-coral-400",
  employee: "bg-gold-400/10 text-gold-400",
  inactive: "bg-slate-400/10 text-slate-500",
};

const validRoles = ["client", "cpa", "admin", "employee"];

function exportUsersToCSV(users: UserRow[], filename: string) {
  const headers = [
    "Name",
    "Email",
    "Company",
    "Role",
    "Plan",
    "Status",
    "Entities",
    "Joined",
  ];
  const rows = users.map((u) => [
    u.full_name || "Unnamed",
    u.email,
    u.company_name || "",
    u.role,
    u.plan,
    u.subscription_status,
    String(u.entity_count),
    new Date(u.created_at).toLocaleDateString(),
  ]);

  const csv = [headers, ...rows]
    .map((row) =>
      row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(",")
    )
    .join("\n");

  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<UserRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [updatingRole, setUpdatingRole] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [showDeactivateModal, setShowDeactivateModal] = useState(false);
  const [deactivating, setDeactivating] = useState(false);

  const loadUsers = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/users");
      if (res.ok) {
        const data = await res.json();
        setUsers(data.users || []);
      }
    } catch (err) {
      console.error("Failed to load users:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  const handleRoleChange = async (userId: string, newRole: string) => {
    setUpdatingRole(true);
    try {
      const res = await fetch("/api/admin/users", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, role: newRole }),
      });
      if (res.ok) {
        setUsers((prev) =>
          prev.map((u) => (u.id === userId ? { ...u, role: newRole } : u))
        );
      }
    } catch (err) {
      console.error("Failed to update role:", err);
    } finally {
      setUpdatingRole(false);
      setEditingUserId(null);
    }
  };

  const filteredUsers = users.filter((u) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      (u.full_name || "").toLowerCase().includes(q) ||
      (u.email || "").toLowerCase().includes(q) ||
      (u.company_name || "").toLowerCase().includes(q) ||
      u.role.toLowerCase().includes(q)
    );
  });

  // Selection handlers
  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === filteredUsers.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredUsers.map((u) => u.id)));
    }
  };

  const selectedCount = selectedIds.size;
  const allSelected = filteredUsers.length > 0 && selectedIds.size === filteredUsers.length;
  const someSelected = selectedIds.size > 0 && selectedIds.size < filteredUsers.length;

  const handleExportSelected = () => {
    const selected = users.filter((u) => selectedIds.has(u.id));
    exportUsersToCSV(selected, `users-selected-${Date.now()}.csv`);
  };

  const handleExportAll = () => {
    exportUsersToCSV(users, `users-all-${Date.now()}.csv`);
  };

  const handleDeactivateSelected = async () => {
    setDeactivating(true);
    try {
      const promises = Array.from(selectedIds).map((userId) =>
        fetch("/api/admin/users", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ userId, role: "inactive" }),
        })
      );
      await Promise.all(promises);
      setUsers((prev) =>
        prev.map((u) =>
          selectedIds.has(u.id) ? { ...u, role: "inactive" } : u
        )
      );
      setSelectedIds(new Set());
    } catch (err) {
      console.error("Failed to deactivate users:", err);
    } finally {
      setDeactivating(false);
      setShowDeactivateModal(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-navy-950">
      <AdminSidebar active="Clients" />

      {/* Deactivation Confirmation Modal */}
      {showDeactivateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="glass-card mx-4 w-full max-w-md rounded-xl p-6">
            <div className="mb-4 flex items-center gap-3">
              <div className="rounded-lg bg-coral-400/10 p-2">
                <AlertTriangle className="h-5 w-5 text-coral-400" />
              </div>
              <h3 className="text-lg font-semibold text-white">
                Confirm Deactivation
              </h3>
            </div>
            <p className="mb-2 text-sm text-slate-400">
              Are you sure you want to deactivate{" "}
              <span className="font-medium text-white">{selectedCount}</span>{" "}
              selected user{selectedCount !== 1 ? "s" : ""}?
            </p>
            <p className="mb-6 text-xs text-slate-500">
              Their role will be set to &quot;inactive&quot; and they will lose access
              to their accounts. This action can be reversed by changing their
              role back.
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowDeactivateModal(false)}
                disabled={deactivating}
                className="rounded-xl border border-navy-600 px-4 py-2 text-sm font-medium text-slate-300 transition-colors hover:border-slate-500 hover:text-white disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleDeactivateSelected}
                disabled={deactivating}
                className="flex items-center gap-2 rounded-xl bg-coral-400/10 px-4 py-2 text-sm font-medium text-coral-400 transition-colors hover:bg-coral-400/20 disabled:opacity-50"
              >
                {deactivating ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Deactivating...
                  </>
                ) : (
                  <>
                    <UserX className="h-4 w-4" />
                    Deactivate
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <main className="ml-0 flex-1 p-4 pt-16 lg:ml-64 lg:p-8 lg:pt-8">
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white">User Management</h1>
            <p className="mt-1 text-slate-400">
              Manage all users, roles, and subscriptions.
            </p>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <button
              onClick={handleExportAll}
              className="flex items-center gap-2 rounded-xl border border-navy-600 bg-navy-800/50 px-4 py-2.5 text-sm font-medium text-slate-300 transition-colors hover:border-teal-400/50 hover:text-white"
            >
              <Download className="h-4 w-4" />
              Export All
            </button>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
              <input
                type="text"
                placeholder="Search users..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full rounded-xl border border-navy-600 bg-navy-800/50 py-2.5 pl-10 pr-4 text-sm text-white placeholder-slate-500 outline-none transition-colors focus:border-teal-400/50 sm:w-72"
              />
            </div>
          </div>
        </div>

        {/* Bulk Action Bar */}
        {selectedCount > 0 && (
          <div className="mb-4 flex items-center justify-between rounded-xl border border-teal-400/20 bg-teal-500/5 px-4 py-3">
            <span className="text-sm text-teal-400">
              {selectedCount} user{selectedCount !== 1 ? "s" : ""} selected
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={handleExportSelected}
                className="flex items-center gap-1.5 rounded-lg bg-navy-800/50 px-3 py-1.5 text-xs font-medium text-slate-300 transition-colors hover:text-white"
              >
                <Download className="h-3.5 w-3.5" />
                Export Selected
              </button>
              <button
                onClick={() => setShowDeactivateModal(true)}
                className="flex items-center gap-1.5 rounded-lg bg-coral-400/10 px-3 py-1.5 text-xs font-medium text-coral-400 transition-colors hover:bg-coral-400/20"
              >
                <UserX className="h-3.5 w-3.5" />
                Deactivate Selected
              </button>
              <button
                onClick={() => setSelectedIds(new Set())}
                className="ml-1 rounded-lg p-1.5 text-slate-500 transition-colors hover:text-white"
                title="Clear selection"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        )}

        {loading ? (
          <div className="flex h-64 items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-teal-400" />
            <span className="ml-3 text-slate-400">Loading users...</span>
          </div>
        ) : (
          <div className="glass-card overflow-x-auto rounded-xl">
            <table className="w-full min-w-[800px]">
              <thead>
                <tr className="border-b border-navy-700/50">
                  <th className="px-4 py-3 text-left">
                    <button
                      onClick={toggleSelectAll}
                      className="text-slate-500 transition-colors hover:text-teal-400"
                      title={allSelected ? "Deselect all" : "Select all"}
                    >
                      {allSelected ? (
                        <CheckSquare className="h-4 w-4 text-teal-400" />
                      ) : someSelected ? (
                        <MinusSquare className="h-4 w-4 text-teal-400" />
                      ) : (
                        <Square className="h-4 w-4" />
                      )}
                    </button>
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-500">
                    Name
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-500">
                    Email
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-500">
                    Company
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-500">
                    Role
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-500">
                    Plan
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-500">
                    Status
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-500">
                    Entities
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-500">
                    Joined
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-navy-700/30">
                {filteredUsers.length === 0 ? (
                  <tr>
                    <td
                      colSpan={9}
                      className="px-4 py-12 text-center text-sm text-slate-500"
                    >
                      {searchQuery
                        ? "No users match your search."
                        : "No users found."}
                    </td>
                  </tr>
                ) : (
                  filteredUsers.map((user) => {
                    const isSelected = selectedIds.has(user.id);
                    return (
                      <tr
                        key={user.id}
                        className={`transition-colors hover:bg-navy-800/30 ${
                          isSelected ? "bg-teal-500/5" : ""
                        }`}
                      >
                        <td className="px-4 py-3">
                          <button
                            onClick={() => toggleSelect(user.id)}
                            className="text-slate-500 transition-colors hover:text-teal-400"
                          >
                            {isSelected ? (
                              <CheckSquare className="h-4 w-4 text-teal-400" />
                            ) : (
                              <Square className="h-4 w-4" />
                            )}
                          </button>
                        </td>
                        <td className="px-4 py-3 text-sm font-medium text-white">
                          {user.full_name || "Unnamed"}
                        </td>
                        <td className="px-4 py-3 text-sm text-slate-400">
                          {user.email}
                        </td>
                        <td className="px-4 py-3 text-sm text-slate-400">
                          {user.company_name || "-"}
                        </td>
                        <td className="px-4 py-3">
                          {editingUserId === user.id ? (
                            <div className="relative">
                              <select
                                defaultValue={user.role}
                                disabled={updatingRole}
                                onChange={(e) =>
                                  handleRoleChange(user.id, e.target.value)
                                }
                                onBlur={() => setEditingUserId(null)}
                                className="appearance-none rounded-lg border border-navy-600 bg-navy-800 px-3 py-1.5 text-xs text-white outline-none focus:border-teal-400/50"
                                autoFocus
                              >
                                {validRoles.map((r) => (
                                  <option key={r} value={r}>
                                    {r.charAt(0).toUpperCase() + r.slice(1)}
                                  </option>
                                ))}
                              </select>
                              <ChevronDown className="pointer-events-none absolute right-2 top-1/2 h-3 w-3 -translate-y-1/2 text-slate-500" />
                            </div>
                          ) : (
                            <button
                              onClick={() => setEditingUserId(user.id)}
                              className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${
                                roleBadgeStyles[user.role] ||
                                "bg-slate-400/10 text-slate-400"
                              }`}
                              title="Click to change role"
                            >
                              {user.role.charAt(0).toUpperCase() +
                                user.role.slice(1)}
                            </button>
                          )}
                        </td>
                        <td className="px-4 py-3 text-sm text-slate-400">
                          {user.plan}
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${
                              user.subscription_status === "active"
                                ? "bg-teal-500/10 text-teal-400"
                                : user.subscription_status === "trialing"
                                  ? "bg-cyan-400/10 text-cyan-400"
                                  : user.subscription_status === "past_due"
                                    ? "bg-coral-400/10 text-coral-400"
                                    : "bg-slate-400/10 text-slate-500"
                            }`}
                          >
                            {user.subscription_status === "none"
                              ? "Free"
                              : user.subscription_status.charAt(0).toUpperCase() +
                                user.subscription_status.slice(1)}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-sm text-slate-400">
                          {user.entity_count}
                        </td>
                        <td className="px-4 py-3 text-sm text-slate-500">
                          {new Date(user.created_at).toLocaleDateString(
                            "en-US",
                            {
                              month: "short",
                              day: "numeric",
                              year: "numeric",
                            }
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        )}
      </main>
    </div>
  );
}

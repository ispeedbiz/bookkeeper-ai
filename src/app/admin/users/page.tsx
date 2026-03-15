"use client";

import { useEffect, useState, useCallback } from "react";
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
  LogOut,
  User,
  ListTodo,
  Bell,
  Shield,
  Loader2,
  Search,
  ChevronDown,
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

const sideNavItems = [
  { label: "Dashboard", icon: LayoutDashboard, active: false, href: "/admin" },
  { label: "Work Queue", icon: ListTodo, active: false, href: "/admin" },
  { label: "Clients", icon: Users, active: true, href: "/admin/users" },
  { label: "Team", icon: Briefcase, active: false, href: "/admin" },
  { label: "Documents", icon: FileText, active: false, href: "/admin" },
  { label: "Analytics", icon: BarChart3, active: false, href: "/admin" },
  { label: "Notifications", icon: Bell, active: false, href: "/admin" },
  { label: "Security", icon: Shield, active: false, href: "/admin" },
  { label: "Settings", icon: Settings, active: false, href: "/admin" },
];

const roleBadgeStyles: Record<string, string> = {
  client: "bg-teal-500/10 text-teal-400",
  cpa: "bg-cyan-400/10 text-cyan-400",
  admin: "bg-coral-400/10 text-coral-400",
  employee: "bg-gold-400/10 text-gold-400",
};

const validRoles = ["client", "cpa", "admin", "employee"];

export default function AdminUsersPage() {
  const router = useRouter();
  const [users, setUsers] = useState<UserRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [updatingRole, setUpdatingRole] = useState(false);
  const [userProfile, setUserProfile] = useState<{
    full_name: string;
    email: string;
  } | null>(null);

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const loadUsers = useCallback(async () => {
    setLoading(true);
    try {
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
  }, [supabase]);

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

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    await supabase.auth.signOut();
    router.push("/login");
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
      <main className="ml-64 flex-1 p-8">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white">User Management</h1>
            <p className="mt-1 text-slate-400">
              Manage all users, roles, and subscriptions.
            </p>
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
            <input
              type="text"
              placeholder="Search users..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-72 rounded-xl border border-navy-600 bg-navy-800/50 py-2.5 pl-10 pr-4 text-sm text-white placeholder-slate-500 outline-none transition-colors focus:border-teal-400/50"
            />
          </div>
        </div>

        {loading ? (
          <div className="flex h-64 items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-teal-400" />
            <span className="ml-3 text-slate-400">Loading users...</span>
          </div>
        ) : (
          <div className="glass-card overflow-hidden rounded-xl">
            <table className="w-full">
              <thead>
                <tr className="border-b border-navy-700/50">
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
                      colSpan={8}
                      className="px-4 py-12 text-center text-sm text-slate-500"
                    >
                      {searchQuery
                        ? "No users match your search."
                        : "No users found."}
                    </td>
                  </tr>
                ) : (
                  filteredUsers.map((user) => (
                    <tr
                      key={user.id}
                      className="transition-colors hover:bg-navy-800/30"
                    >
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
                        {new Date(user.created_at).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </main>
    </div>
  );
}

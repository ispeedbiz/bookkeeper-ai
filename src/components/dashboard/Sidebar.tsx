"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  LayoutDashboard,
  FileText,
  CreditCard,
  Settings,
  ChevronLeft,
  ChevronRight,
  LogOut,
  User,
  Loader2,
  DollarSign,
  Menu,
  X,
  Building2,
  BarChart3,
  MessageSquare,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";

interface Entity {
  id: string;
  name: string;
}

interface UserProfile {
  full_name: string | null;
  email: string;
}

const navItems = [
  { label: "Overview", icon: LayoutDashboard, href: "/dashboard" },
  { label: "Entities", icon: Building2, href: "/dashboard/entities" },
  { label: "Documents", icon: FileText, href: "/dashboard/documents" },
  { label: "Reports", icon: BarChart3, href: "/dashboard/reports" },
  { label: "Payroll", icon: DollarSign, href: "/dashboard/payroll" },
  { label: "Messages", icon: MessageSquare, href: "/dashboard/messages" },
  { label: "Billing", icon: CreditCard, href: "/dashboard/billing" },
  { label: "Settings", icon: Settings, href: "/dashboard/settings" },
];

export default function Sidebar({ active = "Overview" }: { active?: string }) {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [entities, setEntities] = useState<Entity[]>([]);
  const [selectedEntity, setSelectedEntity] = useState<string>("");
  const [loggingOut, setLoggingOut] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const supabase = createClient();

    async function fetchUserData() {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      // Fetch profile
      const { data: profileData } = await supabase
        .from("profiles")
        .select("full_name, email")
        .eq("id", user.id)
        .single();

      if (profileData) {
        setProfile(profileData);
      } else {
        setProfile({
          full_name: user.user_metadata?.full_name || null,
          email: user.email || "",
        });
      }

      // Fetch entities
      const { data: entityData } = await supabase
        .from("entities")
        .select("id, name")
        .eq("user_id", user.id)
        .order("name");

      if (entityData && entityData.length > 0) {
        setEntities(entityData);
        setSelectedEntity(entityData[0].id);
      }
    }

    fetchUserData();
  }, []);

  async function handleLogout() {
    setLoggingOut(true);
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
  }

  return (
    <>
      {/* Mobile hamburger button */}
      <button
        onClick={() => setMobileOpen(true)}
        className="fixed left-4 top-4 z-50 rounded-lg border border-navy-700/50 bg-navy-900/90 p-2 text-slate-400 backdrop-blur-sm hover:text-white lg:hidden"
        aria-label="Open sidebar"
      >
        <Menu className="h-5 w-5" />
      </button>

      {/* Mobile overlay backdrop */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      <aside
        className={`fixed left-0 top-0 z-50 flex h-screen flex-col border-r border-navy-700/50 bg-navy-900/95 backdrop-blur-md transition-all duration-300 ${
          collapsed ? "w-16" : "w-64"
        } ${mobileOpen ? "translate-x-0" : "-translate-x-full"} lg:translate-x-0`}
      >
        {/* Logo */}
        <div className="flex h-16 items-center justify-between border-b border-navy-700/50 px-4">
          {!collapsed && (
            <Link href="/" className="text-lg font-bold text-gradient">
              BookkeeperAI
            </Link>
          )}
          <div className="flex items-center gap-1">
            <button
              onClick={() => setMobileOpen(false)}
              className="rounded-lg p-1.5 text-slate-500 hover:bg-navy-800 hover:text-white lg:hidden"
            >
              <X className="h-4 w-4" />
            </button>
            <button
              onClick={() => setCollapsed(!collapsed)}
              className="hidden rounded-lg p-1.5 text-slate-500 hover:bg-navy-800 hover:text-white lg:block"
            >
              {collapsed ? (
                <ChevronRight className="h-4 w-4" />
              ) : (
                <ChevronLeft className="h-4 w-4" />
              )}
            </button>
          </div>
        </div>

      {/* Entity Switcher */}
      {!collapsed && (
        <div className="border-b border-navy-700/50 p-4">
          {entities.length > 0 ? (
            <select
              value={selectedEntity}
              onChange={(e) => setSelectedEntity(e.target.value)}
              className="w-full rounded-lg border border-navy-600 bg-navy-800 px-3 py-2 text-sm text-white outline-none focus:border-teal-400/50"
            >
              {entities.map((entity) => (
                <option key={entity.id} value={entity.id}>
                  {entity.name}
                </option>
              ))}
            </select>
          ) : (
            <div className="rounded-lg border border-navy-600 bg-navy-800 px-3 py-2 text-sm text-slate-500">
              No entities yet
            </div>
          )}
        </div>
      )}

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto p-3">
        <ul className="space-y-1">
          {navItems.map((item) => (
            <li key={item.label}>
              <Link
                href={item.href}
                className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all ${
                  active === item.label
                    ? "bg-teal-500/10 text-teal-400"
                    : "text-slate-400 hover:bg-navy-800 hover:text-white"
                }`}
                title={collapsed ? item.label : undefined}
                onClick={() => setMobileOpen(false)}
              >
                <item.icon className="h-5 w-5 shrink-0" />
                {!collapsed && item.label}
              </Link>
            </li>
          ))}
        </ul>
      </nav>

      {/* User */}
      <div className="border-t border-navy-700/50 p-3">
        <div
          className={`flex items-center gap-3 rounded-xl px-3 py-2.5 ${
            collapsed ? "justify-center" : ""
          }`}
        >
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-teal-500/20">
            <User className="h-4 w-4 text-teal-400" />
          </div>
          {!collapsed && (
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-white">
                {profile?.full_name || profile?.email?.split("@")[0] || "User"}
              </p>
              <p className="truncate text-xs text-slate-500">
                {profile?.email || ""}
              </p>
            </div>
          )}
          {!collapsed && (
            <button
              onClick={handleLogout}
              disabled={loggingOut}
              className="text-slate-500 hover:text-coral-400 disabled:opacity-50"
              title="Sign out"
            >
              {loggingOut ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <LogOut className="h-4 w-4" />
              )}
            </button>
          )}
        </div>
      </div>
    </aside>
    </>
  );
}

"use client";

import { useEffect, useState } from "react";
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
} from "lucide-react";

const sideNavItems = [
  { label: "Dashboard", icon: LayoutDashboard, href: "/admin" },
  { label: "Work Queue", icon: ListTodo, href: "/admin/work-queue" },
  { label: "Clients", icon: Users, href: "/admin/users" },
  { label: "Team", icon: Briefcase, href: "/admin/team" },
  { label: "Documents", icon: FileText, href: "/admin/documents" },
  { label: "Analytics", icon: BarChart3, href: "/admin/analytics" },
  { label: "Notifications", icon: Bell, href: "/admin/notifications" },
  { label: "Security", icon: Shield, href: "/admin/security" },
  { label: "Settings", icon: Settings, href: "/admin/settings" },
];

export default function AdminSidebar({ active = "Dashboard" }: { active?: string }) {
  const router = useRouter();
  const [loggingOut, setLoggingOut] = useState(false);
  const [userProfile, setUserProfile] = useState<{
    full_name: string;
    email: string;
  } | null>(null);

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  useEffect(() => {
    async function fetchProfile() {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("full_name, email")
          .eq("id", user.id)
          .single();
        if (profile) setUserProfile(profile);
      }
    }
    fetchProfile();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleLogout = async () => {
    setLoggingOut(true);
    await fetch("/api/auth/logout", { method: "POST" });
    await supabase.auth.signOut();
    router.push("/login");
  };

  return (
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
                  active === item.label
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
        </div>
      </div>
    </aside>
  );
}

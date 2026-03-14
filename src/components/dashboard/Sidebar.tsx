"use client";

import { useState } from "react";
import Link from "next/link";
import {
  LayoutDashboard,
  Building2,
  FileText,
  BarChart3,
  MessageSquare,
  CheckCircle,
  CreditCard,
  Settings,
  ChevronLeft,
  ChevronRight,
  LogOut,
  User,
} from "lucide-react";

const navItems = [
  { label: "Overview", icon: LayoutDashboard, href: "/dashboard" },
  { label: "Entities", icon: Building2, href: "/dashboard" },
  { label: "Documents", icon: FileText, href: "/dashboard/documents" },
  { label: "Reports", icon: BarChart3, href: "/dashboard/reports" },
  { label: "Messages", icon: MessageSquare, href: "/dashboard/messages" },
  { label: "Reconciliation", icon: CheckCircle, href: "/dashboard" },
  { label: "Billing", icon: CreditCard, href: "/dashboard" },
  { label: "Settings", icon: Settings, href: "/dashboard" },
];

export default function Sidebar({ active = "Overview" }: { active?: string }) {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <aside
      className={`fixed left-0 top-0 z-40 flex h-screen flex-col border-r border-navy-700/50 bg-navy-900/95 backdrop-blur-md transition-all duration-300 ${
        collapsed ? "w-16" : "w-64"
      }`}
    >
      {/* Logo */}
      <div className="flex h-16 items-center justify-between border-b border-navy-700/50 px-4">
        {!collapsed && (
          <Link href="/" className="text-lg font-bold text-gradient">
            BookkeeperAI
          </Link>
        )}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="rounded-lg p-1.5 text-slate-500 hover:bg-navy-800 hover:text-white"
        >
          {collapsed ? (
            <ChevronRight className="h-4 w-4" />
          ) : (
            <ChevronLeft className="h-4 w-4" />
          )}
        </button>
      </div>

      {/* Entity Switcher */}
      {!collapsed && (
        <div className="border-b border-navy-700/50 p-4">
          <select className="w-full rounded-lg border border-navy-600 bg-navy-800 px-3 py-2 text-sm text-white outline-none focus:border-teal-400/50">
            <option>Acme Corp</option>
            <option>Beta Industries</option>
            <option>Gamma Holdings</option>
            <option>+ Add Entity</option>
          </select>
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
              <p className="truncate text-sm font-medium text-white">Demo User</p>
              <p className="truncate text-xs text-slate-500">client@demo.com</p>
            </div>
          )}
          {!collapsed && (
            <Link href="/login" className="text-slate-500 hover:text-coral-400">
              <LogOut className="h-4 w-4" />
            </Link>
          )}
        </div>
      </div>
    </aside>
  );
}

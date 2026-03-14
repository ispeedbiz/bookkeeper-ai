"use client";

import Link from "next/link";
import {
  LayoutDashboard,
  Users,
  FileText,
  BarChart3,
  Settings,
  Search,
  Filter,
  MoreVertical,
  ChevronRight,
  DollarSign,
  TrendingUp,
  CheckCircle,
  Clock,
  LogOut,
  User,
  Building2,
} from "lucide-react";

const clients = [
  { name: "Acme Corp", entities: 5, status: "Complete", updated: "2h ago", team: "Priya S.", revenue: "$895" },
  { name: "Beta Industries", entities: 3, status: "In Review", updated: "4h ago", team: "Rahul M.", revenue: "$537" },
  { name: "Gamma Holdings", entities: 8, status: "Processing", updated: "1d ago", team: "Anjali K.", revenue: "$1,432" },
  { name: "Delta Services", entities: 2, status: "Complete", updated: "2d ago", team: "Priya S.", revenue: "$358" },
  { name: "Epsilon LLC", entities: 4, status: "Pending Docs", updated: "3d ago", team: "Rahul M.", revenue: "$716" },
  { name: "Zeta Group", entities: 6, status: "Complete", updated: "1d ago", team: "Anjali K.", revenue: "$1,074" },
  { name: "Eta Corp", entities: 1, status: "In Review", updated: "5h ago", team: "Priya S.", revenue: "$179" },
  { name: "Theta Inc", entities: 3, status: "Processing", updated: "6h ago", team: "Rahul M.", revenue: "$537" },
];

const kpis = [
  { label: "Monthly Revenue", value: "$5,728", icon: DollarSign, change: "+14%" },
  { label: "Active Clients", value: "32", icon: Users, change: "+3" },
  { label: "SLA Met", value: "97.2%", icon: CheckCircle, change: "+1.2%" },
  { label: "Avg Turnaround", value: "2.4 days", icon: Clock, change: "-0.3 days" },
];

const sideNavItems = [
  { label: "Overview", icon: LayoutDashboard, active: true },
  { label: "Clients", icon: Users, active: false },
  { label: "Documents", icon: FileText, active: false },
  { label: "Analytics", icon: BarChart3, active: false },
  { label: "Team", icon: Building2, active: false },
  { label: "Settings", icon: Settings, active: false },
];

export default function CPADashboard() {
  return (
    <div className="flex min-h-screen bg-navy-950">
      {/* Sidebar */}
      <aside className="fixed left-0 top-0 z-40 flex h-screen w-64 flex-col border-r border-navy-700/50 bg-navy-900/95 backdrop-blur-md">
        <div className="flex h-16 items-center border-b border-navy-700/50 px-6">
          <Link href="/" className="text-lg font-bold text-gradient">
            BookkeeperAI
          </Link>
          <span className="ml-2 rounded bg-cyan-400/10 px-2 py-0.5 text-xs font-medium text-cyan-400">
            CPA
          </span>
        </div>
        <nav className="flex-1 overflow-y-auto p-3">
          <ul className="space-y-1">
            {sideNavItems.map((item) => (
              <li key={item.label}>
                <button
                  className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all ${
                    item.active
                      ? "bg-teal-500/10 text-teal-400"
                      : "text-slate-400 hover:bg-navy-800 hover:text-white"
                  }`}
                >
                  <item.icon className="h-5 w-5" />
                  {item.label}
                </button>
              </li>
            ))}
          </ul>
        </nav>
        <div className="border-t border-navy-700/50 p-3">
          <div className="flex items-center gap-3 px-3 py-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-cyan-400/20">
              <User className="h-4 w-4 text-cyan-400" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-white">Demo CPA Firm</p>
              <p className="truncate text-xs text-slate-500">cpa@demo.com</p>
            </div>
            <Link href="/login" className="text-slate-500 hover:text-coral-400">
              <LogOut className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="ml-64 flex-1 p-8">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white">CPA Dashboard</h1>
            <p className="mt-1 text-slate-400">
              Manage all your client entities from one place.
            </p>
          </div>
          <button className="rounded-xl bg-teal-500 px-5 py-2.5 text-sm font-semibold text-navy-950 transition-all hover:brightness-110">
            + Onboard Client
          </button>
        </div>

        {/* KPIs */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {kpis.map((kpi) => (
            <div key={kpi.label} className="glass-card rounded-xl p-5">
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-400">{kpi.label}</span>
                <div className="rounded-lg bg-teal-500/10 p-2">
                  <kpi.icon className="h-4 w-4 text-teal-400" />
                </div>
              </div>
              <div className="mt-3 flex items-baseline gap-2">
                <span className="text-2xl font-bold text-white">{kpi.value}</span>
                <span className="text-sm text-teal-400">{kpi.change}</span>
              </div>
            </div>
          ))}
        </div>

        {/* Bulk Actions + Search */}
        <div className="mt-8 flex items-center gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
            <input
              type="text"
              placeholder="Search clients..."
              className="w-full rounded-xl border border-navy-700 bg-navy-800/50 py-2.5 pl-11 pr-4 text-sm text-white placeholder-slate-500 outline-none focus:border-teal-400/50"
            />
          </div>
          <button className="flex items-center gap-2 rounded-xl border border-navy-700 px-4 py-2.5 text-sm text-slate-400 hover:border-teal-400/30 hover:text-white">
            <Filter className="h-4 w-4" />
            Filter
          </button>
          <button className="rounded-xl border border-navy-700 px-4 py-2.5 text-sm text-slate-400 hover:border-teal-400/30 hover:text-white">
            Bulk Export
          </button>
        </div>

        {/* Client Table */}
        <div className="mt-6 glass-card overflow-hidden rounded-xl">
          <table className="w-full">
            <thead>
              <tr className="border-b border-navy-700/50">
                <th className="px-5 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-500">
                  Client
                </th>
                <th className="px-5 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-500">
                  Entities
                </th>
                <th className="px-5 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-500">
                  Status
                </th>
                <th className="px-5 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-500">
                  Last Updated
                </th>
                <th className="px-5 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-500">
                  Team
                </th>
                <th className="px-5 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-500">
                  MRR
                </th>
                <th className="px-5 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-navy-700/30">
              {clients.map((client) => (
                <tr
                  key={client.name}
                  className="transition-colors hover:bg-navy-800/30"
                >
                  <td className="px-5 py-4">
                    <span className="font-medium text-white">{client.name}</span>
                  </td>
                  <td className="px-5 py-4 text-sm text-slate-400">
                    {client.entities}
                  </td>
                  <td className="px-5 py-4">
                    <span
                      className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${
                        client.status === "Complete"
                          ? "bg-teal-500/10 text-teal-400"
                          : client.status === "Processing"
                            ? "bg-cyan-400/10 text-cyan-400"
                            : client.status === "In Review"
                              ? "bg-gold-400/10 text-gold-400"
                              : "bg-coral-400/10 text-coral-400"
                      }`}
                    >
                      {client.status}
                    </span>
                  </td>
                  <td className="px-5 py-4 text-sm text-slate-400">
                    {client.updated}
                  </td>
                  <td className="px-5 py-4 text-sm text-slate-400">{client.team}</td>
                  <td className="px-5 py-4 text-sm font-medium text-teal-400">
                    {client.revenue}
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-2">
                      <button className="text-slate-500 hover:text-teal-400">
                        <ChevronRight className="h-4 w-4" />
                      </button>
                      <button className="text-slate-500 hover:text-white">
                        <MoreVertical className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Revenue Chart Placeholder */}
        <div className="mt-8 grid gap-8 lg:grid-cols-2">
          <div className="glass-card rounded-xl p-6">
            <h3 className="mb-4 text-lg font-semibold text-white">
              Revenue Trend
            </h3>
            <div className="flex h-48 items-end justify-between gap-2">
              {[65, 72, 58, 80, 95, 88, 110, 105, 120, 118, 135, 142].map(
                (v, i) => (
                  <div
                    key={i}
                    className="flex-1 rounded-t bg-gradient-to-t from-teal-500/20 to-teal-400/60"
                    style={{ height: `${(v / 142) * 100}%` }}
                  />
                )
              )}
            </div>
            <div className="mt-2 flex justify-between text-xs text-slate-500">
              <span>Jan</span>
              <span>Jun</span>
              <span>Dec</span>
            </div>
          </div>

          <div className="glass-card rounded-xl p-6">
            <h3 className="mb-4 text-lg font-semibold text-white flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-teal-400" />
              Growth Summary
            </h3>
            <div className="space-y-4">
              {[
                { label: "New Clients (This Month)", value: "3" },
                { label: "Entities Added", value: "12" },
                { label: "Revenue Growth", value: "+14%" },
                { label: "Client Retention", value: "98%" },
                { label: "Average Entities/Client", value: "4.2" },
              ].map((item) => (
                <div
                  key={item.label}
                  className="flex items-center justify-between border-b border-navy-700/30 pb-3"
                >
                  <span className="text-sm text-slate-400">{item.label}</span>
                  <span className="text-sm font-semibold text-white">
                    {item.value}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

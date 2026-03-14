"use client";

import Link from "next/link";
import {
  LayoutDashboard,
  Users,
  FileText,
  BarChart3,
  Settings,
  Briefcase,
  AlertTriangle,
  DollarSign,
  TrendingUp,
  CheckCircle,
  Clock,
  LogOut,
  User,
  ListTodo,
  Bell,
  Shield,
} from "lucide-react";

const kpis = [
  { label: "MRR", value: "CAD $347,750", icon: DollarSign, change: "+18%", color: "text-teal-400", bg: "bg-teal-500/10" },
  { label: "ARR", value: "CAD $4.17M", icon: TrendingUp, change: "+22%", color: "text-cyan-400", bg: "bg-cyan-400/10" },
  { label: "Active Clients", value: "350", icon: Users, change: "+15", color: "text-gold-400", bg: "bg-gold-400/10" },
  { label: "Churn Rate", value: "3.2%", icon: AlertTriangle, change: "-0.5%", color: "text-coral-400", bg: "bg-coral-400/10" },
  { label: "SLA Score", value: "97.8%", icon: CheckCircle, change: "+1.3%", color: "text-teal-400", bg: "bg-teal-400/10" },
  { label: "Entities Managed", value: "2,450", icon: Briefcase, change: "+180", color: "text-cyan-400", bg: "bg-cyan-400/10" },
];

const workQueue = [
  { stage: "Received", count: 34, items: ["Acme Corp - Mar", "Beta Ind. - Mar", "Delta Svc - Feb"], color: "border-gold-400" },
  { stage: "Processing", count: 22, items: ["Gamma Holdings", "Epsilon LLC", "Zeta Group"], color: "border-cyan-400" },
  { stage: "Review", count: 12, items: ["Theta Inc", "Iota Partners", "Kappa LLC"], color: "border-teal-400" },
  { stage: "Complete", count: 89, items: ["Lambda Corp", "Mu Services", "Nu Group"], color: "border-teal-500" },
];

const team = [
  { name: "Priya Sharma", tasks: 45, accuracy: "98.5%", status: "Active", load: 85 },
  { name: "Rahul Mehta", tasks: 38, accuracy: "97.2%", status: "Active", load: 72 },
  { name: "Anjali Kumar", tasks: 42, accuracy: "99.1%", status: "Active", load: 90 },
  { name: "Vikram Patel", tasks: 35, accuracy: "96.8%", status: "Break", load: 0 },
  { name: "Neha Desai", tasks: 40, accuracy: "98.0%", status: "Active", load: 78 },
];

const tickets = [
  { text: "Client Acme Corp: Missing Q4 bank statements", priority: "High", time: "1h ago" },
  { text: "SLA warning: Gamma Holdings approaching 3-day limit", priority: "Urgent", time: "30m ago" },
  { text: "New signup: Omega Enterprises (CPA, 12 entities)", priority: "Info", time: "2h ago" },
  { text: "AI categorization accuracy dropped below 95%", priority: "Medium", time: "4h ago" },
];

const sideNavItems = [
  { label: "Dashboard", icon: LayoutDashboard, active: true },
  { label: "Work Queue", icon: ListTodo, active: false },
  { label: "Clients", icon: Users, active: false },
  { label: "Team", icon: Briefcase, active: false },
  { label: "Documents", icon: FileText, active: false },
  { label: "Analytics", icon: BarChart3, active: false },
  { label: "Notifications", icon: Bell, active: false },
  { label: "Security", icon: Shield, active: false },
  { label: "Settings", icon: Settings, active: false },
];

export default function AdminDashboard() {
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
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-coral-400/20">
              <User className="h-4 w-4 text-coral-400" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-white">Admin User</p>
              <p className="truncate text-xs text-slate-500">admin@demo.com</p>
            </div>
            <Link href="/login" className="text-slate-500 hover:text-coral-400">
              <LogOut className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="ml-64 flex-1 p-8">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-white">Admin Command Center</h1>
          <p className="mt-1 text-slate-400">
            BookkeeperAI Operations Dashboard - Real-time platform metrics.
          </p>
        </div>

        {/* KPIs */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
          {kpis.map((kpi) => (
            <div key={kpi.label} className="glass-card rounded-xl p-4">
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-500">{kpi.label}</span>
                <div className={`rounded-lg p-1.5 ${kpi.bg}`}>
                  <kpi.icon className={`h-3.5 w-3.5 ${kpi.color}`} />
                </div>
              </div>
              <p className="mt-2 text-lg font-bold text-white">{kpi.value}</p>
              <p className="mt-0.5 text-xs text-teal-400">{kpi.change}</p>
            </div>
          ))}
        </div>

        {/* Work Queue Kanban */}
        <div className="mt-8">
          <h2 className="mb-4 text-lg font-semibold text-white">Work Queue</h2>
          <div className="grid gap-4 lg:grid-cols-4">
            {workQueue.map((col) => (
              <div key={col.stage} className={`glass-card rounded-xl border-t-2 ${col.color}`}>
                <div className="flex items-center justify-between px-4 pt-4">
                  <h3 className="text-sm font-semibold text-white">{col.stage}</h3>
                  <span className="rounded-full bg-navy-800 px-2.5 py-0.5 text-xs font-medium text-slate-400">
                    {col.count}
                  </span>
                </div>
                <div className="space-y-2 p-4">
                  {col.items.map((item) => (
                    <div
                      key={item}
                      className="rounded-lg border border-navy-700/50 bg-navy-800/50 px-3 py-2.5 text-sm text-slate-300 transition-colors hover:border-teal-400/20"
                    >
                      {item}
                    </div>
                  ))}
                  <button className="w-full rounded-lg border border-dashed border-navy-700 py-2 text-xs text-slate-500 hover:border-teal-400/30 hover:text-teal-400">
                    View all {col.count} items
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-8 grid gap-8 lg:grid-cols-5">
          {/* Team Performance */}
          <div className="lg:col-span-3">
            <h2 className="mb-4 text-lg font-semibold text-white">
              Team Performance (SMS360S)
            </h2>
            <div className="glass-card overflow-hidden rounded-xl">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-navy-700/50">
                    <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-500">Name</th>
                    <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-500">Tasks (MTD)</th>
                    <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-500">Accuracy</th>
                    <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-500">Status</th>
                    <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-500">Load</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-navy-700/30">
                  {team.map((member) => (
                    <tr key={member.name} className="transition-colors hover:bg-navy-800/30">
                      <td className="px-4 py-3 text-sm font-medium text-white">{member.name}</td>
                      <td className="px-4 py-3 text-sm text-slate-400">{member.tasks}</td>
                      <td className="px-4 py-3 text-sm text-teal-400">{member.accuracy}</td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${
                          member.status === "Active" ? "bg-teal-500/10 text-teal-400" : "bg-gold-400/10 text-gold-400"
                        }`}>
                          {member.status}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div className="h-1.5 w-20 rounded-full bg-navy-800">
                            <div
                              className={`h-1.5 rounded-full ${
                                member.load > 85 ? "bg-coral-400" : member.load > 60 ? "bg-gold-400" : "bg-teal-400"
                              }`}
                              style={{ width: `${member.load}%` }}
                            />
                          </div>
                          <span className="text-xs text-slate-500">{member.load}%</span>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Tickets / Alerts */}
          <div className="lg:col-span-2">
            <h2 className="mb-4 text-lg font-semibold text-white">
              Recent Alerts
            </h2>
            <div className="space-y-3">
              {tickets.map((ticket, i) => (
                <div key={i} className="glass-card rounded-xl p-4">
                  <div className="flex items-start justify-between">
                    <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                      ticket.priority === "Urgent" ? "bg-coral-400/10 text-coral-400"
                        : ticket.priority === "High" ? "bg-gold-400/10 text-gold-400"
                        : ticket.priority === "Medium" ? "bg-cyan-400/10 text-cyan-400"
                        : "bg-teal-400/10 text-teal-400"
                    }`}>
                      {ticket.priority}
                    </span>
                    <span className="text-xs text-slate-500">{ticket.time}</span>
                  </div>
                  <p className="mt-2 text-sm text-slate-300">{ticket.text}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Revenue + SLA Charts Placeholder */}
        <div className="mt-8 grid gap-8 lg:grid-cols-2">
          <div className="glass-card rounded-xl p-6">
            <h3 className="mb-4 flex items-center gap-2 text-lg font-semibold text-white">
              <DollarSign className="h-5 w-5 text-teal-400" />
              Revenue (12 Months)
            </h3>
            <div className="flex h-48 items-end justify-between gap-1">
              {[33, 55, 85, 113, 145, 175, 200, 227, 255, 290, 320, 348].map((v, i) => (
                <div
                  key={i}
                  className="flex-1 rounded-t bg-gradient-to-t from-teal-500/10 to-teal-400/50"
                  style={{ height: `${(v / 348) * 100}%` }}
                />
              ))}
            </div>
            <div className="mt-2 flex justify-between text-xs text-slate-500">
              <span>Month 1</span>
              <span>Month 6</span>
              <span>Month 12</span>
            </div>
          </div>

          <div className="glass-card rounded-xl p-6">
            <h3 className="mb-4 flex items-center gap-2 text-lg font-semibold text-white">
              <Clock className="h-5 w-5 text-teal-400" />
              SLA Performance
            </h3>
            <div className="flex h-48 items-end justify-between gap-2">
              {[95, 96, 94, 97, 98, 96, 97, 99, 97, 98, 98, 98].map((v, i) => (
                <div key={i} className="flex flex-1 flex-col items-center">
                  <div
                    className={`w-full rounded-t ${v >= 97 ? "bg-teal-400/60" : v >= 95 ? "bg-gold-400/60" : "bg-coral-400/60"}`}
                    style={{ height: `${((v - 90) / 10) * 100}%` }}
                  />
                </div>
              ))}
            </div>
            <div className="mt-2 flex justify-between text-xs text-slate-500">
              <span>Month 1</span>
              <span>Target: 97%</span>
              <span>Month 12</span>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

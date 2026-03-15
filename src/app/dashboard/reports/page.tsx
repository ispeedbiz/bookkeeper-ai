"use client";

import { useState } from "react";
import {
  BarChart3,
  Download,
  Calendar,
  FileText,
  TrendingUp,
  DollarSign,
  Clock,
} from "lucide-react";
import Sidebar from "@/components/dashboard/Sidebar";

const reportTypes = [
  {
    name: "Profit & Loss Statement",
    description: "Income and expense summary for a given period",
    icon: TrendingUp,
    color: "text-teal-400",
    bg: "bg-teal-500/10",
    available: true,
  },
  {
    name: "Balance Sheet",
    description: "Assets, liabilities, and equity snapshot",
    icon: DollarSign,
    color: "text-gold-400",
    bg: "bg-gold-400/10",
    available: true,
  },
  {
    name: "Cash Flow Statement",
    description: "Cash inflows and outflows over a period",
    icon: BarChart3,
    color: "text-cyan-400",
    bg: "bg-cyan-400/10",
    available: true,
  },
  {
    name: "Accounts Receivable Aging",
    description: "Outstanding invoices grouped by due date",
    icon: Calendar,
    color: "text-purple-400",
    bg: "bg-purple-400/10",
    available: false,
  },
  {
    name: "Accounts Payable Aging",
    description: "Outstanding bills grouped by due date",
    icon: FileText,
    color: "text-pink-400",
    bg: "bg-pink-400/10",
    available: false,
  },
  {
    name: "General Ledger",
    description: "Detailed journal entry listing",
    icon: FileText,
    color: "text-emerald-400",
    bg: "bg-emerald-400/10",
    available: false,
  },
];

export default function ReportsPage() {
  const [dateRange, setDateRange] = useState("this_month");

  return (
    <div className="flex min-h-screen bg-navy-950">
      <Sidebar active="Reports" />

      <main className="ml-0 flex-1 p-4 pt-16 lg:ml-64 lg:p-8 lg:pt-8">
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white">
              <BarChart3 className="mr-2 inline h-6 w-6 text-teal-400" />
              Reports
            </h1>
            <p className="mt-1 text-slate-400">
              Generate and download financial reports for your entities.
            </p>
          </div>
          <select
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value)}
            className="rounded-xl border border-navy-600 bg-navy-800/50 px-4 py-2.5 text-sm text-white outline-none focus:border-teal-400/50"
          >
            <option value="this_month">This Month</option>
            <option value="last_month">Last Month</option>
            <option value="this_quarter">This Quarter</option>
            <option value="this_year">This Year</option>
            <option value="custom">Custom Range</option>
          </select>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {reportTypes.map((report) => {
            const Icon = report.icon;
            return (
              <div
                key={report.name}
                className="glass-card rounded-xl p-6 transition-all hover:border-navy-600"
              >
                <div className="flex items-start justify-between">
                  <div className={`rounded-lg ${report.bg} p-2.5`}>
                    <Icon className={`h-5 w-5 ${report.color}`} />
                  </div>
                  {!report.available && (
                    <span className="flex items-center gap-1 rounded-full bg-gold-400/10 px-2.5 py-1 text-xs font-medium text-gold-400">
                      <Clock className="h-3 w-3" />
                      Coming Soon
                    </span>
                  )}
                </div>
                <h3 className="mt-4 font-semibold text-white">{report.name}</h3>
                <p className="mt-1 text-sm text-slate-400">{report.description}</p>
                <button
                  disabled={!report.available}
                  className="mt-4 flex w-full items-center justify-center gap-2 rounded-lg border border-navy-600 bg-navy-800/50 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-navy-700 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <Download className="h-4 w-4" />
                  {report.available ? "Generate Report" : "Not Available Yet"}
                </button>
              </div>
            );
          })}
        </div>

        {/* Info Banner */}
        <div className="mt-8 glass-card rounded-xl p-6">
          <div className="flex items-start gap-4">
            <div className="rounded-lg bg-teal-500/10 p-2.5">
              <BarChart3 className="h-5 w-5 text-teal-400" />
            </div>
            <div>
              <h3 className="font-semibold text-white">AI-Powered Reports</h3>
              <p className="mt-1 text-sm text-slate-400">
                Reports are generated from your uploaded documents and processed data.
                Upload more documents to get more comprehensive financial reports.
                Advanced reports like AR/AP aging and General Ledger will be available soon.
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

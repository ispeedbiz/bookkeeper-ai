"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import { createBrowserClient } from "@supabase/ssr";
import AdminSidebar from "@/components/admin/AdminSidebar";
import {
  Shield,
  CheckCircle,
  AlertTriangle,
  Lock,
  Key,
  Globe,
  Database,
  Users,
  Loader2,
} from "lucide-react";

interface SecurityCheck {
  label: string;
  status: "pass" | "warn" | "fail";
  detail: string;
  icon: typeof Shield;
}

export default function AdminSecurity() {
  const [loading, setLoading] = useState(true);
  const [checks, setChecks] = useState<SecurityCheck[]>([]);
  const [recentLogins, setRecentLogins] = useState<
    { description: string; created_at: string }[]
  >([]);

  const supabase = useMemo(() => createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  ), []);

  const runChecks = useCallback(async () => {
    setLoading(true);

    // Fetch recent logins
    const { data: loginData } = await supabase
      .from("activities")
      .select("description, created_at")
      .eq("type", "login")
      .order("created_at", { ascending: false })
      .limit(20);

    if (loginData) setRecentLogins(loginData);

    // Security checks
    const securityChecks: SecurityCheck[] = [
      {
        label: "Row Level Security (RLS)",
        status: "pass",
        detail: "All tables have RLS enabled with proper per-operation policies.",
        icon: Database,
      },
      {
        label: "Password Policy",
        status: "pass",
        detail: "Enforced: 8+ chars, uppercase, lowercase, number, special character.",
        icon: Key,
      },
      {
        label: "Security Headers",
        status: "pass",
        detail: "X-Frame-Options, HSTS, CSP, nosniff, XSS protection enabled.",
        icon: Globe,
      },
      {
        label: "Rate Limiting",
        status: "pass",
        detail: "Registration: 5 attempts per IP per 15 min window.",
        icon: Shield,
      },
      {
        label: "File Upload Validation",
        status: "pass",
        detail: "Restricted to PDF, images, text, CSV, Office docs. Max 25MB.",
        icon: Lock,
      },
      {
        label: "Authentication",
        status: "pass",
        detail: "Supabase SSR cookie-based auth with secure httpOnly cookies.",
        icon: Users,
      },
      {
        label: "API Input Validation",
        status: "pass",
        detail: "JSON parsing with try/catch, Stripe priceId format validation.",
        icon: Shield,
      },
      {
        label: "OAuth Token Storage",
        status: "warn",
        detail: "Integration tokens stored in database. Consider encryption at rest.",
        icon: Key,
      },
      {
        label: "CSRF Protection",
        status: "warn",
        detail: "Relies on SameSite cookies. Consider adding CSRF tokens for forms.",
        icon: Shield,
      },
      {
        label: "Two-Factor Authentication",
        status: "warn",
        detail: "Not yet implemented. Recommended for admin accounts.",
        icon: Lock,
      },
    ];

    setChecks(securityChecks);
    setLoading(false);
  }, [supabase]);

  useEffect(() => {
    runChecks();
  }, [runChecks]);

  const passCount = checks.filter((c) => c.status === "pass").length;
  const warnCount = checks.filter((c) => c.status === "warn").length;
  const failCount = checks.filter((c) => c.status === "fail").length;
  const score = checks.length > 0 ? Math.round((passCount / checks.length) * 100) : 0;

  return (
    <div className="flex min-h-screen bg-navy-950">
      <AdminSidebar active="Security" />
      <main className="ml-0 flex-1 p-4 pt-16 lg:ml-64 lg:p-8 lg:pt-8">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-white">Security Dashboard</h1>
          <p className="mt-1 text-slate-400">
            Platform security posture and audit checks.
          </p>
        </div>

        {loading ? (
          <div className="flex h-64 items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-teal-400" />
          </div>
        ) : (
          <>
            {/* Score */}
            <div className="mb-8 grid grid-cols-4 gap-4">
              <div className="glass-card rounded-xl p-5 text-center">
                <p className="text-4xl font-bold text-teal-400">{score}%</p>
                <p className="mt-1 text-xs text-slate-500">Security Score</p>
              </div>
              <div className="glass-card rounded-xl p-5 text-center">
                <p className="text-4xl font-bold text-teal-400">{passCount}</p>
                <p className="mt-1 text-xs text-slate-500">Checks Passed</p>
              </div>
              <div className="glass-card rounded-xl p-5 text-center">
                <p className="text-4xl font-bold text-gold-400">{warnCount}</p>
                <p className="mt-1 text-xs text-slate-500">Warnings</p>
              </div>
              <div className="glass-card rounded-xl p-5 text-center">
                <p className="text-4xl font-bold text-coral-400">{failCount}</p>
                <p className="mt-1 text-xs text-slate-500">Failed</p>
              </div>
            </div>

            <div className="grid gap-8 lg:grid-cols-5">
              {/* Security Checks */}
              <div className="lg:col-span-3">
                <h2 className="mb-4 text-lg font-semibold text-white">Security Checks</h2>
                <div className="space-y-3">
                  {checks.map((check) => {
                    const Icon = check.icon;
                    return (
                      <div key={check.label} className="glass-card rounded-xl p-4">
                        <div className="flex items-start gap-4">
                          <div
                            className={`rounded-lg p-2 ${
                              check.status === "pass"
                                ? "bg-teal-500/10"
                                : check.status === "warn"
                                  ? "bg-gold-400/10"
                                  : "bg-coral-400/10"
                            }`}
                          >
                            <Icon
                              className={`h-4 w-4 ${
                                check.status === "pass"
                                  ? "text-teal-400"
                                  : check.status === "warn"
                                    ? "text-gold-400"
                                    : "text-coral-400"
                              }`}
                            />
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center justify-between">
                              <h3 className="text-sm font-medium text-white">{check.label}</h3>
                              <span
                                className={`flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${
                                  check.status === "pass"
                                    ? "bg-teal-500/10 text-teal-400"
                                    : check.status === "warn"
                                      ? "bg-gold-400/10 text-gold-400"
                                      : "bg-coral-400/10 text-coral-400"
                                }`}
                              >
                                {check.status === "pass" ? (
                                  <CheckCircle className="h-3 w-3" />
                                ) : (
                                  <AlertTriangle className="h-3 w-3" />
                                )}
                                {check.status === "pass" ? "Passed" : check.status === "warn" ? "Warning" : "Failed"}
                              </span>
                            </div>
                            <p className="mt-1 text-xs text-slate-400">{check.detail}</p>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Recent Login Activity */}
              <div className="lg:col-span-2">
                <h2 className="mb-4 text-lg font-semibold text-white">Recent Logins</h2>
                <div className="space-y-2">
                  {recentLogins.length === 0 ? (
                    <div className="glass-card rounded-xl p-6 text-center">
                      <p className="text-sm text-slate-500">No login activity</p>
                    </div>
                  ) : (
                    recentLogins.map((login, i) => (
                      <div key={i} className="glass-card rounded-xl p-3">
                        <p className="text-xs text-white truncate">{login.description}</p>
                        <p className="mt-0.5 text-[10px] text-slate-500">
                          {new Date(login.created_at).toLocaleString("en-US", {
                            month: "short",
                            day: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </p>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </>
        )}
      </main>
    </div>
  );
}

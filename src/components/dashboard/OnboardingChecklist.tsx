"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  CheckCircle,
  Circle,
  Building2,
  FileText,
  CreditCard,
  User,
  X,
  ChevronDown,
  ChevronUp,
  Sparkles,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";

interface ChecklistItem {
  id: string;
  label: string;
  description: string;
  href: string;
  icon: typeof Building2;
  completed: boolean;
}

export default function OnboardingChecklist() {
  const [items, setItems] = useState<ChecklistItem[]>([]);
  const [dismissed, setDismissed] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const [loading, setLoading] = useState(true);

  const checkProgress = useCallback(async () => {
    const supabase = createClient();
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Check profile completeness
      const { data: profile } = await supabase
        .from("profiles")
        .select("full_name, company_name, phone")
        .eq("id", user.id)
        .single();

      const profileComplete = !!(profile?.full_name && profile?.company_name);

      // Check entities
      const { count: entityCount } = await supabase
        .from("entities")
        .select("*", { count: "exact", head: true })
        .eq("user_id", user.id);

      // Check documents
      const { count: docCount } = await supabase
        .from("documents")
        .select("*", { count: "exact", head: true })
        .eq("user_id", user.id);

      // Check subscription
      const { data: sub } = await supabase
        .from("subscriptions")
        .select("status")
        .eq("user_id", user.id)
        .single();

      const hasSubscription = sub?.status === "active" || sub?.status === "trialing";

      setItems([
        {
          id: "profile",
          label: "Complete your profile",
          description: "Add your name and company details",
          href: "/dashboard/settings",
          icon: User,
          completed: profileComplete,
        },
        {
          id: "entity",
          label: "Add a business entity",
          description: "Create your first entity to organize bookkeeping",
          href: "/dashboard/entities",
          icon: Building2,
          completed: (entityCount ?? 0) > 0,
        },
        {
          id: "document",
          label: "Upload your first document",
          description: "Upload a receipt, invoice, or bank statement",
          href: "/dashboard/documents",
          icon: FileText,
          completed: (docCount ?? 0) > 0,
        },
        {
          id: "billing",
          label: "Set up billing",
          description: "Choose a plan or continue your free trial",
          href: "/dashboard/billing",
          icon: CreditCard,
          completed: hasSubscription,
        },
      ]);
    } catch (error) {
      console.error("Onboarding check error:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // Check if dismissed in localStorage
    const wasDismissed = localStorage.getItem("onboarding-dismissed");
    if (wasDismissed) {
      setDismissed(true);
      setLoading(false);
      return;
    }
    checkProgress();
  }, [checkProgress]);

  const completedCount = items.filter((i) => i.completed).length;
  const allDone = items.length > 0 && completedCount === items.length;

  const handleDismiss = () => {
    localStorage.setItem("onboarding-dismissed", "true");
    setDismissed(true);
  };

  if (loading || dismissed || allDone) return null;

  const progress = items.length > 0 ? (completedCount / items.length) * 100 : 0;

  return (
    <div className="mb-6 glass-card rounded-xl border border-teal-400/20 p-5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="rounded-lg bg-teal-500/10 p-2">
            <Sparkles className="h-5 w-5 text-teal-400" />
          </div>
          <div>
            <h3 className="font-semibold text-white">Getting Started</h3>
            <p className="text-xs text-slate-400">
              {completedCount} of {items.length} completed
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="rounded-lg p-1.5 text-slate-400 hover:text-white"
          >
            {collapsed ? <ChevronDown className="h-4 w-4" /> : <ChevronUp className="h-4 w-4" />}
          </button>
          <button
            onClick={handleDismiss}
            className="rounded-lg p-1.5 text-slate-500 hover:text-slate-300"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Progress bar */}
      <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-navy-800">
        <div
          className="h-full rounded-full bg-teal-400 transition-all duration-500"
          style={{ width: `${progress}%` }}
        />
      </div>

      {!collapsed && (
        <div className="mt-4 space-y-2">
          {items.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.id}
                href={item.href}
                className={`flex items-center gap-3 rounded-lg p-3 transition-colors ${
                  item.completed
                    ? "opacity-60"
                    : "hover:bg-navy-800/50"
                }`}
              >
                {item.completed ? (
                  <CheckCircle className="h-5 w-5 shrink-0 text-teal-400" />
                ) : (
                  <Circle className="h-5 w-5 shrink-0 text-slate-600" />
                )}
                <div className="flex-1 min-w-0">
                  <p className={`text-sm font-medium ${
                    item.completed ? "text-slate-400 line-through" : "text-white"
                  }`}>
                    {item.label}
                  </p>
                  <p className="text-xs text-slate-500">{item.description}</p>
                </div>
                <Icon className={`h-4 w-4 shrink-0 ${
                  item.completed ? "text-slate-600" : "text-teal-400"
                }`} />
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}

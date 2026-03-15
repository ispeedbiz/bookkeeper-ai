"use client";

import { useState, useEffect, useCallback } from "react";
import {
  CreditCard,
  Crown,
  Clock,
  CheckCircle,
  AlertTriangle,
  ExternalLink,
  Zap,
  Building2,
  Loader2,
  XCircle,
} from "lucide-react";
import Sidebar from "@/components/dashboard/Sidebar";
import { createClient } from "@/lib/supabase/client";
import { CPA_PRICING, DIRECT_PRICING } from "@/lib/constants";
import { STRIPE_PLANS, formatCurrency } from "@/lib/stripe";

type SubscriptionStatus =
  | "trialing"
  | "active"
  | "past_due"
  | "cancelled"
  | "canceled"
  | "incomplete"
  | null;

interface Subscription {
  id: string;
  stripe_subscription_id: string;
  plan_type: string;
  status: SubscriptionStatus;
  stripe_price_id: string;
  current_period_start: string;
  current_period_end: string;
  trial_start: string | null;
  trial_end: string | null;
  cancel_at: string | null;
  cancelled_at: string | null;
}

interface Activity {
  id: string;
  type: string;
  description: string;
  created_at: string;
  metadata: Record<string, unknown>;
}

interface Profile {
  full_name: string;
  company_name: string;
  entity_count: number;
  entity_limit: number;
  subscription_status: string;
}

const statusConfig: Record<
  string,
  { color: string; bg: string; label: string; icon: typeof CheckCircle }
> = {
  trialing: {
    color: "text-gold-400",
    bg: "bg-gold-400/10 border-gold-400/30",
    label: "Trial",
    icon: Clock,
  },
  active: {
    color: "text-teal-400",
    bg: "bg-teal-500/10 border-teal-400/30",
    label: "Active",
    icon: CheckCircle,
  },
  past_due: {
    color: "text-coral-400",
    bg: "bg-coral-400/10 border-coral-400/30",
    label: "Past Due",
    icon: AlertTriangle,
  },
  cancelled: {
    color: "text-slate-400",
    bg: "bg-slate-500/10 border-slate-400/30",
    label: "Cancelled",
    icon: XCircle,
  },
  canceled: {
    color: "text-slate-400",
    bg: "bg-slate-500/10 border-slate-400/30",
    label: "Cancelled",
    icon: XCircle,
  },
};

function getPlanName(priceId: string): string {
  const allPlans = [
    ...Object.values(STRIPE_PLANS.cpa),
    ...Object.values(STRIPE_PLANS.direct),
  ];
  const plan = allPlans.find((p) => p.priceId === priceId);
  return plan?.name || "Unknown Plan";
}

function getTrialDaysRemaining(trialEnd: string | null): number {
  if (!trialEnd) return 0;
  const end = new Date(trialEnd);
  const now = new Date();
  const diff = end.getTime() - now.getTime();
  return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
}

export default function BillingPage() {
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [payments, setPayments] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const supabase = createClient();

  const fetchData = useCallback(async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      // Fetch profile, subscription, and payment activities in parallel
      const [profileRes, subRes, paymentsRes] = await Promise.all([
        supabase
          .from("profiles")
          .select("full_name, company_name, entity_count, entity_limit, subscription_status")
          .eq("id", user.id)
          .single(),
        supabase
          .from("subscriptions")
          .select("*")
          .eq("user_id", user.id)
          .single(),
        supabase
          .from("activities")
          .select("*")
          .eq("user_id", user.id)
          .eq("type", "payment_received")
          .order("created_at", { ascending: false })
          .limit(10),
      ]);

      if (profileRes.data) setProfile(profileRes.data);
      if (subRes.data) setSubscription(subRes.data);
      if (paymentsRes.data) setPayments(paymentsRes.data);
    } catch (error) {
      console.error("Error fetching billing data:", error);
    } finally {
      setLoading(false);
    }
  }, [supabase]);

  useEffect(() => {
    fetchData();

    // Check for success/cancelled URL params
    const params = new URLSearchParams(window.location.search);
    if (params.get("success") === "true") {
      setSuccessMessage("Subscription activated successfully! Welcome aboard.");
      window.history.replaceState({}, "", "/dashboard/billing");
    }
    if (params.get("cancelled") === "true") {
      setErrorMessage("Checkout was cancelled. No charges were made.");
      window.history.replaceState({}, "", "/dashboard/billing");
    }
  }, [fetchData]);

  const handleCheckout = async (priceId: string, planType: string) => {
    setActionLoading(priceId);
    setErrorMessage(null);
    try {
      const res = await fetch("/api/stripe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ priceId, planType }),
      });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        setErrorMessage(data.error || "Failed to start checkout");
      }
    } catch {
      setErrorMessage("Failed to connect to billing service");
    } finally {
      setActionLoading(null);
    }
  };

  const handlePortal = async () => {
    setActionLoading("portal");
    setErrorMessage(null);
    try {
      const res = await fetch("/api/stripe/portal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        setErrorMessage(data.error || "Failed to open billing portal");
      }
    } catch {
      setErrorMessage("Failed to connect to billing service");
    } finally {
      setActionLoading(null);
    }
  };

  const trialDays = subscription
    ? getTrialDaysRemaining(subscription.trial_end)
    : 0;
  const status = subscription?.status || null;
  const statusInfo = status ? statusConfig[status] : null;
  const StatusIcon = statusInfo?.icon || CreditCard;

  return (
    <div className="flex min-h-screen bg-navy-950">
      <Sidebar active="Billing" />

      <main className="ml-64 flex-1 p-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-white">Billing & Subscription</h1>
          <p className="mt-1 text-slate-400">
            Manage your plan, payment methods, and billing history.
          </p>
        </div>

        {/* Alerts */}
        {successMessage && (
          <div className="mb-6 flex items-center gap-3 rounded-xl border border-teal-400/30 bg-teal-500/10 px-5 py-4">
            <CheckCircle className="h-5 w-5 shrink-0 text-teal-400" />
            <p className="text-sm text-teal-300">{successMessage}</p>
            <button
              onClick={() => setSuccessMessage(null)}
              className="ml-auto text-teal-400 hover:text-teal-300"
            >
              <XCircle className="h-4 w-4" />
            </button>
          </div>
        )}
        {errorMessage && (
          <div className="mb-6 flex items-center gap-3 rounded-xl border border-coral-400/30 bg-coral-400/10 px-5 py-4">
            <AlertTriangle className="h-5 w-5 shrink-0 text-coral-400" />
            <p className="text-sm text-coral-300">{errorMessage}</p>
            <button
              onClick={() => setErrorMessage(null)}
              className="ml-auto text-coral-400 hover:text-coral-300"
            >
              <XCircle className="h-4 w-4" />
            </button>
          </div>
        )}

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-teal-400" />
          </div>
        ) : (
          <>
            {/* Current Plan Card */}
            <div className="mb-8 grid gap-6 lg:grid-cols-3">
              <div className="glass-card rounded-xl p-6 lg:col-span-2">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-3">
                      <Crown className="h-5 w-5 text-gold-400" />
                      <h2 className="text-lg font-semibold text-white">
                        Current Plan
                      </h2>
                    </div>
                    {subscription ? (
                      <div className="mt-4">
                        <p className="text-2xl font-bold text-white">
                          {getPlanName(subscription.stripe_price_id)}
                        </p>
                        <div className="mt-2 flex items-center gap-3">
                          {statusInfo && (
                            <span
                              className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium ${statusInfo.bg} ${statusInfo.color}`}
                            >
                              <StatusIcon className="h-3 w-3" />
                              {statusInfo.label}
                            </span>
                          )}
                          <span className="text-sm text-slate-400">
                            Renews{" "}
                            {new Date(
                              subscription.current_period_end
                            ).toLocaleDateString("en-CA", {
                              month: "long",
                              day: "numeric",
                              year: "numeric",
                            })}
                          </span>
                        </div>
                      </div>
                    ) : (
                      <div className="mt-4">
                        <p className="text-2xl font-bold text-white">
                          No Active Plan
                        </p>
                        <p className="mt-1 text-sm text-slate-400">
                          Choose a plan below to get started with BookkeeperAI.
                        </p>
                      </div>
                    )}
                  </div>
                  {subscription && (
                    <button
                      onClick={handlePortal}
                      disabled={actionLoading === "portal"}
                      className="flex items-center gap-2 rounded-lg border border-navy-600 bg-navy-800 px-4 py-2 text-sm font-medium text-white transition-colors hover:border-teal-400/30 hover:bg-navy-700 disabled:opacity-50"
                    >
                      {actionLoading === "portal" ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <ExternalLink className="h-4 w-4" />
                      )}
                      Manage Subscription
                    </button>
                  )}
                </div>

                {/* Trial Countdown */}
                {status === "trialing" && trialDays > 0 && (
                  <div className="mt-6 rounded-lg border border-gold-400/20 bg-gold-400/5 px-5 py-4">
                    <div className="flex items-center gap-3">
                      <Clock className="h-5 w-5 text-gold-400" />
                      <div>
                        <p className="font-medium text-gold-400">
                          {trialDays} day{trialDays !== 1 ? "s" : ""} remaining
                          in your trial
                        </p>
                        <p className="mt-0.5 text-sm text-slate-400">
                          Your trial ends on{" "}
                          {new Date(
                            subscription!.trial_end!
                          ).toLocaleDateString("en-CA", {
                            month: "long",
                            day: "numeric",
                            year: "numeric",
                          })}
                          . Upgrade to continue uninterrupted service.
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Entity Usage */}
              <div className="glass-card rounded-xl p-6">
                <div className="flex items-center gap-3">
                  <Building2 className="h-5 w-5 text-teal-400" />
                  <h2 className="text-lg font-semibold text-white">
                    Entity Usage
                  </h2>
                </div>
                <div className="mt-4">
                  <div className="flex items-baseline gap-1">
                    <span className="text-3xl font-bold text-white">
                      {profile?.entity_count ?? 0}
                    </span>
                    <span className="text-slate-400">
                      / {profile?.entity_limit === -1 ? "Unlimited" : (profile?.entity_limit ?? 0)}
                    </span>
                  </div>
                  <p className="mt-1 text-sm text-slate-400">entities managed</p>
                  {profile && profile.entity_limit !== -1 && profile.entity_limit > 0 && (
                    <div className="mt-4">
                      <div className="h-2 rounded-full bg-navy-800">
                        <div
                          className="h-2 rounded-full bg-gradient-to-r from-teal-400 to-cyan-400 transition-all"
                          style={{
                            width: `${Math.min(100, ((profile.entity_count ?? 0) / profile.entity_limit) * 100)}%`,
                          }}
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Plan Comparison Grid */}
            <div className="mb-8">
              <h2 className="mb-6 text-lg font-semibold text-white">
                <Zap className="mr-2 inline h-5 w-5 text-gold-400" />
                Available Plans
              </h2>

              {/* CPA Plans */}
              <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-teal-400">
                For CPA Firms
              </h3>
              <div className="mb-8 grid gap-4 lg:grid-cols-3">
                {CPA_PRICING.map((plan, i) => {
                  const planKeys = ["starter", "growth", "enterprise"] as const;
                  const stripePlan = STRIPE_PLANS.cpa[planKeys[i]];
                  const isCurrentPlan =
                    subscription?.stripe_price_id === stripePlan.priceId;

                  return (
                    <div
                      key={plan.name}
                      className={`relative rounded-xl border p-6 transition-all ${
                        plan.highlighted
                          ? "border-teal-400/40 bg-teal-500/5"
                          : "border-navy-700/50 bg-navy-900/50"
                      } ${isCurrentPlan ? "ring-2 ring-teal-400/50" : ""}`}
                    >
                      {plan.highlighted && (
                        <span className="absolute -top-3 left-4 rounded-full bg-teal-500 px-3 py-0.5 text-xs font-semibold text-navy-950">
                          Most Popular
                        </span>
                      )}
                      {isCurrentPlan && (
                        <span className="absolute -top-3 right-4 rounded-full bg-gold-400 px-3 py-0.5 text-xs font-semibold text-navy-950">
                          Current Plan
                        </span>
                      )}
                      <h4 className="text-lg font-bold text-white">
                        {plan.name}
                      </h4>
                      <div className="mt-2 flex items-baseline gap-1">
                        <span className="text-2xl font-bold text-white">
                          {plan.price}
                        </span>
                        <span className="text-sm text-slate-400">
                          {plan.period}
                        </span>
                      </div>
                      <p className="mt-1 text-sm text-slate-400">
                        {plan.entities} entities
                      </p>
                      {"bestFor" in plan && (
                        <p className="mt-1 text-xs text-teal-400/70">
                          Best for: {plan.bestFor}
                        </p>
                      )}
                      <ul className="mt-4 space-y-2">
                        {plan.features.map((feature) => (
                          <li
                            key={feature}
                            className="flex items-center gap-2 text-sm text-slate-300"
                          >
                            <CheckCircle className="h-3.5 w-3.5 shrink-0 text-teal-400" />
                            {feature}
                          </li>
                        ))}
                      </ul>
                      <button
                        onClick={() =>
                          handleCheckout(stripePlan.priceId, "cpa")
                        }
                        disabled={
                          isCurrentPlan ||
                          !stripePlan.priceId ||
                          actionLoading === stripePlan.priceId
                        }
                        className={`mt-6 w-full rounded-lg px-4 py-2.5 text-sm font-semibold transition-all ${
                          isCurrentPlan
                            ? "cursor-default border border-teal-400/30 bg-transparent text-teal-400"
                            : plan.highlighted
                              ? "bg-teal-500 text-navy-950 hover:bg-teal-400"
                              : "border border-navy-600 bg-navy-800 text-white hover:border-teal-400/30"
                        } disabled:opacity-50`}
                      >
                        {actionLoading === stripePlan.priceId ? (
                          <Loader2 className="mx-auto h-4 w-4 animate-spin" />
                        ) : isCurrentPlan ? (
                          "Current Plan"
                        ) : (
                          "Select Plan"
                        )}
                      </button>
                    </div>
                  );
                })}
              </div>

              {/* Direct Plans */}
              <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-teal-400">
                For Businesses
              </h3>
              <div className="grid gap-4 lg:grid-cols-3">
                {DIRECT_PRICING.map((plan, i) => {
                  const planKeys = [
                    "essential",
                    "professional",
                    "premium",
                  ] as const;
                  const stripePlan = STRIPE_PLANS.direct[planKeys[i]];
                  const isCurrentPlan =
                    subscription?.stripe_price_id === stripePlan.priceId;

                  return (
                    <div
                      key={plan.name}
                      className={`relative rounded-xl border p-6 transition-all ${
                        plan.highlighted
                          ? "border-teal-400/40 bg-teal-500/5"
                          : "border-navy-700/50 bg-navy-900/50"
                      } ${isCurrentPlan ? "ring-2 ring-teal-400/50" : ""}`}
                    >
                      {plan.highlighted && (
                        <span className="absolute -top-3 left-4 rounded-full bg-teal-500 px-3 py-0.5 text-xs font-semibold text-navy-950">
                          Most Popular
                        </span>
                      )}
                      {isCurrentPlan && (
                        <span className="absolute -top-3 right-4 rounded-full bg-gold-400 px-3 py-0.5 text-xs font-semibold text-navy-950">
                          Current Plan
                        </span>
                      )}
                      <h4 className="text-lg font-bold text-white">
                        {plan.name}
                      </h4>
                      <div className="mt-2 flex items-baseline gap-1">
                        <span className="text-2xl font-bold text-white">
                          {plan.price}
                        </span>
                        <span className="text-sm text-slate-400">
                          {plan.period}
                        </span>
                      </div>
                      <p className="mt-1 text-sm text-slate-400">
                        {plan.entities}
                      </p>
                      <ul className="mt-4 space-y-2">
                        {plan.features.map((feature) => (
                          <li
                            key={feature}
                            className="flex items-center gap-2 text-sm text-slate-300"
                          >
                            <CheckCircle className="h-3.5 w-3.5 shrink-0 text-teal-400" />
                            {feature}
                          </li>
                        ))}
                      </ul>
                      <button
                        onClick={() =>
                          handleCheckout(stripePlan.priceId, "direct")
                        }
                        disabled={
                          isCurrentPlan ||
                          !stripePlan.priceId ||
                          actionLoading === stripePlan.priceId
                        }
                        className={`mt-6 w-full rounded-lg px-4 py-2.5 text-sm font-semibold transition-all ${
                          isCurrentPlan
                            ? "cursor-default border border-teal-400/30 bg-transparent text-teal-400"
                            : plan.highlighted
                              ? "bg-teal-500 text-navy-950 hover:bg-teal-400"
                              : "border border-navy-600 bg-navy-800 text-white hover:border-teal-400/30"
                        } disabled:opacity-50`}
                      >
                        {actionLoading === stripePlan.priceId ? (
                          <Loader2 className="mx-auto h-4 w-4 animate-spin" />
                        ) : isCurrentPlan ? (
                          "Current Plan"
                        ) : (
                          "Select Plan"
                        )}
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Payment History */}
            <div>
              <h2 className="mb-4 text-lg font-semibold text-white">
                <CreditCard className="mr-2 inline h-5 w-5 text-teal-400" />
                Payment History
              </h2>
              <div className="glass-card rounded-xl">
                {payments.length > 0 ? (
                  <div className="divide-y divide-navy-700/30">
                    {payments.map((payment) => (
                      <div
                        key={payment.id}
                        className="flex items-center justify-between px-5 py-4"
                      >
                        <div className="flex items-center gap-3">
                          <div className="rounded-lg bg-teal-500/10 p-2">
                            <CheckCircle className="h-4 w-4 text-teal-400" />
                          </div>
                          <div>
                            <p className="text-sm font-medium text-white">
                              {payment.description}
                            </p>
                            <p className="text-xs text-slate-500">
                              {new Date(payment.created_at).toLocaleDateString(
                                "en-CA",
                                {
                                  month: "long",
                                  day: "numeric",
                                  year: "numeric",
                                }
                              )}
                            </p>
                          </div>
                        </div>
                        {payment.metadata && typeof payment.metadata === "object" && "amount" in payment.metadata && (
                          <span className="text-sm font-medium text-white">
                            {formatCurrency(
                              Number(payment.metadata.amount),
                              String((payment.metadata as Record<string, unknown>).currency || "cad")
                            )}
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="px-5 py-12 text-center">
                    <CreditCard className="mx-auto h-8 w-8 text-slate-600" />
                    <p className="mt-3 text-sm text-slate-400">
                      No payment history yet
                    </p>
                  </div>
                )}
              </div>
            </div>
          </>
        )}
      </main>
    </div>
  );
}

import { NextResponse } from "next/server";
import {
  createServerSupabaseClient,
  createServiceRoleClient,
} from "@/lib/supabase/server";

interface Subscription {
  id: string;
  user_id: string;
  plan: string;
  status: string;
  amount: number | null;
  currency: string | null;
  created_at: string;
  cancelled_at: string | null;
}

// Default plan prices (monthly in USD) used when amount is not stored
const PLAN_PRICES: Record<string, number> = {
  starter: 49,
  professional: 99,
  enterprise: 249,
  free: 0,
};

export async function GET() {
  try {
    const supabase = await createServerSupabaseClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const serviceClient = await createServiceRoleClient();

    // Check admin role
    const { data: profile } = await serviceClient
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    if (!profile || profile.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Fetch all subscriptions
    const { data: subscriptions, error: subError } = await serviceClient
      .from("subscriptions")
      .select("id, user_id, plan, status, amount, currency, created_at, cancelled_at");

    if (subError) {
      return NextResponse.json({ error: subError.message }, { status: 500 });
    }

    const allSubs = (subscriptions || []) as Subscription[];

    // Active subscriptions for MRR
    const activeSubs = allSubs.filter(
      (s) => s.status === "active" || s.status === "trialing"
    );

    // Calculate MRR
    const mrr = activeSubs.reduce((sum, sub) => {
      const amount = sub.amount ?? PLAN_PRICES[sub.plan?.toLowerCase()] ?? 0;
      return sum + amount;
    }, 0);

    // Calculate ARPU (Average Revenue Per User)
    const arpu = activeSubs.length > 0 ? mrr / activeSubs.length : 0;

    // Calculate churn rate (cancelled / total non-free subscriptions)
    const totalPaidEver = allSubs.filter(
      (s) => (s.plan?.toLowerCase() || "free") !== "free"
    );
    const cancelledSubs = allSubs.filter(
      (s) => s.status === "canceled" || s.status === "cancelled"
    );
    const churnRate =
      totalPaidEver.length > 0
        ? (cancelledSubs.length / totalPaidEver.length) * 100
        : 0;

    // Revenue breakdown by plan
    const revenueByPlan: Record<string, { count: number; revenue: number }> = {};
    for (const sub of activeSubs) {
      const plan = sub.plan || "Unknown";
      const amount = sub.amount ?? PLAN_PRICES[plan.toLowerCase()] ?? 0;
      if (!revenueByPlan[plan]) {
        revenueByPlan[plan] = { count: 0, revenue: 0 };
      }
      revenueByPlan[plan].count += 1;
      revenueByPlan[plan].revenue += amount;
    }

    // Monthly revenue trend (last 12 months based on subscription created_at)
    const monthlyRevenue: { month: string; revenue: number; subscriptions: number }[] = [];
    for (let i = 11; i >= 0; i--) {
      const date = new Date();
      date.setMonth(date.getMonth() - i);
      const monthKey = date.toLocaleString("en-US", { month: "short", year: "2-digit" });
      const monthStart = new Date(date.getFullYear(), date.getMonth(), 1);
      const monthEnd = new Date(date.getFullYear(), date.getMonth() + 1, 0, 23, 59, 59);

      // Count subscriptions active during this month
      const activeInMonth = allSubs.filter((s) => {
        const created = new Date(s.created_at);
        if (created > monthEnd) return false;
        if (s.cancelled_at && new Date(s.cancelled_at) < monthStart) return false;
        const status = s.status;
        if (status === "canceled" || status === "cancelled") {
          if (s.cancelled_at && new Date(s.cancelled_at) < monthStart) return false;
          if (!s.cancelled_at && created < monthStart) return false;
        }
        return true;
      });

      const monthRevenue = activeInMonth.reduce((sum, sub) => {
        const amount = sub.amount ?? PLAN_PRICES[sub.plan?.toLowerCase()] ?? 0;
        return sum + amount;
      }, 0);

      monthlyRevenue.push({
        month: monthKey,
        revenue: monthRevenue,
        subscriptions: activeInMonth.length,
      });
    }

    return NextResponse.json({
      mrr,
      arpu: Math.round(arpu * 100) / 100,
      churn_rate: Math.round(churnRate * 100) / 100,
      active_subscriptions: activeSubs.length,
      total_subscriptions: allSubs.length,
      cancelled_subscriptions: cancelledSubs.length,
      revenue_by_plan: revenueByPlan,
      monthly_revenue: monthlyRevenue,
    });
  } catch (err) {
    console.error("Admin revenue error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

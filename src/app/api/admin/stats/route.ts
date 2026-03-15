import { NextResponse } from "next/server";
import {
  createServerSupabaseClient,
  createServiceRoleClient,
} from "@/lib/supabase/server";

export async function GET() {
  try {
    // Verify the caller is an admin
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

    // Fetch all stats in parallel
    const [
      usersResult,
      subscriptionsResult,
      documentsResult,
      docsByStatusResult,
      recentSignupsResult,
      entitiesResult,
      aiAnalyzedResult,
      transactionsResult,
    ] = await Promise.all([
      serviceClient
        .from("profiles")
        .select("*", { count: "exact", head: true }),
      serviceClient
        .from("subscriptions")
        .select("*", { count: "exact", head: true })
        .in("status", ["active", "trialing"]),
      serviceClient
        .from("documents")
        .select("*", { count: "exact", head: true }),
      serviceClient
        .from("documents")
        .select("status"),
      serviceClient
        .from("profiles")
        .select("*", { count: "exact", head: true })
        .gte(
          "created_at",
          new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()
        ),
      serviceClient
        .from("entities")
        .select("*", { count: "exact", head: true }),
      serviceClient
        .from("documents")
        .select("*", { count: "exact", head: true })
        .not("ai_analysis", "is", null),
      serviceClient
        .from("transactions")
        .select("*", { count: "exact", head: true }),
    ]);

    // Group documents by status
    const documentsByStatus: Record<string, number> = {};
    if (docsByStatusResult.data) {
      for (const doc of docsByStatusResult.data) {
        const status = (doc as { status: string }).status || "unknown";
        documentsByStatus[status] = (documentsByStatus[status] || 0) + 1;
      }
    }

    return NextResponse.json({
      total_users: usersResult.count ?? 0,
      active_subscriptions: subscriptionsResult.count ?? 0,
      total_documents: documentsResult.count ?? 0,
      documents_by_status: documentsByStatus,
      recent_signups: recentSignupsResult.count ?? 0,
      total_entities: entitiesResult.count ?? 0,
      ai_analyzed_documents: aiAnalyzedResult.count ?? 0,
      total_transactions: transactionsResult.count ?? 0,
    });
  } catch (err) {
    console.error("Admin stats error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

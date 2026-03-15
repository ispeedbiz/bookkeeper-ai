import { NextRequest, NextResponse } from "next/server";
import {
  createServerSupabaseClient,
  createServiceRoleClient,
} from "@/lib/supabase/server";

async function verifyAdmin() {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const serviceClient = await createServiceRoleClient();
  const { data: profile } = await serviceClient
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (!profile || profile.role !== "admin") return null;

  return { user, serviceClient };
}

export async function GET() {
  try {
    const auth = await verifyAdmin();
    if (!auth) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { serviceClient } = auth;

    // Get all profiles with subscription and entity count
    const { data: profiles, error: profilesError } = await serviceClient
      .from("profiles")
      .select("*")
      .order("created_at", { ascending: false });

    if (profilesError) {
      return NextResponse.json(
        { error: profilesError.message },
        { status: 500 }
      );
    }

    // For each user, get subscription and entity count
    const usersWithDetails = await Promise.all(
      (profiles || []).map(async (profile) => {
        const [subscriptionResult, entityCountResult] = await Promise.all([
          serviceClient
            .from("subscriptions")
            .select("plan, status")
            .eq("user_id", profile.id)
            .in("status", ["active", "trialing", "past_due"])
            .order("created_at", { ascending: false })
            .limit(1)
            .maybeSingle(),
          serviceClient
            .from("entities")
            .select("id", { count: "exact", head: true })
            .eq("user_id", profile.id),
        ]);

        return {
          id: profile.id,
          full_name: profile.full_name,
          email: profile.email,
          company_name: profile.company_name,
          role: profile.role,
          created_at: profile.created_at,
          plan: subscriptionResult.data?.plan || "Free",
          subscription_status: subscriptionResult.data?.status || "none",
          entity_count: entityCountResult.count ?? 0,
        };
      })
    );

    return NextResponse.json({ users: usersWithDetails });
  } catch (err) {
    console.error("Admin users GET error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const auth = await verifyAdmin();
    if (!auth) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { serviceClient } = auth;
    const body = await request.json();
    const { userId, role } = body;

    if (!userId || !role) {
      return NextResponse.json(
        { error: "userId and role are required" },
        { status: 400 }
      );
    }

    const validRoles = ["client", "cpa", "admin", "employee"];
    if (!validRoles.includes(role)) {
      return NextResponse.json(
        { error: `Invalid role. Must be one of: ${validRoles.join(", ")}` },
        { status: 400 }
      );
    }

    const { error } = await serviceClient
      .from("profiles")
      .update({ role })
      .eq("id", userId);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, userId, role });
  } catch (err) {
    console.error("Admin users PATCH error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

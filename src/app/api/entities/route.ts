import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient, createServiceRoleClient } from "@/lib/supabase/server";

/**
 * GET /api/entities — List all entities for the authenticated user
 */
export async function GET() {
  try {
    const supabase = await createServerSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: entities, error } = await supabase
      .from("entities")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Entities fetch error:", error);
      return NextResponse.json({ error: "Failed to fetch entities" }, { status: 500 });
    }

    return NextResponse.json({ entities });
  } catch (error) {
    console.error("Entities GET error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

/**
 * POST /api/entities — Create a new entity (enforces subscription entity limit)
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    let body;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
    }

    const { name, type, industry } = body;

    if (!name || !name.trim()) {
      return NextResponse.json({ error: "Entity name is required" }, { status: 400 });
    }

    // Enforce subscription entity limit
    const serviceClient = await createServiceRoleClient();

    const [{ data: subscription }, { count: currentEntityCount }] = await Promise.all([
      serviceClient
        .from("subscriptions")
        .select("entity_limit, status")
        .eq("user_id", user.id)
        .in("status", ["active", "trialing"])
        .single(),
      supabase
        .from("entities")
        .select("id", { count: "exact", head: true })
        .eq("user_id", user.id),
    ]);

    const entityLimit = subscription?.entity_limit ?? 1;

    if ((currentEntityCount ?? 0) >= entityLimit) {
      return NextResponse.json(
        {
          error: `Entity limit reached. Your plan allows ${entityLimit} entit${entityLimit === 1 ? "y" : "ies"}. Please upgrade to add more.`,
        },
        { status: 403 }
      );
    }

    // Create entity
    const { data: entity, error } = await supabase
      .from("entities")
      .insert({
        user_id: user.id,
        name: name.trim(),
        type: type || "business",
        industry: industry || null,
        status: "onboarding",
      })
      .select()
      .single();

    if (error) {
      console.error("Entity creation error:", error);
      return NextResponse.json({ error: "Failed to create entity" }, { status: 500 });
    }

    // Log activity
    await supabase.from("activities").insert({
      user_id: user.id,
      entity_id: entity.id,
      type: "entity_created",
      description: `Created entity "${entity.name}"`,
    });

    return NextResponse.json({ entity }, { status: 201 });
  } catch (error) {
    console.error("Entities POST error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

/**
 * PATCH /api/entities — Update an existing entity
 */
export async function PATCH(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    let body;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
    }

    const { id, name, type, industry, status } = body;

    if (!id) {
      return NextResponse.json({ error: "Entity ID is required" }, { status: 400 });
    }

    // Build update object with only provided fields
    const updateData: Record<string, string> = {};
    if (name !== undefined) updateData.name = name.trim();
    if (type !== undefined) updateData.type = type;
    if (industry !== undefined) updateData.industry = industry;
    if (status !== undefined) updateData.status = status;

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json({ error: "No fields to update" }, { status: 400 });
    }

    const { data: entity, error } = await supabase
      .from("entities")
      .update(updateData)
      .eq("id", id)
      .eq("user_id", user.id)
      .select()
      .single();

    if (error || !entity) {
      return NextResponse.json({ error: "Entity not found or unauthorized" }, { status: 404 });
    }

    return NextResponse.json({ entity });
  } catch (error) {
    console.error("Entities PATCH error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

/**
 * DELETE /api/entities — Delete an entity
 */
export async function DELETE(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "Entity ID is required" }, { status: 400 });
    }

    const { error } = await supabase
      .from("entities")
      .delete()
      .eq("id", id)
      .eq("user_id", user.id);

    if (error) {
      console.error("Entity deletion error:", error);
      return NextResponse.json({ error: "Failed to delete entity" }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Entities DELETE error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

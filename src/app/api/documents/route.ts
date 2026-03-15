import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";

const DEFAULT_PAGE_SIZE = 50;
const MAX_PAGE_SIZE = 200;

export async function GET(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const entityId = searchParams.get("entityId");
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
    const limit = Math.min(
      MAX_PAGE_SIZE,
      Math.max(1, parseInt(searchParams.get("limit") || String(DEFAULT_PAGE_SIZE), 10))
    );
    const offset = (page - 1) * limit;

    if (entityId) {
      // Verify entity belongs to user
      const { data: entity } = await supabase
        .from("entities")
        .select("id")
        .eq("id", entityId)
        .eq("user_id", user.id)
        .single();

      if (!entity) {
        return NextResponse.json(
          { error: "Entity not found or unauthorized" },
          { status: 403 }
        );
      }

      const { data: documents, error, count } = await supabase
        .from("documents")
        .select("*", { count: "exact" })
        .eq("entity_id", entityId)
        .order("created_at", { ascending: false })
        .range(offset, offset + limit - 1);

      if (error) {
        console.error("Documents query error:", error);
        return NextResponse.json(
          { error: "Failed to fetch documents" },
          { status: 500 }
        );
      }

      return NextResponse.json({
        documents,
        pagination: { page, limit, total: count ?? 0, totalPages: Math.ceil((count ?? 0) / limit) },
      });
    }

    // Fetch all documents for user's entities
    const { data: entities } = await supabase
      .from("entities")
      .select("id")
      .eq("user_id", user.id);

    const entityIds = entities?.map((e) => e.id) || [];

    if (entityIds.length === 0) {
      return NextResponse.json({
        documents: [],
        pagination: { page: 1, limit, total: 0, totalPages: 0 },
      });
    }

    const { data: documents, error, count } = await supabase
      .from("documents")
      .select("*", { count: "exact" })
      .in("entity_id", entityIds)
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      console.error("Documents query error:", error);
      return NextResponse.json(
        { error: "Failed to fetch documents" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      documents,
      pagination: { page, limit, total: count ?? 0, totalPages: Math.ceil((count ?? 0) / limit) },
    });
  } catch (error) {
    console.error("Documents API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";

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

      const { data: documents, error } = await supabase
        .from("documents")
        .select("*")
        .eq("entity_id", entityId)
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Documents query error:", error);
        return NextResponse.json(
          { error: "Failed to fetch documents" },
          { status: 500 }
        );
      }

      return NextResponse.json({ documents });
    }

    // Fetch all documents for user's entities
    const { data: entities } = await supabase
      .from("entities")
      .select("id")
      .eq("user_id", user.id);

    const entityIds = entities?.map((e) => e.id) || [];

    if (entityIds.length === 0) {
      return NextResponse.json({ documents: [] });
    }

    const { data: documents, error } = await supabase
      .from("documents")
      .select("*")
      .in("entity_id", entityIds)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Documents query error:", error);
      return NextResponse.json(
        { error: "Failed to fetch documents" },
        { status: 500 }
      );
    }

    return NextResponse.json({ documents });
  } catch (error) {
    console.error("Documents API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

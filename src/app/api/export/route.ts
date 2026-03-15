import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";

type ExportEntity = "documents" | "activities";

const VALID_EXPORT_TYPES = ["csv", "json"] as const;
const VALID_ENTITIES: ExportEntity[] = ["documents", "activities"];

function escapeCsvValue(value: unknown): string {
  if (value === null || value === undefined) return "";
  const str = String(value);
  if (str.includes(",") || str.includes('"') || str.includes("\n")) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

function toCsv(rows: Record<string, unknown>[]): string {
  if (rows.length === 0) return "";

  const headers = Object.keys(rows[0]);
  const headerLine = headers.map(escapeCsvValue).join(",");

  const dataLines = rows.map((row) =>
    headers.map((h) => escapeCsvValue(row[h])).join(",")
  );

  return [headerLine, ...dataLines].join("\n");
}

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
    const type = searchParams.get("type") as "csv" | "json" | null;
    const entityId = searchParams.get("entityId");
    const exportEntity = (searchParams.get("entity") || "documents") as string;
    const dateFrom = searchParams.get("dateFrom");
    const dateTo = searchParams.get("dateTo");

    // Validate export type
    if (!type || !VALID_EXPORT_TYPES.includes(type)) {
      return NextResponse.json(
        {
          error: `Invalid export type. Must be one of: ${VALID_EXPORT_TYPES.join(", ")}`,
        },
        { status: 400 }
      );
    }

    // Validate export entity
    if (!VALID_ENTITIES.includes(exportEntity as ExportEntity)) {
      return NextResponse.json(
        {
          error: `Invalid entity. Must be one of: ${VALID_ENTITIES.join(", ")}`,
        },
        { status: 400 }
      );
    }

    if (!entityId) {
      return NextResponse.json(
        { error: "entityId is required" },
        { status: 400 }
      );
    }

    // Verify entity belongs to user
    const { data: entity } = await supabase
      .from("entities")
      .select("id, name")
      .eq("id", entityId)
      .eq("user_id", user.id)
      .single();

    if (!entity) {
      return NextResponse.json(
        { error: "Entity not found or unauthorized" },
        { status: 403 }
      );
    }

    let rows: Record<string, unknown>[] = [];

    if (exportEntity === "documents") {
      let query = supabase
        .from("documents")
        .select(
          "id, file_name, mime_type, file_size, type, status, ai_summary, created_at, updated_at"
        )
        .eq("entity_id", entityId)
        .order("created_at", { ascending: false });

      if (dateFrom) {
        query = query.gte("created_at", dateFrom);
      }
      if (dateTo) {
        query = query.lte("created_at", dateTo);
      }

      const { data, error } = await query;

      if (error) {
        console.error("Documents export error:", error);
        return NextResponse.json(
          { error: "Failed to fetch documents" },
          { status: 500 }
        );
      }

      rows = (data || []).map((doc) => ({
        id: doc.id,
        file_name: doc.file_name,
        mime_type: doc.mime_type,
        file_size_bytes: doc.file_size,
        document_type: doc.type,
        status: doc.status,
        ai_summary: doc.ai_summary,
        created_at: doc.created_at,
        updated_at: doc.updated_at,
      }));
    } else if (exportEntity === "activities") {
      let query = supabase
        .from("activities")
        .select("id, type, description, metadata, created_at")
        .eq("entity_id", entityId)
        .order("created_at", { ascending: false });

      if (dateFrom) {
        query = query.gte("created_at", dateFrom);
      }
      if (dateTo) {
        query = query.lte("created_at", dateTo);
      }

      const { data, error } = await query;

      if (error) {
        console.error("Activities export error:", error);
        return NextResponse.json(
          { error: "Failed to fetch activities" },
          { status: 500 }
        );
      }

      rows = (data || []).map((act) => ({
        id: act.id,
        type: act.type,
        description: act.description,
        metadata: act.metadata ? JSON.stringify(act.metadata) : "",
        created_at: act.created_at,
      }));
    }

    // Log export activity
    await supabase.from("activities").insert({
      user_id: user.id,
      entity_id: entityId,
      type: "data_exported",
      description: `Exported ${exportEntity} as ${type.toUpperCase()} for ${entity.name}`,
      metadata: {
        export_type: type,
        export_entity: exportEntity,
        row_count: rows.length,
        date_from: dateFrom,
        date_to: dateTo,
      },
    });

    if (type === "json") {
      return NextResponse.json({
        entity: { id: entity.id, name: entity.name },
        exportedAt: new Date().toISOString(),
        rowCount: rows.length,
        data: rows,
      });
    }

    // CSV response
    const csv = toCsv(rows);
    const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
    const filename = `${entity.name.replace(/[^a-zA-Z0-9]/g, "_")}_${exportEntity}_${timestamp}.csv`;

    return new NextResponse(csv, {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    });
  } catch (error) {
    console.error("Export error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

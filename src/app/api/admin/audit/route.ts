import { NextRequest, NextResponse } from "next/server";
import {
  createServerSupabaseClient,
  createServiceRoleClient,
} from "@/lib/supabase/server";

const DEFAULT_PAGE_SIZE = 50;
const MAX_PAGE_SIZE = 200;

type AuditActionType =
  | "document_uploaded"
  | "document_status_changed"
  | "role_changed"
  | "login"
  | "logout"
  | "data_exported"
  | "entity_created"
  | "entity_updated"
  | "entity_deleted";

const VALID_ACTION_TYPES: AuditActionType[] = [
  "document_uploaded",
  "document_status_changed",
  "role_changed",
  "login",
  "logout",
  "data_exported",
  "entity_created",
  "entity_updated",
  "entity_deleted",
];

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

export async function GET(request: NextRequest) {
  try {
    const auth = await verifyAdmin();
    if (!auth) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { serviceClient } = auth;
    const { searchParams } = new URL(request.url);

    // Parse query params
    const userId = searchParams.get("userId");
    const actionType = searchParams.get("actionType");
    const dateFrom = searchParams.get("dateFrom");
    const dateTo = searchParams.get("dateTo");
    const entityId = searchParams.get("entityId");
    const page = Math.max(
      1,
      parseInt(searchParams.get("page") || "1", 10)
    );
    const limit = Math.min(
      MAX_PAGE_SIZE,
      Math.max(1, parseInt(searchParams.get("limit") || String(DEFAULT_PAGE_SIZE), 10))
    );
    const offset = (page - 1) * limit;

    // Validate action type if provided
    if (actionType && !VALID_ACTION_TYPES.includes(actionType as AuditActionType)) {
      return NextResponse.json(
        {
          error: `Invalid action type. Must be one of: ${VALID_ACTION_TYPES.join(", ")}`,
        },
        { status: 400 }
      );
    }

    // Build query
    let query = serviceClient
      .from("activities")
      .select("id, user_id, entity_id, type, description, metadata, created_at", {
        count: "exact",
      })
      .order("created_at", { ascending: false });

    if (userId) {
      query = query.eq("user_id", userId);
    }

    if (actionType) {
      query = query.eq("type", actionType);
    }

    if (entityId) {
      query = query.eq("entity_id", entityId);
    }

    if (dateFrom) {
      query = query.gte("created_at", dateFrom);
    }

    if (dateTo) {
      query = query.lte("created_at", dateTo);
    }

    query = query.range(offset, offset + limit - 1);

    const { data: activities, error, count } = await query;

    if (error) {
      console.error("Audit log query error:", error);
      return NextResponse.json(
        { error: "Failed to fetch audit log" },
        { status: 500 }
      );
    }

    // Enrich with user and entity names
    const userIds = [
      ...new Set((activities || []).map((a) => a.user_id).filter(Boolean)),
    ];
    const entityIds = [
      ...new Set((activities || []).map((a) => a.entity_id).filter(Boolean)),
    ];

    // Fetch user profiles and entities in parallel
    const [profilesResult, entitiesResult] = await Promise.all([
      userIds.length > 0
        ? serviceClient
            .from("profiles")
            .select("id, full_name, email")
            .in("id", userIds)
        : Promise.resolve({ data: [] }),
      entityIds.length > 0
        ? serviceClient
            .from("entities")
            .select("id, name")
            .in("id", entityIds)
        : Promise.resolve({ data: [] }),
    ]);

    const profileMap = new Map(
      (profilesResult.data || []).map((p) => [
        p.id,
        { full_name: p.full_name, email: p.email },
      ])
    );
    const entityMap = new Map(
      (entitiesResult.data || []).map((e) => [e.id, e.name])
    );

    const enrichedActivities = (activities || []).map((activity) => ({
      id: activity.id,
      user_id: activity.user_id,
      user_name: profileMap.get(activity.user_id)?.full_name || null,
      user_email: profileMap.get(activity.user_id)?.email || null,
      entity_id: activity.entity_id,
      entity_name: entityMap.get(activity.entity_id) || null,
      action_type: activity.type,
      description: activity.description,
      metadata: activity.metadata,
      created_at: activity.created_at,
    }));

    const totalCount = count ?? 0;

    return NextResponse.json({
      audit_log: enrichedActivities,
      pagination: {
        page,
        limit,
        total: totalCount,
        totalPages: Math.ceil(totalCount / limit),
      },
      filters: {
        userId: userId || null,
        actionType: actionType || null,
        entityId: entityId || null,
        dateFrom: dateFrom || null,
        dateTo: dateTo || null,
      },
    });
  } catch (error) {
    console.error("Audit log error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

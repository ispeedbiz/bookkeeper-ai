import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";

/**
 * GET /api/payroll — List employees for an entity
 * Query params: entityId (required)
 */
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

    if (!entityId) {
      return NextResponse.json(
        { error: "entityId query parameter is required" },
        { status: 400 }
      );
    }

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
        { status: 404 }
      );
    }

    const { data: employees, error } = await supabase
      .from("employees")
      .select("*")
      .eq("entity_id", entityId)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Employees fetch error:", error);
      return NextResponse.json(
        { error: "Failed to fetch employees" },
        { status: 500 }
      );
    }

    return NextResponse.json({ employees: employees || [] });
  } catch (error) {
    console.error("Payroll GET error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/payroll — Create an employee record
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    let body;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { error: "Invalid request body" },
        { status: 400 }
      );
    }

    const {
      entity_id,
      name,
      email,
      position,
      sin_last4,
      pay_rate,
      pay_type,
      pay_frequency,
    } = body;

    if (!entity_id || !name?.trim()) {
      return NextResponse.json(
        { error: "entity_id and name are required" },
        { status: 400 }
      );
    }

    // Verify entity belongs to user
    const { data: entity } = await supabase
      .from("entities")
      .select("id")
      .eq("id", entity_id)
      .eq("user_id", user.id)
      .single();

    if (!entity) {
      return NextResponse.json(
        { error: "Entity not found or unauthorized" },
        { status: 404 }
      );
    }

    const { data: employee, error } = await supabase
      .from("employees")
      .insert({
        entity_id,
        user_id: user.id,
        name: name.trim(),
        email: email?.trim() || null,
        position: position?.trim() || null,
        sin_last4: sin_last4 || null,
        pay_rate: parseFloat(pay_rate) || 0,
        pay_type: pay_type || "salary",
        pay_frequency: pay_frequency || "biweekly",
        status: "active",
      })
      .select()
      .single();

    if (error) {
      console.error("Employee creation error:", error);
      return NextResponse.json(
        { error: "Failed to create employee" },
        { status: 500 }
      );
    }

    // Log activity
    await supabase.from("activities").insert({
      user_id: user.id,
      entity_id,
      type: "employee_added",
      description: `Added employee "${name.trim()}"`,
    });

    return NextResponse.json({ employee }, { status: 201 });
  } catch (error) {
    console.error("Payroll POST error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/payroll — Update an employee record
 */
export async function PATCH(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    let body;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { error: "Invalid request body" },
        { status: 400 }
      );
    }

    const { id, ...updates } = body;

    if (!id) {
      return NextResponse.json(
        { error: "Employee ID is required" },
        { status: 400 }
      );
    }

    // Build update object with only provided fields
    const allowedFields = [
      "name",
      "email",
      "position",
      "sin_last4",
      "pay_rate",
      "pay_type",
      "pay_frequency",
      "status",
    ];

    const updateData: Record<string, string | number | null> = {};
    for (const field of allowedFields) {
      if (updates[field] !== undefined) {
        if (field === "pay_rate") {
          updateData[field] = parseFloat(updates[field]) || 0;
        } else if (typeof updates[field] === "string") {
          updateData[field] = updates[field].trim();
        } else {
          updateData[field] = updates[field];
        }
      }
    }

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json(
        { error: "No fields to update" },
        { status: 400 }
      );
    }

    // Verify employee belongs to user via entity ownership
    const { data: employee, error } = await supabase
      .from("employees")
      .update(updateData)
      .eq("id", id)
      .eq("user_id", user.id)
      .select()
      .single();

    if (error || !employee) {
      return NextResponse.json(
        { error: "Employee not found or unauthorized" },
        { status: 404 }
      );
    }

    return NextResponse.json({ employee });
  } catch (error) {
    console.error("Payroll PATCH error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/payroll — Remove an employee record
 */
export async function DELETE(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { error: "Employee ID is required" },
        { status: 400 }
      );
    }

    // Verify ownership and delete
    const { data: employee } = await supabase
      .from("employees")
      .select("name, entity_id")
      .eq("id", id)
      .eq("user_id", user.id)
      .single();

    if (!employee) {
      return NextResponse.json(
        { error: "Employee not found or unauthorized" },
        { status: 404 }
      );
    }

    const { error } = await supabase
      .from("employees")
      .delete()
      .eq("id", id)
      .eq("user_id", user.id);

    if (error) {
      console.error("Employee deletion error:", error);
      return NextResponse.json(
        { error: "Failed to delete employee" },
        { status: 500 }
      );
    }

    // Log activity
    await supabase.from("activities").insert({
      user_id: user.id,
      entity_id: employee.entity_id,
      type: "employee_removed",
      description: `Removed employee "${employee.name}"`,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Payroll DELETE error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

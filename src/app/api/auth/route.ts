import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";

/**
 * GET /api/auth — Profile lookup helper.
 * Returns the current user's profile (role, name, etc.)
 * Used by client-side code after sign-in to determine the redirect target.
 */
export async function GET() {
  try {
    const supabase = await createServerSupabaseClient();

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json(
        { error: "Not authenticated" },
        { status: 401 }
      );
    }

    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("id, email, full_name, role, company_name, avatar_url, onboarding_completed")
      .eq("id", user.id)
      .single();

    if (profileError || !profile) {
      return NextResponse.json(
        { error: "Profile not found" },
        { status: 404 }
      );
    }

    const redirectTo =
      profile.role === "admin"
        ? "/admin"
        : profile.role === "cpa"
          ? "/cpa"
          : "/dashboard";

    return NextResponse.json({
      user: {
        id: profile.id,
        email: profile.email,
        name: profile.full_name,
        role: profile.role,
        companyName: profile.company_name,
        avatarUrl: profile.avatar_url,
        onboardingCompleted: profile.onboarding_completed,
      },
      redirectTo,
    });
  } catch {
    return NextResponse.json(
      { error: "Authentication check failed" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/auth — Sign out helper.
 * Signs out the current user server-side.
 */
export async function POST(request: Request) {
  try {
    const { action } = await request.json();

    if (action === "signout") {
      const supabase = await createServerSupabaseClient();
      await supabase.auth.signOut();
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch {
    return NextResponse.json(
      { error: "Request failed" },
      { status: 500 }
    );
  }
}

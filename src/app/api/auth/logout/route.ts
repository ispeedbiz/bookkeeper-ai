import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export async function POST() {
  try {
    const supabase = await createServerSupabaseClient();
    await supabase.auth.signOut();

    const response = NextResponse.json({ success: true }, { status: 200 });

    // Clear cookies individually — comma-separated Set-Cookie headers don't work
    response.cookies.set("sb-access-token", "", {
      path: "/",
      httpOnly: true,
      sameSite: "lax",
      maxAge: 0,
    });
    response.cookies.set("sb-refresh-token", "", {
      path: "/",
      httpOnly: true,
      sameSite: "lax",
      maxAge: 0,
    });

    return response;
  } catch (err) {
    console.error("Logout error:", err);
    return NextResponse.json(
      { error: "Failed to sign out" },
      { status: 500 }
    );
  }
}

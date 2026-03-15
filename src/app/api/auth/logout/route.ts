import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export async function POST() {
  try {
    const supabase = await createServerSupabaseClient();
    await supabase.auth.signOut();

    return NextResponse.json(
      { success: true },
      {
        status: 200,
        headers: {
          "Set-Cookie": [
            "sb-access-token=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0",
            "sb-refresh-token=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0",
          ].join(", "),
        },
      }
    );
  } catch (err) {
    console.error("Logout error:", err);
    return NextResponse.json(
      { error: "Failed to sign out" },
      { status: 500 }
    );
  }
}

import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { createServiceRoleClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const tokenHash = searchParams.get("token_hash");
  const type = searchParams.get("type");
  const origin = new URL(request.url).origin;

  if (!tokenHash || !type) {
    return NextResponse.redirect(
      `${origin}/verify-email?error=verification_failed`
    );
  }

  try {
    const supabase = await createServerSupabaseClient();

    const { data, error } = await supabase.auth.verifyOtp({
      token_hash: tokenHash,
      type: type as "email",
    });

    if (error || !data.user) {
      console.error("Email verification error:", error?.message);
      return NextResponse.redirect(
        `${origin}/verify-email?error=verification_failed`
      );
    }

    // Log successful verification
    try {
      const serviceClient = await createServiceRoleClient();
      const userId = data.user.id;

      // Get the user's entity for the activity log
      const { data: entity } = await serviceClient
        .from("entities")
        .select("id")
        .eq("user_id", userId)
        .limit(1)
        .single();

      await serviceClient.from("activities").insert({
        user_id: userId,
        entity_id: entity?.id || null,
        type: "email_verified",
        description: `Email verified for ${data.user.email}.`,
      });
    } catch (logError) {
      console.error("Activity log error during verification:", logError);
    }

    return NextResponse.redirect(`${origin}/dashboard?verified=true`);
  } catch (error) {
    console.error("Verification route error:", error);
    return NextResponse.redirect(
      `${origin}/verify-email?error=verification_failed`
    );
  }
}

import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient, createServiceRoleClient } from "@/lib/supabase/server";
import { exchangeCodeForTokens as exchangeQBO } from "@/lib/integrations/quickbooks";
import { exchangeCodeForTokens as exchangeXero } from "@/lib/integrations/xero";
import { exchangeCodeForTokens as exchangeZoho } from "@/lib/integrations/zoho";

/**
 * Validate that a redirect URL is safe (same-origin only).
 * Prevents open redirect attacks by ensuring the URL starts with the app origin.
 */
function isSafeRedirect(url: string, origin: string): boolean {
  try {
    const parsed = new URL(url);
    const originParsed = new URL(origin);
    return parsed.origin === originParsed.origin;
  } catch {
    return false;
  }
}

/**
 * Build a safe redirect URL. Falls back to /dashboard/settings if the URL is not same-origin.
 */
function safeRedirectUrl(path: string, request: NextRequest): URL {
  const target = new URL(path, request.url);
  const origin = request.nextUrl.origin;
  if (isSafeRedirect(target.toString(), origin)) {
    return target;
  }
  return new URL("/dashboard/settings", request.url);
}

/**
 * GET /api/integrations/callback?code=...&state=...&realmId=...
 * Handles OAuth callback from accounting software providers.
 * Stores tokens securely and updates entity integration status.
 */
export async function GET(request: NextRequest) {
  try {
    const code = request.nextUrl.searchParams.get("code");
    const stateParam = request.nextUrl.searchParams.get("state");
    const realmId = request.nextUrl.searchParams.get("realmId"); // QuickBooks specific

    if (!code || !stateParam) {
      return NextResponse.redirect(
        safeRedirectUrl("/dashboard/settings?error=missing_params", request)
      );
    }

    // Decode state
    let state: { userId: string; entityId: string; provider: string; nonce: string };
    try {
      state = JSON.parse(Buffer.from(stateParam, "base64url").toString());
    } catch {
      return NextResponse.redirect(
        safeRedirectUrl("/dashboard/settings?error=invalid_state", request)
      );
    }

    // CSRF protection: Verify nonce from state matches the one stored in cookie
    const storedNonce = request.cookies.get("oauth_nonce")?.value;
    if (!state.nonce || !storedNonce || state.nonce !== storedNonce) {
      console.error("OAuth CSRF: nonce mismatch");
      return NextResponse.redirect(
        safeRedirectUrl("/dashboard/settings?error=csrf_failed", request)
      );
    }

    // CSRF protection: Verify the user in the state matches the authenticated user
    const supabase = await createServerSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user || user.id !== state.userId) {
      console.error("OAuth CSRF: state userId does not match authenticated user");
      return NextResponse.redirect(
        safeRedirectUrl("/dashboard/settings?error=auth_mismatch", request)
      );
    }

    // Verify entity belongs to user
    const { data: entity } = await supabase
      .from("entities")
      .select("id")
      .eq("id", state.entityId)
      .eq("user_id", user.id)
      .single();

    if (!entity) {
      return NextResponse.redirect(
        safeRedirectUrl("/dashboard/settings?error=invalid_entity", request)
      );
    }

    const serviceClient = await createServiceRoleClient();

    let tokens: { access_token: string; refresh_token: string; expires_in: number };

    switch (state.provider) {
      case "quickbooks":
        tokens = await exchangeQBO(code);
        break;
      case "xero":
        tokens = await exchangeXero(code);
        break;
      case "zoho":
        tokens = await exchangeZoho(code);
        break;
      default:
        return NextResponse.redirect(
          safeRedirectUrl("/dashboard/settings?error=unknown_provider", request)
        );
    }

    // Store integration credentials
    await serviceClient.from("integrations").upsert({
      entity_id: state.entityId,
      user_id: state.userId,
      provider: state.provider,
      access_token: tokens.access_token,
      refresh_token: tokens.refresh_token,
      token_expires_at: new Date(Date.now() + tokens.expires_in * 1000).toISOString(),
      realm_id: realmId || null,
      status: "connected",
      connected_at: new Date().toISOString(),
    }, {
      onConflict: "entity_id,provider",
    });

    // Update entity with integration ID
    const updateData: Record<string, string> = {};
    if (state.provider === "quickbooks" && realmId) {
      updateData.quickbooks_id = realmId;
    } else if (state.provider === "xero") {
      updateData.xero_id = "connected";
    }

    if (Object.keys(updateData).length > 0) {
      await serviceClient
        .from("entities")
        .update(updateData)
        .eq("id", state.entityId);
    }

    // Log activity
    await serviceClient.from("activities").insert({
      user_id: state.userId,
      entity_id: state.entityId,
      type: "profile_updated",
      description: `Connected ${state.provider.charAt(0).toUpperCase() + state.provider.slice(1)} integration`,
      metadata: { provider: state.provider },
    });

    // Clear the nonce cookie and redirect to settings
    const response = NextResponse.redirect(
      safeRedirectUrl(`/dashboard/settings?connected=${state.provider}`, request)
    );
    response.cookies.set("oauth_nonce", "", {
      maxAge: 0,
      httpOnly: true,
      secure: true,
      sameSite: "lax",
      path: "/",
    });
    return response;
  } catch (error) {
    console.error("Integration callback error:", error);
    return NextResponse.redirect(
      new URL("/dashboard/settings?error=connection_failed", request.url)
    );
  }
}

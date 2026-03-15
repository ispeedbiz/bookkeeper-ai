import { NextRequest, NextResponse } from "next/server";
import { createServiceRoleClient } from "@/lib/supabase/server";
import { exchangeCodeForTokens as exchangeQBO } from "@/lib/integrations/quickbooks";
import { exchangeCodeForTokens as exchangeXero } from "@/lib/integrations/xero";
import { exchangeCodeForTokens as exchangeZoho } from "@/lib/integrations/zoho";

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
        new URL("/dashboard/settings?error=missing_params", request.url)
      );
    }

    // Decode state
    let state: { userId: string; entityId: string; provider: string };
    try {
      state = JSON.parse(Buffer.from(stateParam, "base64url").toString());
    } catch {
      return NextResponse.redirect(
        new URL("/dashboard/settings?error=invalid_state", request.url)
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
          new URL("/dashboard/settings?error=unknown_provider", request.url)
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

    return NextResponse.redirect(
      new URL(`/dashboard/settings?connected=${state.provider}`, request.url)
    );
  } catch (error) {
    console.error("Integration callback error:", error);
    return NextResponse.redirect(
      new URL("/dashboard/settings?error=connection_failed", request.url)
    );
  }
}

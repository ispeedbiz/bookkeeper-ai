import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { getAuthorizationUrl as getQBOAuthUrl } from "@/lib/integrations/quickbooks";
import { getAuthorizationUrl as getXeroAuthUrl } from "@/lib/integrations/xero";
import { getAuthorizationUrl as getZohoAuthUrl } from "@/lib/integrations/zoho";
import { randomUUID } from "crypto";

/**
 * GET /api/integrations/connect?provider=quickbooks|xero|zoho&entityId=...
 * Initiates OAuth flow for accounting software integration.
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

    const provider = request.nextUrl.searchParams.get("provider");
    const entityId = request.nextUrl.searchParams.get("entityId");

    if (!provider || !entityId) {
      return NextResponse.json(
        { error: "Provider and entityId are required" },
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
        { error: "Entity not found" },
        { status: 404 }
      );
    }

    // Generate state token with user/entity context
    const state = Buffer.from(
      JSON.stringify({
        userId: user.id,
        entityId,
        provider,
        nonce: randomUUID(),
      })
    ).toString("base64url");

    let authUrl: string;

    switch (provider) {
      case "quickbooks":
        authUrl = getQBOAuthUrl(state);
        break;
      case "xero":
        authUrl = getXeroAuthUrl(state);
        break;
      case "zoho":
        authUrl = getZohoAuthUrl(state);
        break;
      default:
        return NextResponse.json(
          { error: "Unsupported provider. Use: quickbooks, xero, or zoho" },
          { status: 400 }
        );
    }

    return NextResponse.json({ authUrl });
  } catch (error) {
    console.error("Integration connect error:", error);
    return NextResponse.json(
      { error: "Failed to initiate connection" },
      { status: 500 }
    );
  }
}

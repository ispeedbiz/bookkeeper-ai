import { NextResponse } from "next/server";
import Stripe from "stripe";
import { createServerSupabaseClient, createServiceRoleClient } from "@/lib/supabase/server";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

export async function POST(request: Request) {
  try {
    // 1. Get authenticated user
    const supabase = await createServerSupabaseClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    // 2. Get stripe_customer_id from profiles
    const serviceClient = await createServiceRoleClient();
    const { data: profile } = await serviceClient
      .from("profiles")
      .select("stripe_customer_id")
      .eq("id", user.id)
      .single();

    if (!profile?.stripe_customer_id) {
      return NextResponse.json(
        { error: "No billing account found. Please subscribe to a plan first." },
        { status: 400 }
      );
    }

    // 3. Create billing portal session
    const origin = request.headers.get("origin") || process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

    const session = await stripe.billingPortal.sessions.create({
      customer: profile.stripe_customer_id,
      return_url: `${origin}/dashboard/billing`,
    });

    return NextResponse.json({ url: session.url });
  } catch (error) {
    console.error("Stripe portal error:", error);
    const message =
      error instanceof Error ? error.message : "Failed to create portal session";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

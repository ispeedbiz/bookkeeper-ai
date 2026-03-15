import { NextResponse } from "next/server";
import Stripe from "stripe";
import { createServerSupabaseClient, createServiceRoleClient } from "@/lib/supabase/server";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

export async function POST(request: Request) {
  try {
    // 1. Get authenticated user from Supabase
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

    let body;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { error: "Invalid request body. JSON is required." },
        { status: 400 }
      );
    }

    const { priceId, planType } = body || {};

    if (!priceId) {
      return NextResponse.json(
        { error: "Price ID is required" },
        { status: 400 }
      );
    }

    // Validate priceId format (Stripe price IDs start with "price_")
    if (typeof priceId !== "string" || !priceId.startsWith("price_")) {
      return NextResponse.json(
        { error: "Invalid Price ID format" },
        { status: 400 }
      );
    }

    // 2. Get or create Stripe customer
    const serviceClient = await createServiceRoleClient();
    const { data: profile } = await serviceClient
      .from("profiles")
      .select("stripe_customer_id, full_name, company_name")
      .eq("id", user.id)
      .single();

    let customerId = profile?.stripe_customer_id;

    if (!customerId) {
      const customer = await stripe.customers.create({
        email: user.email,
        name: profile?.full_name || undefined,
        metadata: {
          userId: user.id,
          companyName: profile?.company_name || "",
        },
      });
      customerId = customer.id;

      // Save customer ID to profile
      await serviceClient
        .from("profiles")
        .update({ stripe_customer_id: customerId })
        .eq("id", user.id);
    }

    // 3. Check for existing subscriptions to decide on trial
    const existingSubscriptions = await stripe.subscriptions.list({
      customer: customerId,
      status: "all",
      limit: 1,
    });

    const hasExistingSubscription = existingSubscriptions.data.length > 0;

    // 4. Create Checkout Session
    const origin = request.headers.get("origin") || process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

    const sessionParams: Stripe.Checkout.SessionCreateParams = {
      customer: customerId,
      mode: "subscription",
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      success_url: `${origin}/dashboard/billing?success=true`,
      cancel_url: `${origin}/dashboard/billing?cancelled=true`,
      metadata: {
        userId: user.id,
        planType: planType || "direct",
      },
    };

    // Add trial for new customers only
    if (!hasExistingSubscription) {
      sessionParams.subscription_data = {
        trial_period_days: 14,
        metadata: {
          userId: user.id,
          planType: planType || "direct",
        },
      };
    }

    const session = await stripe.checkout.sessions.create(sessionParams);

    return NextResponse.json({ url: session.url });
  } catch (error) {
    console.error("Stripe checkout error:", error);
    const message =
      error instanceof Error ? error.message : "Failed to create checkout session";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

import { NextResponse } from "next/server";
import Stripe from "stripe";
import { createServiceRoleClient } from "@/lib/supabase/server";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

export async function POST(request: Request) {
  const body = await request.text();
  const sig = request.headers.get("stripe-signature")!;

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(
      body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (err) {
    console.error("Webhook signature verification failed:", err);
    return NextResponse.json(
      { error: "Webhook signature verification failed" },
      { status: 400 }
    );
  }

  const supabase = await createServiceRoleClient();

  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object as Stripe.Checkout.Session;
      const subscriptionId = session.subscription as string | null;
      const customerId = session.customer as string | null;
      const userId = session.metadata?.userId;
      const planType = session.metadata?.planType || "essential";

      if (!userId || !subscriptionId || !customerId) break;

      // Fetch full subscription details
      const subscription = await stripe.subscriptions.retrieve(subscriptionId);
      const priceId = subscription.items.data[0]?.price?.id;

      // Extract period timestamps safely
      const sub = subscription as unknown as Record<string, unknown>;
      const periodStart = sub.current_period_start as number;
      const periodEnd = sub.current_period_end as number;
      const trialEnd = sub.trial_end as number | null;

      // Upsert subscription record
      await supabase.from("subscriptions").upsert(
        {
          user_id: userId,
          stripe_subscription_id: subscriptionId,
          stripe_price_id: priceId,
          plan: planType,
          status: subscription.status === "canceled" ? "cancelled" : subscription.status,
          current_period_start: new Date(periodStart * 1000).toISOString(),
          current_period_end: new Date(periodEnd * 1000).toISOString(),
          trial_ends_at: trialEnd
            ? new Date(trialEnd * 1000).toISOString()
            : null,
          cancel_at_period_end: subscription.cancel_at_period_end || false,
          entity_limit: 1,
        },
        { onConflict: "user_id" }
      );

      // Save stripe_customer_id to profile
      await supabase
        .from("profiles")
        .update({ stripe_customer_id: customerId })
        .eq("id", userId);

      // Log activity
      await supabase.from("activities").insert({
        user_id: userId,
        type: "subscription_created",
        description: `Subscription created: ${planType} plan`,
        metadata: { subscriptionId, planType, status: subscription.status },
      });

      break;
    }

    case "customer.subscription.updated": {
      const subscription = event.data.object as Stripe.Subscription;
      const subscriptionId = subscription.id;

      const sub = subscription as unknown as Record<string, unknown>;
      const periodStart = sub.current_period_start as number;
      const periodEnd = sub.current_period_end as number;

      // Find user by stripe subscription ID
      const { data: existingSub } = await supabase
        .from("subscriptions")
        .select("user_id")
        .eq("stripe_subscription_id", subscriptionId)
        .single();

      if (!existingSub) break;

      await supabase
        .from("subscriptions")
        .update({
          status: subscription.status === "canceled" ? "cancelled" : subscription.status,
          current_period_start: new Date(periodStart * 1000).toISOString(),
          current_period_end: new Date(periodEnd * 1000).toISOString(),
          cancel_at_period_end: subscription.cancel_at_period_end || false,
        })
        .eq("stripe_subscription_id", subscriptionId);

      break;
    }

    case "customer.subscription.deleted": {
      const subscription = event.data.object as Stripe.Subscription;
      const subscriptionId = subscription.id;

      const { data: existingSub } = await supabase
        .from("subscriptions")
        .select("user_id")
        .eq("stripe_subscription_id", subscriptionId)
        .single();

      if (existingSub) {
        await supabase
          .from("subscriptions")
          .update({
            status: "cancelled",
            cancel_at_period_end: true,
          })
          .eq("stripe_subscription_id", subscriptionId);

        await supabase.from("activities").insert({
          user_id: existingSub.user_id,
          type: "subscription_cancelled",
          description: "Subscription has been cancelled",
          metadata: { subscriptionId },
        });
      }

      break;
    }

    case "invoice.payment_succeeded": {
      const invoice = event.data.object as Stripe.Invoice;
      const customerId = invoice.customer as string;

      const { data: profile } = await supabase
        .from("profiles")
        .select("id")
        .eq("stripe_customer_id", customerId)
        .single();

      if (profile) {
        await supabase.from("activities").insert({
          user_id: profile.id,
          type: "payment_received",
          description: `Payment of ${((invoice.amount_paid || 0) / 100).toFixed(2)} ${(invoice.currency || "cad").toUpperCase()} received`,
          metadata: {
            invoiceId: invoice.id,
            amount: invoice.amount_paid,
            currency: invoice.currency,
          },
        });
      }

      break;
    }

    case "invoice.payment_failed": {
      const invoice = event.data.object as Stripe.Invoice;
      const customerId = invoice.customer as string;

      if (!customerId) break;

      const { data: profile } = await supabase
        .from("profiles")
        .select("id")
        .eq("stripe_customer_id", customerId)
        .single();

      if (profile) {
        await supabase.from("activities").insert({
          user_id: profile.id,
          type: "payment_received",
          description: `⚠️ Payment of ${((invoice.amount_due || 0) / 100).toFixed(2)} ${(invoice.currency || "cad").toUpperCase()} failed — please update payment method`,
          metadata: {
            invoiceId: invoice.id,
            amount: invoice.amount_due,
            currency: invoice.currency,
            failed: true,
          },
        });
      }

      break;
    }
  }

  return NextResponse.json({ received: true });
}

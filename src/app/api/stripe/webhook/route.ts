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
      const subscriptionId = session.subscription as string;
      const customerId = session.customer as string;
      const userId = session.metadata?.userId;
      const planType = session.metadata?.planType || "direct";

      if (!userId || !subscriptionId) break;

      // Fetch full subscription details
      const subscription = await stripe.subscriptions.retrieve(subscriptionId);
      const priceId = subscription.items.data[0]?.price?.id;
      const productId = subscription.items.data[0]?.price?.product as string;

      // Upsert subscription record
      await supabase.from("subscriptions").upsert(
        {
          user_id: userId,
          stripe_subscription_id: subscriptionId,
          stripe_customer_id: customerId,
          stripe_price_id: priceId,
          stripe_product_id: productId,
          plan_type: planType,
          status: subscription.status,
          current_period_start: new Date(
            subscription.current_period_start * 1000
          ).toISOString(),
          current_period_end: new Date(
            subscription.current_period_end * 1000
          ).toISOString(),
          trial_start: subscription.trial_start
            ? new Date(subscription.trial_start * 1000).toISOString()
            : null,
          trial_end: subscription.trial_end
            ? new Date(subscription.trial_end * 1000).toISOString()
            : null,
          cancel_at: subscription.cancel_at
            ? new Date(subscription.cancel_at * 1000).toISOString()
            : null,
          cancelled_at: subscription.canceled_at
            ? new Date(subscription.canceled_at * 1000).toISOString()
            : null,
        },
        { onConflict: "user_id" }
      );

      // Update profile subscription status
      await supabase
        .from("profiles")
        .update({ subscription_status: subscription.status })
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
      const userId = subscription.metadata?.userId;

      if (!userId) {
        // Try to find user by stripe subscription ID
        const { data: sub } = await supabase
          .from("subscriptions")
          .select("user_id")
          .eq("stripe_subscription_id", subscriptionId)
          .single();

        if (!sub) break;

        await supabase
          .from("subscriptions")
          .update({
            status: subscription.status,
            current_period_start: new Date(
              subscription.current_period_start * 1000
            ).toISOString(),
            current_period_end: new Date(
              subscription.current_period_end * 1000
            ).toISOString(),
            cancel_at: subscription.cancel_at
              ? new Date(subscription.cancel_at * 1000).toISOString()
              : null,
            cancelled_at: subscription.canceled_at
              ? new Date(subscription.canceled_at * 1000).toISOString()
              : null,
          })
          .eq("stripe_subscription_id", subscriptionId);

        await supabase
          .from("profiles")
          .update({ subscription_status: subscription.status })
          .eq("id", sub.user_id);

        break;
      }

      await supabase
        .from("subscriptions")
        .update({
          status: subscription.status,
          current_period_start: new Date(
            subscription.current_period_start * 1000
          ).toISOString(),
          current_period_end: new Date(
            subscription.current_period_end * 1000
          ).toISOString(),
          cancel_at: subscription.cancel_at
            ? new Date(subscription.cancel_at * 1000).toISOString()
            : null,
          cancelled_at: subscription.canceled_at
            ? new Date(subscription.canceled_at * 1000).toISOString()
            : null,
        })
        .eq("user_id", userId);

      await supabase
        .from("profiles")
        .update({ subscription_status: subscription.status })
        .eq("id", userId);

      break;
    }

    case "customer.subscription.deleted": {
      const subscription = event.data.object as Stripe.Subscription;
      const subscriptionId = subscription.id;

      // Find user by subscription
      const { data: sub } = await supabase
        .from("subscriptions")
        .select("user_id")
        .eq("stripe_subscription_id", subscriptionId)
        .single();

      if (sub) {
        await supabase
          .from("subscriptions")
          .update({
            status: "cancelled",
            cancelled_at: new Date().toISOString(),
          })
          .eq("stripe_subscription_id", subscriptionId);

        await supabase
          .from("profiles")
          .update({ subscription_status: "cancelled" })
          .eq("id", sub.user_id);

        await supabase.from("activities").insert({
          user_id: sub.user_id,
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

      // Find user by customer ID
      const { data: profile } = await supabase
        .from("profiles")
        .select("id")
        .eq("stripe_customer_id", customerId)
        .single();

      if (profile) {
        await supabase.from("activities").insert({
          user_id: profile.id,
          type: "payment_received",
          description: `Payment of ${(invoice.amount_paid / 100).toFixed(2)} ${(invoice.currency || "cad").toUpperCase()} received`,
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

      const { data: profile } = await supabase
        .from("profiles")
        .select("id")
        .eq("stripe_customer_id", customerId)
        .single();

      if (profile) {
        await supabase.from("activities").insert({
          user_id: profile.id,
          type: "payment_failed",
          description: `Payment of ${(invoice.amount_due / 100).toFixed(2)} ${(invoice.currency || "cad").toUpperCase()} failed`,
          metadata: {
            invoiceId: invoice.id,
            amount: invoice.amount_due,
            currency: invoice.currency,
          },
        });
      }

      break;
    }
  }

  return NextResponse.json({ received: true });
}

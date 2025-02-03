// app/api/webhook/route.ts
import { NextResponse } from "next/server";
import { headers } from "next/headers";
import Stripe from "stripe";
import { createClient } from "@supabase/supabase-js";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);
const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!;

export async function POST(req: Request) {
  const body = await req.text();
  const signature = (await headers()).get("stripe-signature")!;
  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
  } catch (err) {
    return NextResponse.json(
      { error: "Webhook signature verification failed" },
      { status: 400 }
    );
  }

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        await handleCheckoutCompleted(
          event.data.object as Stripe.Checkout.Session
        );
        break;
      }

      case "setup_intent.succeeded": {
        await handleSetupIntentSucceeded(
          event.data.object as Stripe.SetupIntent
        );
        break;
      }

      case "invoice.payment_succeeded": {
        await handleSuccessfulPayment(event.data.object as Stripe.Invoice);
        break;
      }

      case "invoice.payment_failed": {
        await handleFailedPayment(event.data.object as Stripe.Invoice);
        break;
      }

      case "customer.subscription.updated": {
        await handleSubscriptionUpdated(
          event.data.object as Stripe.Subscription
        );
        break;
      }

      case "customer.subscription.deleted": {
        await handleSubscriptionDeleted(
          event.data.object as Stripe.Subscription
        );
        break;
      }

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("Error processing webhook:", error);
    return NextResponse.json(
      { error: "Webhook processing failed" },
      { status: 500 }
    );
  }
}

async function handleCheckoutCompleted(session: Stripe.Checkout.Session) {
  const subscription = await stripe.subscriptions.retrieve(
    session.subscription as string
  );

  // Handle payment method if exists
  if (session.payment_intent) {
    await handlePaymentMethodUpdate(
      session.payment_intent as string,
      session.metadata?.userId,
      subscription
    );
  }

  // Update subscription status
  const { error } = await supabase.from("subscriptions").upsert({
    user_id: session.metadata?.userId,
    listing_id: session.metadata?.listing_id,
    stripe_subscription_id: subscription.id,
    stripe_customer_id: subscription.customer as string,
    status: subscription.status,
    service_type: session.metadata?.serviceType,
    tier_type: session.metadata?.tierType,
    is_annual: session.metadata?.isAnnual === "true",
    current_period_end: new Date(
      subscription.current_period_end * 1000
    ).toISOString(),
  });

  if (error) throw error;

  // Update listing status
  const { error: updateError } = await supabase
    .from(`${session.metadata?.serviceType}_listing`)
    .update({
      is_draft: false,
      is_archived: false,
    })
    .eq("id", session.metadata?.listing_id);

  if (updateError) throw updateError;
}

async function handleSetupIntentSucceeded(setupIntent: Stripe.SetupIntent) {
  if (setupIntent.payment_method && setupIntent.customer) {
    const paymentMethodId =
      typeof setupIntent.payment_method === "string"
        ? setupIntent.payment_method
        : setupIntent.payment_method.id;

    await handlePaymentMethodUpdate(
      paymentMethodId,
      setupIntent.metadata?.userId,
      undefined,
      setupIntent.customer as string
    );
  }
}

async function handleSuccessfulPayment(invoice: Stripe.Invoice) {
  const subscription = await stripe.subscriptions.retrieve(
    invoice.subscription as string
  );

  // Get the subscription details to know the service type and listing ID
  const { data: subData } = await supabase
    .from("subscriptions")
    .select("service_type, listing_id")
    .eq("stripe_subscription_id", subscription.id)
    .single();

  // Update subscription
  await supabase
    .from("subscriptions")
    .update({
      status: subscription.status,
      current_period_end: new Date(
        subscription.current_period_end * 1000
      ).toISOString(),
      cancel_at_period_end: subscription.cancel_at_period_end,
    })
    .eq("stripe_subscription_id", subscription.id);

  // Update listing status to active
  if (subData) {
    await supabase
      .from(`${subData.service_type}_listing`)
      .update({ is_archived: false })
      .eq("id", subData.listing_id);
  }

  // Record payment history
  await supabase.from("subscription_history").insert({
    subscription_id: subscription.id,
    action: "payment_success",
    metadata: {
      invoice_id: invoice.id,
      amount_paid: invoice.amount_paid,
      period_end: subscription.current_period_end,
    },
  });
}

async function handleFailedPayment(invoice: Stripe.Invoice) {
  const subscription = await stripe.subscriptions.retrieve(
    invoice.subscription as string
  );

  // Get payment intent to check error details
  let failureReason = "Unknown error";
  if (invoice.payment_intent) {
    const paymentIntent = await stripe.paymentIntents.retrieve(
      typeof invoice.payment_intent === "string"
        ? invoice.payment_intent
        : invoice.payment_intent.id
    );
    failureReason =
      paymentIntent.last_payment_error?.message ?? "Payment failed";
  }

  await supabase
    .from("subscriptions")
    .update({
      status: subscription.status,
    })
    .eq("stripe_subscription_id", subscription.id);

  // If it's past due, mark the listing as inactive
  if (subscription.status === "past_due") {
    const { data: sub } = await supabase
      .from("subscriptions")
      .select("service_type, listing_id")
      .eq("stripe_subscription_id", subscription.id)
      .single();

    if (sub) {
      await supabase
        .from(sub.service_type + "_listing")
        .update({ is_archived: true })
        .eq("id", sub.listing_id);
    }
  }

  // Record failed payment
  await supabase.from("subscription_history").insert({
    subscription_id: subscription.id,
    action: "payment_failed",
    metadata: {
      invoice_id: invoice.id,
      failure_reason: failureReason,
    },
  });
}

async function handleSubscriptionUpdated(subscription: Stripe.Subscription) {
  await supabase
    .from("subscriptions")
    .update({
      status: subscription.status,
      current_period_end: new Date(
        subscription.current_period_end * 1000
      ).toISOString(),
      cancel_at_period_end: subscription.cancel_at_period_end,
    })
    .eq("stripe_subscription_id", subscription.id);
}

async function handleSubscriptionDeleted(subscription: Stripe.Subscription) {
  const { data: sub } = await supabase
    .from("subscriptions")
    .select("service_type, listing_id")
    .eq("stripe_subscription_id", subscription.id)
    .single();

  if (sub) {
    await supabase
      .from(sub.service_type + "_listing")
      .update({ is_archived: true })
      .eq("id", sub.listing_id);
  }

  await supabase
    .from("subscriptions")
    .update({
      status: "inactive",
      cancel_at_period_end: false,
    })
    .eq("stripe_subscription_id", subscription.id);
}

async function handlePaymentMethodUpdate(
  paymentMethodId: string,
  userId: string | undefined,
  subscription?: Stripe.Subscription,
  customerId?: string
) {
  const paymentMethod = await stripe.paymentMethods.retrieve(paymentMethodId);

  // Delete existing payment methods in Stripe
  const { data: existingPaymentMethods } = await supabase
    .from("payment_methods")
    .select("stripe_payment_method_id")
    .eq("user_id", userId);

  if (existingPaymentMethods) {
    for (const pm of existingPaymentMethods) {
      try {
        await stripe.paymentMethods.detach(pm.stripe_payment_method_id);
      } catch (error) {
        console.error("Error detaching payment method:", error);
      }
    }
  }

  // Delete all existing payment methods from database
  await supabase.from("payment_methods").delete().eq("user_id", userId);

  const customer = customerId || (subscription?.customer as string);

  // Set as default payment method in Stripe
  await stripe.customers.update(customer, {
    invoice_settings: {
      default_payment_method: paymentMethodId,
    },
  });

  if (subscription) {
    await stripe.subscriptions.update(subscription.id, {
      default_payment_method: paymentMethodId,
    });
  }

  // Insert new payment method
  const { error: paymentMethodError } = await supabase
    .from("payment_methods")
    .insert({
      user_id: userId,
      stripe_payment_method_id: paymentMethod.id,
      stripe_customer_id: customer,
      is_default: true,
      last_4: paymentMethod.card?.last4,
      card_brand: paymentMethod.card?.brand,
      exp_month: paymentMethod.card?.exp_month,
      exp_year: paymentMethod.card?.exp_year,
      card_fingerprint: paymentMethod.card?.fingerprint,
    });

  if (paymentMethodError) {
    await stripe.paymentMethods.detach(paymentMethodId);
    throw paymentMethodError;
  }
}

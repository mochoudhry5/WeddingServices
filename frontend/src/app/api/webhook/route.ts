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
    console.log("Processing webhook event:", event.type);

    switch (event.type) {
      case "customer.subscription.created":
      case "customer.subscription.updated": {
        await handleSubscriptionUpdate(
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

async function handleSubscriptionUpdate(subscription: Stripe.Subscription) {
  // Log incoming subscription state
  console.log("Processing subscription update:", {
    id: subscription.id,
    status: subscription.status,
    cancel_at_period_end: subscription.cancel_at_period_end,
    cancel_at: subscription.cancel_at,
    current_period_end: subscription.current_period_end,
    hasDiscount: !!subscription.discount,
  });

  // A subscription can be canceled in two ways:
  // 1. cancel_at_period_end = true (regular cancellation)
  // 2. cancel_at = timestamp (discount-based cancellation)
  const now = Math.floor(Date.now() / 1000);
  const isScheduledForCancellation =
    subscription.cancel_at_period_end ||
    (subscription.cancel_at !== null && subscription.cancel_at > now);

  console.log("Cancellation status:", {
    isScheduledForCancellation,
    reason: subscription.cancel_at_period_end
      ? "period_end"
      : subscription.cancel_at
      ? "scheduled_date"
      : "not_cancelled",
  });

  // Get discount information
  const discount = subscription.discount;
  const hasDiscount = !!discount;

  // Calculate discount period dates
  let discountStart = null;
  let discountEnd = null;

  if (hasDiscount) {
    discountStart = new Date(subscription.start_date * 1000).toISOString();

    if (subscription.cancel_at) {
      // If subscription is cancelled at a specific time, use that
      discountEnd = new Date(subscription.cancel_at * 1000).toISOString();
    } else if (discount.end) {
      // Otherwise use the discount end date if available
      discountEnd = new Date(discount.end * 1000).toISOString();
    }
  }

  // Prepare update data
  const updateData = {
    status: subscription.status,
    current_period_end: new Date(
      subscription.current_period_end * 1000
    ).toISOString(),
    // Mark as scheduled for cancellation if either cancel method is active
    cancel_at_period_end: isScheduledForCancellation,
    // Track discount period using trial fields
    is_trial: hasDiscount,
    trial_start: discountStart,
    trial_end: discountEnd,
    // Keep promo code reference if it exists
    ...(hasDiscount &&
      discount.promotion_code && {
        promo_code: discount.promotion_code,
      }),
  };

  console.log("Updating subscription in database:", updateData);

  // Update subscription in database
  const { error: updateError } = await supabase
    .from("subscriptions")
    .update(updateData)
    .eq("stripe_subscription_id", subscription.id);

  if (updateError) {
    console.error("Error updating subscription:", updateError);
    throw updateError;
  }

  // Update listing status if subscription is active
  if (subscription.status === "active" || subscription.status === "trialing") {
    const { data: sub } = await supabase
      .from("subscriptions")
      .select("service_type, listing_id")
      .eq("stripe_subscription_id", subscription.id)
      .single();

    if (sub) {
      await supabase
        .from(`${sub.service_type}_listing`)
        .update({ is_archived: false })
        .eq("id", sub.listing_id);
    }
  }
}

async function handleSubscriptionDeleted(subscription: Stripe.Subscription) {
  console.log("Processing subscription deletion:", subscription.id);

  // Get subscription details before deletion
  const { data: sub } = await supabase
    .from("subscriptions")
    .select("service_type, listing_id")
    .eq("stripe_subscription_id", subscription.id)
    .single();

  if (sub) {
    // Archive the listing
    await supabase
      .from(`${sub.service_type}_listing`)
      .update({ is_archived: true })
      .eq("id", sub.listing_id);
  }

  // Update subscription status and clear promotional fields
  // Using UTC timestamp for consistency
  await supabase
    .from("subscriptions")
    .update({
      status: "inactive",
      cancel_at_period_end: false,
      is_trial: false,
      trial_start: null,
      trial_end: null,
      promo_code: null,
      current_period_end: subscription.canceled_at
        ? new Date(subscription.canceled_at * 1000).toISOString()
        : new Date().toISOString(),
    })
    .eq("stripe_subscription_id", subscription.id);
}

async function handleSuccessfulPayment(invoice: Stripe.Invoice) {
  const subscription = await stripe.subscriptions.retrieve(
    invoice.subscription as string
  );

  // Record the successful payment
  await supabase.from("subscription_history").insert({
    subscription_id: subscription.id,
    action: "payment_success",
    metadata: {
      invoice_id: invoice.id,
      amount_paid: invoice.amount_paid,
      period_end: subscription.current_period_end,
    },
  });

  // Let handleSubscriptionUpdate handle the subscription updates
  await handleSubscriptionUpdate(subscription);
}

async function handleFailedPayment(invoice: Stripe.Invoice) {
  const subscription = await stripe.subscriptions.retrieve(
    invoice.subscription as string
  );

  // Get detailed failure reason
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

  // Record the payment failure
  await supabase.from("subscription_history").insert({
    subscription_id: subscription.id,
    action: "payment_failed",
    metadata: {
      invoice_id: invoice.id,
      failure_reason: failureReason,
    },
  });

  // Let handleSubscriptionUpdate handle the subscription updates
  await handleSubscriptionUpdate(subscription);
}

async function handleSetupIntentSucceeded(setupIntent: Stripe.SetupIntent) {
  console.log("Processing SetupIntent:", {
    id: setupIntent.id,
    payment_method: setupIntent.payment_method,
    customer: setupIntent.customer,
    metadata: setupIntent.metadata,
  });

  if (!setupIntent.payment_method || !setupIntent.customer) {
    console.error("Missing required SetupIntent fields");
    return;
  }

  const paymentMethodId =
    typeof setupIntent.payment_method === "string"
      ? setupIntent.payment_method
      : setupIntent.payment_method.id;

  // Check for existing payment method
  const { data: existingPayment, error: existingPaymentError } = await supabase
    .from("payment_methods")
    .select("id")
    .eq("stripe_payment_method_id", paymentMethodId)
    .single();

  if (existingPaymentError && existingPaymentError.code !== "PGRST116") {
    console.error(
      "Error checking existing payment method:",
      existingPaymentError
    );
    throw existingPaymentError;
  }

  if (existingPayment) {
    console.log("Payment method already exists, skipping processing");
    return;
  }

  // Get userId through various fallbacks
  let userId = setupIntent.metadata?.userId;

  if (!userId) {
    // Try getting from customer metadata
    const customer = await stripe.customers.retrieve(
      setupIntent.customer as string
    );

    if (!("deleted" in customer) && customer.metadata?.userId) {
      userId = customer.metadata.userId;
      console.log("Retrieved userId from customer metadata");
    }

    // If still no userId, try getting from subscriptions
    if (!userId) {
      const subscriptions = await stripe.subscriptions.list({
        customer: setupIntent.customer as string,
        limit: 1,
        status: "all",
      });

      if (subscriptions.data.length > 0) {
        userId = subscriptions.data[0].metadata.userId;
        console.log("Retrieved userId from subscription metadata");
      }
    }
  }

  if (!userId) {
    console.error(
      "Could not determine userId for SetupIntent:",
      setupIntent.id
    );
    return;
  }

  await handlePaymentMethodUpdate(
    paymentMethodId,
    userId,
    undefined,
    setupIntent.customer as string
  );
}

async function handlePaymentMethodUpdate(
  paymentMethodId: string,
  userId: string,
  subscription?: Stripe.Subscription,
  customerId?: string
) {
  console.log("Updating payment method:", {
    paymentMethodId,
    userId,
    customerId,
    hasSubscription: !!subscription,
  });

  const paymentMethod = await stripe.paymentMethods.retrieve(paymentMethodId);

  // Delete existing payment methods
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

  await supabase.from("payment_methods").delete().eq("user_id", userId);

  const customer = customerId || (subscription?.customer as string);

  // Set as default payment method
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
    console.error("Error inserting payment method:", paymentMethodError);
    await stripe.paymentMethods.detach(paymentMethodId);
    throw paymentMethodError;
  }
}

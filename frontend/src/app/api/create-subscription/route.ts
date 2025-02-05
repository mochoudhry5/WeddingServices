//app/api/create-subscription/route.ts
import { NextResponse } from "next/server";
import Stripe from "stripe";
import { createClient } from "@supabase/supabase-js";

// Types
type ServiceType =
  | "wedding_planner"
  | "hair_makeup"
  | "photo_video"
  | "dj"
  | "venue";
type TierType = "basic" | "premium" | "enterprise"; // adjust based on your actual tiers

interface CreateSubscriptionBody {
  priceId: string;
  userId: string;
  serviceType: ServiceType;
  tierType: TierType;
  isAnnual: boolean;
  listing_id: string;
  promoCode?: string;
  idempotencyKey: string; // Required for preventing duplicate subscriptions
}

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  maxNetworkRetries: 2, // Retry failed requests
});

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: Request) {
  try {
    const body = await request.json();

    // Validate request body
    const validationError = validateRequestBody(body);
    if (validationError) {
      return NextResponse.json({ error: validationError }, { status: 400 });
    }

    const {
      priceId,
      userId,
      serviceType,
      tierType,
      isAnnual,
      listing_id,
      promoCode,
      idempotencyKey,
    } = body as CreateSubscriptionBody;

    // Check for existing subscription to prevent duplicates
    const { data: existingSubscription } = await supabase
      .from("subscriptions")
      .select("id")
      .eq("user_id", userId)
      .eq("listing_id", listing_id)
      .eq("status", "active")
      .single();

    if (existingSubscription) {
      return NextResponse.json(
        { error: "Active subscription already exists for this listing" },
        { status: 409 }
      );
    }

    // Get user's payment method
    const { data: paymentMethod, error: paymentMethodError } = await supabase
      .from("payment_methods")
      .select("stripe_customer_id, stripe_payment_method_id")
      .eq("user_id", userId)
      .single();

    if (paymentMethodError || !paymentMethod) {
      return NextResponse.json(
        { error: "No payment method found" },
        { status: 400 }
      );
    }

    let promotionCode: Stripe.PromotionCode | null = null;
    let trialPeriodDays: number | undefined = undefined;

    // Validate promo code if provided
    if (promoCode) {
      try {
        const promotionCodes = await stripe.promotionCodes.list({
          code: promoCode,
          active: true,
          expand: ["coupon"],
        });

        if (!promotionCodes.data.length) {
          return NextResponse.json(
            { error: "Invalid or inactive promo code" },
            { status: 400 }
          );
        }

        promotionCode = promotionCodes.data[0];

        // Check if this is a trial promotion
        const coupon = promotionCode.coupon as Stripe.Coupon;
        if (coupon.metadata?.isTrial === "true") {
          const months = parseInt(coupon.metadata.trialDurationMonths || "3");
          trialPeriodDays = months * 30;
        }
      } catch (error) {
        console.error("Error validating promo code:", error);
        return NextResponse.json(
          { error: "Error validating promo code" },
          { status: 400 }
        );
      }
    }

    // Create subscription with idempotency key
    const subscription = await stripe.subscriptions.create(
      {
        customer: paymentMethod.stripe_customer_id,
        items: [{ price: priceId }],
        default_payment_method: paymentMethod.stripe_payment_method_id,
        payment_behavior: "error_if_incomplete",
        promotion_code: promotionCode?.id,
        trial_period_days: trialPeriodDays,
        metadata: {
          userId,
          serviceType,
          tierType,
          isAnnual: String(isAnnual),
          listing_id,
        },
      },
      {
        idempotencyKey,
      }
    );

    // Create subscription record in Supabase
    const { error: subscriptionError } = await supabase
      .from("subscriptions")
      .insert({
        user_id: userId,
        listing_id,
        stripe_subscription_id: subscription.id,
        stripe_customer_id: paymentMethod.stripe_customer_id,
        status: subscription.status,
        service_type: serviceType,
        tier_type: tierType,
        is_trial: !!trialPeriodDays,
        is_annual: isAnnual,
        trial_start: trialPeriodDays ? new Date().toISOString() : null,
        trial_end: trialPeriodDays
          ? new Date(
              Date.now() + trialPeriodDays * 24 * 60 * 60 * 1000
            ).toISOString()
          : null,
        current_period_end: new Date(
          subscription.current_period_end * 1000
        ).toISOString(),
        promo_code: promoCode || null,
      });

    if (subscriptionError) {
      console.error("Error creating Supabase subscription:", subscriptionError);

      try {
        // Fetch the latest invoice for this subscription
        const latestInvoice = await stripe.invoices.retrieve(
          subscription.latest_invoice as string
        );

        // If the invoice was paid, issue a refund
        if (latestInvoice.status === "paid" && latestInvoice.payment_intent) {
          await stripe.refunds.create({
            payment_intent: latestInvoice.payment_intent as string,
            reason: "requested_by_customer",
          });
        }

        // Cancel the subscription
        await stripe.subscriptions.cancel(subscription.id);
      } catch (stripeError) {
        // Log the error but don't throw it - we'll throw the original subscriptionError
        console.error("Error cleaning up Stripe resources:", stripeError);
      }

      throw subscriptionError;
    }

    // Mark the listing as active
    const { error: listingError } = await supabase
      .from(`${serviceType}_listing`)
      .update({ is_draft: false })
      .eq("id", listing_id);

    if (listingError) {
      console.error("Error updating listing:", listingError);
      // Don't throw - listing update is non-critical
    }

    return NextResponse.json({
      success: true,
      subscriptionId: subscription.id,
      redirectUrl: `/services/${getServiceTypeForUrl(
        serviceType
      )}/${listing_id}`,
    });
  } catch (error) {
    // Log the full error for debugging
    console.error("Subscription creation failed:", error);

    const errorMessage =
      error instanceof Error ? error.message : "An unknown error occurred";

    return NextResponse.json(
      {
        error: "Failed to create subscription",
        details:
          process.env.NODE_ENV === "development" ? errorMessage : undefined,
      },
      { status: 500 }
    );
  }
}

function validateRequestBody(body: any): string | null {
  const requiredFields = [
    "priceId",
    "userId",
    "serviceType",
    "tierType",
    "listing_id",
    "idempotencyKey",
  ];
  const missingFields = requiredFields.filter((field) => !body[field]);

  if (missingFields.length > 0) {
    return `Missing required fields: ${missingFields.join(", ")}`;
  }

  if (typeof body.isAnnual !== "boolean") {
    return "isAnnual must be a boolean";
  }

  // Validate service type
  const validServiceTypes = [
    "wedding_planner",
    "hair_makeup",
    "photo_video",
    "dj",
    "venue",
  ];
  if (!validServiceTypes.includes(body.serviceType)) {
    return "Invalid service type";
  }

  return null;
}

function getServiceTypeForUrl(serviceType: ServiceType): string {
  const mapping: Record<ServiceType, string> = {
    wedding_planner: "weddingPlanner",
    hair_makeup: "hairMakeup",
    photo_video: "photoVideo",
    dj: "dj",
    venue: "venue",
  };
  return mapping[serviceType];
}

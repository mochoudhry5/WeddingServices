// app/api/create-subscription/route.ts
import { NextResponse } from "next/server";
import Stripe from "stripe";
import { createClient } from "@supabase/supabase-js";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { priceId, userId, serviceType, tierType, isAnnual, listing_id } =
      body;

    // Validate required fields
    if (!priceId || !userId || !serviceType || !tierType || !listing_id) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Get user's payment method
    const { data: paymentMethod } = await supabase
      .from("payment_methods")
      .select("*")
      .eq("user_id", userId)
      .single();

    if (!paymentMethod) {
      return NextResponse.json(
        { error: "No payment method found" },
        { status: 400 }
      );
    }

    const subscription = await stripe.subscriptions.create({
      customer: paymentMethod.stripe_customer_id,
      items: [{ price: priceId }],
      default_payment_method: paymentMethod.stripe_payment_method_id,
      payment_behavior: "error_if_incomplete",
      metadata: {
        userId,
        serviceType,
        tierType,
        isAnnual: isAnnual.toString(),
        listing_id,
      },
    });

    // If we get here, payment was successful, so create the subscription record
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
        is_annual: isAnnual,
        current_period_end: new Date(
          subscription.current_period_end * 1000
        ).toISOString(),
      });

    if (subscriptionError) throw subscriptionError;

    // Mark the listing as active
    const { error: listingError } = await supabase
      .from(`${serviceType}_listing`)
      .update({ is_draft: false })
      .eq("id", listing_id);

    if (listingError) throw listingError;

    return NextResponse.json({
      success: true,
      subscriptionId: subscription.id,
      redirectUrl: `/services/${getServiceTypeForUrl(
        serviceType
      )}/${listing_id}`,
    });
  } catch (error) {
    console.error("Error creating subscription:", error);
    return NextResponse.json(
      { error: "Failed to create subscription" },
      { status: 500 }
    );
  }
}

// Helper function to convert service types for URLs
function getServiceTypeForUrl(serviceType: string): string {
  const mapping: { [key: string]: string } = {
    wedding_planner: "weddingPlanner",
    hair_makeup: "hairMakeup",
    photo_video: "photoVideo",
    dj: "dj",
    venue: "venue",
  };
  return mapping[serviceType] || serviceType;
}

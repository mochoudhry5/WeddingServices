// app/api/create-checkout-session/route.ts
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

    if (!priceId || !userId || !serviceType || !tierType) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Get or create customer
    const { data: existingSubscription } = await supabase
      .from("subscriptions")
      .select("stripe_customer_id")
      .eq("user_id", userId)
      .not("stripe_customer_id", "is", null)
      .limit(1)
      .single();

    let customerId: string;

    if (!existingSubscription?.stripe_customer_id) {
      const { data: user } = await supabase
        .from("user_preferences")
        .select("*")
        .eq("id", userId)
        .single();

      if (!user) {
        return NextResponse.json({ error: "User not found" }, { status: 404 });
      }

      const customer = await stripe.customers.create({
        email: user.email,
        metadata: { userId },
      });
      customerId = customer.id;
    } else {
      customerId = existingSubscription.stripe_customer_id;
    }

    const sessionConfig: Stripe.Checkout.SessionCreateParams = {
      customer: customerId,
      billing_address_collection: "auto",
      payment_method_types: ["card"],
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      mode: "subscription",
      success_url: `${
        process.env.NEXT_PUBLIC_BASE_URL
      }/services/${getServiceTypeForUrl(serviceType)}/${listing_id}`,
      cancel_url: `${process.env.NEXT_PUBLIC_BASE_URL}/services/`,
      metadata: {
        userId,
        serviceType,
        tierType,
        isAnnual: isAnnual.toString(),
        listing_id,
      },
      custom_text: {
        submit: {
          message:
            "Review your subscription details and confirm your payment method.",
        },
      },
    };

    const session = await stripe.checkout.sessions.create(sessionConfig);
    return NextResponse.json({ sessionId: session.id });
  } catch (error) {
    console.error("Checkout session error:", error);
    return NextResponse.json(
      { error: "Failed to create checkout session" },
      { status: 500 }
    );
  }
}

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

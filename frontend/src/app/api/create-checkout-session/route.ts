// app/api/create-checkout-session/route.ts
import { NextResponse } from "next/server";
import Stripe from "stripe";
import { createClient } from "@supabase/supabase-js";

const mapping = {
  venue: "venue",
  hair_makeup: "hairMakeup",
  wedding_planner: "weddingPlanner",
  photo_video: "photoVideo",
  dj: "dj",
} as const;

// Validate environment variables
if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error("Missing STRIPE_SECRET_KEY");
}

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: "2024-12-18.acacia",
});

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error("Missing Supabase environment variables");
}

const supabase = createClient(supabaseUrl, supabaseKey);

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { priceId, userId, serviceType, tierType, isAnnual, listing_id } =
      body;

    // Validate request data
    if (!priceId || !userId || !serviceType || !tierType) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Check if user already has a Stripe customer ID
    const { data: existingSubscription } = await supabase
      .from("subscriptions")
      .select("stripe_customer_id")
      .eq("user_id", userId)
      .not("stripe_customer_id", "is", null)
      .limit(1)
      .single();

    let customerId: string;

    if (!existingSubscription?.stripe_customer_id) {
      // Get user data
      const { data: user } = await supabase
        .from("user_preferences")
        .select("*")
        .eq("id", userId)
        .single();

      if (!user) {
        return NextResponse.json({ error: "User not found" }, { status: 404 });
      }

      // Create new customer
      const customer = await stripe.customers.create({
        email: user.email,
        metadata: {
          userId: userId,
        },
      });
      customerId = customer.id;
    } else {
      customerId = existingSubscription.stripe_customer_id;
    }

    const key: keyof typeof mapping = serviceType;

    // Create Stripe checkout session with proper typing
    const session = await stripe.checkout.sessions.create({
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
      subscription_data: {
        trial_settings: {
          end_behavior: {
            missing_payment_method: "cancel",
          },
        },
      },
      success_url: `${process.env.NEXT_PUBLIC_BASE_URL}/services/${mapping[key]}/${listing_id}`,
      cancel_url: `${process.env.NEXT_PUBLIC_BASE_URL}/services/`,
      metadata: {
        userId,
        serviceType,
        tierType,
        isAnnual: isAnnual.toString(),
        listing_id,
      },
    } as Stripe.Checkout.SessionCreateParams);

    return NextResponse.json({ sessionId: session.id });
  } catch (error) {
    console.error("Checkout session error:", error);
    return NextResponse.json(
      { error: "Failed to create checkout session" },
      { status: 500 }
    );
  }
}

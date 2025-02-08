// app/api/create-setup-intent/route.ts
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
    const { customerId, userId, email } = await request.json();

    // If no customerId is provided, create a new customer
    let finalCustomerId = customerId;
    if (!finalCustomerId) {
      // Create a new customer in Stripe
      const customer = await stripe.customers.create({
        email,
        metadata: { userId },
      });

      finalCustomerId = customer.id;
    }

    // Create the setup intent with the customer ID
    const setupIntent = await stripe.setupIntents.create({
      customer: finalCustomerId,
      payment_method_types: ["card"],
      metadata: {
        userId, // Include userId in metadata for webhook handling
      },
    });

    return NextResponse.json({
      clientSecret: setupIntent.client_secret,
      customerId: finalCustomerId, // Return the customer ID for reference
    });
  } catch (error) {
    console.error("Setup intent error:", error);
    return NextResponse.json(
      {
        error: "Failed to create setup intent",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

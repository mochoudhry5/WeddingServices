import { supabase } from "@/lib/supabase";
import { NextResponse } from "next/server";
import Stripe from "stripe";

// In app/api/auth/register/route.ts or similar
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

export async function POST(request: Request) {
  try {
    const { email, userId } = await request.json();

    // Create Stripe customer
    const customer = await stripe.customers.create({
      email,
      metadata: { userId },
    });

    // Store customer ID in user_preferences
    await supabase
      .from("user_preferences")
      .update({ stripe_customer_id: customer.id })
      .eq("id", userId);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error creating customer:", error);
    return NextResponse.json(
      { error: "Failed to create customer" },
      { status: 500 }
    );
  }
}

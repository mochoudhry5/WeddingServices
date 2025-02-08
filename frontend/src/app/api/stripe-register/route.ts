// app/api/stripe-register/route.ts
import { createClient } from "@supabase/supabase-js";
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: Request) {
  try {
    const { userId, email } = await req.json();

    const customer = await stripe.customers.create({
      email,
      metadata: { userId },
    });

    const { error } = await supabase
      .from("user_preferences")
      .update({ stripe_customer_id: customer.id })
      .eq("id", userId);

    if (error) throw error;

    return Response.json({ customerId: customer.id });
  } catch (error) {
    console.error("Stripe API error:", error);
    return new Response("Error creating customer", { status: 500 });
  }
}

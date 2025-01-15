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

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;
    const subscription = await stripe.subscriptions.retrieve(
      session.subscription as string
    );

    // Update the user's subscription status in Supabase
    const { error } = await supabase.from("subscriptions").upsert({
      user_id: session.metadata?.userId,
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

    if (error) {
      console.error("Error updating subscription:", error);
      return NextResponse.json(
        { error: "Error updating subscription" },
        { status: 500 }
      );
    }

    const { data: updatedData, error: updateError } = await supabase
      .from(`${session.metadata?.serviceType}_listing`)
      .update({
        is_draft: false,
      })
      .eq("id", session.metadata?.listing_id);

    if (updateError) {
      console.error("Error updating listing:", error);
      return NextResponse.json(
        { error: "Error updating listing" },
        { status: 500 }
      );
    } else {
      console.log("Updated listing data:", updatedData);
    }
  }

  return NextResponse.json({ received: true });
}

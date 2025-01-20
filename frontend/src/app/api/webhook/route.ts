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
    console.log("Session:", session);

    try {
      // Get the subscription
      const subscription = await stripe.subscriptions.retrieve(
        session.subscription as string
      );
      console.log("Subscription:", subscription);

      // Get payment method from PaymentIntent if exists
      let paymentMethodId = null;
      if (session.payment_intent) {
        const paymentIntent = await stripe.paymentIntents.retrieve(
          session.payment_intent as string
        );
        paymentMethodId = paymentIntent.payment_method;
      } else {
        paymentMethodId = subscription.default_payment_method;
      }

      if (paymentMethodId && typeof paymentMethodId === "string") {
        console.log("Found payment method ID:", paymentMethodId);

        // Set as default for both customer and subscription
        await stripe.customers.update(subscription.customer as string, {
          invoice_settings: {
            default_payment_method: paymentMethodId,
          },
        });

        await stripe.subscriptions.update(subscription.id, {
          default_payment_method: paymentMethodId,
        });

        // Get payment method details
        const paymentMethod = await stripe.paymentMethods.retrieve(
          paymentMethodId
        );
        console.log("Payment Method Details:", paymentMethod);

        // First update all existing payment methods to non-default
        const { error: updateError } = await supabase
          .from("payment_methods")
          .update({ is_default: false })
          .eq("user_id", session.metadata?.userId);

        if (updateError) throw updateError;

        // Then insert/update the new payment method as default
        const { error: paymentError } = await supabase
          .from("payment_methods")
          .upsert({
            user_id: session.metadata?.userId,
            stripe_payment_method_id: paymentMethodId,
            stripe_customer_id: subscription.customer as string,
            is_default: true,
            last_4: paymentMethod.card?.last4,
            card_brand: paymentMethod.card?.brand,
            exp_month: paymentMethod.card?.exp_month,
            exp_year: paymentMethod.card?.exp_year,
            card_fingerprint: paymentMethod.card?.fingerprint,
          });

        if (paymentError) {
          console.error("Error storing payment method:", paymentError);
          throw paymentError;
        }
      }

      // Rest of your code for updating subscription and listing...
    } catch (error) {
      console.error("Error processing webhook:", error);
      return NextResponse.json(
        { error: "Error processing webhook" },
        { status: 500 }
      );
    }
  }

  try {
    if (event.type === "setup_intent.succeeded") {
      const setupIntent = event.data.object as Stripe.SetupIntent;

      if (setupIntent.payment_method && setupIntent.customer) {
        const paymentMethodId =
          typeof setupIntent.payment_method === "string"
            ? setupIntent.payment_method
            : setupIntent.payment_method.id;

        const paymentMethod = await stripe.paymentMethods.retrieve(
          paymentMethodId
        );

        // Check for duplicate card in database using fingerprint
        const { data: existingCards } = await supabase
          .from("payment_methods")
          .select("*")
          .eq("user_id", setupIntent.metadata?.userId)
          .eq("card_fingerprint", paymentMethod.card?.fingerprint);

        if (existingCards && existingCards.length > 0) {
          // If duplicate found, detach from Stripe
          await stripe.paymentMethods.detach(paymentMethodId);
          console.log("Duplicate card detected and detached from Stripe");
          return NextResponse.json(
            { error: "Duplicate card" },
            { status: 400 }
          );
        }

        // If not a duplicate, proceed with saving
        const { count } = await supabase
          .from("payment_methods")
          .select("*", { count: "exact" })
          .eq("user_id", setupIntent.metadata?.userId);

        const isFirstPaymentMethod = count === 0;

        if (isFirstPaymentMethod) {
          await stripe.customers.update(setupIntent.customer as string, {
            invoice_settings: {
              default_payment_method: paymentMethodId,
            },
          });
        }

        const { error: paymentMethodError } = await supabase
          .from("payment_methods")
          .insert({
            user_id: setupIntent.metadata?.userId,
            stripe_payment_method_id: paymentMethod.id,
            stripe_customer_id: setupIntent.customer as string,
            is_default: isFirstPaymentMethod,
            last_4: paymentMethod.card?.last4,
            card_brand: paymentMethod.card?.brand,
            exp_month: paymentMethod.card?.exp_month,
            exp_year: paymentMethod.card?.exp_year,
            card_fingerprint: paymentMethod.card?.fingerprint,
          });

        if (paymentMethodError) {
          // If database insert fails, detach from Stripe as cleanup
          await stripe.paymentMethods.detach(paymentMethodId);
          throw paymentMethodError;
        }
      }
    }
  } catch (error) {
    console.error("Error processing webhook:", error);
    return NextResponse.json(
      { error: "Webhook processing failed" },
      { status: 500 }
    );
  }

  return NextResponse.json({ received: true });
}

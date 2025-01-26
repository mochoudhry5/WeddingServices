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
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;

        const subscription = await stripe.subscriptions.retrieve(
          session.subscription as string
        );

        // Get payment method ID
        let paymentMethodId = null;
        if (session.payment_intent) {
          const paymentIntent = await stripe.paymentIntents.retrieve(
            session.payment_intent as string
          );
          paymentMethodId = paymentIntent.payment_method;

          if (paymentMethodId && typeof paymentMethodId === "string") {
            // Only handle payment method updates if this is a new payment method
            const paymentMethod = await stripe.paymentMethods.retrieve(
              paymentMethodId
            );

            // Delete any existing payment methods in Stripe
            const { data: existingPaymentMethods } = await supabase
              .from("payment_methods")
              .select("stripe_payment_method_id")
              .eq("user_id", session.metadata?.userId);

            if (existingPaymentMethods) {
              for (const pm of existingPaymentMethods) {
                try {
                  await stripe.paymentMethods.detach(
                    pm.stripe_payment_method_id
                  );
                } catch (error) {
                  console.error("Error detaching payment method:", error);
                }
              }
            }

            // Delete all existing payment methods from database
            await supabase
              .from("payment_methods")
              .delete()
              .eq("user_id", session.metadata?.userId);

            // Set the new payment method as default in Stripe
            await stripe.customers.update(subscription.customer as string, {
              invoice_settings: {
                default_payment_method: paymentMethodId,
              },
            });

            await stripe.subscriptions.update(subscription.id, {
              default_payment_method: paymentMethodId,
            });

            // Insert the new payment method
            const { error: paymentError } = await supabase
              .from("payment_methods")
              .insert({
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
        }

        // Update subscription status
        const { error } = await supabase.from("subscriptions").upsert({
          user_id: session.metadata?.userId,
          listing_id: session.metadata?.listing_id,
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

        if (error) throw error;

        // Update listing status
        const { error: updateError } = await supabase
          .from(`${session.metadata?.serviceType}_listing`)
          .update({
            is_draft: false,
          })
          .eq("id", session.metadata?.listing_id);

        if (updateError) throw updateError;
        break;
      }

      case "setup_intent.succeeded": {
        const setupIntent = event.data.object as Stripe.SetupIntent;

        if (setupIntent.payment_method && setupIntent.customer) {
          const paymentMethodId =
            typeof setupIntent.payment_method === "string"
              ? setupIntent.payment_method
              : setupIntent.payment_method.id;

          const paymentMethod = await stripe.paymentMethods.retrieve(
            paymentMethodId
          );

          // Delete existing payment methods in Stripe
          const { data: existingPaymentMethods } = await supabase
            .from("payment_methods")
            .select("stripe_payment_method_id")
            .eq("user_id", setupIntent.metadata?.userId);

          if (existingPaymentMethods) {
            for (const pm of existingPaymentMethods) {
              try {
                await stripe.paymentMethods.detach(pm.stripe_payment_method_id);
              } catch (error) {
                console.error("Error detaching payment method:", error);
              }
            }
          }

          // Delete all existing payment methods from database
          await supabase
            .from("payment_methods")
            .delete()
            .eq("user_id", setupIntent.metadata?.userId);

          // Set as default payment method in Stripe
          await stripe.customers.update(setupIntent.customer as string, {
            invoice_settings: {
              default_payment_method: paymentMethodId,
            },
          });

          // Insert new payment method
          const { error: paymentMethodError } = await supabase
            .from("payment_methods")
            .insert({
              user_id: setupIntent.metadata?.userId,
              stripe_payment_method_id: paymentMethod.id,
              stripe_customer_id: setupIntent.customer as string,
              is_default: true,
              last_4: paymentMethod.card?.last4,
              card_brand: paymentMethod.card?.brand,
              exp_month: paymentMethod.card?.exp_month,
              exp_year: paymentMethod.card?.exp_year,
              card_fingerprint: paymentMethod.card?.fingerprint,
            });

          if (paymentMethodError) {
            await stripe.paymentMethods.detach(paymentMethodId);
            throw paymentMethodError;
          }
        }
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

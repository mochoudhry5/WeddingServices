// supabase/functions/reactivate-subscription/index.ts

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import Stripe from "https://esm.sh/stripe@12.0.0?target=deno";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const STRIPE_SECRET_KEY = Deno.env.get("STRIPE_SECRET_KEY");
const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

if (!STRIPE_SECRET_KEY || !SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  throw new Error("Missing environment variables");
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const stripe = new Stripe(STRIPE_SECRET_KEY, {
      apiVersion: "2023-10-16",
      httpClient: Stripe.createFetchHttpClient(),
    });

    const supabaseAdmin = createClient(
      SUPABASE_URL,
      SUPABASE_SERVICE_ROLE_KEY,
      {
        auth: {
          persistSession: false,
        },
      }
    );

    const { subscriptionId } = await req.json();

    if (!subscriptionId) {
      throw new Error("Subscription ID is required");
    }

    // Verify user authentication
    const authHeader = req.headers.get("Authorization")?.split("Bearer ")[1];
    if (!authHeader) {
      throw new Error("No authorization header");
    }

    const {
      data: { user },
      error: authError,
    } = await supabaseAdmin.auth.getUser(authHeader);
    if (authError || !user) {
      throw new Error("Invalid authentication");
    }

    // Verify the subscription belongs to the user
    const { data: subscription, error: subError } = await supabaseAdmin
      .from("subscriptions")
      .select("*")
      .eq("stripe_subscription_id", subscriptionId)
      .eq("user_id", user.id)
      .single();

    if (subError || !subscription) {
      throw new Error("Subscription not found or unauthorized");
    }

    try {
      // Get the original subscription from Stripe
      const originalSubscription = await stripe.subscriptions.retrieve(
        subscriptionId
      );

      // Create a new subscription with the same parameters
      const newSubscription = await stripe.subscriptions.create({
        customer: subscription.stripe_customer_id,
        items: originalSubscription.items.data.map((item) => ({
          price: item.price.id,
          quantity: item.quantity,
        })),
        metadata: {
          listing_id: subscription.listing_id,
          service_type: subscription.service_type,
        },
      });

      // Update the subscription in our database
      const { error: updateError } = await supabaseAdmin
        .from("subscriptions")
        .update({
          stripe_subscription_id: newSubscription.id,
          status: newSubscription.status,
          cancel_at_period_end: false,
          current_period_end: new Date(
            newSubscription.current_period_end * 1000
          ).toISOString(),
        })
        .eq("id", subscription.id);

      if (updateError) throw updateError;

      // Create record in subscription history
      const { error: historyError } = await supabaseAdmin
        .from("subscription_history")
        .insert({
          subscription_id: subscription.id,
          action: "reactivated",
          metadata: {
            old_subscription_id: subscriptionId,
            new_subscription_id: newSubscription.id,
          },
        });

      if (historyError) throw historyError;

      // If the listing was deactivated, reactivate it
      const { error: listingError } = await supabaseAdmin
        .from(subscription.service_type + "_listing")
        .update({ status: "active" })
        .eq("id", subscription.listing_id);

      if (listingError) throw listingError;

      return new Response(
        JSON.stringify({
          message: "Subscription reactivated successfully",
          subscription: {
            id: newSubscription.id,
            status: newSubscription.status,
            current_period_end: new Date(
              newSubscription.current_period_end * 1000
            ).toISOString(),
          },
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200,
        }
      );
    } catch (error) {
      throw error;
    }
  } catch (error) {
    console.error("Error:", error);
    return new Response(
      JSON.stringify({
        error:
          error instanceof Error ? error.message : "An unknown error occurred",
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      }
    );
  }
});

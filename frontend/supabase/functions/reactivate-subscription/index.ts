import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import Stripe from "https://esm.sh/stripe@12.0.0?target=deno";

// First, import the necessary types from Stripe
type SubscriptionUpdateParams = Stripe.SubscriptionUpdateParams;

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
        auth: { persistSession: false },
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

    // Get subscription data from database
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
      // Get current subscription state from Stripe
      const stripeSubscription = await stripe.subscriptions.retrieve(
        subscriptionId
      );
      console.log("Current subscription state:", {
        id: stripeSubscription.id,
        status: stripeSubscription.status,
        cancel_at_period_end: stripeSubscription.cancel_at_period_end,
        cancel_at: stripeSubscription.cancel_at,
      });

      // Handle active subscription that's scheduled to cancel
      if (stripeSubscription.status === "active") {
        console.log("Reactivating active subscription");

        // Then define our reactivation settings with the correct type
        let reactivationSettings: SubscriptionUpdateParams = {
          billing_cycle_anchor: "unchanged" as const,
          proration_behavior: "none" as const,
        };

        // Now we can safely add the cancellation parameters
        if (stripeSubscription.cancel_at) {
          reactivationSettings = {
            ...reactivationSettings,
            cancel_at: null,
          };
        } else if (stripeSubscription.cancel_at_period_end) {
          reactivationSettings = {
            ...reactivationSettings,
            cancel_at_period_end: false,
          };
        }

        console.log("Applying reactivation settings:", reactivationSettings);

        const reactivatedSubscription = await stripe.subscriptions.update(
          subscriptionId,
          reactivationSettings
        );

        // Update our database - we only need to clear the cancellation status
        const { error: updateError } = await supabaseAdmin
          .from("subscriptions")
          .update({
            cancel_at_period_end: false,
          })
          .eq("id", subscription.id);

        if (updateError) throw updateError;

        return new Response(
          JSON.stringify({
            message: "Subscription reactivated successfully",
            subscription: {
              id: reactivatedSubscription.id,
              status: reactivatedSubscription.status,
              current_period_end: new Date(
                reactivatedSubscription.current_period_end * 1000
              ).toISOString(),
            },
          }),
          {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
            status: 200,
          }
        );
      }

      // Handle expired/inactive subscription - create new one
      console.log("Creating new subscription for expired subscription");

      // Get the appropriate price for the subscription
      const prices = await stripe.prices.list({
        active: true,
        lookup_keys: [
          `${subscription.service_type}_${subscription.tier_type}_${
            subscription.is_annual ? "annual" : "monthly"
          }`,
        ],
      });

      if (!prices.data.length) {
        throw new Error("Could not find matching price");
      }

      // Create a new subscription with the same parameters
      const newSubscription = await stripe.subscriptions.create({
        customer: subscription.stripe_customer_id,
        items: [{ price: prices.data[0].id }],
        metadata: {
          userId: user.id,
          listing_id: subscription.listing_id,
          serviceType: subscription.service_type,
          tierType: subscription.tier_type,
          isAnnual: String(subscription.is_annual),
        },
        payment_settings: {
          payment_method_options: {
            card: {
              mandate_options: {
                description: `Subscription for ${subscription.service_type} service`,
              },
              request_three_d_secure: "automatic",
            },
          },
        },
      });

      // Update our database with the new subscription ID
      const { error: updateError } = await supabaseAdmin
        .from("subscriptions")
        .update({
          stripe_subscription_id: newSubscription.id,
          cancel_at_period_end: false,
          // Let the webhook handle the rest of the updates
        })
        .eq("id", subscription.id);

      if (updateError) throw updateError;

      return new Response(
        JSON.stringify({
          message: "New subscription created successfully",
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
          error instanceof Error
            ? error.message
            : "An unexpected error occurred",
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      }
    );
  }
});

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

    // Verify subscription ownership
    const { data: subscription, error: subError } = await supabaseAdmin
      .from("subscriptions")
      .select("*")
      .eq("stripe_subscription_id", subscriptionId)
      .eq("user_id", user.id)
      .single();

    if (subError || !subscription) {
      throw new Error("Subscription not found or unauthorized");
    }

    // Get current subscription from Stripe with expanded discount information
    const currentSubscription = await stripe.subscriptions.retrieve(
      subscriptionId,
      {
        expand: ["discount", "discount.coupon"],
      }
    );

    // Log the subscription state before cancellation
    console.log("Current subscription state:", {
      id: currentSubscription.id,
      status: currentSubscription.status,
      discount: currentSubscription.discount,
      current_period_end: currentSubscription.current_period_end,
      cancel_at_period_end: currentSubscription.cancel_at_period_end,
      cancel_at: currentSubscription.cancel_at,
    });

    // Check for active discount
    const hasActiveDiscount =
      currentSubscription.discount ||
      (currentSubscription.discounts &&
        currentSubscription.discounts.length > 0);

    // Set up cancellation parameters
    let cancelationSettings: any = {
      proration_behavior: "none",
    };

    // Determine cancellation timing based on discount
    if (hasActiveDiscount && currentSubscription.discount?.end) {
      console.log(
        "Setting cancellation at discount end:",
        new Date(currentSubscription.discount.end * 1000)
      );
      cancelationSettings.cancel_at = currentSubscription.discount.end;
    } else {
      console.log("Setting cancellation at period end");
      cancelationSettings.cancel_at_period_end = true;
    }

    // Log the cancellation settings we're about to apply
    console.log("Applying cancellation settings:", cancelationSettings);

    // Update the subscription in Stripe
    const canceledSubscription = await stripe.subscriptions.update(
      subscriptionId,
      cancelationSettings
    );

    // Log the subscription after cancellation
    console.log("Subscription after cancellation:", {
      id: canceledSubscription.id,
      status: canceledSubscription.status,
      cancel_at: canceledSubscription.cancel_at,
      cancel_at_period_end: canceledSubscription.cancel_at_period_end,
    });

    // Update Supabase to reflect cancellation status
    // We set cancel_at_period_end to true for both types of cancellation
    // to indicate the subscription is scheduled to end
    const { error: updateError } = await supabaseAdmin
      .from("subscriptions")
      .update({
        cancel_at_period_end: true,
      })
      .eq("id", subscription.id);

    if (updateError) {
      console.error("Error updating Supabase:", updateError);
      throw new Error("Failed to update subscription status");
    }

    // Calculate remaining time for the response
    const effectiveEndDate =
      canceledSubscription.cancel_at || canceledSubscription.current_period_end;

    const now = new Date();
    const remainingDays = Math.ceil(
      (new Date(effectiveEndDate * 1000).getTime() - now.getTime()) /
        (1000 * 60 * 60 * 24)
    );

    return new Response(
      JSON.stringify({
        message: hasActiveDiscount
          ? "Subscription will be cancelled when the promotional period ends"
          : "Subscription will be cancelled at the end of the billing period",
        effectiveDate: new Date(effectiveEndDate * 1000).toISOString(),
        remainingDays,
        willBeChargedAgain: false,
        hasActiveDiscount,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
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

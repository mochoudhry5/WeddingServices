import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import Stripe from "https://esm.sh/stripe@12.0.0?target=deno";

declare global {
  interface Window {
    Deno: {
      env: {
        get(key: string): string | undefined;
      };
    };
  }
}

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

    // Get current subscription from Stripe to check details
    const currentSubscription = await stripe.subscriptions.retrieve(
      subscriptionId
    );

    // Check if there's an active discount
    const hasActiveDiscount =
      currentSubscription.discount ||
      (currentSubscription.discounts &&
        currentSubscription.discounts.length > 0);

    let cancelationSettings: any = {
      proration_behavior: "none", // Ensures no proration occurs
    };

    if (hasActiveDiscount) {
      // If there's a discount, cancel immediately when discount ends
      // Find the discount end timestamp
      const discount =
        currentSubscription.discount || currentSubscription.discounts?.[0];
      if (discount && "end" in discount) {
        cancelationSettings.cancel_at = discount.end;
      } else {
        // If we can't find the discount end date, fall back to period end
        cancelationSettings.cancel_at_period_end = true;
      }
    } else {
      // No discount - cancel at period end
      cancelationSettings.cancel_at_period_end = true;
    }

    // Cancel the subscription with determined settings
    const canceledSubscription = await stripe.subscriptions.update(
      subscriptionId,
      cancelationSettings
    );

    // Calculate remaining days
    const effectiveEndDate =
      canceledSubscription.cancel_at || canceledSubscription.current_period_end;
    const now = new Date();
    const remainingDays = Math.ceil(
      (new Date(effectiveEndDate * 1000).getTime() - now.getTime()) /
        (1000 * 60 * 60 * 24)
    );

    // Update subscription status in database
    const { error: updateError } = await supabaseAdmin
      .from("subscriptions")
      .update({
        status: "active", // Keep as active until the end
        cancel_at_period_end: true,
        current_period_end: new Date(
          canceledSubscription.current_period_end * 1000
        ).toISOString(),
        cancel_at: canceledSubscription.cancel_at
          ? new Date(canceledSubscription.cancel_at * 1000).toISOString()
          : null,
      })
      .eq("id", subscription.id);

    if (updateError) {
      throw new Error("Failed to update subscription status");
    }

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

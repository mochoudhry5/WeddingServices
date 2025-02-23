// supabase/functions/get-billing-data/index.ts
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import Stripe from "https://esm.sh/stripe@12.1.1?target=deno";

interface SubscriptionDetails {
  amount: number;
  currency: string;
  nextPaymentAttempt: number | null;
  periodEnd: number;
  trialEnd: number | null;
  recurring_price: number;
  recurring_currency: string;
  recurring_interval: string;
  product_name: string;
  billing_description: string;
  is_metered: boolean;
  trial_end_date: string | null;
}

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") ?? "", {
  httpClient: Stripe.createFetchHttpClient(),
});

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      {
        auth: { persistSession: false },
      }
    );

    const authHeader = req.headers.get("Authorization")?.split("Bearer ")[1];
    if (!authHeader) throw new Error("No authorization header");

    const {
      data: { user },
      error: authError,
    } = await supabaseClient.auth.getUser(authHeader);
    if (authError || !user) throw new Error("Invalid authentication");

    // Get user's subscriptions
    const { data: subscriptions, error: subscriptionError } =
      await supabaseClient
        .from("subscriptions")
        .select(
          `
        id,
        user_id,
        stripe_subscription_id,
        stripe_customer_id,
        status,
        service_type,
        is_trial,
        tier_type,
        is_annual,
        current_period_end,
        created_at,
        listing_id,
        cancel_at_period_end,
        trial_start,
        trial_end,
        promo_code
      `
        )
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

    if (subscriptionError) throw subscriptionError;

    // Get detailed Stripe information for active subscriptions
    const subscriptionDetails: Record<string, SubscriptionDetails> = {};
    const allSubscriptions = subscriptions || [];

    await Promise.all(
      allSubscriptions.map(async (sub) => {
        try {
          const subscription = await stripe.subscriptions.retrieve(
            sub.stripe_subscription_id,
            {
              expand: [
                "latest_invoice",
                "items.data.price",
                "items.data.price.product",
              ],
            }
          );

          const invoice = subscription.latest_invoice as Stripe.Invoice;
          const subscriptionItem = subscription.items.data[0];
          const price = subscriptionItem.price;
          const product = price.product as Stripe.Product;

          subscriptionDetails[sub.stripe_subscription_id] = {
            amount: invoice.amount_due,
            currency: invoice.currency,
            nextPaymentAttempt: invoice.next_payment_attempt,
            periodEnd: subscription.current_period_end,
            trialEnd: subscription.trial_end,
            recurring_price: price.unit_amount || 0,
            recurring_currency: price.currency,
            recurring_interval: price.recurring?.interval || "month",
            product_name: product.name || "Subscription",
            billing_description:
              price.nickname || product.name || "Subscription",
            is_metered: price.type === "metered",
            trial_end_date: subscription.trial_end
              ? new Date(subscription.trial_end * 1000).toISOString()
              : null,
          };
        } catch (error) {
          console.error(
            `Error fetching Stripe subscription ${sub.stripe_subscription_id}:`,
            error
          );
        }
      })
    );

    return new Response(
      JSON.stringify({
        subscriptions: subscriptions || [],
        subscriptionDetails,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error) {
    console.error("Error in get-billing-data:", error);
    return new Response(
      JSON.stringify({
        error:
          error instanceof Error ? error.message : "An unknown error occurred",
        details:
          Deno.env.get("ENVIRONMENT") === "development"
            ? error instanceof Error
              ? error.stack
              : null
            : undefined,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      }
    );
  }
});

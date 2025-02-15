// supabase/functions/delete-account/index.ts
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import Stripe from "https://esm.sh/stripe@12.0.0?target=deno";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  // Handle CORS
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    // Initialize Stripe
    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") ?? "", {
      apiVersion: "2023-10-16",
      httpClient: Stripe.createFetchHttpClient(),
    });

    // Initialize Supabase Admin Client
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      {
        auth: {
          persistSession: false,
        },
      }
    );

    // Get user from auth header
    const authHeader = req.headers.get("Authorization")?.split("Bearer ")[1];
    if (!authHeader) throw new Error("No authorization header");

    const {
      data: { user },
      error: authError,
    } = await supabaseAdmin.auth.getUser(authHeader);

    if (authError || !user) throw new Error("Invalid authentication");

    // Check for active subscriptions
    const { data: subscriptions, error: subError } = await supabaseAdmin
      .from("subscriptions")
      .select("*")
      .eq("user_id", user.id)
      .or("status.eq.active,status.eq.trialing,status.eq.past_due");

    if (subError) throw new Error("Failed to check subscriptions");

    // Filter active subscriptions
    const activeSubscriptions = subscriptions.filter((sub) => {
      if (sub.status === "active" && !sub.cancel_at_period_end) {
        return true;
      }

      if (sub.status === "active" && sub.cancel_at_period_end) {
        const periodEnd = new Date(sub.current_period_end);
        return periodEnd > new Date();
      }

      return ["trialing", "past_due"].includes(sub.status);
    });

    if (activeSubscriptions.length > 0) {
      const latestExpiryDate = new Date(
        Math.max(
          ...activeSubscriptions.map((sub) =>
            new Date(sub.current_period_end).getTime()
          )
        )
      );

      throw new Error(
        `Cannot delete account with active subscriptions. Latest subscription expires on ${latestExpiryDate.toLocaleDateString()}`
      );
    }

    // Get Stripe customer ID
    const { data: paymentMethod } = await supabaseAdmin
      .from("payment_methods")
      .select("stripe_customer_id")
      .eq("user_id", user.id)
      .single();

    // Delete Stripe customer if exists
    if (paymentMethod?.stripe_customer_id) {
      try {
        await stripe.customers.del(paymentMethod.stripe_customer_id);
      } catch (stripeError) {
        // Log the error but continue with account deletion
        // This handles cases where the customer might have already been deleted in Stripe
        console.error("Stripe customer deletion error:", stripeError);
      }
    }

    // Delete user data from database
    // Get request body
    const { isVendor } = await req.json();

    // Delete user data from database
    const { data: deletionResult, error: deleteError } =
      await supabaseAdmin.rpc("delete_user_data", {
        uid: user.id,
        is_vendor: isVendor,
      });

    if (deleteError) throw deleteError;
    if (!deletionResult?.success) {
      throw new Error(deletionResult?.error || "Failed to delete account");
    }

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    console.error("Error:", error);
    return new Response(
      JSON.stringify({
        error: error.message,
        details: error instanceof Error ? error.stack : undefined,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      }
    );
  }
});

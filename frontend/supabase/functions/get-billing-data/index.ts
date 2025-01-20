// supabase/functions/get-billing-data/index.ts
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    // Initialize Supabase client
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      {
        auth: { persistSession: false },
      }
    );

    // Get user from auth header
    const authHeader = req.headers.get("Authorization")?.split("Bearer ")[1];
    if (!authHeader) throw new Error("No authorization header");

    const {
      data: { user },
      error: authError,
    } = await supabaseClient.auth.getUser(authHeader);
    if (authError || !user) throw new Error("Invalid authentication");

    // Fetch all data in parallel
    const [subscriptionsResult, ...listingResults] = await Promise.all([
      // Get subscriptions
      supabaseClient
        .from("subscriptions")
        .select(
          `
          id,
          user_id,
          stripe_subscription_id,
          stripe_customer_id,
          status,
          service_type,
          tier_type,
          is_annual,
          current_period_end,
          created_at,
          listing_id, 
          cancel_at_period_end
        `
        )
        .eq("user_id", user.id)
        .order("created_at", { ascending: false }),

      // Get listings for each service type
      supabaseClient
        .from("dj_listing")
        .select("id, business_name, created_at")
        .eq("user_id", user.id),

      supabaseClient
        .from("photo_video_listing")
        .select("id, business_name, created_at")
        .eq("user_id", user.id),

      supabaseClient
        .from("hair_makeup_listing")
        .select("id, business_name, created_at")
        .eq("user_id", user.id),

      supabaseClient
        .from("venue_listing")
        .select("id, business_name, created_at")
        .eq("user_id", user.id),

      supabaseClient
        .from("wedding_planner_listing")
        .select("id, business_name, created_at")
        .eq("user_id", user.id),
    ]);

    // Check for errors
    const errors = [subscriptionsResult, ...listingResults]
      .filter((result) => result.error)
      .map((result) => result.error);

    if (errors.length > 0) {
      throw new Error(
        `Database errors: ${errors.map((e) => e.message).join(", ")}`
      );
    }

    // Format response
    const [
      djListings,
      photoVideoListings,
      hairMakeupListings,
      venueListings,
      weddingPlannerListings,
    ] = listingResults.map((result) => result.data || []);

    return new Response(
      JSON.stringify({
        subscriptions: subscriptionsResult.data || [],
        listings: {
          dj: djListings,
          photoVideo: photoVideoListings,
          hairMakeup: hairMakeupListings,
          venue: venueListings,
          weddingPlanner: weddingPlannerListings,
        },
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 400,
    });
  }
});

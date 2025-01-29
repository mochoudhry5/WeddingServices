// supabase/functions/get-invoices/index.ts

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

    // Verify user authentication
    const authHeader = req.headers.get("Authorization")?.split("Bearer ")[1];
    if (!authHeader) throw new Error("No authorization header");

    const {
      data: { user },
      error: authError,
    } = await supabaseAdmin.auth.getUser(authHeader);
    if (authError || !user) throw new Error("Invalid authentication");

    // Get all subscriptions for the user
    const { data: subscriptions, error: subError } = await supabaseAdmin
      .from("subscriptions")
      .select("stripe_customer_id")
      .eq("user_id", user.id);

    if (subError) throw subError;

    // Get unique customer IDs
    const customerIds = [
      ...new Set(subscriptions.map((sub) => sub.stripe_customer_id)),
    ];

    // Fetch invoices for each customer ID
    const allInvoices = [];
    for (const customerId of customerIds) {
      const invoices = await stripe.invoices.list({
        customer: customerId,
        limit: 100,
      });
      allInvoices.push(...invoices.data);
    }

    // Format invoices with relevant information
    const formattedInvoices = allInvoices.map((invoice) => ({
      id: invoice.id,
      number: invoice.number,
      created: new Date(invoice.created * 1000).toISOString(),
      amount_paid: invoice.amount_paid / 100,
      amount_due: invoice.amount_due / 100,
      status: invoice.status,
      subscription_id: invoice.subscription,
      hosted_invoice_url: invoice.hosted_invoice_url,
    }));

    return new Response(
      JSON.stringify({
        invoices: formattedInvoices,
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

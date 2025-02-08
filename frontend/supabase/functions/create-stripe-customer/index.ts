import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@12.0.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";

const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY")!);
const supabase = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
);

serve(async (req) => {
  const { record } = await req.json();
  try {
    const { data, error } = await supabase.auth.admin.getUserById(record.id);

    if (error) throw error;

    const customer = await stripe.customers.create({
      email: data.user.email,
      metadata: { userId: record.id },
    });

    const { error: userPreferencesError } = await supabase
      .from("user_preferences")
      .update({ stripe_customer_id: customer.id })
      .eq("id", record.id);

    if (userPreferencesError) throw userPreferencesError;

    return new Response(JSON.stringify({ customerId: customer.id }));
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 400,
    });
  }
});

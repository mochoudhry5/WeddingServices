// supabase/functions/cancel-subscription/index.ts

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
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
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const STRIPE_SECRET_KEY = Deno.env.get('STRIPE_SECRET_KEY');
const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

if (!STRIPE_SECRET_KEY || !SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  throw new Error('Missing environment variables');
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const stripe = new Stripe(STRIPE_SECRET_KEY, {
      apiVersion: '2023-10-16',
      httpClient: Stripe.createFetchHttpClient(),
    });

    const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
      auth: {
        persistSession: false,
      },
    });

    const { subscriptionId } = await req.json();

    if (!subscriptionId) {
      throw new Error('Subscription ID is required');
    }

    const authHeader = req.headers.get('Authorization')?.split('Bearer ')[1];
    if (!authHeader) {
      throw new Error('No authorization header');
    }

    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(authHeader);
    if (authError || !user) {
      throw new Error('Invalid authentication');
    }

    // Verify subscription ownership
    const { data: subscription, error: subError } = await supabaseAdmin
      .from('subscriptions')
      .select('*')
      .eq('stripe_subscription_id', subscriptionId)
      .eq('user_id', user.id)
      .single();

    if (subError || !subscription) {
      throw new Error('Subscription not found or unauthorized');
    }

    // Get current subscription from Stripe to check details
    const currentSubscription = await stripe.subscriptions.retrieve(subscriptionId);

    // Calculate remaining days in the current period
    const currentPeriodEnd = new Date(currentSubscription.current_period_end * 1000);
    const now = new Date();
    const remainingDays = Math.ceil((currentPeriodEnd.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

    // Cancel the subscription with specific settings
    const canceledSubscription = await stripe.subscriptions.update(subscriptionId, {
      cancel_at_period_end: true, // This will cancel at the end of the current period
      proration_behavior: 'none', // Ensures no proration occurs
    });

    // Update subscription status in database
    const { error: updateError } = await supabaseAdmin
      .from('subscriptions')
      .update({
        status: 'active', // Keep as active until the end of period
        cancel_at_period_end: true, // Add this field to your subscriptions table
        current_period_end: new Date(canceledSubscription.current_period_end * 1000).toISOString(),
      })
      .eq('id', subscription.id);

    if (updateError) {
      throw new Error('Failed to update subscription status');
    }

    return new Response(
      JSON.stringify({
        message: 'Subscription will be cancelled at the end of the billing period',
        effectiveDate: new Date(canceledSubscription.current_period_end * 1000).toISOString(),
        remainingDays,
        willBeChargedAgain: false
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );

  } catch (error) {
    console.error('Error:', error);
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : 'An unknown error occurred',
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    );
  }
});
"use client";

import React, { useState, useEffect } from "react";
import { CreditCard, Link, RefreshCcw, XCircle } from "lucide-react";
import NextLink from "next/link";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { AddPaymentMethodDialog } from "./AddPaymentMethodDialog";
import { Invoice } from "@/lib/stripe";
import InvoicesSection from "./InvoicesSection";

// Types for subscription data
interface StripeSubscription {
  id: string;
  user_id: string;
  stripe_subscription_id: string;
  stripe_customer_id: string;
  status: string;
  service_type: string;
  is_trial: boolean;
  tier_type: string;
  is_annual: boolean;
  current_period_end: string;
  created_at: string;
  listing_id: string;
  cancel_at_period_end: boolean;
  trial_start: string | null;
  trial_end: string | null;
  promo_code: string | null;
}

// Types for subscription details from Stripe
interface SubscriptionDetails {
  amount: number;
  currency: string;
  nextPaymentAttempt: number | null;
  periodEnd: number;
  trialEnd: number | null;
  recurring_price: number; // The full subscription price
  recurring_currency: string; // The currency for the full price
}

// Combined billing data response
interface BillingData {
  subscriptions: StripeSubscription[];
  subscriptionDetails: { [key: string]: SubscriptionDetails };
  listings: ListingsByCategory;
}

// Types for listing data
interface ListingsByCategory {
  dj: BaseListing[];
  photoVideo: BaseListing[];
  hairMakeup: BaseListing[];
  venue: BaseListing[];
  weddingPlanner: BaseListing[];
}

interface BaseListing {
  id: string;
  business_name: string;
  created_at: string;
}

interface PaymentMethod {
  id: string;
  user_id: string;
  stripe_payment_method_id: string;
  stripe_customer_id: string;
  last_4: string;
  card_brand: string;
  exp_month: number;
  exp_year: number;
}

// Service type labels for display
const labelMap: Record<string, string> = {
  venue: "Venue",
  dj: "DJ",
  hair_makeup: "Hair & Makeup",
  wedding_planner: "Wedding Planner",
  photo_video: "Photography & Videography",
};

const PaymentMethodSection = ({
  paymentMethod,
  onUpdatePaymentMethod,
}: {
  paymentMethod: PaymentMethod | null;
  onUpdatePaymentMethod: () => void;
}) => {
  if (!paymentMethod) {
    return (
      <div className="mb-8 rounded-lg bg-gray-50 p-6">
        <div className="flex justify-between items-center">
          <div>
            <h3 className="text-lg font-medium text-black">Payment</h3>
            <p className="text-gray-600 mt-1">Link by Stripe</p>
          </div>
          <button
            onClick={onUpdatePaymentMethod}
            className="text-black hover:text-gray-400 transition-colors font-medium"
          >
            Add
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="mb-8 rounded-lg bg-gray-50 p-6">
      <div className="flex flex-col space-y-4">
        <div className="flex justify-between items-center">
          <div>
            <h3 className="text-lg font-medium text-black">Payment</h3>
            <p className="text-gray-600 mt-1">Link by Stripe</p>
          </div>
          <button
            onClick={onUpdatePaymentMethod}
            className="text-black hover:text-gray-400 transition-colors font-medium"
          >
            Update
          </button>
        </div>
        <div className="flex items-center space-x-4 border-t border-gray-700 pt-4">
          <div className="w-12 h-8 bg-gray-700 rounded flex items-center justify-center">
            <CreditCard size={20} className="text-gray-300" />
          </div>
          <div>
            <p className="text-sm font-medium text-black">
              {paymentMethod.card_brand.charAt(0).toUpperCase() +
                paymentMethod.card_brand.slice(1)}{" "}
              •••• {paymentMethod.last_4}
            </p>
            <p className="text-sm text-gray-400">
              Expires {paymentMethod.exp_month.toString().padStart(2, "0")}/
              {paymentMethod.exp_year}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

// Helper function to convert service types for URLs
// This ensures our frontend routes match our database service types
function getServiceTypeForUrl(serviceType: string): string {
  const mapping: { [key: string]: string } = {
    wedding_planner: "weddingPlanner",
    hair_makeup: "hairMakeup",
    photo_video: "photoVideo",
    dj: "dj",
    venue: "venue",
  };
  return mapping[serviceType] || serviceType;
}

// Props interface for the SubscriptionSection component
interface SubscriptionSectionProps {
  title: string;
  subscriptions: StripeSubscription[];
  subscriptionDetails: { [key: string]: SubscriptionDetails };
  onCancelSubscription: (subscription: StripeSubscription) => void;
  onReactivateSubscription: (subscription: StripeSubscription) => void;
  showReactivate?: boolean;
  isExpiring?: boolean;
  isExpired?: boolean;
}

// Component to display a section of subscriptions
const SubscriptionSection: React.FC<SubscriptionSectionProps> = ({
  title,
  subscriptions,
  subscriptionDetails,
  onCancelSubscription,
  onReactivateSubscription,
  showReactivate = false,
  isExpiring = false,
  isExpired = false,
}) => {
  if (subscriptions.length === 0) return null;

  // Formats currency amounts with proper currency symbol and decimal places
  const formatCurrency = (amount: number, currency: string) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: currency.toUpperCase(),
    }).format(amount / 100);
  };

  // Calculates remaining trial days for trial subscriptions
  const getRemainingTrialDays = (subscription: StripeSubscription) => {
    if (!subscription.is_trial || !subscription.trial_end) return null;

    const trialEnd = new Date(subscription.trial_end);
    const now = new Date();

    if (trialEnd <= now) return null;

    const daysRemaining = Math.ceil(
      (trialEnd.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
    );
    return daysRemaining > 0 ? daysRemaining : null;
  };

  // Gets formatted next payment information including trial status
  const getNextPaymentInfo = (subscription: StripeSubscription) => {
    const details = subscriptionDetails[subscription.stripe_subscription_id];
    if (!details) return null;

    const trialDays = getRemainingTrialDays(subscription);
    if (trialDays) {
      // Get the full price from the subscription details
      const fullPrice = details.recurring_price || details.amount;
      return `Free for ${trialDays} days, then ${formatCurrency(
        fullPrice,
        details.currency
      )}`;
    }

    return details.amount === 0
      ? "Free"
      : formatCurrency(details.amount, details.currency);
  };

  return (
    <div className="mb-8">
      <div className="border rounded-lg bg-white">
        <div className="flex justify-between items-center py-4 px-6 border-b">
          <h3 className="text-xl font-bold text-gray-900">{title}</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th
                  scope="col"
                  className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  {isExpired
                    ? "End Date"
                    : isExpiring
                    ? "Expires On"
                    : "Next Payment"}
                </th>
                <th
                  scope="col"
                  className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Plan Type
                </th>
                <th
                  scope="col"
                  className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Status
                </th>
                <th
                  scope="col"
                  className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Listing
                </th>
                <th
                  scope="col"
                  className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 bg-white">
              {subscriptions.map((subscription) => (
                <tr
                  key={subscription.id}
                  className="hover:bg-gray-50 transition-colors"
                >
                  {/* Payment/Expiry Date Column */}
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex flex-col">
                      <span
                        className={
                          subscription.cancel_at_period_end
                            ? "text-red-600"
                            : "text-gray-900"
                        }
                      >
                        {subscription.is_trial && subscription.trial_end ? (
                          <div>
                            {new Date(
                              subscription.trial_end
                            ).toLocaleDateString()}
                          </div>
                        ) : (
                          <div>
                            {new Date(
                              subscription.current_period_end
                            ).toLocaleDateString()}
                          </div>
                        )}
                      </span>
                      {subscription.status === "active" &&
                        !subscription.cancel_at_period_end && (
                          <span className="text-sm text-gray-500">
                            {getNextPaymentInfo(subscription)}
                          </span>
                        )}
                    </div>
                  </td>
                  {/* Plan Type Column */}
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">
                      {labelMap[subscription.service_type]}
                    </div>
                    <div className="text-sm text-gray-500">
                      {subscription.tier_type.charAt(0).toUpperCase() +
                        subscription.tier_type.slice(1)}{" "}
                      ({subscription.is_annual ? "Annual" : "Monthly"})
                    </div>
                  </td>
                  {/* Status Column */}
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <div className="flex flex-col gap-1.5">
                      <span
                        className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium w-fit
                        ${
                          subscription.status === "active" &&
                          !subscription.cancel_at_period_end
                            ? "bg-green-50 text-green-700"
                            : subscription.status === "active" &&
                              subscription.cancel_at_period_end
                            ? "bg-yellow-100 text-yellow-800"
                            : subscription.status === "past_due"
                            ? "bg-yellow-100 text-yellow-800"
                            : "bg-red-100 text-red-800"
                        }`}
                      >
                        {subscription.status.charAt(0).toUpperCase() +
                          subscription.status.slice(1)}
                      </span>
                    </div>
                  </td>
                  {/* Listing Link Column */}
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <NextLink
                      href={`/services/${getServiceTypeForUrl(
                        subscription.service_type
                      )}/${subscription.listing_id}`}
                      className="text-gray-600 hover:text-gray-900 transition-colors"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <Link size={20} />
                    </NextLink>
                  </td>
                  {/* Actions Column */}
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <div className="flex items-center space-x-3">
                      {subscription.status === "active" &&
                        !subscription.cancel_at_period_end && (
                          <button
                            onClick={() => onCancelSubscription(subscription)}
                            className="inline-flex items-center space-x-1 text-red-600 hover:text-red-800"
                          >
                            <XCircle size={16} />
                            <span>Cancel</span>
                          </button>
                        )}
                      {showReactivate && (
                        <button
                          onClick={() => onReactivateSubscription(subscription)}
                          className="inline-flex items-center space-x-1 text-green-600 hover:text-green-800"
                        >
                          <RefreshCcw size={16} />
                          <span>Reactivate</span>
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}; // Main Billing Component
const Billing: React.FC = () => {
  // State Management
  // We use BillingData interface to maintain a single source of truth for subscription and listing data
  const { user } = useAuth();
  const [billingData, setBillingData] = useState<BillingData>({
    subscriptions: [],
    subscriptionDetails: {},
    listings: {
      dj: [],
      photoVideo: [],
      hairMakeup: [],
      venue: [],
      weddingPlanner: [],
    },
  });

  // UI state management
  const [loading, setLoading] = useState(true);
  const [subscriptionToCancel, setSubscriptionToCancel] =
    useState<StripeSubscription | null>(null);
  const [subscriptionToReactivate, setSubscriptionToReactivate] =
    useState<StripeSubscription | null>(null);
  const [showAddPaymentMethod, setShowAddPaymentMethod] = useState(false);
  const [setupIntentSecret, setSetupIntentSecret] = useState<string | null>(
    null
  );
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod | null>(
    null
  );
  const [invoices, setInvoices] = useState<Invoice[]>([]);

  // Data fetching on component mount and when user changes
  useEffect(() => {
    const fetchBillingData = async () => {
      if (!user?.id) return;

      try {
        // Get billing data
        const { data: billingResponse, error: billingError } =
          await supabase.functions.invoke<BillingData>("get-billing-data");

        // Handle errors explicitly
        if (billingError) throw billingError;
        if (!billingResponse) throw new Error("No billing data received");

        // Now TypeScript knows billingResponse is definitely BillingData
        setBillingData(billingResponse);

        // Fetch invoices
        const { data: invoiceData, error: invoiceError } =
          await supabase.functions.invoke("get-invoices");

        // Handle invoice errors similarly
        if (invoiceError) throw invoiceError;
        if (!invoiceData) throw new Error("No invoice data received");

        setInvoices(invoiceData.invoices);

        // Get payment method
        const { data: methodData, error: methodError } = await supabase
          .from("payment_methods")
          .select("*")
          .eq("user_id", user.id)
          .single();

        // PGRST116 is the error code for no rows returned - this is expected
        if (methodError && methodError.code !== "PGRST116") throw methodError;
        setPaymentMethod(methodData || null);
      } catch (error) {
        console.error("Error fetching billing data:", error);
        toast.error("Failed to load billing information");
      } finally {
        setLoading(false);
      }
    };

    fetchBillingData();
  }, [user?.id]);

  // Handles adding or updating a payment method
  const handleAddOrUpdatePaymentMethod = async () => {
    try {
      // Require an active subscription to add payment method
      if (!billingData.subscriptions.length && !paymentMethod) {
        toast.error("You need an active subscription to add a payment method");
        return;
      }

      // Get customer ID from existing payment method or subscription
      const customerId =
        paymentMethod?.stripe_customer_id ||
        billingData.subscriptions[0]?.stripe_customer_id;

      const { data, error } = await supabase.functions.invoke(
        "create-setup-intent",
        {
          body: { customerId },
        }
      );

      if (error) throw error;

      setSetupIntentSecret(data.clientSecret);
      setShowAddPaymentMethod(true);
    } catch (error) {
      console.error("Error creating setup intent:", error);
      toast.error("Failed to initialize payment method setup");
    }
  };

  // Handles successful payment method addition
  const handlePaymentMethodAdded = async () => {
    try {
      if (!user?.id) return;

      const { data: methodData, error: methodError } = await supabase
        .from("payment_methods")
        .select("*")
        .eq("user_id", user.id)
        .single();

      if (methodError) throw methodError;
      setPaymentMethod(methodData);
      setShowAddPaymentMethod(false);
      setSetupIntentSecret(null);
      toast.success("Payment method updated successfully");
    } catch (error) {
      console.error("Error refreshing payment method:", error);
      toast.error("Failed to refresh payment method");
    }
  };

  // Handles subscription cancellation
  const handleCancelSubscription = async () => {
    if (!subscriptionToCancel) return;

    try {
      const { data, error } = await supabase.functions.invoke(
        "cancel-subscription",
        {
          body: {
            subscriptionId: subscriptionToCancel.stripe_subscription_id,
          },
        }
      );

      if (error) throw error;

      // Update local state to reflect cancellation
      setBillingData((prev) => ({
        ...prev,
        subscriptions: prev.subscriptions.map((sub) =>
          sub.id === subscriptionToCancel.id
            ? { ...sub, cancel_at_period_end: true }
            : sub
        ),
      }));

      toast.success(
        `Subscription will be cancelled on ${new Date(
          data.effectiveDate
        ).toLocaleDateString()}`
      );
    } catch (error) {
      console.error("Error cancelling subscription:", error);
      toast.error("Failed to cancel subscription");
    } finally {
      setSubscriptionToCancel(null);
    }
  };

  // Handles subscription reactivation
  const handleReactivateSubscription = async () => {
    if (!subscriptionToReactivate) return;

    try {
      const { data, error } = await supabase.functions.invoke(
        "reactivate-subscription",
        {
          body: {
            subscriptionId: subscriptionToReactivate.stripe_subscription_id,
            idempotencyKey: crypto.randomUUID(), // Prevent duplicate reactivations
          },
        }
      );

      if (error) throw error;

      // Refresh all billing data to get updated subscription status
      const { data: billingResponse, error: billingError } =
        await supabase.functions.invoke<BillingData>("get-billing-data");
      if (billingError) throw billingError;
      if (!billingResponse) throw new Error("No billing data received");

      setBillingData(billingResponse);
      toast.success("Subscription reactivated successfully");
    } catch (error) {
      console.error("Error reactivating subscription:", error);
      toast.error("Failed to reactivate subscription");
    } finally {
      setSubscriptionToReactivate(null);
    }
  };

  // Filter subscriptions by their status for display
  const activeSubscriptions = billingData.subscriptions.filter(
    (sub) => sub.status === "active" && !sub.cancel_at_period_end
  );

  const cancelingSubscriptions = billingData.subscriptions.filter(
    (sub) => sub.status === "active" && sub.cancel_at_period_end
  );

  const inactiveSubscriptions = billingData.subscriptions.filter(
    (sub) => sub.status === "inactive" || sub.status === "canceled"
  );

  // Loading state
  if (loading) {
    return (
      <div className="min-h-[390px] flex items-center justify-center">
        <div className="text-gray-500">Loading billing information...</div>
      </div>
    );
  }

  if (billingData.subscriptions.length === 0) {
    return (
      <div className="min-h-[390px] flex items-center justify-center">
        <div className="text-center">
          <CreditCard size={48} className="mx-auto text-gray-400 mb-4" />
          <p className="text-gray-500">
            No listings or billing information available
          </p>
          <p className="text-sm text-gray-400 mt-2">
            Create a listing to start managing your billing
          </p>
        </div>
      </div>
    );
  } // Main render method for the billing interface
  return (
    <div className="min-h-[390px] flex flex-col">
      {/* Header Section */}
      <div className="mb-6">
        <h3 className="text-lg font-medium">Billing</h3>
        <p className="text-sm text-gray-500">
          Manage and view your payment method and subscription history
        </p>
      </div>

      {/* Payment Method Section */}
      <PaymentMethodSection
        paymentMethod={paymentMethod}
        onUpdatePaymentMethod={handleAddOrUpdatePaymentMethod}
      />

      {/* Subscription Sections */}
      <SubscriptionSection
        title="Active Subscriptions"
        subscriptions={activeSubscriptions}
        subscriptionDetails={billingData.subscriptionDetails}
        onCancelSubscription={setSubscriptionToCancel}
        onReactivateSubscription={setSubscriptionToReactivate}
      />

      <SubscriptionSection
        title="Expiring Soon Subscriptions"
        subscriptions={cancelingSubscriptions}
        subscriptionDetails={billingData.subscriptionDetails}
        onCancelSubscription={setSubscriptionToCancel}
        onReactivateSubscription={setSubscriptionToReactivate}
        showReactivate={true}
        isExpiring={true}
      />

      <SubscriptionSection
        title="Expired Subscriptions"
        subscriptions={inactiveSubscriptions}
        subscriptionDetails={billingData.subscriptionDetails}
        onCancelSubscription={setSubscriptionToCancel}
        onReactivateSubscription={setSubscriptionToReactivate}
        showReactivate={true}
        isExpired={true}
      />

      {/* Invoice History Section */}
      <InvoicesSection invoices={invoices} />

      {/* Cancel Subscription Dialog */}
      <AlertDialog
        open={!!subscriptionToCancel}
        onOpenChange={() => setSubscriptionToCancel(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Cancel Subscription</AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-2">
                <div>Are you sure you want to cancel this subscription?</div>
                {subscriptionToCancel?.is_trial ? (
                  <div className="font-medium text-gray-700">
                    Your trial will end immediately and you will lose access to
                    the service.
                  </div>
                ) : (
                  <div className="font-medium text-gray-700">
                    Your service will continue until{" "}
                    {subscriptionToCancel &&
                      new Date(
                        subscriptionToCancel.current_period_end
                      ).toLocaleDateString()}{" "}
                    since you've already paid for this period.
                  </div>
                )}
                <div className="text-sm text-gray-500">
                  No refunds will be issued for the current billing period.
                </div>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Keep Subscription</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleCancelSubscription}
              className="bg-red-600 text-white hover:bg-red-700"
            >
              Cancel Subscription
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Reactivate Subscription Dialog */}
      <AlertDialog
        open={!!subscriptionToReactivate}
        onOpenChange={() => setSubscriptionToReactivate(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Reactivate Subscription</AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-2">
                <div>Would you like to reactivate this subscription?</div>
                {subscriptionToReactivate?.is_trial &&
                new Date(subscriptionToReactivate.trial_end!) > new Date() ? (
                  <div>
                    Your trial period will resume with the remaining time.
                  </div>
                ) : (
                  <div>
                    {billingData.subscriptionDetails[
                      subscriptionToReactivate?.stripe_subscription_id!
                    ]?.amount === 0
                      ? "Your subscription will be reactivated at no cost."
                      : "You will be charged for the subscription upon reactivation."}
                  </div>
                )}
                <div className="text-sm text-gray-500">
                  Your subscription will renew at the same rate as before.
                </div>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleReactivateSubscription}
              className="bg-green-600 text-white hover:bg-green-700"
            >
              Reactivate Subscription
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Add/Update Payment Method Dialog */}
      <AddPaymentMethodDialog
        open={showAddPaymentMethod}
        onClose={() => {
          setShowAddPaymentMethod(false);
          setSetupIntentSecret(null);
        }}
        clientSecret={setupIntentSecret}
        onSuccess={handlePaymentMethodAdded}
      />
    </div>
  );
};

export default Billing;

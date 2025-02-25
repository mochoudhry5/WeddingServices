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
import { formatInTimeZone } from "date-fns-tz";
import { toZonedTime } from "date-fns-tz";
import { FunctionsHttpError } from "@supabase/supabase-js";
import { json } from "node:stream/consumers";

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

  // Calculates remaining trial days with timezone awareness
  const getRemainingTrialDays = (subscription: StripeSubscription) => {
    if (!subscription.is_trial || !subscription.trial_end) return null;

    // Get user's timezone
    const userTimeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;

    // Convert dates to user's timezone
    const trialEnd = toZonedTime(
      new Date(subscription.trial_end),
      userTimeZone
    );
    const now = toZonedTime(new Date(), userTimeZone);

    if (trialEnd <= now) return null;

    // Calculate the difference in milliseconds
    const timeDiff = trialEnd.getTime() - now.getTime();

    // Get remaining time in hours
    const hoursRemaining = timeDiff / (1000 * 60 * 60);

    if (hoursRemaining < 24) {
      // If less than a day, return a decimal
      return hoursRemaining / 24;
    }

    // Subtract one day since payment occurs on the last day
    return Math.ceil(timeDiff / (1000 * 60 * 60 * 24)) - 1;
  };

  // Gets formatted next payment information including trial status
  const getNextPaymentInfo = (subscription: StripeSubscription) => {
    const details = subscriptionDetails[subscription.stripe_subscription_id];
    if (!details) return null;

    const trialDays = getRemainingTrialDays(subscription);
    if (trialDays !== null) {
      // Get the full price from the subscription details
      const fullPrice = details.recurring_price || details.amount;

      // Format the trial remaining time
      let trialText;
      if (trialDays < 1) {
        const hoursLeft = Math.ceil(trialDays * 24);
        trialText = `Free for ${hoursLeft} hour${hoursLeft !== 1 ? "s" : ""}`;
      } else {
        trialText = `Free for ${Math.ceil(trialDays)} day${
          Math.ceil(trialDays) !== 1 ? "s" : ""
        }`;
      }

      return `${trialText}, then ${formatCurrency(
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
        <div className="overflow-x-auto w-full">
          <table className="w-full min-w-full table-fixed">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th
                  scope="col"
                  className="px-4 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-1/5"
                >
                  {isExpired
                    ? "End Date"
                    : isExpiring
                    ? "Expires On"
                    : "Next Payment"}
                </th>
                <th
                  scope="col"
                  className="px-4 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-1/5"
                >
                  Plan Type
                </th>
                <th
                  scope="col"
                  className="px-4 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-1/5"
                >
                  Status
                </th>
                <th
                  scope="col"
                  className="px-4 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-1/5"
                >
                  Listing
                </th>
                <th
                  scope="col"
                  className="px-4 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-1/5"
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
                  <td className="px-4 py-4 text-sm break-words">
                    <div className="flex flex-col">
                      <span
                        className={
                          subscription.cancel_at_period_end
                            ? "text-red-600"
                            : "text-gray-900"
                        }
                      >
                        {(() => {
                          const date = new Date(
                            subscription.is_trial && subscription.trial_end
                              ? subscription.trial_end
                              : subscription.current_period_end
                          );
                          const timeZone =
                            Intl.DateTimeFormat().resolvedOptions().timeZone;

                          const formattedDate = formatInTimeZone(
                            date,
                            timeZone,
                            "PPP"
                          );
                          return formattedDate;
                        })()}
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
                  <td className="px-4 py-4 text-sm break-words">
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
                  <td className="px-4 py-4 text-sm break-words">
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
                  <td className="px-4 py-4 text-sm break-words">
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
                  <td className="px-4 py-4 text-sm break-words">
                    <div className="flex items-center space-x-3">
                      {subscription.status === "active" &&
                        !subscription.cancel_at_period_end && (
                          <button
                            onClick={() => onCancelSubscription(subscription)}
                            className="inline-flex items-center text-red-600 hover:text-red-800"
                          >
                            <XCircle size={16} className="mr-1" />
                            <span className="hidden sm:inline">Cancel</span>
                          </button>
                        )}
                      {showReactivate && (
                        <button
                          onClick={() => onReactivateSubscription(subscription)}
                          className="inline-flex items-center text-green-600 hover:text-green-800"
                        >
                          <RefreshCcw size={16} className="mr-1" />
                          <span className="hidden sm:inline">Reactivate</span>
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
};
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
  const [isReactivating, setIsReactivating] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);

  // Data fetching on component mount and when user changes
  useEffect(() => {
    fetchBillingData();
  }, [user?.id]);

  const fetchBillingData = async () => {
    if (!user?.id) return;

    try {
      // Get billing data
      const { data: billingResponse, error: billingError } =
        await supabase.functions.invoke<BillingData>("get-billing-data");

      if (billingError instanceof FunctionsHttpError) {
        const errorMessage = await billingError.context.json();
        console.log("Function returned an error", errorMessage);
        if (errorMessage) throw new Error(errorMessage.error);
      }

      // Handle errors explicitly
      if (billingError) throw billingError;
      if (!billingResponse) throw new Error("No billing data received");

      // Now TypeScript knows billingResponse is definitely BillingData
      setBillingData(billingResponse);

      // Fetch invoices
      const { data: invoiceData, error: invoiceError } =
        await supabase.functions.invoke("get-invoices");

      if (invoiceError instanceof FunctionsHttpError) {
        const errorMessage = await invoiceError.context.json();
        console.log("Function returned an error", errorMessage);
        if (errorMessage) throw new Error(errorMessage.error);
      }

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

      if (error instanceof FunctionsHttpError) {
        const errorMessage = await error.context.json();
        console.log("Function returned an error", errorMessage);
        if (errorMessage) throw new Error(errorMessage.error);
      }

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

    setIsCancelling(true);
    try {
      const { data, error } = await supabase.functions.invoke(
        "cancel-subscription",
        {
          body: {
            subscriptionId: subscriptionToCancel.stripe_subscription_id,
          },
        }
      );

      if (error instanceof FunctionsHttpError) {
        const errorMessage = await error.context.json();
        console.log("Function returned an error", errorMessage);
        if (errorMessage) throw new Error(errorMessage.error);
      }

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
      setIsCancelling(false);
    }
  };

  // Handles subscription reactivation
  const handleReactivateSubscription = async () => {
    if (!subscriptionToReactivate) return;

    setIsReactivating(true);
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

      if (error instanceof FunctionsHttpError) {
        const errorMessage = await error.context.json();
        console.log("Function returned an error", errorMessage);
        if (errorMessage) throw new Error(errorMessage.error);
      }

      if (error) throw error;

      await fetchBillingData();
      toast.success("Subscription reactivated successfully");
    } catch (error) {
      console.error("Error reactivating subscription:", error);
      toast.error("Failed to reactivate subscription");
    } finally {
      setSubscriptionToReactivate(null);
      setIsReactivating(false);
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
            <button
              onClick={handleCancelSubscription}
              className="bg-red-600 text-white hover:bg-red-700 relative h-10 px-4 py-2 rounded-md"
              disabled={isCancelling}
            >
              {isCancelling ? (
                <>
                  <span className="opacity-0">Cancel Subscription</span>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="h-5 w-5 animate-spin rounded-full border-b-2 border-white"></div>
                  </div>
                </>
              ) : (
                "Cancel Subscription"
              )}
            </button>
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
                    ]?.amount === 0 ? (
                      "Your subscription will be reactivated at no cost."
                    ) : subscriptionToReactivate?.status === "inactive" ||
                      subscriptionToReactivate?.status === "canceled" ? (
                      <div className="font-medium text-gray-700">
                        Your card ending in {paymentMethod?.last_4} will be
                        charged{" "}
                        {(() => {
                          const details =
                            subscriptionToReactivate?.stripe_subscription_id
                              ? billingData.subscriptionDetails[
                                  subscriptionToReactivate
                                    .stripe_subscription_id
                                ]
                              : null;

                          if (
                            !details?.recurring_price ||
                            !details?.recurring_currency
                          ) {
                            return "your subscription amount";
                          }

                          return new Intl.NumberFormat("en-US", {
                            style: "currency",
                            currency: details.recurring_currency.toUpperCase(),
                          }).format(details.recurring_price / 100);
                        })()}{" "}
                        immediately upon reactivation.
                      </div>
                    ) : (
                      <div>
                        Your subscription will resume with your current billing
                        cycle.
                      </div>
                    )}
                  </div>
                )}
                <div className="text-sm text-gray-500">
                  {subscriptionToReactivate?.status === "inactive" ||
                  subscriptionToReactivate?.status === "canceled"
                    ? "Your subscription will continue to renew at this rate unless cancelled."
                    : "Your next renewal will be at your regular subscription rate."}
                </div>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <button
              onClick={handleReactivateSubscription}
              className="bg-green-600 text-white hover:bg-green-700 relative h-10 px-4 py-2 rounded-md"
            >
              {isReactivating ? (
                <>
                  <span className="opacity-0">Reactivate Subscription</span>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="h-5 w-5 animate-spin rounded-full border-b-2 border-white"></div>
                  </div>
                </>
              ) : (
                "Reactivate Subscription"
              )}
            </button>
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

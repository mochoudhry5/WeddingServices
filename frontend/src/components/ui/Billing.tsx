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

// Types
interface StripeSubscription {
  id: string;
  user_id: string;
  stripe_subscription_id: string;
  stripe_customer_id: string;
  status: string;
  service_type: string;
  tier_type: string;
  is_annual: boolean;
  current_period_end: string;
  created_at: string;
  listing_id: string;
  cancel_at_period_end: boolean;
}

interface BaseListing {
  id: string;
  business_name: string;
  created_at: string;
}

interface ListingsByCategory {
  dj: BaseListing[];
  photoVideo: BaseListing[];
  hairMakeup: BaseListing[];
  venue: BaseListing[];
  weddingPlanner: BaseListing[];
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

const getServiceTypeForUrl = (dbServiceType: string): string => {
  const mapping: { [key: string]: string } = {
    wedding_planner: "weddingPlanner",
    hair_makeup: "hairMakeup",
    photo_video: "photoVideo",
    dj: "dj",
    venue: "venue",
  };
  return mapping[dbServiceType] || dbServiceType;
};

const SubscriptionSection = ({
  title,
  subscriptions,
  onCancelSubscription,
  onReactivateSubscription,
  showReactivate = false,
  isExpiring = false,
}: {
  title: string;
  subscriptions: StripeSubscription[];
  onCancelSubscription: (subscription: StripeSubscription) => void;
  onReactivateSubscription: (subscription: StripeSubscription) => void;
  showReactivate?: boolean;
  isExpiring?: boolean;
}) => {
  if (subscriptions.length === 0) return null;

  return (
    <div className="mb-8">
      <div className="border rounded-lg">
        <div className="flex justify-between items-center py-4 px-6">
          <h3 className="text-lg font-medium">{title}</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500">
                  Start Date
                </th>
                {isExpiring ? (
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500">
                    Expires On
                  </th>
                ) : (
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500">
                    Next Payment
                  </th>
                )}
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500">
                  Plan Type
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500">
                  Listing
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {subscriptions.map((subscription) => (
                <tr key={subscription.id}>
                  <td className="whitespace-nowrap px-6 py-4 text-sm">
                    {new Date(subscription.created_at).toLocaleDateString()}
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-sm">
                    {subscription.cancel_at_period_end ? (
                      <span className="text-red-600">
                        {new Date(
                          subscription.current_period_end
                        ).toLocaleDateString()}
                      </span>
                    ) : subscription.status === "inactive" ? (
                      "No upcoming payment"
                    ) : (
                      new Date(
                        subscription.current_period_end
                      ).toLocaleDateString()
                    )}
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-sm">
                    {subscription.tier_type.charAt(0).toUpperCase() +
                      subscription.tier_type.slice(1)}{" "}
                    ({subscription.is_annual ? "Annual" : "Monthly"})
                  </td>
                  <td className="whitespace-nowrap px-6 py-4">
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        subscription.status === "active" &&
                        !subscription.cancel_at_period_end
                          ? "bg-green-100 text-green-800"
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
                  </td>
                  <td className="whitespace-nowrap px-6 py-4">
                    <NextLink
                      href={`/services/${getServiceTypeForUrl(
                        subscription.service_type
                      )}/${subscription.listing_id}`}
                      className="inline-block text-black hover:text-stone-500 transition-colors"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <Link size={20} />
                    </NextLink>
                  </td>
                  <td className="whitespace-nowrap px-6 py-4">
                    <div className="flex items-center space-x-2">
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
};

const Billing = () => {
  const { user } = useAuth();
  const [listings, setListings] = useState<ListingsByCategory>({
    dj: [],
    photoVideo: [],
    hairMakeup: [],
    venue: [],
    weddingPlanner: [],
  });
  const [subscriptions, setSubscriptions] = useState<StripeSubscription[]>([]);
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

  useEffect(() => {
    const fetchBillingData = async () => {
      if (!user?.id) return;
      try {
        // Get billing data
        const { data, error } = await supabase.functions.invoke(
          "get-billing-data"
        );
        if (error) throw error;

        setSubscriptions(data.subscriptions);
        setListings(data.listings);

        // Fetch invoices
        const { data: invoiceData, error: invoiceError } =
          await supabase.functions.invoke("get-invoices");
        if (invoiceError) throw invoiceError;

        setInvoices(invoiceData.invoices);

        // Get payment method
        const { data: methodData, error: methodError } = await supabase
          .from("payment_methods")
          .select("*")
          .eq("user_id", user.id)
          .single();

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

  const handleAddOrUpdatePaymentMethod = async () => {
    try {
      if (!subscriptions.length && !paymentMethod) {
        toast.error("You need an active subscription to add a payment method");
        return;
      }

      // Get customerId from either payment method or subscriptions
      const customerId =
        paymentMethod?.stripe_customer_id ||
        subscriptions[0]?.stripe_customer_id;

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

      setSubscriptions((prev) =>
        prev.map((sub) =>
          sub.id === subscriptionToCancel.id
            ? { ...sub, cancel_at_period_end: true }
            : sub
        )
      );

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

  const handleReactivateSubscription = async () => {
    if (!subscriptionToReactivate) return;

    try {
      const { data, error } = await supabase.functions.invoke(
        "reactivate-subscription",
        {
          body: {
            subscriptionId: subscriptionToReactivate.stripe_subscription_id,
          },
        }
      );

      if (error) throw error;

      const { data: billingData, error: billingError } =
        await supabase.functions.invoke("get-billing-data");
      if (billingError) throw billingError;

      setSubscriptions(billingData.subscriptions);
      toast.success("Subscription reactivated successfully");
    } catch (error) {
      console.error("Error reactivating subscription:", error);
      toast.error("Failed to reactivate subscription");
    } finally {
      setSubscriptionToReactivate(null);
    }
  };

  // Group subscriptions by status
  const activeSubscriptions = subscriptions.filter(
    (sub) => sub.status === "active" && !sub.cancel_at_period_end
  );

  const cancelingSubscriptions = subscriptions.filter(
    (sub) => sub.status === "active" && sub.cancel_at_period_end
  );

  const inactiveSubscriptions = subscriptions.filter(
    (sub) => sub.status === "inactive" || sub.status === "canceled"
  );

  if (loading) {
    return (
      <div className="min-h-[390px] flex items-center justify-center">
        <div className="text-gray-500">Loading billing information...</div>
      </div>
    );
  }

  const hasListings = Object.values(listings).some(
    (categoryListings) => categoryListings.length > 0
  );

  if (!hasListings && subscriptions.length === 0) {
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
  }

  return (
    <div className="min-h-[390px] flex flex-col">
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

      {/* Active Subscriptions */}
      <SubscriptionSection
        title="Active Subscriptions"
        subscriptions={activeSubscriptions}
        onCancelSubscription={setSubscriptionToCancel}
        onReactivateSubscription={setSubscriptionToReactivate}
      />

      {/* Canceling Subscriptions */}
      <SubscriptionSection
        title="Expiring Soon Subscriptions"
        subscriptions={cancelingSubscriptions}
        onCancelSubscription={setSubscriptionToCancel}
        onReactivateSubscription={setSubscriptionToReactivate}
        showReactivate={true}
        isExpiring={true}
      />

      {/* Inactive Subscriptions */}
      <SubscriptionSection
        title="Expired Subscriptions"
        subscriptions={inactiveSubscriptions}
        onCancelSubscription={setSubscriptionToCancel}
        onReactivateSubscription={setSubscriptionToReactivate}
        showReactivate={true}
      />

      <InvoicesSection invoices={invoices} />

      {/* Cancel Dialog */}
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
                <div className="font-medium text-gray-700">
                  Your service will continue until{" "}
                  {subscriptionToCancel &&
                    new Date(
                      subscriptionToCancel.current_period_end
                    ).toLocaleDateString()}{" "}
                  since you've already paid for this period.
                </div>
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

      {/* Reactivate Dialog */}
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
                <div>
                  If you have an active subscription that has not expired it,
                  you will be charged at your next billing period. Otherwise,
                  you will be charged immediately.
                </div>
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

import React, { useState, useEffect } from "react";
import {
  CreditCard,
  ChevronDown,
  ChevronUp,
  XCircle,
  Link,
  RefreshCcw,
} from "lucide-react";
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

interface ServiceCategory {
  id: string;
  name: string;
  table: string;
  color: string;
}

// Constants
const serviceCategories: ServiceCategory[] = [
  {
    id: "dj",
    name: "DJ Services",
    table: "dj_listing",
    color: "bg-blue-100 text-blue-800",
  },
  {
    id: "photo_video",
    name: "Photo & Video",
    table: "photo_video_listing",
    color: "bg-purple-100 text-purple-800",
  },
  {
    id: "hair_makeup",
    name: "Hair & Makeup",
    table: "hair_makeup_listing",
    color: "bg-pink-100 text-pink-800",
  },
  {
    id: "venue",
    name: "Venue",
    table: "venue_listing",
    color: "bg-green-100 text-green-800",
  },
  {
    id: "wedding_planner",
    name: "Wedding Planner & Coordinator",
    table: "wedding_planner_listing",
    color: "bg-yellow-100 text-yellow-800",
  },
];

const PaymentMethodsSection = ({
  paymentMethods,
  onSetDefault,
  onAddNew,
}: {
  paymentMethods: PaymentMethod[];
  onSetDefault: (paymentMethodId: string) => void;
  onAddNew: () => void;
}) => {
  if (paymentMethods.length === 0) {
    return (
      <div className="mb-8">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-medium">Payment Methods</h3>
          <button
            onClick={onAddNew}
            className="inline-flex items-center space-x-2 px-4 py-2 bg-black text-white rounded-lg hover:bg-stone-700 transition-colors"
          >
            <CreditCard size={16} />
            <span>Add Payment Method</span>
          </button>
        </div>
        <div className="p-6 text-center bg-gray-50 rounded-lg border border-dashed border-gray-300">
          <CreditCard className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">
            No payment methods
          </h3>
          <p className="mt-1 text-sm text-gray-500">
            Add a payment method to manage your subscriptions.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="mb-8">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-medium">Payment Methods</h3>
        <button
          onClick={onAddNew}
          className="inline-flex items-center space-x-2 px-2 py-1 bg-black text-white rounded-lg hover:bg-stone-700 transition-colors"
        >
          <CreditCard size={16} />
          <span>Add Payment Method</span>
        </button>
      </div>
      <div className="space-y-4">
        {paymentMethods.map((method) => (
          <div
            key={method.id}
            className="flex items-center justify-between p-4 border rounded-lg bg-white"
          >
            <div className="flex items-center space-x-4">
              <div className="w-12 h-8 bg-gray-100 rounded flex items-center justify-center">
                <CreditCard size={20} className="text-gray-600" />
              </div>
              <div>
                <p className="text-sm font-medium">
                  {method.card_brand.charAt(0).toUpperCase() +
                    method.card_brand.slice(1)}{" "}
                  •••• {method.last_4}
                </p>
                <p className="text-xs text-gray-500">
                  Expires {method.exp_month.toString().padStart(2, "0")}/
                  {method.exp_year}
                </p>
              </div>
              {method.is_default && (
                <span className="ml-2 inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-black">
                  Default
                </span>
              )}
            </div>
            <div className="flex items-center space-x-4">
              {!method.is_default && (
                <button
                  onClick={() => onSetDefault(method.stripe_payment_method_id)}
                  className="text-sm text-black hover:text-stone-600 transition-colors"
                >
                  Make Default
                </button>
              )}
            </div>
          </div>
        ))}
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

// Components
const SubscriptionSection = ({
  title,
  subscriptions,
  onCancelSubscription,
  onReactivateSubscription,
  showReactivate = false,
}: {
  title: string;
  subscriptions: StripeSubscription[];
  onCancelSubscription: (subscription: StripeSubscription) => void;
  onReactivateSubscription: (subscription: StripeSubscription) => void;
  showReactivate?: boolean;
}) => {
  if (subscriptions.length === 0) return null;

  return (
    <div className="mb-8">
      <h3 className="text-lg font-medium mb-4">{title}</h3>
      <div className="border rounded-lg overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-2 text-center text-xs font-medium text-gray-500">
                Start Date
              </th>
              <th className="px-4 py-2 text-center text-xs font-medium text-gray-500">
                Next Payment
              </th>
              <th className="px-4 py-2 text-center text-xs font-medium text-gray-500">
                Plan Type
              </th>
              <th className="px-4 py-2 text-center text-xs font-medium text-gray-500">
                Status
              </th>
              <th className="px-4 py-2 text-center text-xs font-medium text-gray-500">
                Listing
              </th>
              <th className="px-4 py-2 text-center text-xs font-medium text-gray-500">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {subscriptions.map((subscription) => (
              <tr key={subscription.id}>
                <td className="px-4 py-3 text-sm text-center">
                  {new Date(subscription.created_at).toLocaleDateString()}
                </td>
                <td className="px-4 py-3 text-sm text-center">
                  {subscription.cancel_at_period_end ? (
                    <span className="text-red-600">
                      Cancels on{" "}
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
                <td className="px-4 py-3 text-sm text-center">
                  {subscription.tier_type.charAt(0).toUpperCase() +
                    subscription.tier_type.slice(1)}{" "}
                  ({subscription.is_annual ? "Annual" : "Monthly"})
                </td>
                <td className="px-4 py-3 text-center">
                  <span
                    className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
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
                <td className="px-4 py-3 text-center">
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
                <td className="px-4 py-3 text-center">
                  <div className="flex items-center justify-center space-x-2">
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
  );
};

interface PaymentMethod {
  id: string;
  user_id: string;
  stripe_payment_method_id: string;
  stripe_customer_id: string;
  is_default: boolean;
  last_4: string;
  card_brand: string;
  exp_month: number;
  exp_year: number;
}

// Main Component
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
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);

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

        // Get payment methods
        const { data: methodsData, error: methodsError } = await supabase
          .from("payment_methods")
          .select("*")
          .eq("user_id", user.id)
          .order("is_default", { ascending: false });

        if (methodsError) throw methodsError;
        setPaymentMethods(methodsData || []);
      } catch (error) {
        console.error("Error fetching billing data:", error);
        toast.error("Failed to load billing information");
      } finally {
        setLoading(false);
      }
    };

    fetchBillingData();
  }, [user?.id]);

  const handleSetDefaultPaymentMethod = async (paymentMethodId: string) => {
    try {
      // First, get the customer ID
      const { data: paymentMethod } = await supabase
        .from("payment_methods")
        .select("stripe_customer_id")
        .eq("stripe_payment_method_id", paymentMethodId)
        .single();

      if (!paymentMethod?.stripe_customer_id) {
        throw new Error("Customer ID not found");
      }

      // Update in Stripe first
      const { error: stripeError } = await supabase.functions.invoke(
        "update-default-payment-method",
        {
          body: {
            paymentMethodId,
            customerId: paymentMethod.stripe_customer_id,
          },
        }
      );

      if (stripeError) throw stripeError;

      // Update in our database
      const { error: dbError } = await supabase
        .from("payment_methods")
        .update({ is_default: false })
        .eq("user_id", user?.id);

      if (dbError) throw dbError;

      const { error: updateError } = await supabase
        .from("payment_methods")
        .update({ is_default: true })
        .eq("stripe_payment_method_id", paymentMethodId);

      if (updateError) throw updateError;

      // Refresh payment methods
      setPaymentMethods((prev) =>
        prev.map((method) => ({
          ...method,
          is_default: method.stripe_payment_method_id === paymentMethodId,
        }))
      );

      toast.success("Default payment method updated");
    } catch (error) {
      console.error("Error updating default payment method:", error);
      toast.error("Failed to update default payment method");
    }
  };

  const handleAddPaymentMethod = async () => {
    try {
      if (!paymentMethods.length && !subscriptions.length) {
        toast.error("You need an active subscription to add a payment method");
        return;
      }

      // Get customerId from either payment methods or subscriptions
      const customerId =
        paymentMethods[0]?.stripe_customer_id ||
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

  const refreshPaymentMethods = async () => {
    if (!user?.id) return;

    try {
      const { data: methodsData, error: methodsError } = await supabase
        .from("payment_methods")
        .select("*")
        .eq("user_id", user.id)
        .order("is_default", { ascending: false });

      if (methodsError) throw methodsError;
      setPaymentMethods(methodsData || []);
    } catch (error) {
      console.error("Error refreshing payment methods:", error);
      toast.error("Failed to refresh payment methods");
    }
  };

  const handlePaymentMethodAdded = async () => {
    await refreshPaymentMethods();
    setShowAddPaymentMethod(false);
    setSetupIntentSecret(null);
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
          Manage and view payment methods and subscription history
        </p>
      </div>

      {/* Payment Methods Section */}
      <PaymentMethodsSection
        paymentMethods={paymentMethods}
        onSetDefault={handleSetDefaultPaymentMethod}
        onAddNew={handleAddPaymentMethod}
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
      />

      {/* Inactive Subscriptions */}
      <SubscriptionSection
        title="Expired Subscriptions"
        subscriptions={inactiveSubscriptions}
        onCancelSubscription={setSubscriptionToCancel}
        onReactivateSubscription={setSubscriptionToReactivate}
        showReactivate={true}
      />

      {/* Cancel Dialog */}
      <AlertDialog
        open={!!subscriptionToCancel}
        onOpenChange={() => setSubscriptionToCancel(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Cancel Subscription</AlertDialogTitle>
            <AlertDialogDescription className="space-y-2">
              <p>Are you sure you want to cancel this subscription?</p>
              <p className="font-medium text-gray-700">
                Your service will continue until{" "}
                {subscriptionToCancel &&
                  new Date(
                    subscriptionToCancel.current_period_end
                  ).toLocaleDateString()}{" "}
                since you've already paid for this period.
              </p>
              <p className="text-sm text-gray-500">
                No refunds will be issued for the current billing period.
              </p>
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
            <AlertDialogDescription className="space-y-2">
              <p>
                Would you like to reactivate this subscription? You will be
                charged immediately for the next billing period.
              </p>
              <p className="text-sm text-gray-500">
                Your subscription will renew at the same rate as before.
              </p>
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

      {/* Add Payment Method Dialog */}
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

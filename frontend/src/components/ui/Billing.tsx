import React, { useState, useEffect } from "react";
import { CreditCard, ChevronDown, ChevronUp } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";

// Updated interface to match your database schema
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

interface CategoryStats {
  listings: number;
  activeSubscriptions: number;
}

interface ServiceCategory {
  id: string;
  name: string;
  table: string;
  color: string;
}

const serviceCategories: ServiceCategory[] = [
  {
    id: "dj",
    name: "DJ Services",
    table: "dj_listing",
    color: "bg-blue-100 text-blue-800",
  },
  {
    id: "photoVideo",
    name: "Photo & Video",
    table: "photo_video_listing",
    color: "bg-purple-100 text-purple-800",
  },
  {
    id: "hairMakeup",
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
    id: "weddingPlanner",
    name: "Wedding Planner & Coordinator",
    table: "wedding_planner_listing",
    color: "bg-yellow-100 text-yellow-800",
  },
];

const CategoryCard = ({
  category,
  stats,
  expanded,
  onToggle,
}: {
  category: ServiceCategory;
  stats: CategoryStats;
  expanded: boolean;
  onToggle: () => void;
}) => (
  <div className="bg-white rounded-lg shadow-sm border border-gray-200">
    <div
      className="p-4 flex items-center justify-between cursor-pointer"
      onClick={onToggle}
    >
      <div>
        <h3 className="text-lg font-medium">{category.name}</h3>
        <p className="text-sm text-gray-500">
          {stats.listings} listing{stats.listings !== 1 ? "s" : ""} ·{" "}
          {stats.activeSubscriptions} active subscription
          {stats.activeSubscriptions !== 1 ? "s" : ""}
        </p>
      </div>
      <div className="flex items-center space-x-4">
        {expanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
      </div>
    </div>
  </div>
);

const SubscriptionList = ({
  subscriptions,
}: {
  subscriptions: StripeSubscription[];
}) => (
  <div className="mt-4 border rounded-lg overflow-hidden">
    <table className="w-full">
      <thead className="bg-gray-50">
        <tr>
          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">
            Start Date
          </th>
          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">
            Next Payment
          </th>
          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">
            Plan Type
          </th>
          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">
            Status
          </th>
        </tr>
      </thead>
      <tbody className="divide-y divide-gray-200">
        {subscriptions.map((subscription) => (
          <tr key={subscription.id}>
            <td className="px-4 py-3 text-sm">
              {new Date(subscription.created_at).toLocaleDateString()}
            </td>
            <td className="px-4 py-3 text-sm">
              {new Date(subscription.current_period_end).toLocaleDateString()}
            </td>
            <td className="px-4 py-3 text-sm">
              {subscription.tier_type.charAt(0).toUpperCase() +
                subscription.tier_type.slice(1)}{" "}
              ({subscription.is_annual ? "Annual" : "Monthly"})
            </td>
            <td className="px-4 py-3">
              <span
                className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                  subscription.status === "active"
                    ? "bg-green-100 text-green-800"
                    : subscription.status === "past_due"
                    ? "bg-yellow-100 text-yellow-800"
                    : subscription.status === "canceled"
                    ? "bg-red-100 text-red-800"
                    : "bg-gray-100 text-gray-800"
                }`}
              >
                {subscription.status.charAt(0).toUpperCase() +
                  subscription.status.slice(1)}
              </span>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  </div>
);

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
  const [expandedCategories, setExpandedCategories] = useState<string[]>([]);

  useEffect(() => {
    const fetchBillingData = async () => {
      if (!user?.id) return;

      try {
        // Fetch listings for each category
        const listingPromises = serviceCategories.map(async (category) => {
          const { data, error } = await supabase
            .from(category.table)
            .select("id, business_name, created_at")
            .eq("user_id", user.id);

          if (error) throw error;
          return { category: category.id, listings: data || [] };
        });

        const listingResults = await Promise.all(listingPromises);
        const newListings = listingResults.reduce(
          (acc, { category, listings }) => ({
            ...acc,
            [category]: listings,
          }),
          {} as ListingsByCategory
        );

        setListings(newListings);

        // Fetch all stripe subscriptions with the correct fields
        const { data: subscriptionData, error: subscriptionError } =
          await supabase
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
              created_at
            `
            )
            .eq("user_id", user.id)
            .order("created_at", { ascending: false });

        if (subscriptionError) throw subscriptionError;
        console.log("Subscriptions fetched:", subscriptionData);
        setSubscriptions(subscriptionData || []);
      } catch (error) {
        console.error("Error fetching billing data:", error);
        toast.error("Failed to load billing information");
      } finally {
        setLoading(false);
      }
    };

    fetchBillingData();
  }, [user?.id]);

  const calculateCategoryStats = (categoryId: string): CategoryStats => {
    const categoryListings = listings[categoryId as keyof ListingsByCategory];
    const categorySubscriptions = subscriptions.filter(
      (s) => s.service_type === categoryId // Changed from listing_type to service_type
    );

    return {
      listings: categoryListings.length,
      activeSubscriptions: categorySubscriptions.filter(
        (s) => s.status === "active"
      ).length,
    };
  };

  const toggleCategory = (categoryId: string) => {
    setExpandedCategories((prev) =>
      prev.includes(categoryId)
        ? prev.filter((id) => id !== categoryId)
        : [...prev, categoryId]
    );
  };

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

  if (!hasListings) {
    return (
      <div className="min-h-[390px] flex items-center justify-center">
        <div className="text-center">
          <CreditCard size={48} className="mx-auto text-gray-400 mb-4" />
          <p className="text-gray-500">
            No listings or billing information available
          </p>
          <p className="text-sm text-gray-400 mt-2">
            Create a listing to start managing your revenue
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[390px] flex flex-col">
      <div className="mb-6">
        <h3 className="text-lg font-medium">Billing & Revenue</h3>
        <p className="text-sm text-gray-500">
          Manage your listing revenue and view subscription history
        </p>
      </div>

      {/* Category Cards */}
      <div className="space-y-4">
        {serviceCategories.map((category) => {
          const stats = calculateCategoryStats(category.id);
          if (stats.listings === 0) return null;

          return (
            <div key={category.id}>
              <CategoryCard
                category={category}
                stats={stats}
                expanded={expandedCategories.includes(category.id)}
                onToggle={() => toggleCategory(category.id)}
              />
              {expandedCategories.includes(category.id) && (
                <SubscriptionList
                  subscriptions={subscriptions.filter(
                    (s) => s.service_type === category.id
                  )}
                />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default Billing;

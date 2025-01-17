import React, { useState, useEffect } from "react";
import { CreditCard, ChevronDown, ChevronUp, Download } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";

interface BaseListing {
  id: string;
  title: string;
  price: number;
  created_at: string;
}

interface ListingsByCategory {
  dj: BaseListing[];
  photoVideo: BaseListing[];
  hairMakeup: BaseListing[];
  venue: BaseListing[];
}

interface Transaction {
  id: string;
  amount: number;
  status: string;
  created_at: string;
  listing_id: string;
  listing_type: string;
  listing_title: string;
}

interface CategoryStats {
  listings: number;
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
    color: "bg-green-100 text-green-800",
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
        </p>
      </div>
    </div>
  </div>
);

const TransactionList = ({ transactions }: { transactions: Transaction[] }) => (
  <div className="mt-4 border rounded-lg overflow-hidden">
    <table className="w-full">
      <thead className="bg-gray-50">
        <tr>
          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">
            Date
          </th>
          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">
            Listing
          </th>
          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">
            Amount
          </th>
          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">
            Status
          </th>
        </tr>
      </thead>
      <tbody className="divide-y divide-gray-200">
        {transactions.map((transaction) => (
          <tr key={transaction.id}>
            <td className="px-4 py-3 text-sm">
              {new Date(transaction.created_at).toLocaleDateString()}
            </td>
            <td className="px-4 py-3 text-sm">{transaction.listing_title}</td>
            <td className="px-4 py-3 text-sm">
              <span
                className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                  serviceCategories.find(
                    (cat) => cat.id === transaction.listing_type
                  )?.color || "bg-gray-100 text-gray-800"
                }`}
              >
                {serviceCategories.find(
                  (cat) => cat.id === transaction.listing_type
                )?.name || "Other"}
              </span>
            </td>
            <td className="px-4 py-3 text-sm">
              ${transaction.amount.toLocaleString()}
            </td>
            <td className="px-4 py-3">
              <span
                className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                  transaction.status === "completed"
                    ? "bg-green-100 text-green-800"
                    : transaction.status === "pending"
                    ? "bg-yellow-100 text-yellow-800"
                    : "bg-red-100 text-red-800"
                }`}
              >
                {transaction.status.charAt(0).toUpperCase() +
                  transaction.status.slice(1)}
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
  });
  const [transactions, setTransactions] = useState<Transaction[]>([]);
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
            .select("business_name")
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

        // Fetch transactions for all listings
        const allListingIds = Object.values(newListings)
          .flat()
          .map((listing) => listing.id);

        if (allListingIds.length > 0) {
          const { data: transactionData, error: transactionError } =
            await supabase
              .from("subscriptions")
              .select("*")
              .in("listing_id", allListingIds)
              .order("created_at", { ascending: false });

          if (transactionError) throw transactionError;
          setTransactions(transactionData || []);
        }
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
    const categoryTransactions = transactions.filter((t) =>
      categoryListings.some((listing) => listing.id === t.listing_id)
    );

    return {
      listings: categoryListings.length,
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
          Manage your listing revenue and view transaction history
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
                <TransactionList
                  transactions={transactions.filter((t) =>
                    listings[category.id as keyof ListingsByCategory].some(
                      (listing) => listing.id === t.listing_id
                    )
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

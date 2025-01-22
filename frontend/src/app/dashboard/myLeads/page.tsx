"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import {
  Calendar,
  Music,
  Camera,
  Building2,
  HeartHandshake,
  Search,
  DollarSign,
  SlidersHorizontal,
  MapPin,
} from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { supabase } from "@/lib/supabase";
import ErrorBoundary from "@/components/ui/ErrorBoundary";

// UI Components
import NavBar from "@/components/ui/NavBar";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import Footer from "@/components/ui/Footer";
import { Input } from "@/components/ui/input";
import { ProtectedRoute } from "@/components/ui/ProtectedRoute";
import { VendorProtectedRoute } from "@/components/ui/VendorProtectedRoute";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";

type ServiceType =
  | "venue"
  | "dj"
  | "weddingPlanner"
  | "photoVideo"
  | "hairMakeup";

interface Lead {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  event_date: string;
  city: string;
  state: string;
  budget: number;
  created_at: string;
  message?: string | null;
  service_type?: string;
}

type Leads = {
  [K in ServiceType]: Lead[];
};

type SortOption = "newest" | "price-low" | "price-high";

interface ServiceConfig {
  listingTable: string;
  type: string;
  displayName: string;
  icon: React.ComponentType<any>;
  table: string;
}

const SERVICE_CONFIGS = {
  venue: {
    listingTable: "venue_listing",
    type: "venue",
    displayName: "Venue",
    icon: Building2,
    table: "venue_leads",
  },
  dj: {
    type: "dj",
    listingTable: "dj_listing",
    displayName: "DJ",
    icon: Music,
    table: "dj_leads",
  },
  weddingPlanner: {
    type: "weddingPlanner",
    listingTable: "wedding_planner_listing",
    displayName: "Wedding Planner & Coordinator",
    icon: Calendar,
    table: "wedding_planner_leads",
  },
  photoVideo: {
    type: "photoVideo",
    listingTable: "photo_video_listing",
    displayName: "Photo & Video",
    icon: Camera,
    table: "photo_video_leads",
  },
  hairMakeup: {
    type: "hairMakeup",
    listingTable: "hair_makeup_listing",
    displayName: "Hair & Makeup",
    icon: HeartHandshake,
    table: "hair_makeup_leads",
  },
} as const;

const preventNegativeInput = (e: React.KeyboardEvent<HTMLInputElement>) => {
  if (e.key === "-" || e.key === "e") {
    e.preventDefault();
  }
};

const useLeadsData = (user: any) => {
  const [userListings, setUserListings] = useState<ServiceType[]>([]);
  const [leads, setLeads] = useState<Leads>({
    venue: [],
    dj: [],
    weddingPlanner: [],
    photoVideo: [],
    hairMakeup: [],
  });
  const [isLoading, setIsLoading] = useState(true);

  const checkUserListings = useCallback(async () => {
    if (!user?.id) return;

    try {
      setIsLoading(true);
      const foundListings: ServiceType[] = [];

      await Promise.all(
        Object.entries(SERVICE_CONFIGS).map(async ([serviceType, config]) => {
          const { data, error } = await supabase
            .from(config.listingTable)
            .select("id")
            .eq("user_id", user.id);

          if (data && !error && data.length > 0) {
            foundListings.push(serviceType as ServiceType);
          }
        })
      );

      const orderedListings = Object.keys(SERVICE_CONFIGS).filter(
        (serviceType) => foundListings.includes(serviceType as ServiceType)
      ) as ServiceType[];

      setUserListings(orderedListings);

      if (orderedListings.length > 0) {
        await loadLeadsForServices(orderedListings);
      }
    } catch (error) {
      console.error("Error checking user listings:", error);
      toast.error("Failed to load your listings");
    } finally {
      setIsLoading(false);
    }
  }, [user?.id]);

  const loadLeadsForServices = async (services: ServiceType[]) => {
    try {
      const allLeads: Leads = {
        venue: [],
        dj: [],
        weddingPlanner: [],
        photoVideo: [],
        hairMakeup: [],
      };

      await Promise.all(
        services.map(async (serviceType) => {
          const { data, error } = await supabase
            .from(SERVICE_CONFIGS[serviceType].table)
            .select("*")
            .order("created_at", { ascending: false });

          if (error) throw error;
          allLeads[serviceType] = data || [];
        })
      );

      setLeads(allLeads);
    } catch (error) {
      console.error("Error loading leads:", error);
      toast.error("Failed to load leads");
    }
  };

  useEffect(() => {
    if (user) {
      checkUserListings();
    }
  }, [user, checkUserListings]);

  return { userListings, leads, isLoading, setLeads };
};

const useLeadsFiltering = (
  leads: Leads,
  searchTerm: string,
  sortBy: SortOption,
  budgetRange: [number, number]
) => {
  return useMemo(() => {
    const filtered = { ...leads };
    Object.keys(filtered).forEach((serviceType) => {
      let serviceLeads = [...leads[serviceType as ServiceType]];

      // Filter by search term
      if (searchTerm) {
        const search = searchTerm.toLowerCase();
        serviceLeads = serviceLeads.filter(
          (lead) =>
            lead.message?.toLowerCase().includes(search) ||
            `${lead.city}, ${lead.state}`.toLowerCase().includes(search) ||
            `${lead.first_name} ${lead.last_name}`
              .toLowerCase()
              .includes(search) ||
            lead.email.toLowerCase().includes(search)
        );
      }

      // Filter by budget range
      if (budgetRange[0] > 0 || budgetRange[1] > 0) {
        serviceLeads = serviceLeads.filter((lead) => {
          if (budgetRange[0] > 0 && budgetRange[1] > 0) {
            return (
              lead.budget >= budgetRange[0] && lead.budget <= budgetRange[1]
            );
          } else if (budgetRange[0] > 0) {
            return lead.budget >= budgetRange[0];
          } else if (budgetRange[1] > 0) {
            return lead.budget <= budgetRange[1];
          }
          return true;
        });
      }

      // Sort leads
      serviceLeads.sort((a, b) => {
        switch (sortBy) {
          case "newest":
            return (
              new Date(b.created_at).getTime() -
              new Date(a.created_at).getTime()
            );
          case "price-low":
            return a.budget - b.budget;
          case "price-high":
            return b.budget - a.budget;
          default:
            return 0;
        }
      });

      filtered[serviceType as ServiceType] = serviceLeads;
    });
    return filtered;
  }, [leads, searchTerm, sortBy, budgetRange]);
};

export default function LeadsPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<ServiceType | null>(null);
  const { userListings, leads, isLoading, setLeads } = useLeadsData(user);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState<SortOption>("newest");
  const [isFilterSheetOpen, setIsFilterSheetOpen] = useState(false);
  const [budgetRange, setBudgetRange] = useState<[number, number]>([0, 0]);
  const [errors, setErrors] = useState({ min: "", max: "" });

  const filteredLeads = useLeadsFiltering(
    leads,
    searchTerm,
    sortBy,
    budgetRange
  );

  useEffect(() => {
    if (!activeTab && userListings.length > 0) {
      setActiveTab(userListings[0]);
    }
  }, [userListings, activeTab]);

  const validateAndSetBudget = useCallback(
    (value: string, index: number) => {
      const newBudgetRange = [...budgetRange] as [number, number];
      const numValue = value === "" ? 0 : Math.max(0, parseInt(value));
      newBudgetRange[index] = numValue;

      const newErrors = { min: "", max: "" };

      if (index === 0 && numValue > budgetRange[1] && budgetRange[1] !== 0) {
        newErrors.min = "Min budget cannot exceed max budget";
      }

      if (index === 1 && numValue < budgetRange[0] && numValue !== 0) {
        newErrors.max = "Max budget cannot be less than min budget";
      }

      if (numValue > 1000000) {
        newErrors[index === 0 ? "min" : "max"] =
          "Budget cannot exceed $1,000,000";
        return;
      }

      setBudgetRange(newBudgetRange);
      setErrors(newErrors);
    },
    [budgetRange]
  );

  const handleFilterApply = useCallback(() => {
    if (!errors.min && !errors.max) {
      setIsFilterSheetOpen(false);
    }
  }, [errors]);

  const handleFilterReset = useCallback(() => {
    setBudgetRange([0, 0]);
    setErrors({ min: "", max: "" });
    setIsFilterSheetOpen(false);
  }, []);

  const formatDate = useCallback((dateString: string) => {
    return format(new Date(dateString), "MMM d, yyyy");
  }, []);

  // UI Component renderers
  const renderServiceNav = () => (
    <div className="flex overflow-x-auto gap-2 p-2 bg-white rounded-lg shadow-sm no-scrollbar">
      {userListings.map((serviceType) => {
        const config = SERVICE_CONFIGS[serviceType];
        const Icon = config.icon;
        return (
          <button
            key={serviceType}
            onClick={() => setActiveTab(serviceType)}
            className={`px-4 py-2 rounded-lg whitespace-nowrap transition-all flex items-center gap-2 ${
              activeTab === serviceType
                ? "bg-black text-white"
                : "bg-gray-100 hover:bg-gray-200 text-gray-700"
            }`}
          >
            <Icon className="h-4 w-4" />
            {config.displayName}
            <span className="px-2 py-0.5 text-xs rounded-full bg-white/20">
              {leads[serviceType].length}
            </span>
          </button>
        );
      })}
    </div>
  );

  const renderFilters = () => (
    <div className="flex flex-col sm:flex-row gap-4 mb-6">
      <div className="relative flex-grow">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
        <Input
          type="text"
          placeholder="Search by name, email, or location..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
        />
      </div>
      <div className="flex gap-2">
        <Select
          value={sortBy}
          onValueChange={(value: typeof sortBy) => setSortBy(value)}
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Sort by..." />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="newest">Newest First</SelectItem>
            <SelectItem value="price-low">Budget: Low to High</SelectItem>
            <SelectItem value="price-high">Budget: High to Low</SelectItem>
          </SelectContent>
        </Select>

        <Sheet open={isFilterSheetOpen} onOpenChange={setIsFilterSheetOpen}>
          <SheetTrigger asChild>
            <button className="h-10 px-4 flex items-center gap-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
              <SlidersHorizontal className="h-5 w-5" />
              <span>Filters</span>
            </button>
          </SheetTrigger>
          <SheetContent side="right" className="w-full sm:max-w-md">
            <SheetHeader>
              <SheetTitle>Filters</SheetTitle>
            </SheetHeader>
            <div className="mt-6">
              <div className="space-y-4">
                <div>
                  <h3 className="text-sm font-medium mb-2">Budget Range</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">
                          $
                        </span>
                        <input
                          type="number"
                          min="0"
                          onKeyDown={preventNegativeInput}
                          value={budgetRange[0] || ""}
                          onChange={(e) =>
                            validateAndSetBudget(e.target.value, 0)
                          }
                          className="w-full pl-7 pr-3 py-2 border rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
                          placeholder="Min"
                        />
                      </div>
                      {errors.min && (
                        <p className="text-red-500 text-xs">{errors.min}</p>
                      )}
                    </div>
                    <div className="space-y-1">
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">
                          $
                        </span>
                        <input
                          type="number"
                          min="0"
                          onKeyDown={preventNegativeInput}
                          value={budgetRange[1] || ""}
                          onChange={(e) =>
                            validateAndSetBudget(e.target.value, 1)
                          }
                          className="w-full pl-7 pr-3 py-2 border rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
                          placeholder="Max"
                        />
                      </div>
                      {errors.max && (
                        <p className="text-red-500 text-xs">{errors.max}</p>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex gap-3 pt-6">
                  <button
                    onClick={handleFilterApply}
                    disabled={errors.min !== "" || errors.max !== ""}
                    className="flex-1 py-2.5 bg-black text-white rounded-lg hover:bg-black/90 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
                  >
                    Apply
                  </button>
                  <button
                    onClick={handleFilterReset}
                    className="flex-1 py-2.5 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    Reset
                  </button>
                </div>
              </div>
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </div>
  );

  const handleCardClick = useCallback(
    (e: React.MouseEvent, lead: Lead, activeTab: ServiceType) => {
      e.preventDefault();
      e.stopPropagation();
      if (
        !(e.target as HTMLElement).closest("button") &&
        !(e.target as HTMLElement).closest("a")
      ) {
        window.open(`/services/leads/${activeTab}/${lead.id}`, "_blank");
      }
    },
    []
  );

  const renderLeadCard = (lead: Lead) => {
    // Early return if activeTab is null (shouldn't happen in practice)
    if (!activeTab) return null;

    const Icon = SERVICE_CONFIGS[activeTab].icon;

    return (
      <Card
        key={lead.id}
        className="overflow-hidden cursor-pointer hover:shadow-md transition-all h-full flex flex-col"
        onClick={(e) => handleCardClick(e, lead, activeTab)}
      >
        <CardHeader className="space-y-1">
          <div className="flex items-start justify-between">
            <div className="flex items-start space-x-2 min-w-0">
              <Icon className="h-6 w-6 flex-shrink-0 mt-1" />
              <CardTitle className="text-xl truncate">
                <span className="block truncate">
                  {lead.first_name} {lead.last_name}
                </span>
              </CardTitle>
            </div>
          </div>
          <CardDescription>
            Submitted on {formatDate(lead.created_at)}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center space-x-2 text-gray-600">
              <Calendar className="h-4 w-4" />
              <span>Event Date: {formatDate(lead.event_date)}</span>
            </div>
            <div className="flex items-center space-x-2 text-gray-600">
              <DollarSign className="h-4 w-4" />
              <span>Budget: ${lead.budget.toLocaleString()}</span>
            </div>
            <div className="flex items-center space-x-2 text-gray-600">
              <MapPin className="h-4 w-4" />
              <span>
                Location: {lead.city}, {lead.state}
              </span>
            </div>
            {lead.message && (
              <div className="mt-4">
                <p className="text-sm text-gray-600 line-clamp-1">
                  {lead.message}
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    );
  };

  const renderEmptyState = () => (
    <div className="text-center py-12 bg-white rounded-lg shadow">
      {userListings.length === 0 ? (
        <>
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            No Active Listings Found
          </h3>
          <p className="text-gray-500 mb-6">
            You need to create a service listing before you can view leads
          </p>
          <Button
            onClick={() => router.push("/services")}
            className="bg-black hover:bg-stone-500"
          >
            Create Listing
          </Button>
        </>
      ) : (
        <>
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            No {activeTab && SERVICE_CONFIGS[activeTab].displayName} leads yet
          </h3>
          <p className="text-gray-500 mb-6">
            When you receive new{" "}
            {activeTab && SERVICE_CONFIGS[activeTab].displayName.toLowerCase()}{" "}
            leads, they will appear here
          </p>
        </>
      )}
    </div>
  );

  const renderLoadingState = () => (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
      {[...Array(3)].map((_, i) => (
        <div key={i} className="bg-white rounded-xl shadow-sm overflow-hidden">
          <div className="animate-pulse">
            <div className="p-4 space-y-3">
              <div className="h-4 bg-gray-200 rounded w-3/4" />
              <div className="h-3 bg-gray-200 rounded w-1/2" />
              <div className="h-3 bg-gray-200 rounded w-5/6" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );

  return (
    <ErrorBoundary>
      <ProtectedRoute>
        <VendorProtectedRoute>
          <div className="flex flex-col min-h-screen bg-gray-50">
            <NavBar />
            <div className="flex-1">
              <div className="max-w-7xl mx-auto px-4 py-8">
                <h1 className="text-3xl font-bold mb-8">Service Leads</h1>

                {isLoading ? (
                  renderLoadingState()
                ) : (
                  <>
                    {userListings.length > 0 ? (
                      <>
                        {renderServiceNav()}
                        {activeTab && (
                          <div className="mt-6">
                            {renderFilters()}
                            {filteredLeads[activeTab].length > 0 ? (
                              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                                {filteredLeads[activeTab].map((lead) => (
                                  <div key={lead.id}>
                                    {renderLeadCard(lead)}
                                  </div>
                                ))}
                              </div>
                            ) : (
                              renderEmptyState()
                            )}
                          </div>
                        )}
                      </>
                    ) : (
                      renderEmptyState()
                    )}
                  </>
                )}
              </div>
            </div>
            <Footer />
          </div>
        </VendorProtectedRoute>
      </ProtectedRoute>
    </ErrorBoundary>
  );
}

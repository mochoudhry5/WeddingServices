"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import {
  Calendar,
  Music,
  Camera,
  Building2,
  HeartHandshake,
  Search,
  Mail,
  Phone,
  DollarSign,
  SlidersHorizontal,
} from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { supabase } from "@/lib/supabase";

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

type ServiceType =
  | "venue"
  | "dj"
  | "wedding_planner"
  | "photo_video"
  | "hair_makeup";

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

const SERVICE_CONFIGS = {
  venue: {
    type: "venue",
    displayName: "Venue",
    icon: Building2,
    table: "venue_leads",
  },
  dj: {
    type: "dj",
    displayName: "DJ",
    icon: Music,
    table: "dj_leads",
  },
  wedding_planner: {
    type: "wedding_planner",
    displayName: "Wedding Planner",
    icon: Calendar,
    table: "wedding_planner_leads",
  },
  photo_video: {
    type: "photo_video",
    displayName: "Photo & Video",
    icon: Camera,
    table: "photo_video_leads",
  },
  hair_makeup: {
    type: "hair_makeup",
    displayName: "Hair & Makeup",
    icon: HeartHandshake,
    table: "hair_makeup_leads",
  },
} as const;

export default function LeadsPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<ServiceType>("venue");
  const [leads, setLeads] = useState<Leads>({
    venue: [],
    dj: [],
    wedding_planner: [],
    photo_video: [],
    hair_makeup: [],
  });
  const [filteredLeads, setFilteredLeads] = useState<Leads>({
    venue: [],
    dj: [],
    wedding_planner: [],
    photo_video: [],
    hair_makeup: [],
  });
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState<"newest" | "price-low" | "price-high">(
    "newest"
  );
  const [isFilterSheetOpen, setIsFilterSheetOpen] = useState(false);
  const [budgetRange, setBudgetRange] = useState([0, 0]);
  const [errors, setErrors] = useState({ min: "", max: "" });

  useEffect(() => {
    if (user) {
      loadAllLeads();
    }
  }, [user]);

  useEffect(() => {
    filterLeads();
  }, [budgetRange, searchTerm, sortBy, leads, activeTab]);

  const loadAllLeads = async () => {
    try {
      if (!user?.id) return;

      setIsLoading(true);
      const allLeads: Leads = {
        venue: [],
        dj: [],
        wedding_planner: [],
        photo_video: [],
        hair_makeup: [],
      };

      await Promise.all(
        (Object.keys(SERVICE_CONFIGS) as ServiceType[]).map(
          async (serviceType) => {
            const { data, error } = await supabase
              .from(SERVICE_CONFIGS[serviceType].table)
              .select("*")
              .eq("user_id", user.id)
              .order("created_at", { ascending: false });

            if (error) throw error;
            allLeads[serviceType] = data || [];
          }
        )
      );

      setLeads(allLeads);
    } catch (error) {
      console.error("Error loading leads:", error);
      toast.error("Failed to load leads");
    } finally {
      setIsLoading(false);
    }
  };

  const filterLeads = () => {
    const filtered = { ...leads };
    Object.keys(filtered).forEach((serviceType) => {
      let serviceLeads = [...leads[serviceType as ServiceType]];

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

    setFilteredLeads(filtered);
  };

  const validateAndSetBudget = (value: string, index: number) => {
    const newBudgetRange = [...budgetRange];
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
  };

  const handleFilterApply = () => {
    if (!errors.min && !errors.max) {
      filterLeads();
      setIsFilterSheetOpen(false);
    }
  };

  const handleFilterReset = () => {
    setBudgetRange([0, 0]);
    setErrors({ min: "", max: "" });
    setIsFilterSheetOpen(false);
  };

  const formatPhoneNumber = (phone: string): string => {
    const cleaned = phone.replace(/\D/g, "");
    return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(
      6
    )}`;
  };

  const formatDate = (dateString: string) => {
    return format(new Date(dateString), "MMM d, yyyy");
  };

  // UI Component renderers
  const renderServiceNav = () => (
    <div className="flex overflow-x-auto gap-2 p-2 bg-white rounded-lg shadow-sm no-scrollbar">
      {Object.entries(SERVICE_CONFIGS).map(([key, config]) => {
        const Icon = config.icon;
        const serviceKey = key as ServiceType;
        return (
          <button
            key={key}
            onClick={() => setActiveTab(serviceKey)}
            className={`px-4 py-2 rounded-lg whitespace-nowrap transition-all flex items-center gap-2 ${
              activeTab === key
                ? "bg-black text-white"
                : "bg-gray-100 hover:bg-gray-200 text-gray-700"
            }`}
          >
            <Icon className="h-4 w-4" />
            {config.displayName}
            <span className="px-2 py-0.5 text-xs rounded-full bg-white/20">
              {leads[serviceKey].length}
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

  const renderLeadCard = (lead: Lead) => {
    const Icon = SERVICE_CONFIGS[activeTab].icon;

    const handleCardClick = (e: React.MouseEvent, lead: Lead) => {
      e.preventDefault();
      e.stopPropagation();
      if (!(e.target as HTMLElement).closest("button")) {
        router.push(`/services/leads/${activeTab}/${lead.id}`);
      }
    };

    return (
      <Card
        key={lead.id}
        className="overflow-hidden cursor-pointer hover:shadow-md transition-all h-full flex flex-col"
        onClick={(e) => handleCardClick(e, lead)}
      >
        <CardHeader className="space-y-1">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Icon className="h-6 w-6" />
              <CardTitle className="text-xl">
                {lead.first_name} {lead.last_name}
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
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <div className="flex items-center space-x-2 text-gray-600">
                <Mail className="h-4 w-4" />
                <a
                  href={`mailto:${lead.email}`}
                  className="hover:underline truncate"
                  onClick={(e) => e.stopPropagation()}
                >
                  {lead.email}
                </a>
              </div>
              <div className="flex items-center space-x-2 text-gray-600">
                <Phone className="h-4 w-4" />
                <a
                  href={`tel:${lead.phone}`}
                  className="hover:underline"
                  onClick={(e) => e.stopPropagation()}
                >
                  {formatPhoneNumber(lead.phone)}
                </a>
              </div>
            </div>
            {lead.message && (
              <div className="mt-4">
                <p className="text-sm text-gray-600 line-clamp-2">
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
      <h3 className="text-lg font-medium text-gray-900 mb-2">
        No {SERVICE_CONFIGS[activeTab].displayName} leads yet
      </h3>
      <p className="text-gray-500 mb-6">
        When you receive new{" "}
        {SERVICE_CONFIGS[activeTab].displayName.toLowerCase()} leads, they will
        appear here
      </p>
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
    <ProtectedRoute>
      <div className="flex flex-col min-h-screen bg-gray-50">
        <NavBar />
        <div className="flex-1">
          <div className="max-w-7xl mx-auto px-4 py-8">
            <h1 className="text-3xl font-bold mb-8">Service Leads</h1>

            {isLoading ? (
              renderLoadingState()
            ) : (
              <>
                {renderServiceNav()}
                <div className="mt-6">
                  {renderFilters()}
                  {filteredLeads[activeTab].length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                      {filteredLeads[activeTab].map((lead) => (
                        <div key={lead.id}>{renderLeadCard(lead)}</div>
                      ))}
                    </div>
                  ) : (
                    renderEmptyState()
                  )}
                </div>
              </>
            )}
          </div>
        </div>
        <Footer />
      </div>
    </ProtectedRoute>
  );
}

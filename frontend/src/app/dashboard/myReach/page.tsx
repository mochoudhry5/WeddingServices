"use client";

import React, { useState, useEffect, useCallback, useMemo, memo } from "react";
import { useAuth } from "@/context/AuthContext";
import NavBar from "@/components/ui/NavBar";
import Footer from "@/components/ui/Footer";
import { supabase } from "@/lib/supabase";
import { DollarSign, MapPin, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { ProtectedRoute } from "@/components/ui/ProtectedRoute";
import { NonVendorProtectedRoute } from "@/components/ui/NonVendorProtectedRoute";
import ErrorBoundary from "@/components/ui/ErrorBoundary";
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
import {
  Calendar,
  Music,
  Camera,
  Building2,
  HeartHandshake,
} from "lucide-react";
import { Button } from "@/components/ui/button";

interface Inquiry {
  id: string;
  created_at: string;
  event_date: string;
  budget: number;
  city: string;
  state: string;
  message?: string;
  user_id: string;
}

type ServiceType =
  | "venue"
  | "photoVideo"
  | "hairMakeup"
  | "dj"
  | "weddingPlanner";

type Inquiries = {
  [K in ServiceType]: Inquiry[];
};

type SortOption = "newest" | "price-low" | "price-high";

const SERVICE_CONFIGS = {
  venue: {
    type: "venue",
    displayName: "Venue",
    icon: Building2,
    table: "venue_leads",
  },
  photoVideo: {
    type: "photoVideo",
    displayName: "Photo & Video",
    icon: Camera,
    table: "photo_video_leads",
  },
  hairMakeup: {
    type: "hairMakeup",
    displayName: "Hair & Makeup",
    icon: HeartHandshake,
    table: "hair_makeup_leads",
  },
  dj: {
    type: "dj",
    displayName: "DJ",
    icon: Music,
    table: "dj_leads",
  },
  weddingPlanner: {
    type: "weddingPlanner",
    displayName: "Wedding Planner",
    icon: Calendar,
    table: "wedding_planner_leads",
  },
} as const;

const useInquiriesData = (user: any) => {
  const [inquiries, setInquiries] = useState<Inquiries>({
    venue: [],
    photoVideo: [],
    hairMakeup: [],
    dj: [],
    weddingPlanner: [],
  });
  const [isLoading, setIsLoading] = useState(true);
  const [activeServices, setActiveServices] = useState<ServiceType[]>([]);

  const loadAllInquiries = useCallback(async () => {
    if (!user?.id) {
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      const allInquiries: Inquiries = {
        venue: [],
        photoVideo: [],
        hairMakeup: [],
        dj: [],
        weddingPlanner: [],
      };

      await Promise.all(
        (
          Object.entries(SERVICE_CONFIGS) as [
            ServiceType,
            (typeof SERVICE_CONFIGS)[ServiceType]
          ][]
        ).map(async ([serviceType, config]) => {
          const { data, error } = await supabase
            .from(config.table)
            .select("*")
            .eq("user_id", user.id)
            .order("created_at", { ascending: false });

          if (error) throw error;
          allInquiries[serviceType] = data || [];
        })
      );

      const servicesWithInquiries = Object.entries(allInquiries)
        .filter(([_, inquiries]) => inquiries.length > 0)
        .map(([serviceType]) => serviceType as ServiceType);

      setActiveServices(servicesWithInquiries);
      setInquiries(allInquiries);
    } catch (error) {
      console.error("Error loading inquiries:", error);
      toast.error("Failed to load inquiries. Please try again later.");
    } finally {
      setIsLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    if (user) {
      loadAllInquiries();
    }
  }, [user, loadAllInquiries]);

  const reloadInquiries = useCallback(() => {
    loadAllInquiries();
  }, [loadAllInquiries]);

  return {
    inquiries,
    setInquiries,
    isLoading,
    activeServices,
    setActiveServices,
    reloadInquiries,
  };
};

const useInquiriesFiltering = (
  inquiries: Inquiries,
  searchTerm: string,
  sortBy: SortOption
) => {
  return useMemo(() => {
    const filtered = { ...inquiries };
    Object.keys(filtered).forEach((serviceType) => {
      let serviceInquiries = [...inquiries[serviceType as ServiceType]];

      if (searchTerm) {
        const search = searchTerm.toLowerCase();
        serviceInquiries = serviceInquiries.filter(
          (item) =>
            item.message?.toLowerCase().includes(search) ||
            `${item.city}, ${item.state}`.toLowerCase().includes(search)
        );
      }

      serviceInquiries.sort((a, b) => {
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

      filtered[serviceType as ServiceType] = serviceInquiries;
    });
    return filtered;
  }, [inquiries, searchTerm, sortBy]);
};

// Memoized Components
const ServiceNav = memo(
  ({
    activeServices,
    selectedService,
    setSelectedService,
    inquiries,
  }: {
    activeServices: ServiceType[];
    selectedService: ServiceType | null;
    setSelectedService: (service: ServiceType) => void;
    inquiries: Inquiries;
  }) => (
    <div className="flex overflow-x-auto gap-2 p-2 bg-white rounded-lg shadow-sm no-scrollbar">
      {activeServices.map((serviceType) => {
        const Icon = SERVICE_CONFIGS[serviceType].icon;
        return (
          <button
            key={serviceType}
            onClick={() => setSelectedService(serviceType)}
            className={`px-4 py-2 rounded-lg whitespace-nowrap transition-all flex items-center gap-2 ${
              selectedService === serviceType
                ? "bg-black text-white"
                : "bg-gray-100 hover:bg-gray-200 text-gray-700"
            }`}
          >
            <Icon className="h-4 w-4" />
            {SERVICE_CONFIGS[serviceType].displayName}
            <span className="px-2 py-0.5 text-xs rounded-full bg-white/20">
              {inquiries[serviceType].length}
            </span>
          </button>
        );
      })}
    </div>
  )
);
ServiceNav.displayName = "ServiceNav";

const InquiryCard = memo(
  ({
    inquiry,
    selectedService,
    onEdit,
    onDelete,
  }: {
    inquiry: Inquiry;
    selectedService: ServiceType;
    onEdit: (inquiry: Inquiry) => void;
    onDelete: (inquiry: Inquiry) => void;
  }) => {
    const Icon = SERVICE_CONFIGS[selectedService].icon;

    const calculateDaysRemaining = (createdAt: string) => {
      const created = new Date(createdAt);
      const expiry = new Date(created.getTime() + 14 * 24 * 60 * 60 * 1000);
      const now = new Date();
      const daysRemaining = Math.ceil(
        (expiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
      );
      return Math.max(0, daysRemaining);
    };

    const formatDate = useCallback((dateString: string) => {
      const date = new Date(dateString);
      return date.toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
      });
    }, []);

    const handleEditClick = useCallback(
      (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        onEdit(inquiry);
      },
      [inquiry, onEdit]
    );

    const handleDeleteClick = useCallback(
      (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        onDelete(inquiry);
      },
      [inquiry, onDelete]
    );

    const daysRemaining = calculateDaysRemaining(inquiry.created_at);

    return (
      <Card className="overflow-hidden">
        <CardHeader className="space-y-1">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Icon className="h-6 w-6" />
              <CardTitle className="text-xl">
                {SERVICE_CONFIGS[selectedService].displayName}
              </CardTitle>
            </div>
            <div className="flex items-center gap-2">
              <span
                className={`px-2 py-1 text-xs font-medium rounded-full ${
                  daysRemaining <= 3
                    ? "bg-red-100 text-red-700"
                    : daysRemaining <= 7
                    ? "bg-yellow-100 text-yellow-700"
                    : "bg-green-100 text-green-700"
                }`}
              >
                {daysRemaining} days left
              </span>
              <button
                onClick={handleEditClick}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                aria-label="Edit inquiry"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="text-gray-500 hover:text-gray-700"
                >
                  <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" />
                  <path d="m15 5 4 4" />
                </svg>
              </button>
              <button
                onClick={handleDeleteClick}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                aria-label="Delete inquiry"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="text-red-500 hover:text-red-800"
                >
                  <path d="M3 6h18" />
                  <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
                  <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
                  <line x1="10" x2="10" y1="11" y2="17" />
                  <line x1="14" x2="14" y1="11" y2="17" />
                </svg>
              </button>
            </div>
          </div>
          <CardDescription>
            Submitted on {formatDate(inquiry.created_at)}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center space-x-2 text-gray-600">
              <Calendar className="h-4 w-4" />
              <span>Event Date: {formatDate(inquiry.event_date)}</span>
            </div>
            <div className="flex items-center space-x-2 text-gray-600">
              <DollarSign className="h-4 w-4" />
              <span>Budget: ${inquiry.budget.toLocaleString()}</span>
            </div>
            <div className="flex items-center space-x-2 text-gray-600">
              <MapPin className="h-4 w-4" />
              <span>
                Location: {inquiry.city}, {inquiry.state}
              </span>
            </div>
            {inquiry.message && (
              <div className="mt-4">
                <p className="text-sm text-gray-600 line-clamp-1">
                  {inquiry.message}
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    );
  }
);

InquiryCard.displayName = "InquiryCard";

export default function QuickReachesPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [selectedService, setSelectedService] = useState<ServiceType | null>(
    null
  );
  const {
    inquiries,
    setInquiries,
    isLoading,
    activeServices,
    setActiveServices,
  } = useInquiriesData(user);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState<SortOption>("newest");
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [inquiryToDelete, setInquiryToDelete] = useState<Inquiry | null>(null);

  const filteredInquiries = useInquiriesFiltering(
    inquiries,
    searchTerm,
    sortBy
  );

  useEffect(() => {
    if (!selectedService && activeServices.length > 0) {
      setSelectedService(activeServices[0]);
    }
  }, [activeServices, selectedService]);

  const handleEdit = useCallback(
    (inquiry: Inquiry) => {
      if (!selectedService) return;
      const editRoutes = {
        dj: `/services/dj/editReach/${inquiry.id}`,
        hairMakeup: `/services/hairMakeup/editReach/${inquiry.id}`,
        photoVideo: `/services/photoVideo/editReach/${inquiry.id}`,
        venue: `/services/venue/editReach/${inquiry.id}`,
        weddingPlanner: `/services/weddingPlanner/editReach/${inquiry.id}`,
      };

      const route = editRoutes[selectedService];
      if (route) {
        router.push(route);
      } else {
        toast.error("Invalid service type");
      }
    },
    [selectedService, router]
  );

  const handleDelete = useCallback(
    async (inquiry: Inquiry) => {
      try {
        if (!selectedService) return;

        const serviceConfig = SERVICE_CONFIGS[selectedService];
        const { error } = await supabase
          .from(serviceConfig.table)
          .delete()
          .eq("id", inquiry.id);

        if (error) throw error;

        setInquiries((prev) => ({
          ...prev,
          [selectedService]: prev[selectedService].filter(
            (item) => item.id !== inquiry.id
          ),
        }));

        // After deleting, check if this was the last inquiry for this service type
        const updatedInquiries = inquiries[selectedService].filter(
          (item) => item.id !== inquiry.id
        );

        if (updatedInquiries.length === 0) {
          const newActiveServices = activeServices.filter(
            (s) => s !== selectedService
          );
          setActiveServices(newActiveServices);

          // If there are other active services, switch to the first one
          if (newActiveServices.length > 0) {
            setSelectedService(newActiveServices[0]);
          } else {
            setSelectedService(null);
          }
        }

        toast.success("Inquiry deleted successfully");
        setShowDeleteDialog(false);
        setInquiryToDelete(null);
      } catch (error) {
        console.error("Error deleting inquiry:", error);
        toast.error("Failed to delete inquiry");
      }
    },
    [
      selectedService,
      inquiries,
      activeServices,
      setActiveServices,
      setSelectedService,
      setInquiries,
    ]
  );

  const renderServiceNav = () => (
    <ServiceNav
      activeServices={activeServices}
      selectedService={selectedService}
      setSelectedService={setSelectedService}
      inquiries={inquiries}
    />
  );

  // Rest of the rendering logic remains the same
  const renderFilters = () => (
    <div className="flex flex-col sm:flex-row gap-4 mb-6">
      <div className="relative flex-grow">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
        <Input
          type="text"
          placeholder="Search by location or message..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
        />
      </div>
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
    </div>
  );

  const renderCard = (inquiry: Inquiry) => {
    if (!selectedService) return null;

    return (
      <InquiryCard
        inquiry={inquiry}
        selectedService={selectedService}
        onEdit={handleEdit}
        onDelete={(inq) => {
          setInquiryToDelete(inq);
          setShowDeleteDialog(true);
        }}
      />
    );
  };

  const renderEmptyState = () => (
    <div className="text-center py-12 bg-white rounded-lg shadow">
      <h3 className="text-lg font-medium text-gray-900 mb-2">
        No Quick Reaches Yet
      </h3>
      <p className="text-gray-500 mb-6">
        Get started by submitting your first quick reach
      </p>
      <Button
        onClick={() => router.push("/quickReach")}
        className="bg-black hover:bg-stone-500"
      >
        Create Quick Reach
      </Button>
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
        <NonVendorProtectedRoute>
          <div className="flex flex-col min-h-screen bg-gray-50">
            <NavBar />
            <div className="flex-1">
              <div className="max-w-7xl mx-auto px-4 py-8">
                <h1 className="text-3xl font-bold mb-8">Quick Reaches</h1>

                {isLoading ? (
                  renderLoadingState()
                ) : (
                  <>
                    {activeServices.length > 0 ? (
                      <>
                        {renderServiceNav()}
                        {selectedService && (
                          <div className="mt-6">
                            {renderFilters()}
                            {filteredInquiries[selectedService].length > 0 ? (
                              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                                {filteredInquiries[selectedService].map(
                                  (inquiry) => (
                                    <div key={inquiry.id}>
                                      {renderCard(inquiry)}
                                    </div>
                                  )
                                )}
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

            {/* Delete Confirmation Dialog */}
            <AlertDialog
              open={showDeleteDialog}
              onOpenChange={setShowDeleteDialog}
            >
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Delete Quick Reach</AlertDialogTitle>
                  <AlertDialogDescription>
                    Are you sure you want to delete this quick reach? This
                    action cannot be undone.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={() =>
                      inquiryToDelete && handleDelete(inquiryToDelete)
                    }
                    className="bg-red-600 hover:bg-red-700 focus:ring-red-600"
                  >
                    Delete
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </NonVendorProtectedRoute>
      </ProtectedRoute>
    </ErrorBoundary>
  );
}

"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import NavBar from "@/components/ui/NavBar";
import Footer from "@/components/ui/Footer";
import { supabase } from "@/lib/supabase";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
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

type ServiceType =
  | "dj"
  | "hairMakeup"
  | "photoVideo"
  | "venue"
  | "weddingPlanner";

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

export default function QuickReachesPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [inquiries, setInquiries] = useState<any[]>([]);
  const [filteredInquiries, setFilteredInquiries] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedService, setSelectedService] = useState<ServiceType>("venue");
  const [sortBy, setSortBy] = useState<"newest" | "price-low" | "price-high">(
    "newest"
  );
  const [serviceCounts, setServiceCounts] = useState<
    Record<ServiceType, number>
  >({
    dj: 0,
    hairMakeup: 0,
    photoVideo: 0,
    venue: 0,
    weddingPlanner: 0,
  });
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [inquiryToDelete, setInquiryToDelete] = useState<any>(null);

  useEffect(() => {
    if (user) {
      loadServiceCounts();
    }
  }, [user]);

  useEffect(() => {
    if (user) {
      loadInquiries();
    }
  }, [user, selectedService]);

  useEffect(() => {
    filterInquiries();
  }, [searchTerm, sortBy, inquiries]);

  const loadServiceCounts = async () => {
    try {
      const counts = { ...serviceCounts };

      await Promise.all(
        Object.entries(SERVICE_CONFIGS).map(async ([service, config]) => {
          const { count, error } = await supabase
            .from(config.table)
            .select("*", { count: "exact", head: true })
            .eq("user_id", user?.id);

          if (!error && count !== null) {
            counts[service as ServiceType] = count;
          }
        })
      );

      setServiceCounts(counts);
    } catch (error) {
      console.error("Error loading service counts:", error);
    }
  };

  const loadInquiries = async () => {
    try {
      if (!user?.id) {
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      setInquiries([]);

      const serviceConfig = SERVICE_CONFIGS[selectedService];
      if (!serviceConfig) {
        throw new Error("Invalid service type");
      }

      const { data, error } = await supabase
        .from(serviceConfig.table)
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (error) throw error;

      setInquiries(data || []);
    } catch (error) {
      console.error("Error loading inquiries:", error);
      toast.error("Failed to load inquiries");
      setInquiries([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleEdit = (inquiry: any) => {
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
  };

  const handleDelete = async (inquiry: any) => {
    try {
      const serviceConfig = SERVICE_CONFIGS[selectedService];
      const { error } = await supabase
        .from(serviceConfig.table)
        .delete()
        .eq("id", inquiry.id);

      if (error) throw error;

      toast.success("Inquiry deleted successfully");
      setServiceCounts((prev) => ({
        ...prev,
        [selectedService]: Math.max(0, prev[selectedService] - 1),
      }));
      setInquiries((prev) => prev.filter((item) => item.id !== inquiry.id));
      setShowDeleteDialog(false);
    } catch (error) {
      console.error("Error deleting inquiry:", error);
      toast.error("Failed to delete inquiry");
    }
  };

  const filterInquiries = () => {
    let filtered = [...inquiries];

    if (searchTerm) {
      filtered = filtered.filter(
        (item) =>
          item.message?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          `${item.city}, ${item.state}`
            .toLowerCase()
            .includes(searchTerm.toLowerCase())
      );
    }

    filtered.sort((a, b) => {
      switch (sortBy) {
        case "newest":
          return (
            new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
          );
        case "price-low":
          return a.budget - b.budget;
        case "price-high":
          return b.budget - a.budget;
        default:
          return 0;
      }
    });

    setFilteredInquiries(filtered);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const renderServiceNav = () => (
    <div className="flex overflow-x-auto gap-2 p-2 bg-white rounded-lg shadow-sm no-scrollbar">
      {Object.entries(SERVICE_CONFIGS).map(([key, config]) => {
        const Icon = config.icon;
        return (
          <button
            key={key}
            onClick={() => setSelectedService(key as ServiceType)}
            className={`px-4 py-2 rounded-lg whitespace-nowrap transition-all flex items-center gap-2 ${
              selectedService === key
                ? "bg-black text-white"
                : "bg-gray-100 hover:bg-gray-200 text-gray-700"
            }`}
          >
            <Icon className="h-4 w-4" />
            {config.displayName}
            <span className="px-2 py-0.5 text-xs rounded-full bg-white/20">
              {serviceCounts[key as ServiceType]}
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

  const renderEmptyState = () => (
    <div className="text-center py-12 bg-white rounded-lg shadow">
      <h3 className="text-lg font-medium text-gray-900 mb-2">
        No {SERVICE_CONFIGS[selectedService].displayName} inquiries yet
      </h3>
      <p className="text-gray-500 mb-6">
        Start by submitting a quick reach for{" "}
        {SERVICE_CONFIGS[selectedService].displayName.toLowerCase()}
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

  const renderCard = (inquiry: any) => {
    const Icon = SERVICE_CONFIGS[selectedService].icon;
    return (
      <Card key={inquiry.id} className="overflow-hidden">
        <CardHeader className="space-y-1">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Icon className="h-6 w-6" />
              <CardTitle className="text-xl">
                {SERVICE_CONFIGS[selectedService].displayName}
              </CardTitle>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={(e) => {
                  e.preventDefault();
                  handleEdit(inquiry);
                }}
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
                onClick={(e) => {
                  e.preventDefault();
                  setInquiryToDelete(inquiry);
                  setShowDeleteDialog(true);
                }}
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
              <span>Budget: ${inquiry.budget.toLocaleString()}</span>
            </div>
            <div className="text-gray-600">
              <p>
                Location: {inquiry.city}, {inquiry.state}
              </p>
            </div>
            {inquiry.message && (
              <div className="mt-4">
                <p className="text-sm text-gray-600 line-clamp-2">
                  {inquiry.message}
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <ProtectedRoute>
      <div className="flex flex-col min-h-screen bg-gray-50">
        <NavBar />
        <div className="flex-1">
          <div className="max-w-7xl mx-auto px-4 py-8">
            <h1 className="text-3xl font-bold mb-8">Quick Reaches</h1>

            {isLoading ? (
              renderLoadingState()
            ) : (
              <>
                {renderServiceNav()}
                <div className="mt-6">
                  {renderFilters()}
                  {filteredInquiries.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                      {filteredInquiries.map((inquiry) => renderCard(inquiry))}
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

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Inquiry</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this inquiry? This action cannot
              be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => inquiryToDelete && handleDelete(inquiryToDelete)}
              className="bg-red-600 hover:bg-red-700 focus:ring-red-600"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </ProtectedRoute>
  );
}
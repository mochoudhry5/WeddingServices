"use client";

import React, { useState, useEffect, useMemo, useCallback, memo } from "react";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogFooter,
  AlertDialogAction,
  AlertDialogCancel,
} from "@/components/ui/alert-dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import {
  Eye,
  MessageCircle,
  Archive,
  CheckCircle,
  RefreshCw,
  Trash2,
  Search,
  Filter,
  X,
} from "lucide-react";
import { AlertDialogDescription } from "@radix-ui/react-alert-dialog";

// Base Interfaces
interface BaseListing {
  id: string;
  user_id: string;
  business_name: string;
  address: string;
  city: string;
  state: string;
  description: string;
  created_at: string;
  is_archived: boolean;
}

// Detailed Interfaces
interface ServiceMedia {
  id: string;
  file_path: string;
  display_order: number;
}

interface Lead {
  id: string;
  name: string;
  email_entered: string;
  phone: string;
  message?: string;
  contacted_at: string;
  status: "New" | "Reviewed" | "Followed Up" | "Archived";
  listing_id: string;
  metadata?: Record<string, any>;
}

interface Listing extends BaseListing {
  media: ServiceMedia[];
  service_type?: string;
  max_guests?: number;
  base_price?: number;
  years_experience: number;
  min_service_price?: number;
  max_service_price?: number;
  is_draft: boolean;
  number_of_contacted?: number;
  like_count?: number;
}

// Props and Filter Interfaces
interface ListingAnalyticsDashboardProps {
  listing: Listing;
  setAnalyticsListing: (listing: Listing | null) => void;
}

interface LeadFilters {
  searchTerm: string;
  dateRange?: {
    start?: Date | null;
    end?: Date | null;
  };
}

// Utility Types
type LeadStatus = Lead["status"];
type LeadActionHandler = (leadId: string, action: LeadStatus) => Promise<void>;

const LeadManagementDashboard: React.FC<ListingAnalyticsDashboardProps> = ({
  listing,
  setAnalyticsListing,
}) => {
  // State Management
  const [contactHistory, setContactHistory] = useState<Lead[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [activeTab, setActiveTab] = useState<LeadStatus>("New");

  // Filtering State
  const [filters, setFilters] = useState<LeadFilters>({
    searchTerm: "",
    dateRange: { start: null, end: null },
  });

  // Memoized filtered leads
  const filteredLeads = useMemo(() => {
    return contactHistory.filter((lead) => {
      // Search term filter
      const matchesSearch =
        !filters.searchTerm ||
        lead.name?.toLowerCase().includes(filters.searchTerm.toLowerCase()) ||
        lead.email_entered
          .toLowerCase()
          .includes(filters.searchTerm.toLowerCase());

      // Convert date to YYYY-MM-DD in LOCAL TIME
      const toLocalDateString = (date: Date) =>
        date.toLocaleDateString("en-CA"); // "YYYY-MM-DD" format in local time

      const contactDate = toLocalDateString(new Date(lead.contacted_at));
      const startDate = filters.dateRange?.start
        ? toLocalDateString(new Date(filters.dateRange.start))
        : null;
      const endDate = filters.dateRange?.end
        ? toLocalDateString(new Date(filters.dateRange.end))
        : null;

      console.log("Contact Date:", contactDate);
      console.log("Start Date:", startDate);
      console.log("End Date:", endDate);

      // Date range filter
      const matchesDateRange =
        (!startDate || contactDate >= startDate) &&
        (!endDate || contactDate <= endDate);

      return matchesSearch && matchesDateRange;
    });
  }, [contactHistory, filters]);

  // Fetch contact history
  const fetchContactHistory = useCallback(async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from("contact_history")
        .select("*")
        .eq("listing_id", listing.id)
        .eq("status", activeTab)
        .order("contacted_at", { ascending: false });

      if (error) throw error;
      setContactHistory(data || []);
    } catch (error) {
      console.error("Error fetching contact history:", error);
      toast.error("Failed to load contact history");
    } finally {
      setIsLoading(false);
    }
  }, [listing.id, activeTab]);

  // Trigger fetch on dependency changes
  useEffect(() => {
    fetchContactHistory();
  }, [fetchContactHistory]);

  // Performance overview calculations
  const performanceMetrics = useMemo(
    () => ({
      totalLikes: listing.like_count || 0,
      totalContacts: listing.number_of_contacted || 0,
      newLeads: contactHistory.filter((lead) => lead.status === "New").length,
    }),
    [listing, contactHistory]
  );

  // Lead action handler
  const handleLeadAction: LeadActionHandler = async (leadId, action) => {
    try {
      const { error } = await supabase
        .from("contact_history")
        .update({ status: action })
        .eq("id", leadId);

      if (error) throw error;

      // Optimistic UI update
      setContactHistory((prev) =>
        prev.map((lead) =>
          lead.id === leadId ? { ...lead, status: action } : lead
        )
      );

      toast.success(`Lead status changed to ${action}`);

      // Refetch to ensure consistency
      await fetchContactHistory();
    } catch (error) {
      console.error(`Error changing lead status to ${action}:`, error);
      toast.error("Failed to update lead status");
    }
  };

  return (
    <AlertDialog
      open={!!listing}
      onOpenChange={() => setAnalyticsListing(null)}
    >
      <AlertDialogContent className="max-w-6xl w-full max-h-[80vh] overflow-y-auto">
        <AlertDialogHeader>
          {/* Close Button */}
          <button
            onClick={() => setAnalyticsListing(null)}
            className="text-gray-500 hover:text-gray-700 p-2 rounded-full"
          >
            <X className="w-6 h-6" />
          </button>
          <>
            <AlertDialogTitle className="hidden"></AlertDialogTitle>
            <AlertDialogDescription className="hidden"></AlertDialogDescription>
          </>
        </AlertDialogHeader>
        {/* Performance Overview */}
        <PerformanceOverview metrics={performanceMetrics} />

        {/* Filtering */}
        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <Input
            placeholder="Search leads..."
            value={filters.searchTerm}
            onChange={(e) =>
              setFilters((prev) => ({
                ...prev,
                searchTerm: e.target.value,
              }))
            }
            className="flex-grow"
          />
          <DateRangeFilter
            onChange={(range) =>
              setFilters((prev) => ({
                ...prev,
                dateRange: range,
              }))
            }
          />
        </div>

        {/* Lead Management Tabs */}
        <Tabs
          value={activeTab}
          onValueChange={(tab) => setActiveTab(tab as LeadStatus)}
        >
          <TabsList className="grid grid-cols-4 mb-6">
            {["New", "Reviewed", "Followed Up", "Archived"].map((status) => (
              <TabsTrigger
                key={status}
                value={status}
                className="flex items-center"
              >
                {status === "New" && <Archive className="w-4 h-4 mr-2" />}
                {status === "Reviewed" && <Eye className="w-4 h-4 mr-2" />}
                {status === "Followed Up" && (
                  <MessageCircle className="w-4 h-4 mr-2" />
                )}
                {status === "Archived" && <Trash2 className="w-4 h-4 mr-2" />}
                {status}
              </TabsTrigger>
            ))}
          </TabsList>

          {/* Lead Grid */}
          <TabsContent
            value={activeTab}
            className="min-h-[300px] max-h-[600px] overflow-y-auto"
          >
            {isLoading ? (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {Array.from({ length: 6 }, (_, index) => (
                  <div
                    key={index}
                    className="bg-gray-100 animate-pulse rounded-lg h-32"
                  />
                ))}
              </div>
            ) : filteredLeads.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                <p className="text-xl mb-4">No Leads in this Category</p>
                <p className="text-sm">
                  Check back later or adjust your filters
                </p>
              </div>
            ) : (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredLeads.map((lead) => (
                  <LeadCard
                    key={lead.id}
                    lead={lead}
                    onSelect={() => setSelectedLead(lead)}
                    onAction={handleLeadAction}
                  />
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>

        {/* Modals */}
        {selectedLead && (
          <LeadDetailsModal
            lead={selectedLead}
            onClose={() => setSelectedLead(null)}
            onAction={handleLeadAction}
          />
        )}
      </AlertDialogContent>
    </AlertDialog>
  );
};
export default LeadManagementDashboard;

const PerformanceOverview: React.FC<{
  metrics: {
    totalLikes: number;
    totalContacts: number;
    newLeads: number;
  };
}> = ({ metrics }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
      {[
        {
          label: "Total Likes",
          value: metrics.totalLikes,
          className: "bg-blue-50 text-blue-800",
        },
        {
          label: "Total Contacts",
          value: metrics.totalContacts,
          className: "bg-green-50 text-green-800",
        },
        {
          label: "New Leads",
          value: metrics.newLeads,
          className: "bg-yellow-50 text-yellow-800",
        },
      ].map(({ label, value, className }) => (
        <div key={label} className={`p-4 rounded-lg shadow-sm ${className}`}>
          <div className="text-sm font-medium mb-2">{label}</div>
          <div className="text-2xl font-bold">{value}</div>
        </div>
      ))}
    </div>
  );
};

const DateRangeFilter: React.FC<{
  onChange: (range: { start: Date | null; end: Date | null }) => void;
}> = ({ onChange }) => {
  const [dateRange, setDateRange] = useState<{
    start: Date | null;
    end: Date | null;
  }>({
    start: null,
    end: null,
  });

  const handleDateChange = (field: "start" | "end", value: string) => {
    if (!value) {
      setDateRange((prev) => ({ ...prev, [field]: null }));
      onChange({ ...dateRange, [field]: null });
      return;
    }

    // Ensure date is interpreted in LOCAL TIME
    const [year, month, day] = value.split("-").map(Number);
    const newDate = new Date(year, month - 1, day); // Month is zero-based in JS

    const updatedRange = { ...dateRange, [field]: newDate };

    setDateRange(updatedRange);
    onChange(updatedRange);
  };

  return (
    <div className="flex items-center space-x-4">
      <div className="flex items-center space-x-2">
        <label className="text-sm text-gray-600">From</label>
        <input
          type="date"
          className="border rounded px-2 py-1 text-sm"
          value={
            dateRange.start ? dateRange.start.toISOString().split("T")[0] : ""
          }
          onChange={(e) => handleDateChange("start", e.target.value)}
        />
      </div>
      <div className="flex items-center space-x-2">
        <label className="text-sm text-gray-600">To</label>
        <input
          type="date"
          className="border rounded px-2 py-1 text-sm"
          value={dateRange.end ? dateRange.end.toISOString().split("T")[0] : ""}
          onChange={(e) => handleDateChange("end", e.target.value)}
        />
      </div>
    </div>
  );
};

const LeadCard: React.FC<{
  lead: Lead;
  onSelect: () => void;
  onAction: (leadId: string, action: LeadStatus) => Promise<void>;
}> = memo(({ lead, onSelect, onAction }) => {
  const statusColors = {
    New: "bg-yellow-100 text-yellow-800",
    Reviewed: "bg-blue-100 text-blue-800",
    "Followed Up": "bg-green-100 text-green-800",
    Archived: "bg-gray-100 text-gray-800",
  };

  const availableActions: LeadStatus[] = useMemo(() => {
    switch (lead.status) {
      case "New":
        return ["Reviewed", "Followed Up"];
      case "Reviewed":
        return ["New", "Followed Up"];
      case "Followed Up":
        return ["New", "Reviewed"];
      default:
        return [];
    }
  }, [lead.status]);

  return (
    <div className="bg-white border rounded-lg shadow-sm hover:shadow-md transition-all duration-300 ease-in-out group">
      <div className="p-4 cursor-pointer" onClick={onSelect}>
        <div className="flex justify-between items-center mb-3">
          <h3 className="text-lg font-semibold">{lead.name}</h3>
          <span
            className={`px-2 py-1 rounded-full text-xs ${
              statusColors[lead.status]
            }`}
          >
            {lead.status}
          </span>
        </div>
        <div className="text-sm text-gray-600 mb-2">{lead.email_entered}</div>
        <div className="text-xs text-gray-500">
          {new Date(lead.contacted_at).toLocaleDateString()}
        </div>
      </div>
      {lead.status !== "Archived" && availableActions.length > 0 && (
        <div className="border-t p-2 flex justify-end space-x-2 opacity-0 group-hover:opacity-100 transition-opacity">
          {availableActions.map((action) => (
            <button
              key={action}
              onClick={(e) => {
                e.stopPropagation();
                onAction(lead.id, action);
              }}
              className="text-xs px-2 py-1 rounded hover:bg-gray-100 transition-colors"
            >
              {action}
            </button>
          ))}
        </div>
      )}
    </div>
  );
});

const LeadDetailsModal: React.FC<{
  lead: Lead;
  onClose: () => void;
  onAction: (leadId: string, action: LeadStatus) => Promise<void>;
}> = ({ lead, onClose, onAction }) => {
  const availableActions: LeadStatus[] = useMemo(() => {
    switch (lead.status) {
      case "New":
        return ["Reviewed", "Followed Up", "Archived"];
      case "Reviewed":
        return ["New", "Followed Up", "Archived"];
      case "Followed Up":
        return ["New", "Reviewed", "Archived"];
      default:
        return [];
    }
  }, [lead.status]);

  return (
    <AlertDialog open={true} onOpenChange={onClose}>
      <AlertDialogContent className="w-[95vw] max-w-md lg:max-w-2xl">
        <AlertDialogHeader>
          <AlertDialogTitle>Lead Details: {lead.name}</AlertDialogTitle>
        </AlertDialogHeader>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 max-h-[60vh] overflow-y-auto">
          <div className="space-y-4">
            <div>
              <p className="text-sm font-medium text-gray-600 mb-1">Email</p>
              <div className="bg-gray-50 p-3 rounded-lg break-all">
                <p className="text-gray-900 text-sm">{lead.email_entered}</p>
              </div>
            </div>

            <div>
              <p className="text-sm font-medium text-gray-600 mb-1">Phone</p>
              <div className="bg-gray-50 p-3 rounded-lg">
                <p className="text-gray-900 text-sm">{lead.phone}</p>
              </div>
            </div>

            <div>
              <p className="text-sm font-medium text-gray-600 mb-1">
                Contacted On
              </p>
              <div className="bg-gray-50 p-3 rounded-lg">
                <p className="text-gray-900 text-sm">
                  {new Date(lead.contacted_at).toLocaleString()}
                </p>
              </div>
            </div>
          </div>

          <div>
            <p className="text-sm font-medium text-gray-600 mb-2">Message</p>
            <div className="bg-gray-50 p-4 rounded-lg max-h-64 overflow-y-auto">
              <p className="text-gray-900 whitespace-pre-wrap break-words text-sm leading-relaxed">
                {lead.message || "No message provided"}
              </p>
            </div>
          </div>
        </div>

        <AlertDialogFooter className="flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2">
          <AlertDialogCancel className="w-full sm:w-auto">
            Close
          </AlertDialogCancel>
          <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2 w-full">
            {availableActions.map((action) => (
              <AlertDialogAction
                key={action}
                onClick={() => onAction(lead.id, action)}
                className={`
                  w-full sm:w-auto
                  ${
                    action === "Archived"
                      ? "bg-red-600 hover:bg-red-700"
                      : "bg-black hover:bg-stone-500"
                  }
                `}
              >
                {action}
              </AlertDialogAction>
            ))}
          </div>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

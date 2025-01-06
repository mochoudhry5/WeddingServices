"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  Calendar,
  MapPin,
  Mail,
  Phone,
  DollarSign,
  ChevronLeft,
  Building2,
  Users,
  UtensilsCrossed,
} from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";

import NavBar from "@/components/ui/NavBar";
import Footer from "@/components/ui/Footer";

export default function LeadDetailsPage() {
  const router = useRouter();
  const { id, type } = useParams();
  const [lead, setLead] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  console.log(id, type);
  useEffect(() => {
    loadLeadDetails();
  }, [id, type]);

  const loadLeadDetails = async () => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from(`${type}_leads`)
        .select("*")
        .eq("id", id)
        .single();

      if (error) throw error;
      setLead(data);
    } catch (error) {
      console.error("Error loading lead:", error);
      toast.error("Failed to load lead details");
      router.push("/services/leads");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async () => {
    try {
      const { error } = await supabase
        .from(`${type}_leads`)
        .delete()
        .eq("id", id);

      if (error) throw error;
      toast.success("Lead deleted successfully");
      router.push("/services/leads");
    } catch (error) {
      console.error("Error deleting lead:", error);
      toast.error("Failed to delete lead");
    }
  };

  const formatDate = (date: string) => format(new Date(date), "MMM d, yyyy");

  const formatPhoneNumber = (phone: string) => {
    const cleaned = phone.replace(/\D/g, "");
    return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(
      6
    )}`;
  };

  if (isLoading) {
    return (
      <div className="flex flex-col min-h-screen">
        <NavBar />
        <div className="flex-1 flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-black"></div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen">
      <NavBar />
      <div className="flex-1 bg-gray-50">
        <div className="max-w-5xl mx-auto px-4 py-8">
          <div className="mb-8">
            <button
              onClick={() => router.back()}
              className="flex items-center text-gray-600 hover:text-gray-900"
            >
              <ChevronLeft className="h-5 w-5 mr-1" />
              Back to Leads
            </button>
          </div>

          <div className="bg-white rounded-xl shadow-sm overflow-hidden">
            {/* Header */}
            <div className="p-6 border-b">
              <div className="flex justify-between items-start">
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">
                    {lead.first_name} {lead.last_name}
                  </h1>
                  <p className="text-gray-500 mt-1">
                    Submitted on {formatDate(lead.created_at)}
                  </p>
                </div>
              </div>
            </div>

            {/* Content Grid */}
            <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Basic Information */}
              <div className="space-y-6">
                <div>
                  <h2 className="font-semibold text-gray-900 mb-4">
                    Contact Information
                  </h2>
                  <div className="space-y-4">
                    <div className="flex items-center">
                      <Mail className="h-5 w-5 text-gray-400 mr-3" />
                      <a
                        href={`mailto:${lead.email}`}
                        className="text-blue-600 hover:underline"
                      >
                        {lead.email}
                      </a>
                    </div>
                    <div className="flex items-center">
                      <Phone className="h-5 w-5 text-gray-400 mr-3" />
                      <a
                        href={`tel:${lead.phone}`}
                        className="text-blue-600 hover:underline"
                      >
                        {formatPhoneNumber(lead.phone)}
                      </a>
                    </div>
                  </div>
                </div>

                <div>
                  <h2 className="font-semibold text-gray-900 mb-4">
                    Event Details
                  </h2>
                  <div className="space-y-4">
                    <div className="flex items-center">
                      <Calendar className="h-5 w-5 text-gray-400 mr-3" />
                      <span>{formatDate(lead.event_date)}</span>
                    </div>
                    <div className="flex items-center">
                      <MapPin className="h-5 w-5 text-gray-400 mr-3" />
                      <span>
                        {lead.city}, {lead.state}
                      </span>
                    </div>
                    <div className="flex items-center">
                      <DollarSign className="h-5 w-5 text-gray-400 mr-3" />
                      <span>${lead.budget.toLocaleString()}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Service Specific Information */}
              {type === "venue" && (
                <div>
                  <h2 className="font-semibold text-gray-900 mb-4">
                    Venue Requirements
                  </h2>
                  <div className="space-y-4">
                    <div className="flex items-center">
                      <Users className="h-5 w-5 text-gray-400 mr-3" />
                      <span>
                        {lead.min_guests ? `${lead.min_guests} - ` : ""}
                        {lead.max_guests} guests
                      </span>
                    </div>
                    <div className="flex items-center">
                      <Building2 className="h-5 w-5 text-gray-400 mr-3" />
                      <span className="capitalize">
                        {lead.venue_type.replace(/-/g, " ")}
                      </span>
                    </div>
                    <div className="flex items-center">
                      <UtensilsCrossed className="h-5 w-5 text-gray-400 mr-3" />
                      <span className="capitalize">
                        {lead.catering_preference.replace(/-/g, " ")}
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* Message */}
              {lead.message && (
                <div className="md:col-span-2">
                  <h2 className="font-semibold text-gray-900 mb-4">
                    Additional Message
                  </h2>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <p className="whitespace-pre-wrap text-gray-600">
                      {lead.message}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}

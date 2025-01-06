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
  Home,
} from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";

import NavBar from "@/components/ui/NavBar";
import Footer from "@/components/ui/Footer";

export default function LeadDetailsPage() {
  const router = useRouter();
  const params = useParams();
  const id = params?.id as string;
  const type = params?.type as string;
  const [lead, setLead] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      if (
        !id ||
        !type ||
        ![
          "venue",
          "dj",
          "hair_makeup",
          "photo_video",
          "wedding_planner",
        ].includes(type)
      ) {
        setNotFound(true);
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        setNotFound(false);

        let query;

        if (type === "hair_makeup") {
          query = supabase
            .from(`${type}_leads`)
            .select(
              `
              *,
              styles:hair_makeup_lead_styles (
                id,
                lead_id,
                style,
                type,
                is_custom
              )
            `
            )
            .eq("id", id)
            .single();
        } else if (type === "photo_video") {
          query = supabase
            .from(`${type}_leads`)
            .select(
              `
              *,
              styles:photo_video_lead_styles (
                id,
                lead_id,
                style,
                type,
                is_custom
              )
            `
            )
            .eq("id", id)
            .single();
        } else {
          query = supabase
            .from(`${type}_leads`)
            .select("*")
            .eq("id", id)
            .single();
        }

        const { data, error } = await query;

        if (error) {
          console.error("Supabase error:", error);
          setNotFound(true);
          return;
        }

        if (!data) {
          setNotFound(true);
          return;
        }

        setLead(data);
      } catch (error) {
        console.error("Error loading lead:", error);
        setNotFound(true);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [id, type]);

  const handleBack = () => {
    router.push("/dashboard/myLeads");
  };

  const handleGoHome = () => {
    router.push("/");
  };

  const formatDate = (date: string) => {
    if (!date) return "";
    try {
      return format(new Date(date), "MMM d, yyyy");
    } catch (error) {
      return "";
    }
  };

  const formatPhoneNumber = (phone: string) => {
    if (!phone) return "";
    const cleaned = phone.replace(/\D/g, "");
    const hasValidLength = cleaned.length >= 10;
    if (!hasValidLength) return phone;

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

  if (notFound || !lead) {
    return (
      <div className="flex flex-col min-h-screen">
        <NavBar />
        <div className="flex-1 bg-gray-50">
          <div className="max-w-5xl mx-auto px-4 py-8">
            <div className="bg-white rounded-xl shadow-sm p-6 text-center">
              <h1 className="text-2xl font-bold text-gray-900 mb-4">
                Lead Not Found
              </h1>
              <p className="text-gray-500 mb-8">
                The lead you're looking for doesn't exist or has been deleted.
              </p>
              <div className="flex justify-center gap-4">
                <button
                  onClick={handleGoHome}
                  className="flex items-center gap-2 px-4 py-2 bg-black text-white rounded-md hover:bg-stone-500 transition-colors"
                >
                  <Home className="h-4 w-4" />
                  Go Home
                </button>
              </div>
            </div>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-white">
      <NavBar />

      <main className="flex-1 pb-20">
        <div className="max-w-3xl mx-auto px-4 py-8">
          {/* Back Button */}
          <button
            onClick={handleBack}
            className="group mb-8 flex items-center text-gray-600 hover:text-gray-900"
          >
            <ChevronLeft className="h-5 w-5 mr-1" />
            Back to Leads
          </button>

          {/* Main Content */}
          <div className="space-y-8">
            {/* Header Section */}
            <div className="pb-6 border-b">
              <h1 className="text-2xl font-semibold text-gray-900">
                {lead.first_name || ""} {lead.last_name || ""}
              </h1>
              {lead.created_at && (
                <p className="text-gray-500 mt-2 flex items-center">
                  Submitted on {formatDate(lead.created_at)}
                </p>
              )}
            </div>
            {/* Service Information */}
            <section>
              <h2 className="text-lg font-medium text-gray-900 mb-4">
                Service Information
              </h2>
              <div className="space-y-6">
                {/* Service Type */}
                <div className="flex items-center text-gray-600">
                  <Building2 className="h-5 w-5 mr-3" />
                  <span>
                    {type === "venue" && "Venue"}
                    {type === "dj" && "DJ"}
                    {type === "wedding_planner" &&
                      (lead.service_type === "weddingPlanner"
                        ? "Wedding Planner"
                        : lead.service_type === "weddingCoordinator"
                        ? "Wedding Coordinator"
                        : lead.service_type === "both"
                        ? "Wedding Planning & Coordination"
                        : "Wedding Planner")}
                    {type === "photo_video" &&
                      (lead.service_type === "photography"
                        ? "Photography"
                        : lead.service_type === "videography"
                        ? "Videography"
                        : lead.service_type === "both"
                        ? "Photography & Videography"
                        : "Photography & Videography")}
                    {type === "hair_makeup" &&
                      (lead.service_type === "hair"
                        ? "Hair Styling"
                        : lead.service_type === "makeup"
                        ? "Makeup Services"
                        : lead.service_type === "both"
                        ? "Hair & Makeup Services"
                        : "Hair & Makeup Services")}
                  </span>
                </div>

                {/* Styles for Photo/Video or Hair/Makeup */}
                {(type === "photo_video" || type === "hair_makeup") &&
                  lead.styles?.length > 0 && (
                    <div className="mt-4">
                      <div className="text-sm font-medium text-gray-700 mb-3">
                        Preferred Styles:
                      </div>
                      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                        {lead.styles.map((style: any) => (
                          <div
                            key={style.id}
                            className="p-3 rounded-lg border border-black bg-stone-100 flex items-center gap-2"
                          >
                            <span className="text-green-800">✓</span>
                            <span className="text-sm text-gray-900 capitalize">
                              {style.style.replace(/-/g, " ")}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                {/* Venue-specific details */}
                {type === "venue" && (
                  <div className="space-y-3">
                    {(lead.min_guests || lead.max_guests) && (
                      <div className="flex items-center text-gray-600">
                        <Users className="h-5 w-5 mr-3" />
                        {lead.min_guests ? `${lead.min_guests} - ` : ""}
                        {lead.max_guests} guests
                      </div>
                    )}
                    {lead.venue_type && (
                      <div className="flex items-center text-gray-600">
                        <Building2 className="h-5 w-5 mr-3" />
                        <span className="capitalize">
                          {lead.venue_type.replace(/-/g, " ")}
                        </span>
                      </div>
                    )}
                    {lead.catering_preference && (
                      <div className="flex items-center text-gray-600">
                        <UtensilsCrossed className="h-5 w-5 mr-3" />
                        <span className="capitalize">
                          {lead.catering_preference.replace(/-/g, " ")}
                        </span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </section>

            {/* Contact Information */}
            <section>
              <h2 className="text-lg font-medium text-gray-900 mb-4 border-t pt-8">
                Contact Information
              </h2>
              <div className="space-y-3">
                {lead.email && (
                  <a
                    href={`mailto:${lead.email}`}
                    className="flex items-center text-gray-600 hover:text-gray-900"
                  >
                    <Mail className="h-5 w-5 mr-3" />
                    {lead.email}
                  </a>
                )}
                {lead.phone && (
                  <a
                    href={`tel:${lead.phone}`}
                    className="flex items-center text-gray-600 hover:text-gray-900"
                  >
                    <Phone className="h-5 w-5 mr-3" />
                    {formatPhoneNumber(lead.phone)}
                  </a>
                )}
              </div>
            </section>

            {/* Event Details */}
            <section className="border-t pt-8">
              <h2 className="text-lg font-medium text-gray-900 mb-4">
                Event Details
              </h2>
              <div className="space-y-3">
                {lead.event_date && (
                  <div className="flex items-center text-gray-600">
                    <Calendar className="h-5 w-5 mr-3" />
                    {formatDate(lead.event_date)}
                  </div>
                )}
                {lead.city && lead.state && (
                  <div className="flex items-center text-gray-600">
                    <MapPin className="h-5 w-5 mr-3" />
                    {lead.city}, {lead.state}
                  </div>
                )}
                {typeof lead.budget === "number" && (
                  <div className="flex items-center text-gray-600">
                    <DollarSign className="h-5 w-5 mr-3" />$
                    {lead.budget.toLocaleString()}
                  </div>
                )}
              </div>
            </section>
            {/* Message */}
            {lead.message && (
              <section className="border-t pt-8">
                <h2 className="text-lg font-medium text-gray-900 mb-4">
                  Additional Message
                </h2>
                <p className="text-gray-600 whitespace-pre-wrap">
                  {lead.message}
                </p>
              </section>
            )}
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}

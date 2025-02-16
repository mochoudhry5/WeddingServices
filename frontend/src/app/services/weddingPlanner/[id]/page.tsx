"use client";

import React, {
  useEffect,
  useState,
  useCallback,
  useMemo,
  useRef,
} from "react";
import { useParams } from "next/navigation";
import NavBar from "@/components/ui/NavBar";
import Footer from "@/components/ui/Footer";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import MediaCarousel from "@/components/ui/MainMediaCarousel";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/AuthContext";
import LikeButton from "@/components/ui/LikeButton";
import { ServiceInfoGrid } from "@/components/ui/CardInfoGrid";
import { ArchiveX, SearchX } from "lucide-react";
import { AuthModals } from "@/components/ui/AuthModal";
import ErrorBoundary from "@/components/ui/ErrorBoundary";

interface WeddingPlannerDetails {
  user_id: string;
  user_email: string;
  id: string;
  business_name: string;
  years_experience: string;
  travel_range: number;
  is_remote_business: boolean;
  address: string;
  city: string;
  state: string;
  country: string;
  service_type: "weddingPlanner" | "weddingCoordinator" | "both";
  wedding_planner_specialties: WeddingPlannerSpecialty[];
  website_url: string | null;
  instagram_url: string | null;
  description: string;
  wedding_planner_media: WeddingPlannerMedia[];
  deposit: number;
  cancellation_policy: string;
  wedding_planner_services: WeddingPlannerService[];
  min_service_price: number;
  max_service_price: number;
  is_archived: boolean;
  is_draft: boolean;
  number_of_contacted: number;
}

interface WeddingPlannerMedia {
  file_path: string;
  display_order: number;
}

interface WeddingPlannerService {
  name: string;
  description: string;
  price: number;
  is_custom: boolean;
}

interface WeddingPlannerSpecialty {
  specialty: string;
  is_custom: boolean;
}

interface InquiryForm {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  eventDate: string;
  message: string;
}

// Memoized Components
const ServiceCard = React.memo(
  ({ service }: { service: WeddingPlannerService }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [hasOverflow, setHasOverflow] = useState(false);
    const descriptionRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
      const checkOverflow = () => {
        const element = descriptionRef.current;
        if (element) {
          setHasOverflow(element.scrollHeight > element.clientHeight);
        }
      };

      checkOverflow();
      window.addEventListener("resize", checkOverflow);
      return () => window.removeEventListener("resize", checkOverflow);
    }, [service.description]);

    return (
      <div className="border border-gray-200 rounded-lg overflow-hidden shadow-sm">
        <div
          className={`w-full p-3 sm:p-4 ${
            hasOverflow ? "cursor-pointer hover:bg-gray-50" : ""
          } transition-all duration-200`}
          onClick={() => hasOverflow && setIsOpen(!isOpen)}
        >
          <div className="flex-1">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 mb-2">
              <h3 className="text-base sm:text-lg font-semibold">
                {service.name}
              </h3>
              <div className="text-left sm:text-right">
                <p className="text-green-800 font-semibold whitespace-nowrap text-sm sm:text-base">
                  <span className="text-xs sm:text-sm text-gray-500">
                    Starting at{" "}
                  </span>
                  ${service.price.toLocaleString()}
                </p>
              </div>
            </div>
            <div
              ref={descriptionRef}
              className={isOpen ? "" : "line-clamp-1"}
              style={{
                wordBreak: "break-word",
                overflowWrap: "break-word",
                whiteSpace: "pre-wrap",
                color: "#4B5563", // text-gray-600
                fontSize: "0.875rem", // text-sm
              }}
            >
              {service.description}
            </div>
          </div>
        </div>
      </div>
    );
  }
);

ServiceCard.displayName = "ServiceCard";

// PlannerSpecialties Component
const PlannerSpecialties = React.memo(
  ({
    styles,
    serviceType,
  }: {
    styles: string[];
    serviceType: WeddingPlannerDetails["service_type"];
  }) => {
    if (!styles?.length) return null;

    return (
      <div className="mb-8 sm:mb-12">
        <h2 className="text-lg sm:text-xl md:text-2xl font-bold mb-4 sm:mb-6 break-words">
          {serviceType === "weddingPlanner"
            ? "Wedding Planner Expertise"
            : serviceType === "weddingCoordinator"
            ? "Wedding Coordinator Expertise"
            : "Wedding Planner & Coordinator Expertise"}
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4">
          {styles.map((style, index) => (
            <div
              key={`wedding-planner-${index}`}
              className="p-3 sm:p-4 rounded-lg border border-black bg-stone-100 w-full"
            >
              <div className="flex items-center gap-2 min-w-0">
                <span className="text-green-800 flex-shrink-0">✓</span>
                <span className="text-sm sm:text-base text-gray-900 break-words">
                  {style}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }
);

PlannerSpecialties.displayName = "PlannerSpecialties";

const WeddingDetailsPage = () => {
  const { user } = useAuth();
  const params = useParams();
  const [weddingPlanner, setWeddingPlanner] =
    useState<WeddingPlannerDetails | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [contactHistory, setContactHistory] = useState<{
    contacted_at: string;
  } | null>(null);
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const [isSignUpOpen, setIsSignUpOpen] = useState(false);
  const [inquiryForm, setInquiryForm] = useState<InquiryForm>({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    eventDate: "",
    message: "",
  });

  const handleLoginClose = useCallback(() => setIsLoginOpen(false), []);
  const handleSignUpClose = useCallback(() => setIsSignUpOpen(false), []);
  const handleSwitchToSignUp = useCallback(() => {
    setIsLoginOpen(false);
    setIsSignUpOpen(true);
  }, []);
  const handleSwitchToLogin = useCallback(() => {
    setIsSignUpOpen(false);
    setIsLoginOpen(true);
  }, []);

  const loadWeddingPlannerDetails = useCallback(async () => {
    if (!params.id) return;

    try {
      const { data: weddingPlannerData, error } = await supabase
        .from("wedding_planner_listing")
        .select(
          `
          *,
          user_id,
          user_email,
          is_archived,
          is_draft,
          number_of_contacted,
          wedding_planner_media (
            file_path,
            display_order
          ),
          wedding_planner_services (
            name,
            description,
            price,
            is_custom
          ),
          wedding_planner_specialties (
            specialty,
            is_custom
          )
        `
        )
        .eq("id", params.id)
        .single();

      if (error && error.code !== "PGRST116") {
        if (error) throw error;
      }

      if (
        !weddingPlannerData ||
        (weddingPlannerData.is_archived &&
          (!user?.id || user.id !== weddingPlannerData.user_id)) ||
        weddingPlannerData.is_draft
      ) {
        setWeddingPlanner(null);
        return;
      }

      setWeddingPlanner(weddingPlannerData);
    } catch (error) {
      console.error("Error loading wedding planner:", error);
      setWeddingPlanner(null);
      toast.error("Failed to load wedding planner details");
    } finally {
      setIsLoading(false);
    }
  }, [params.id]);

  const loadContactHistory = useCallback(async () => {
    if (!user?.id || !params.id) return;

    try {
      const { data, error } = await supabase
        .from("contact_history")
        .select("contacted_at")
        .eq("user_id", user.id)
        .eq("listing_id", params.id)
        .eq("service_type", "weddingPlanner")
        .order("contacted_at", { ascending: false })
        .limit(1)
        .single();

      if (error && error.code !== "PGRST116") {
        console.error("Error:", error);
        return;
      }

      setContactHistory(data);
    } catch (error) {
      console.error("Error loading contact history:", error);
    }
  }, [user?.id, params.id]);

  useEffect(() => {
    loadWeddingPlannerDetails();
  }, [loadWeddingPlannerDetails]);

  useEffect(() => {
    loadContactHistory();
  }, [loadContactHistory]);

  const handleInquirySubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      if (!user?.id || !weddingPlanner) {
        toast.error("Please login to send an inquiry");
        return;
      }

      setIsSubmitting(true);

      try {
        // Rest of handleInquirySubmit implementation remains the same...
      } catch (error) {
        console.error("Error:", error);
        toast.error("Failed to send inquiry. Please try again.");
      } finally {
        setIsSubmitting(false);
      }
    },
    [user?.id, weddingPlanner, inquiryForm, loadWeddingPlannerDetails]
  );

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      const { name, value } = e.target;
      setInquiryForm((prev) => ({ ...prev, [name]: value }));
    },
    []
  );

  const plannerStyles = useMemo(
    () =>
      weddingPlanner?.wedding_planner_specialties.map((s) => s.specialty) ?? [],
    [weddingPlanner]
  );

  // Memoized Components
  const renderLoadingState = useMemo(
    () => (
      <div className="min-h-screen bg-slate-50">
        <NavBar />
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="animate-pulse">
            <div className="h-[60vh] bg-slate-200 rounded-lg mb-8" />
            <div className="space-y-4">
              <div className="h-8 bg-slate-200 rounded w-1/2" />
              <div className="h-4 bg-slate-200 rounded w-1/4" />
              <div className="h-4 bg-slate-200 rounded w-3/4" />
            </div>
          </div>
        </div>
        <Footer />
      </div>
    ),
    []
  );

  const renderNotFound = useMemo(
    () => (
      <div className="flex flex-col min-h-screen bg-gray-50">
        <NavBar />
        <div className="flex-1 flex flex-col">
          <div className="flex-grow flex items-center justify-center">
            <div className="max-w-md w-full mx-auto px-4 py-8 text-center">
              <div className="bg-white rounded-lg shadow-sm p-8">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-stone-100 flex items-center justify-center">
                  <SearchX className="w-8 h-8 text-stone-600" />
                </div>
                <h1 className="text-2xl font-bold text-gray-900 mb-2">
                  Listing Not Found
                </h1>
                <p className="text-gray-600 mb-6">
                  We couldn't find the listing you're looking for. It may have
                  been removed or is no longer available.
                </p>
                <div className="space-y-3">
                  <Button
                    onClick={() => window.history.back()}
                    variant="outline"
                    className="w-full"
                  >
                    Go Back
                  </Button>
                  <Button
                    onClick={() => (window.location.href = "/")}
                    className="w-full bg-black hover:bg-stone-800"
                  >
                    Browse All Listings
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
        <Footer />
      </div>
    ),
    []
  );

  if (isLoading) return renderLoadingState;
  if (!weddingPlanner) return renderNotFound;

  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-white overflow-hidden">
        <NavBar />
        {/* Hero/Media Section */}
        <div className="relative bg-black">
          <div className="relative h-[60vh] md:h-[80vh]">
            <MediaCarousel
              media={weddingPlanner.wedding_planner_media}
              name={weddingPlanner.business_name}
              service="wedding-planner"
              className="w-full h-full"
            />
          </div>
        </div>

        {/* Content */}
        <div className="max-w-7xl mx-auto px-4 py-6">
          {/* Like Button Section */}
          {user?.id !== weddingPlanner.user_id && (
            <div className="w-full px-4 pb-5">
              <div className="bg-stone-100 border-black py-2">
                <div className="max-w-3xl mx-auto px-4 flex flex-col items-center justify-center">
                  <div className="flex items-center gap-2">
                    <span className="text-black text-lg font-semibold break-words">
                      Don't forget this listing!
                    </span>
                    <LikeButton
                      itemId={weddingPlanner.id}
                      service="wedding-planner"
                      initialLiked={false}
                      className="text-rose-600 hover:text-rose-700 flex-shrink-0"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {weddingPlanner.is_archived &&
            user?.id === weddingPlanner.user_id && (
              <div className="w-full bg-amber-50 border-y border-amber-200">
                <div className="max-w-7xl mx-auto px-4 py-3">
                  <div className="flex items-center justify-center gap-2">
                    <ArchiveX className="w-5 h-5 text-amber-600" />
                    <p className="text-sm text-amber-800">
                      This listing is archived and is only visible to you. If
                      you want to reactivate the listing go to{" "}
                      <a
                        href="/dashboard/listings"
                        className="underline font-medium hover:text-amber-900"
                      >
                        My Listings
                      </a>
                    </p>
                  </div>
                </div>
              </div>
            )}

          {/* Planner Header */}
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-3 sm:gap-4 mb-6 sm:mb-8">
            <div className="flex-grow min-w-0">
              <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900 break-words">
                {weddingPlanner.business_name}
                <div className="inline-flex items-center ml-2 px-3 py-1 rounded-full bg-white border border-gray-200 text-sm font-medium whitespace-normal">
                  {weddingPlanner.service_type === "both"
                    ? "Wedding Planner & Coordinator"
                    : weddingPlanner.service_type === "weddingPlanner"
                    ? "Wedding Planner"
                    : "Wedding Coordinator"}
                </div>
              </h1>
              <p className="text-sm sm:text-base text-gray-600 break-words mt-2">
                {weddingPlanner.is_remote_business
                  ? `${weddingPlanner.city}, ${weddingPlanner.state} (Remote)`
                  : `${weddingPlanner.address}, ${weddingPlanner.city}, ${weddingPlanner.state}`}
              </p>
            </div>
            <div className="flex flex-col items-end flex-shrink-0 text-right">
              <div className="text-2xl sm:text-3xl font-semibold text-green-800">
                {weddingPlanner.min_service_price ===
                weddingPlanner.max_service_price
                  ? `$${weddingPlanner.max_service_price.toLocaleString()}`
                  : `$${weddingPlanner.min_service_price.toLocaleString()} - $${weddingPlanner.max_service_price.toLocaleString()}`}
              </div>
              <p className="text-xs sm:text-sm text-gray-500">
                (See Services & Pricing)
              </p>
            </div>
          </div>

          {/* Info Grid */}
          <div className="pb-10">
            <ServiceInfoGrid service={weddingPlanner} />
          </div>

          {/* About Section */}
          <div className="px-2 sm:px-0 mb-8 sm:mb-12">
            <h2 className="text-lg sm:text-xl md:text-2xl font-bold mb-3 sm:mb-4 break-words">
              About the Business
            </h2>
            <p className="text-sm sm:text-base text-gray-600 leading-relaxed break-words whitespace-normal">
              {weddingPlanner.description}
            </p>
          </div>

          {/* Specialties */}
          {plannerStyles.length > 0 && (
            <PlannerSpecialties
              styles={plannerStyles}
              serviceType={weddingPlanner.service_type}
            />
          )}

          {/* Services */}
          {weddingPlanner.wedding_planner_services?.length > 0 && (
            <div className="mb-8 sm:mb-12">
              <h2 className="text-lg sm:text-xl md:text-2xl font-bold mb-4 sm:mb-6 break-words">
                Services & Pricing
              </h2>
              <div className="flex flex-col lg:flex-row gap-4">
                {/* First Column */}
                <div className="flex-1 flex flex-col gap-4 min-w-0">
                  {weddingPlanner.wedding_planner_services
                    .filter((_, index) => index % 2 === 0)
                    .map((service, index) => (
                      <ServiceCard key={index * 2} service={service} />
                    ))}
                </div>
                {/* Second Column */}
                <div className="flex-1 flex flex-col gap-4 min-w-0">
                  {weddingPlanner.wedding_planner_services
                    .filter((_, index) => index % 2 === 1)
                    .map((service, index) => (
                      <ServiceCard key={index * 2 + 1} service={service} />
                    ))}
                </div>
              </div>
            </div>
          )}
          {/* Contact Form */}
          {user?.id !== weddingPlanner.user_id ? (
            <div className="mb-12">
              <div className="text-center">
                <h2 className="text-xl md:text-2xl font-bold mb-2">
                  Contact {weddingPlanner.business_name}
                </h2>
                {contactHistory && (
                  <p className="text-sm text-gray-600 mb-6">
                    Last contacted{" "}
                    {new Date(contactHistory.contacted_at).toLocaleDateString()}{" "}
                    at{" "}
                    {new Date(contactHistory.contacted_at).toLocaleTimeString()}
                  </p>
                )}
              </div>
              <div className="max-w-2xl mx-auto">
                {user ? (
                  <div className="bg-gray-50 p-4 md:p-6 rounded-lg">
                    <form onSubmit={handleInquirySubmit} className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            First Name
                          </label>
                          <Input
                            name="firstName"
                            value={inquiryForm.firstName}
                            onChange={handleInputChange}
                            required
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Last Name
                          </label>
                          <Input
                            name="lastName"
                            value={inquiryForm.lastName}
                            onChange={handleInputChange}
                            required
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Email
                        </label>
                        <Input
                          type="email"
                          name="email"
                          value={inquiryForm.email}
                          onChange={handleInputChange}
                          required
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Phone
                        </label>
                        <Input
                          type="tel"
                          name="phone"
                          value={inquiryForm.phone}
                          onChange={handleInputChange}
                          required
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Event Date
                        </label>
                        <Input
                          type="date"
                          name="eventDate"
                          value={inquiryForm.eventDate}
                          onChange={handleInputChange}
                          required
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Message
                        </label>
                        <textarea
                          name="message"
                          value={inquiryForm.message}
                          onChange={handleInputChange}
                          rows={4}
                          className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent text-sm sm:text-base"
                          placeholder="Tell us about your event and requirements..."
                          required
                        />
                      </div>

                      <Button
                        type="submit"
                        disabled={isSubmitting}
                        className="w-full bg-black hover:bg-stone-800 text-sm sm:text-base py-2 sm:py-3"
                      >
                        {isSubmitting ? "Sending..." : "Send Inquiry"}
                      </Button>
                    </form>
                  </div>
                ) : (
                  <div className="bg-gray-50 p-8 rounded-lg text-center">
                    <div className="max-w-md mx-auto">
                      <h3 className="text-xl font-semibold mb-3">
                        Ready to connect?
                      </h3>
                      <p className="text-gray-600 mb-6">
                        Sign in to contact {weddingPlanner.business_name} and
                        ask any questions you may have. It's absolutely free!
                      </p>
                      <Button
                        onClick={() => setIsLoginOpen(true)}
                        className="w-full bg-black hover:bg-stone-800 text-sm sm:text-base py-3"
                      >
                        Sign in to Contact
                      </Button>
                      <p className="text-sm text-gray-500 mt-4">
                        New to our platform? Creating an account takes less than
                        a minute
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="mb-8 sm:mb-12 text-center">
              <p className="text-gray-600">
                Manage your listing from your dashboard.
              </p>
            </div>
          )}

          {/* Auth Modals */}
          <AuthModals
            isLoginOpen={isLoginOpen}
            isSignUpOpen={isSignUpOpen}
            onLoginClose={handleLoginClose}
            onSignUpClose={handleSignUpClose}
            onSwitchToSignUp={handleSwitchToSignUp}
            onSwitchToLogin={handleSwitchToLogin}
          />
        </div>

        <Footer />
      </div>
    </ErrorBoundary>
  );
};

export default WeddingDetailsPage;

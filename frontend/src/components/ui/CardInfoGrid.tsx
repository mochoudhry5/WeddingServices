import React from "react";

interface InfoCardProps {
  title: string;
  children: React.ReactNode;
}

interface ServiceBaseInfo {
  years_experience: string;
  deposit: number;
  travel_range: number;
  website_url: string | null;
  instagram_url: string | null;
}

interface VenueInfoGridProps {
  venue: {
    min_guests: number | null;
    max_guests: number;
    catering_option: "in-house" | "outside" | "both";
    venue_type: "indoor" | "outdoor" | "both";
    website_url: string | null;
    instagram_url: string | null;
  };
}

const InfoCard = ({ title, children }: InfoCardProps) => (
  <div className="bg-stone-50 p-4 rounded-lg border border-gray-100 transition-all duration-200 hover:border-gray-200 h-full flex flex-col justify-between">
    <div className="flex flex-col items-center text-center h-full justify-center">
      <h3 className="text-sm font-semibold mb-2">{title}</h3>
      {children}
    </div>
  </div>
);

const ServiceInfoGrid = ({ service }: { service: ServiceBaseInfo }) => (
  <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
    <InfoCard title="Experience">
      <div className="flex flex-col items-center justify-center">
        <div className="flex items-center justify-center gap-1">
          <span className="text-lg font-semibold text-black">
            {service.years_experience}
          </span>
          <span className="text-base text-gray-600">years</span>
        </div>
      </div>
    </InfoCard>

    <InfoCard title="Deposit">
      <div className="flex flex-col items-center justify-center">
        {service.deposit === 0 ? (
          <span className="text-lg font-semibold text-black">None</span>
        ) : (
          <>
            <div className="flex items-center justify-center gap-1">
              <span className="text-lg font-semibold text-black">
                {service.deposit}
              </span>
              <span className="text-base text-gray-600">%</span>
            </div>
            {service.deposit > 0 && (
              <span className="text-base text-gray-500 mt-1">
                of service cost
              </span>
            )}
          </>
        )}
      </div>
    </InfoCard>

    <InfoCard title="Travel Range">
      <div className="flex flex-col items-center justify-center">
        {service.travel_range === 0 ? (
          <span className="text-lg font-semibold text-black">No Travel</span>
        ) : service.travel_range === -1 ? (
          <span className="text-lg font-semibold text-black">Anywhere</span>
        ) : (
          <div className="flex items-center justify-center gap-1">
            <span className="text-lg font-semibold text-black">
              {service.travel_range}
            </span>
            <span className="text-base text-gray-600">miles</span>
          </div>
        )}
      </div>
    </InfoCard>

    <InfoCard title="Socials">
      <div className="flex flex-col items-center justify-center gap-2 w-full">
        {service.website_url || service.instagram_url ? (
          <>
            {service.website_url && (
              <a
                href={service.website_url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-lg font-semibold text-black hover:text-stone-500 transition-colors duration-200"
              >
                Website
              </a>
            )}
            {service.instagram_url && (
              <a
                href={service.instagram_url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-lg font-semibold text-black hover:text-stone-500 transition-colors duration-200"
              >
                Instagram
              </a>
            )}
          </>
        ) : (
          <span className="text-lg font-semibold">No Links Yet</span>
        )}
      </div>
    </InfoCard>
  </div>
);

const VenueInfoGrid = ({ venue }: VenueInfoGridProps) => (
  <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
    <InfoCard title="Capacity">
      <div className="flex flex-col items-center justify-center gap-2">
        {venue.min_guests ? (
          <div className="flex items-center justify-center gap-1">
            <span className="text-lg font-semibold text-black">
              {venue.min_guests}
            </span>
            <span className="text-sm text-gray-600">min</span>
          </div>
        ) : (
          <span className="text-lg text-gray-600">No minimum</span>
        )}
        <div className="flex items-center justify-center gap-1">
          <span className="text-lg font-semibold text-black">
            {venue.max_guests}
          </span>
          <span className="text-sm text-gray-600">max</span>
        </div>
      </div>
    </InfoCard>

    <InfoCard title="Catering Options">
      <div className="flex items-center justify-center">
        <span className="text-lg font-semibold text-black text-center">
          {venue.catering_option === "both" && "In-house & Outside Catering "}
          {venue.catering_option === "in-house" && "In-house Caterinh"}
          {venue.catering_option === "outside" && "Outside Catering"}
        </span>
      </div>
    </InfoCard>

    <InfoCard title="Venue Type">
      <div className="flex items-center justify-center">
        <span className="text-lg font-semibold text-black text-center">
          {venue.venue_type === "indoor" && "Indoor"}
          {venue.venue_type === "outdoor" && "Outdoor"}
          {venue.venue_type === "both" && "Indoor/Outdoor"}
        </span>
      </div>
    </InfoCard>

    <InfoCard title="Socials">
      <div className="flex flex-col items-center justify-center gap-2 w-full">
        {venue.website_url || venue.instagram_url ? (
          <>
            {venue.website_url && (
              <a
                href={venue.website_url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-lg font-semibold text-black hover:text-stone-500 transition-colors duration-200"
              >
                Website
              </a>
            )}
            {venue.instagram_url && (
              <a
                href={venue.instagram_url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-lg font-semibold text-black hover:text-stone-500 transition-colors duration-200"
              >
                Instagram
              </a>
            )}
          </>
        ) : (
          <span className="text-lg font-semibold">No Links Yet</span>
        )}
      </div>
    </InfoCard>
  </div>
);

export { InfoCard, ServiceInfoGrid, VenueInfoGrid };

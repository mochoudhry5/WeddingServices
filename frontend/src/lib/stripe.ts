// lib/stripe.ts
import { loadStripe } from "@stripe/stripe-js";

export const stripe = loadStripe(
  process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!
);

export const categoryPrices: Record<
  ServiceId,
  Record<TierType, { price: number }>
> = {
  venue: {
    basic: { price: 25 },
    premium: { price: 45 },
    elite: { price: 65 },
  },
  hairMakeup: {
    basic: { price: 5 },
    premium: { price: 10 },
    elite: { price: 15 },
  },
  photoVideo: {
    basic: { price: 5 },
    premium: { price: 10 },
    elite: { price: 15 },
  },
  weddingPlanner: {
    basic: { price: 5 },
    premium: { price: 10 },
    elite: { price: 15 },
  },
  dj: {
    basic: { price: 5 },
    premium: { price: 15 },
    elite: { price: 25 },
  },
};

export interface PaymentMethod {
  card_brand: string;
  last_4: string;
  exp_month: number;
  exp_year: number;
}

export type ServiceId =
  | "venue"
  | "dj"
  | "hairMakeup"
  | "photoVideo"
  | "weddingPlanner";

export interface Invoice {
  id: string;
  number: string;
  created: string;
  amount_paid: number;
  amount_due: number;
  status: string;
  subscription_id: string;
  hosted_invoice_url: string;
}

export type TierType = "basic" | "premium" | "elite";
export type BillingPeriod = "monthly" | "annual";

export type StripePriceIds = {
  [K in ServiceId]: {
    [T in TierType]: {
      [P in BillingPeriod]: string;
    };
  };
};

export const stripePriceIds: StripePriceIds = {
  venue: {
    basic: {
      monthly: "price_1QmlWaCGcL38r0cMz5xiv7uB",
      annual: "price_1QmlX7CGcL38r0cMXQL94G9p",
    },
    premium: {
      monthly: "price_1Qmlb7CGcL38r0cM5Df9JW7O",
      annual: "price_1Qmlb7CGcL38r0cMYPZNGKMb",
    },
    elite: {
      monthly: "price_1QmldUCGcL38r0cMCd64lAtK",
      annual: "price_1QmldUCGcL38r0cMQRAW2nNA",
    },
  },
  hairMakeup: {
    basic: {
      monthly: "price_1QmlgGCGcL38r0cMZbDvKu8E",
      annual: "price_1QmlgGCGcL38r0cM0A0GSVuM",
    },
    premium: {
      monthly: "price_1QmlhbCGcL38r0cMh2fKbRh4",
      annual: "price_1QmlhbCGcL38r0cMS0WBLxls",
    },
    elite: {
      monthly: "price_1Qmlk2CGcL38r0cMZWvkEFPT",
      annual: "price_1Qmlk2CGcL38r0cMW7xQuVxA",
    },
  },
  photoVideo: {
    basic: {
      monthly: "price_1QmllOCGcL38r0cMqhEDvWEI",
      annual: "price_1QmllOCGcL38r0cMUg4qnGN9",
    },
    premium: {
      monthly: "price_1QmlnECGcL38r0cMIXNJRDRM",
      annual: "price_1QmlnECGcL38r0cMn2ExUeHx",
    },
    elite: {
      monthly: "price_1QmloVCGcL38r0cMEHfzOrFq",
      annual: "price_1QmloVCGcL38r0cMifq9h9lL",
    },
  },
  weddingPlanner: {
    basic: {
      monthly: "price_1QmlpiCGcL38r0cMMeG2TWbi",
      annual: "price_1QmlpiCGcL38r0cMNz4G284j",
    },
    premium: {
      monthly: "price_1QmlqYCGcL38r0cMuZ4rE0sk",
      annual: "price_1QmlqYCGcL38r0cMO3KpWJbJ",
    },
    elite: {
      monthly: "price_1QmlsaCGcL38r0cMyBcUhVV9",
      annual: "price_1QmlsaCGcL38r0cMYhWfVvMQ",
    },
  },
  dj: {
    basic: {
      monthly: "price_1QmltYCGcL38r0cMdd3xV1TV",
      annual: "price_1QmltYCGcL38r0cMKydNhs9e",
    },
    premium: {
      monthly: "price_1QmluQCGcL38r0cM0chVZDIr",
      annual: "price_1QmluQCGcL38r0cMzcaYiNTq",
    },
    elite: {
      monthly: "price_1QmlvJCGcL38r0cM5y84ok34",
      annual: "price_1QmlvJCGcL38r0cMQOEoKAh2",
    },
  },
};

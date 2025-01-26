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
      monthly: "price_1QfsgjCGcL38r0cMNkKyCnzE",
      annual: "price_1Qfsi8CGcL38r0cMiLUHmULk",
    },
    premium: {
      monthly: "price_1QfskcCGcL38r0cMuVP9cm6X",
      annual: "price_1QfskcCGcL38r0cMuoSvvrUo",
    },
    elite: {
      monthly: "price_1QfskcCGcL38r0cMGpwqAKt6",
      annual: "price_1QfskcCGcL38r0cMIpO6SF4J",
    },
  },
  hairMakeup: {
    basic: {
      monthly: "price_1QfsgjCGcL38r0cMNkKyCnzE",
      annual: "price_1Qfsi8CGcL38r0cMiLUHmULk",
    },
    premium: {
      monthly: "price_1QfskcCGcL38r0cMuVP9cm6X",
      annual: "price_1QfskcCGcL38r0cMuoSvvrUo",
    },
    elite: {
      monthly: "price_1QfskcCGcL38r0cMGpwqAKt6",
      annual: "price_1QfskcCGcL38r0cMIpO6SF4J",
    },
  },
  photoVideo: {
    basic: {
      monthly: "price_1QfsgjCGcL38r0cMNkKyCnzE",
      annual: "price_1Qfsi8CGcL38r0cMiLUHmULk",
    },
    premium: {
      monthly: "price_1QfskcCGcL38r0cMuVP9cm6X",
      annual: "price_1QfskcCGcL38r0cMuoSvvrUo",
    },
    elite: {
      monthly: "price_1QfskcCGcL38r0cMGpwqAKt6",
      annual: "price_1QfskcCGcL38r0cMIpO6SF4J",
    },
  },
  weddingPlanner: {
    basic: {
      monthly: "price_1QfsgjCGcL38r0cMNkKyCnzE",
      annual: "price_1Qfsi8CGcL38r0cMiLUHmULk",
    },
    premium: {
      monthly: "price_1QfskcCGcL38r0cMuVP9cm6X",
      annual: "price_1QfskcCGcL38r0cMuoSvvrUo",
    },
    elite: {
      monthly: "price_1QfskcCGcL38r0cMGpwqAKt6",
      annual: "price_1QfskcCGcL38r0cMIpO6SF4J",
    },
  },
  dj: {
    basic: {
      monthly: "price_1QfsgjCGcL38r0cMNkKyCnzE",
      annual: "price_1Qfsi8CGcL38r0cMiLUHmULk",
    },
    premium: {
      monthly: "price_1QfskcCGcL38r0cMuVP9cm6X",
      annual: "price_1QfskcCGcL38r0cMuoSvvrUo",
    },
    elite: {
      monthly: "price_1QfskcCGcL38r0cMGpwqAKt6",
      annual: "price_1QfskcCGcL38r0cMIpO6SF4J",
    },
  },
};

// lib/stripe.ts
import { loadStripe } from "@stripe/stripe-js";

export const stripe = loadStripe(
  process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!
);

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

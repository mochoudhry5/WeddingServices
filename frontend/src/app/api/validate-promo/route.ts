// app/api/validate-promo/route.ts
import { NextResponse } from "next/server";
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  maxNetworkRetries: 2,
});

export async function POST(request: Request) {
  try {
    const { promoCode } = await request.json();

    if (!promoCode?.trim()) {
      return NextResponse.json(
        { error: "Promo code is required" },
        { status: 400 }
      );
    }

    try {
      const promotionCodes = await stripe.promotionCodes.list({
        code: promoCode,
        active: true,
        expand: ["data.coupon"],
      });

      if (!promotionCodes.data.length) {
        return NextResponse.json(
          {
            isValid: false,
            error: "Invalid or expired promo code",
          },
          { status: 200 }
        );
      }

      const promotionCode = promotionCodes.data[0];
      const coupon = promotionCode.coupon as Stripe.Coupon;

      // Return details about the promotion
      return NextResponse.json({
        isValid: true,
        details: {
          id: promotionCode.id,
          discountType: coupon.amount_off ? "fixed" : "percentage",
          discountAmount: coupon.amount_off
            ? coupon.amount_off / 100 // Convert cents to dollars
            : coupon.percent_off,
          duration: coupon.duration,
          durationInMonths: coupon.duration_in_months || null,
          name: coupon.name || null,
        },
      });
    } catch (error) {
      console.error("Error validating promo code:", error);
      if (error instanceof Stripe.errors.StripeError) {
        return NextResponse.json(
          {
            isValid: false,
            error: "Failed to validate promo code",
            details:
              process.env.NODE_ENV === "development"
                ? error.message
                : undefined,
          },
          { status: 400 }
        );
      }
      throw error;
    }
  } catch (error) {
    console.error("Server error while validating promo code:", error);
    const errorMessage =
      error instanceof Error ? error.message : "An unknown error occurred";
    return NextResponse.json(
      {
        isValid: false,
        error: "Server error while validating promo code",
        details:
          process.env.NODE_ENV === "development" ? errorMessage : undefined,
      },
      { status: 500 }
    );
  }
}

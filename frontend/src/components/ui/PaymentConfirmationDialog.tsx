import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { CreditCard, Info, XCircle, CheckCircle2 } from "lucide-react";
import React, { Dispatch, SetStateAction, useState } from "react";

interface PaymentMethod {
  card_brand: string;
  last_4: string;
  exp_month: number;
  exp_year: number;
}

interface PromoDetails {
  id: string;
  discountType: "fixed" | "percentage";
  discountAmount: number;
  duration: "forever" | "once" | "repeating";
  durationInMonths: number | null;
  name: string | null;
}

interface PaymentConfirmationDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  onUpdatePayment: () => void;
  paymentMethod: PaymentMethod;
  amount: number;
  isAnnual: boolean;
  tierType: string;
  isLoading: boolean;
  serviceType: string;
  error: string | null;
  promoCode: string;
  setPromoCode: Dispatch<SetStateAction<string>>;
  onValidatePromo: (code: string) => Promise<{
    isValid: boolean;
    details?: PromoDetails;
    error?: string;
  }>;
  children?: React.ReactNode;
}

export function PaymentConfirmationDialog({
  isOpen,
  onClose,
  onConfirm,
  onUpdatePayment,
  paymentMethod,
  amount,
  isAnnual,
  tierType,
  isLoading,
  serviceType,
  error,
  promoCode,
  setPromoCode,
  onValidatePromo,
  children,
}: PaymentConfirmationDialogProps) {
  const [isValidatingPromo, setIsValidatingPromo] = useState(false);
  const [promoError, setPromoError] = useState<string | null>(null);
  const [isPromoValid, setIsPromoValid] = useState(false);
  const [promoDetails, setPromoDetails] = useState<PromoDetails | null>(null);

  const formattedServiceType = serviceType
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" & ");

  const handlePromoValidation = async () => {
    if (!promoCode.trim()) {
      setPromoError("Please enter a promo code");
      return;
    }

    setIsValidatingPromo(true);
    setPromoError(null);

    try {
      const result = await onValidatePromo(promoCode);
      if (result.isValid && result.details) {
        setIsPromoValid(true);
        setPromoError(null);
        setPromoDetails(result.details);
      } else {
        setIsPromoValid(false);
        setPromoDetails(null);
        setPromoError(result.error || "Invalid promo code");
      }
    } catch (err) {
      setIsPromoValid(false);
      setPromoDetails(null);
      setPromoError("Failed to validate promo code. Please try again.");
    } finally {
      setIsValidatingPromo(false);
    }
  };

  const clearPromoCode = () => {
    setPromoCode("");
    setPromoError(null);
    setIsPromoValid(false);
    setPromoDetails(null);
  };

  const getDiscountedAmount = () => {
    if (!promoDetails) return amount;
    if (promoDetails.discountType === "percentage") {
      return amount * (1 - promoDetails.discountAmount / 100);
    }
    return Math.max(0, amount - promoDetails.discountAmount);
  };

  return (
    <AlertDialog open={isOpen} onOpenChange={onClose}>
      <AlertDialogContent className="max-w-md border-0 p-0">
        <AlertDialogHeader className="bg-black px-6 py-4 text-white">
          <AlertDialogTitle className="text-xl font-semibold">
            Confirm Your Subscription
          </AlertDialogTitle>
          <AlertDialogDescription className="text-sm text-gray-300 mt-1">
            Review your subscription details below for your{" "}
            {formattedServiceType.toLocaleUpperCase()} service.
          </AlertDialogDescription>
        </AlertDialogHeader>

        <div className="p-6 space-y-6 max-h-[calc(100vh-16rem)] overflow-y-auto">
          {/* Error Message */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex items-center space-x-2">
                <XCircle className="h-5 w-5 text-red-500 flex-shrink-0" />
                <p className="text-sm text-red-700">{error}</p>
              </div>
              <p className="text-xs text-red-600 mt-1">
                Please try again or update your payment method.
              </p>
            </div>
          )}

          {/* Subscription Details Section */}
          <div className="space-y-4">
            <div className="flex items-center justify-between pb-4 border-b border-gray-200">
              <div>
                <h3 className="font-medium text-lg">
                  {formattedServiceType.toLocaleUpperCase()} Listing
                </h3>
                <div className="text-sm text-gray-600">
                  {tierType.charAt(0).toUpperCase() + tierType.slice(1)} Plan
                </div>
              </div>
              <div className="text-right">
                {isPromoValid && promoDetails ? (
                  <div className="space-y-1">
                    {promoDetails.name && (
                      <div className="font-medium text-green-600 text-sm">
                        {promoDetails.name}
                      </div>
                    )}
                    <div className="flex flex-col">
                      <div className="flex items-center justify-end gap-2">
                        <span className="text-lg font-semibold text-gray-900">
                          ${getDiscountedAmount()}
                        </span>
                        {promoDetails.duration !== "forever" && (
                          <span className="text-sm text-gray-500">
                            for{" "}
                            {promoDetails.duration === "repeating"
                              ? `${promoDetails.durationInMonths} months`
                              : "first payment"}
                          </span>
                        )}
                      </div>
                      {promoDetails.duration !== "forever" && (
                        <div className="flex items-center justify-end gap-2">
                          <span className="text-base text-gray-600">
                            ${amount}
                          </span>
                          <span className="text-sm text-gray-500">
                            per {isAnnual ? "year" : "month"} after
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="text-lg font-semibold">${amount}</div>
                    <div className="text-sm text-gray-600">
                      per {isAnnual ? "year" : "month"}
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Payment Method Section */}
            <div className="bg-gray-50 rounded-xl p-4 space-y-3">
              <h4 className="font-medium">Payment Method</h4>
              <div className="flex items-center space-x-3 p-3 bg-white rounded-lg border border-gray-100">
                <div className="p-2 bg-gray-50 rounded">
                  <CreditCard className="h-5 w-5 text-gray-600" />
                </div>
                <div>
                  <div className="font-medium">
                    {paymentMethod.card_brand.charAt(0).toUpperCase() +
                      paymentMethod.card_brand.slice(1)}{" "}
                    •••• {paymentMethod.last_4}
                  </div>
                  <div className="text-sm text-gray-500">
                    Expires{" "}
                    {paymentMethod.exp_month.toString().padStart(2, "0")}/
                    {paymentMethod.exp_year}
                  </div>
                </div>
              </div>
              {error && (
                <button
                  onClick={onUpdatePayment}
                  className="w-full py-2 text-blue-600 hover:text-blue-800 text-sm font-medium"
                >
                  Try a different payment method
                </button>
              )}
            </div>
          </div>

          {/* Promo Code Section */}
          <div className="space-y-2">
            <label
              htmlFor="promoCode"
              className="text-sm font-medium text-gray-700"
            >
              Have a promo code?
            </label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <input
                  id="promoCode"
                  type="text"
                  value={promoCode}
                  onChange={(e) => {
                    setPromoCode(e.target.value);
                    setPromoError(null);
                    setIsPromoValid(false);
                    setPromoDetails(null);
                  }}
                  disabled={isPromoValid || isValidatingPromo}
                  placeholder="Enter promo code"
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent disabled:bg-gray-50"
                />
                {isPromoValid && (
                  <div className="absolute right-2 top-1/2 -translate-y-1/2">
                    <CheckCircle2 className="h-5 w-5 text-green-500" />
                  </div>
                )}
              </div>
              {!isPromoValid ? (
                <button
                  onClick={handlePromoValidation}
                  disabled={isValidatingPromo || !promoCode.trim()}
                  className="px-4 py-2 bg-gray-900 text-white rounded-lg text-sm font-medium hover:bg-gray-800 disabled:bg-gray-300 transition-colors whitespace-nowrap"
                >
                  {isValidatingPromo ? (
                    <div className="flex items-center gap-2">
                      <span className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Applying...</span>
                    </div>
                  ) : (
                    "Apply"
                  )}
                </button>
              ) : (
                <button
                  onClick={clearPromoCode}
                  className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-900"
                >
                  Remove
                </button>
              )}
            </div>
            {promoError && (
              <p className="text-sm text-red-600 mt-1">{promoError}</p>
            )}
            {isPromoValid && promoDetails && (
              <p className="text-sm text-green-600 mt-1">
                Promo code applied successfully!
              </p>
            )}
          </div>

          {/* Terms and Conditions */}
          <div className="text-sm text-gray-500 space-y-2 bg-gray-50 p-4 rounded-lg">
            <div className="flex space-x-2">
              <Info className="h-4 w-4 text-gray-400 flex-shrink-0 mt-0.5" />
              <span>
                By confirming, you authorize recurring{" "}
                {isAnnual ? "annual" : "monthly"} payments. You can cancel your
                subscription anytime through your billing settings.
              </span>
            </div>
          </div>
          {children}
        </div>

        <AlertDialogFooter className="border-t border-gray-100 p-6 bg-gray-50 flex flex-col-reverse sm:flex-row sm:justify-end gap-3">
          <AlertDialogCancel
            className="mt-2 sm:mt-0 border-gray-300 text-gray-700 hover:bg-gray-50 w-full sm:w-auto text-sm font-medium"
            disabled={isLoading}
          >
            Cancel
          </AlertDialogCancel>
          <button
            onClick={onConfirm}
            disabled={isLoading}
            className="w-full sm:w-auto bg-black text-white hover:bg-stone-800 transition-colors px-5 py-2 rounded-md flex items-center justify-center text-sm font-medium"
          >
            {isLoading ? (
              <div className="flex items-center justify-center gap-2">
                <span className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>Processing...</span>
              </div>
            ) : (
              "Subscribe"
            )}
          </button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

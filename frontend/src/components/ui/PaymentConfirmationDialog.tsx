// components/ui/PaymentConfirmationDialog.tsx
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { CreditCard, Info, XCircle } from "lucide-react";
import React, { Dispatch, SetStateAction } from "react";

interface PaymentMethod {
  card_brand: string;
  last_4: string;
  exp_month: number;
  exp_year: number;
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
  children?: React.ReactNode;
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
  children,
}: PaymentConfirmationDialogProps) {
  const formattedServiceType = serviceType
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" & ");

  return (
    <AlertDialog open={isOpen} onOpenChange={onClose}>
      <AlertDialogContent className="max-w-md border-0 p-0 overflow-hidden">
        <AlertDialogHeader className="bg-black px-6 py-4 text-white">
          <AlertDialogTitle className="text-xl font-semibold">
            Confirm Your Subscription
          </AlertDialogTitle>
          <AlertDialogDescription className="text-sm text-gray-300 mt-1">
            Review your subscription details below for your{" "}
            {formattedServiceType.toLocaleUpperCase()} service.
          </AlertDialogDescription>
        </AlertDialogHeader>

        <div className="p-6 space-y-6">
          {/* Error Message */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
              <div className="flex items-center space-x-2">
                <XCircle className="h-5 w-5 text-red-500" />
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
                <div className="text-lg font-semibold">${amount}</div>
                <div className="text-sm text-gray-600">
                  per {isAnnual ? "year" : "month"}
                </div>
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
              <input
                id="promoCode"
                type="text"
                value={promoCode}
                onChange={(e) => setPromoCode(e.target.value)}
                placeholder="Enter promo code"
                className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent"
              />
            </div>
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
            className="mt-2 sm:mt-0 border-gray-300 text-gray-700 hover:bg-gray-50"
            disabled={isLoading}
          >
            Cancel
          </AlertDialogCancel>
          <button
            onClick={onConfirm}
            disabled={isLoading}
            className="bg-black text-white hover:bg-stone-800 transition-colors px-8"
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

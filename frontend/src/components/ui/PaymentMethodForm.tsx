import React, { useState } from "react";
import {
  PaymentElement,
  useStripe,
  useElements,
} from "@stripe/react-stripe-js";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";

interface PaymentMethodFormProps {
  onSuccess: () => void;
  onCancel: () => void;
  mode: "update" | "create";
}

export const PaymentMethodForm = ({
  onSuccess,
  onCancel,
  mode,
}: PaymentMethodFormProps) => {
  const stripe = useStripe();
  const elements = useElements();
  const [isProcessing, setIsProcessing] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!stripe || !elements) return;

    setIsProcessing(true);
    try {
      const { setupIntent, error } = await stripe.confirmSetup({
        elements,
        redirect: "if_required",
        confirmParams: {
          return_url: window.location.href,
        },
      });

      if (error) {
        console.error("Setup error:", error);
        toast.error(error.message || "Failed to add payment method");
        return;
      }

      if (setupIntent && setupIntent.status === "succeeded") {
        // Wait for webhook processing
        await new Promise((resolve) => setTimeout(resolve, 2500));

        // Verify payment method addition
        const { count } = await supabase
          .from("payment_methods")
          .select("*", { count: "exact" })
          .eq("stripe_payment_method_id", setupIntent.payment_method);

        if (count === 0) {
          toast.error("This card has already been added to your account");
          return;
        }

        toast.success(
          mode === "update"
            ? "Payment method updated successfully"
            : "Payment method added successfully"
        );
        onSuccess();
      }
    } catch (error) {
      console.error("Error:", error);
      toast.error("Failed to process payment method");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-4">
        <PaymentElement
          options={{
            layout: {
              type: "tabs",
              defaultCollapsed: false,
              radios: false,
              spacedAccordionItems: false,
            },
          }}
        />
      </div>
      <div className="flex justify-end space-x-4">
        <button
          type="button"
          onClick={onCancel}
          disabled={isProcessing}
          className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={!stripe || isProcessing}
          className="px-4 py-2 text-sm font-medium text-white bg-black rounded-md hover:bg-gray-800 disabled:opacity-50"
        >
          {isProcessing
            ? "Processing..."
            : mode === "update"
            ? "Update Payment Method"
            : "Continue to Review"}
        </button>
      </div>
      {mode === "create" && (
        <p className="text-xs text-gray-500 text-center mt-4">
          Your card won't be charged until you review and confirm your
          subscription.
        </p>
      )}
    </form>
  );
};

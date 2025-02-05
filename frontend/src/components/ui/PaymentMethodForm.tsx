// components/PaymentMethodForm.tsx
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
}

export const PaymentMethodForm = ({
  onSuccess,
  onCancel,
}: PaymentMethodFormProps) => {
  const stripe = useStripe();
  const elements = useElements();
  const [isProcessing, setIsProcessing] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!stripe || !elements) {
      return;
    }

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
        // Wait a short moment for the webhook to process
        await new Promise((resolve) => setTimeout(resolve, 2500));

        // Verify the payment method was added by checking our database
        const { count } = await supabase
          .from("payment_methods")
          .select("*", { count: "exact" })
          .eq("stripe_payment_method_id", setupIntent.payment_method);

        if (count === 0) {
          // If the payment method isn't in our database, it was likely rejected as a duplicate
          toast.error("This card has already been added to your account");
          return;
        }

        toast.success("Payment method added successfully");
        onSuccess();
      }
    } catch (error) {
      console.error("Error:", error);
      toast.error("Failed to add payment method");
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
          {isProcessing ? "Processing..." : "Add Payment Method"}
        </button>
      </div>
    </form>
  );
};

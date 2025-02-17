import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Elements } from "@stripe/react-stripe-js";
import { loadStripe } from "@stripe/stripe-js";
import { PaymentMethodForm } from "./PaymentMethodForm";

const stripePromise = loadStripe(
  process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!
);

interface AddPaymentMethodDialogProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  clientSecret: string | null;
  mode?: "update" | "create";
}

export const AddPaymentMethodDialog = ({
  open,
  onClose,
  onSuccess,
  clientSecret,
  mode = "update",
}: AddPaymentMethodDialogProps) => {
  if (!clientSecret) return null;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>
            {mode === "update" ? "Update Payment Method" : "Add Payment Method"}
          </DialogTitle>
          {mode === "create" && (
            <DialogDescription className="text-sm text-gray-500 mt-2">
              Add your payment method to continue. You'll have a chance to
              review your subscription and add any promo codes before being
              charged.
            </DialogDescription>
          )}
        </DialogHeader>
        <Elements
          stripe={stripePromise}
          options={{
            clientSecret,
            appearance: {
              theme: "stripe",
              variables: {
                colorPrimary: "#000000",
              },
            },
          }}
        >
          <PaymentMethodForm
            onSuccess={onSuccess}
            onCancel={onClose}
            mode={mode}
          />
        </Elements>
      </DialogContent>
    </Dialog>
  );
};

// components/AddPaymentMethodDialog.tsx
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Elements } from "@stripe/react-stripe-js";
import { loadStripe } from "@stripe/stripe-js";
import { PaymentMethodForm } from "./PaymentMethodForm";

// Initialize Stripe
const stripePromise = loadStripe(
  process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!
);

interface AddPaymentMethodDialogProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  clientSecret: string | null;
}

export const AddPaymentMethodDialog = ({
  open,
  onClose,
  onSuccess,
  clientSecret,
}: AddPaymentMethodDialogProps) => {
  if (!clientSecret) return null;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Add Payment Method</DialogTitle>
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
          <PaymentMethodForm onSuccess={onSuccess} onCancel={onClose} />
        </Elements>
      </DialogContent>
    </Dialog>
  );
};

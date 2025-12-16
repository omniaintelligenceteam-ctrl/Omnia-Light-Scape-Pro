import React from "react";
import { Paywall } from "./Paywall";

interface PricingProps {
  isOpen: boolean;
  onClose: () => void;

  /**
   * Legacy prop from Stripe version (unused now).
   * Kept so existing App.tsx doesn’t crash if it still passes it.
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  onSubscribe?: (plan: any) => Promise<void>;
}

export const Pricing: React.FC<PricingProps> = ({ isOpen, onClose }) => {
  return (
    <Paywall
      isOpen={isOpen}
      onClose={onClose}
      onPaid={() => {
        // After successful PayPal subscription (or DEV unlock),
        // just close the modal. App.tsx should re-check billing status.
        onClose();
      }}
    />
  );
};
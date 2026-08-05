"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";
import type {
  CheckoutShipmentMethod,
  TicketHolderData,
} from "@putiikkipalvelu/storefront-sdk";
import { CustomerData, customerDataSchema } from "@/lib/zodSchemas";
import { useToast } from "@/hooks/use-toast";
import { apiCreatePayPalCheckoutSession } from "@/lib/actions/paypalActions";
import { trackBeginCheckout } from "@/lib/gtm";
import type { CartItem } from "@/hooks/use-cart";

/**
 * "Maksa PayPalilla" — creates the PayPal order and sends the buyer to
 * PayPal's approval page. Full-page assignment (not router.push): the
 * approval page is an external origin.
 */
export function PayPalPayButton({
  customerData,
  shipment,
  ticketHolders,
  disabled = false,
  onLoadingChange,
  onBeforeCheckout,
  cartItems,
  cartTotal,
  discountCode,
}: {
  customerData: CustomerData | null;
  shipment: CheckoutShipmentMethod | null;
  ticketHolders?: Record<string, TicketHolderData[]>;
  disabled?: boolean;
  /** Lets the parent extend its own isLoading guard over this button */
  onLoadingChange?: (loading: boolean) => void;
  /**
   * Runs after validation, before the PayPal order is created. The Paytrail
   * page uses this to release its already-created pending order so stock is
   * never reserved twice.
   */
  onBeforeCheckout?: () => Promise<void>;
  cartItems: CartItem[];
  cartTotal: number;
  discountCode?: string;
}) {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  const handleClick = async () => {
    if (isLoading || disabled) return;

    const validationResult = customerDataSchema.safeParse(customerData);
    if (!validationResult.success) {
      console.error("Customer data validation failed:", validationResult.error);
      return;
    }

    setIsLoading(true);
    onLoadingChange?.(true);

    trackBeginCheckout(cartItems, cartTotal, discountCode);

    await onBeforeCheckout?.();

    const result = await apiCreatePayPalCheckoutSession(
      shipment,
      validationResult.data,
      ticketHolders
    );

    if (result.success) {
      window.location.href = result.data.url;
      // Keep the button disabled while the browser navigates away
      return;
    }

    console.error("PayPal checkout failed:", result.error);
    toast({
      title: "Virhe maksun käsittelyssä",
      description: result.error || "Tuntematon virhe",
      className: "bg-red-50 border-red-200 dark:bg-red-900 dark:border-red-800",
    });
    setIsLoading(false);
    onLoadingChange?.(false);
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={disabled || isLoading}
      className="group inline-flex items-center justify-center gap-3 px-8 py-4 bg-[#003087] text-warm-white font-secondary text-sm tracking-wider uppercase transition-all duration-300 hover:bg-[#001c64] disabled:opacity-50 disabled:cursor-not-allowed"
    >
      {isLoading ? (
        <>
          <Loader2 className="w-4 h-4 animate-spin" />
          <span>Odota</span>
        </>
      ) : (
        <span>Maksa PayPalilla</span>
      )}
    </button>
  );
}

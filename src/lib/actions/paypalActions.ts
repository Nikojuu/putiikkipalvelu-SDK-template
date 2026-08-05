"use server";

import { storefront } from "@/lib/storefront";
import type {
  CheckoutCustomerData,
  CheckoutShipmentMethod,
  PayPalCheckoutResponse,
  TicketHolderData,
} from "@putiikkipalvelu/storefront-sdk";
import { StorefrontError } from "@putiikkipalvelu/storefront-sdk";
import { cookies } from "next/headers";
import { randomUUID } from "crypto";

export type PayPalCheckoutResult =
  | { success: true; data: PayPalCheckoutResponse; orderId: string }
  | { success: false; error: string };

/**
 * Create a PayPal checkout: the backend creates the PayPal order and returns
 * a hosted approval URL. Redirect the buyer there; PayPal returns them to the
 * backend, which captures the payment and forwards to the success page.
 */
export async function apiCreatePayPalCheckoutSession(
  chosenShipmentMethod: CheckoutShipmentMethod | null,
  customerData: CheckoutCustomerData,
  ticketHolders?: Record<string, TicketHolderData[]>
): Promise<PayPalCheckoutResult> {
  const cookieStore = await cookies();
  const cartId = cookieStore.get("cart-id")?.value;
  const sessionId = cookieStore.get("session-id")?.value;
  const orderId = randomUUID();

  try {
    const data = await storefront.checkout.paypal(
      {
        customerData,
        shipmentMethod: chosenShipmentMethod,
        orderId,
        successUrl: `${process.env.NEXT_PUBLIC_BASE_URL}/payment/success/${orderId}`,
        cancelUrl: `${process.env.NEXT_PUBLIC_BASE_URL}/payment/cancel/${orderId}`,
        ...(ticketHolders && { ticketHolders }),
      },
      {
        cartId,
        sessionId,
      }
    );

    return { success: true, data, orderId };
  } catch (error) {
    const message =
      error instanceof StorefrontError
        ? error.message
        : error instanceof Error
          ? error.message
          : "Tuntematon virhe";
    return { success: false, error: message };
  }
}

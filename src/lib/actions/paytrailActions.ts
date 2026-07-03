"use server";

import { storefront } from "@/lib/storefront";
import type {
  CheckoutCustomerData,
  CheckoutShipmentMethod,
  OrderStatus,
  PaytrailCheckoutResponse,
  TicketHolderData,
} from "@putiikkipalvelu/storefront-sdk";
import { StorefrontError } from "@putiikkipalvelu/storefront-sdk";
import { cookies } from "next/headers";
import { randomUUID } from "crypto";

export type PaytrailCheckoutResult =
  | { success: true; data: PaytrailCheckoutResponse; orderId: string }
  | { success: false; error: string };

export type ReleasePaytrailOrderResult =
  | { success: true; released: boolean; status: OrderStatus | null }
  | { success: false; error: string };

export async function apiCreatePaytrailCheckoutSession(
  chosenShipmentMethod: CheckoutShipmentMethod | null,
  customerData: CheckoutCustomerData,
  ticketHolders?: Record<string, TicketHolderData[]>
): Promise<PaytrailCheckoutResult> {
  const cookieStore = await cookies();
  const cartId = cookieStore.get("cart-id")?.value;
  const sessionId = cookieStore.get("session-id")?.value;
  const orderId = randomUUID();

  try {
    const data = await storefront.checkout.paytrail(
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

/**
 * Release an abandoned PENDING Paytrail order: cancel it and restore its
 * reserved stock. Called when the customer idles past the payment-page
 * timeout (before redirecting to the cart) and before creating a new
 * checkout session to replace a previous attempt.
 *
 * If a payment callback already finalized the order, nothing changes and the
 * current status is returned — check for PAID/SHIPPED and route to the
 * success page instead of the cart.
 */
export async function apiReleasePaytrailOrder(
  orderId: string
): Promise<ReleasePaytrailOrderResult> {
  try {
    const { released, status } = await storefront.order.releasePending(orderId);
    return { success: true, released, status };
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

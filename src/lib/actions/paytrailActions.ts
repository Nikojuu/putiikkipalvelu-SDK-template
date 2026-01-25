"use server";

import { storefront } from "@/lib/storefront";
import type {
  CheckoutCustomerData,
  CheckoutShipmentMethod,
  PaytrailCheckoutResponse,
} from "@putiikkipalvelu/storefront-sdk";
import { StorefrontError } from "@putiikkipalvelu/storefront-sdk";
import { cookies } from "next/headers";
import { randomUUID } from "crypto";

export type PaytrailCheckoutResult =
  | { success: true; data: PaytrailCheckoutResponse }
  | { success: false; error: string };

export async function apiCreatePaytrailCheckoutSession(
  chosenShipmentMethod: CheckoutShipmentMethod | null,
  customerData: CheckoutCustomerData
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
      },
      {
        cartId,
        sessionId,
      }
    );

    return { success: true, data };
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

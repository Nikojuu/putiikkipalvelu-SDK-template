"use server";

import { storefront } from "@/lib/storefront";
import type {
  CheckoutCustomerData,
  CheckoutShipmentMethod,
  StripeCheckoutResponse,
} from "@putiikkipalvelu/storefront-sdk";
import { cookies } from "next/headers";
import { randomUUID } from "crypto";

export async function apiCreateStripeCheckoutSession(
  chosenShipmentMethod: CheckoutShipmentMethod | null,
  customerData: CheckoutCustomerData
): Promise<StripeCheckoutResponse> {
  const cookieStore = await cookies();
  const cartId = cookieStore.get("cart-id")?.value;
  const sessionId = cookieStore.get("session-id")?.value;
  const orderId = randomUUID();

  return storefront.checkout.stripe(
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
}

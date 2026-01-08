"use server";

import { storefront } from "@/lib/storefront";
import type {
  ShipmentMethodsWithLocationsResponse,
  CartItem,
} from "@putiikkipalvelu/storefront-sdk";

/**
 * Get shipment methods with pickup locations for a postal code
 * @param postalCode - Customer's postal code for location-based filtering
 * @param cartItems - Cart items for weight-based filtering (SDK calculates weight)
 */
export async function getShipmentMethods(
  postalCode: string,
  cartItems?: CartItem[]
): Promise<ShipmentMethodsWithLocationsResponse> {
  return storefront.shipping.getWithLocations(postalCode, { cartItems });
}

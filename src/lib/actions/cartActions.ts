"use server";

import { cookies } from "next/headers";
import { storefront } from "@/lib/storefront";
import type {
  CartItem,
  CartResponse,
  CartValidationResponse,
  ApplyDiscountResponse,
  GetDiscountResponse,
  RemoveDiscountResponse,
  Campaign,
} from "@putiikkipalvelu/storefront-sdk";
import { StorefrontError } from "@putiikkipalvelu/storefront-sdk";

/**
 * Result type for discount code operations that can fail
 * In server actions, we return errors as part of the response
 * instead of throwing (Next.js doesn't serialize error details in production)
 */
export type ApplyDiscountResult =
  | { success: true; data: ApplyDiscountResponse }
  | { success: false; error: string; code?: string };

/**
 * Get cart session options from cookies
 */
async function getCartSessionOptions() {
  const cookieStore = await cookies();
  const cartId = cookieStore.get("cart-id")?.value;
  const sessionId = cookieStore.get("session-id")?.value;

  return { cartId, sessionId };
}

/**
 * Store cartId in cookie for guest users
 */
async function storeCartId(cartId: string | undefined) {
  if (cartId) {
    const cookieStore = await cookies();
    cookieStore.set("cart-id", cartId, {
      maxAge: 60 * 60 * 24 * 10, // 10 days
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
    });
  }
}

/**
 * Fetch cart from backend
 */
export async function apiFetchCart(): Promise<{
  items: CartItem[];
  cartId: string | null;
}> {
  const sessionOptions = await getCartSessionOptions();

  try {
    const data = await storefront.cart.get(sessionOptions);

    // Store cartId in cookie if returned (guest users)
    await storeCartId(data.cartId);

    return {
      items: data.items,
      cartId: data.cartId ?? null,
    };
  } catch {
    return { items: [], cartId: null };
  }
}

/**
 * Add item to cart
 */
export async function apiAddToCart(
  productId: string,
  variationId?: string,
  quantity: number = 1
): Promise<CartResponse> {
  const sessionOptions = await getCartSessionOptions();

  const data = await storefront.cart.addItem({
    ...sessionOptions,
    productId,
    variationId,
    quantity,
  });

  // Store cartId in cookie if returned
  await storeCartId(data.cartId);

  return data;
}

/**
 * Update item quantity by delta (atomic, race-condition safe)
 *
 * @param productId - Product ID
 * @param delta - Quantity change (+1, -1, or any integer)
 * @param variationId - Optional variation ID
 * @returns Updated cart data
 */
export async function apiUpdateCartQuantity(
  productId: string,
  delta: number,
  variationId?: string
): Promise<CartResponse> {
  const sessionOptions = await getCartSessionOptions();

  const data = await storefront.cart.updateQuantity({
    ...sessionOptions,
    productId,
    variationId,
    delta,
  });

  return data;
}

/**
 * Remove item from cart
 */
export async function apiRemoveFromCart(
  productId: string,
  variationId?: string
): Promise<CartResponse> {
  const sessionOptions = await getCartSessionOptions();

  const data = await storefront.cart.removeItem({
    ...sessionOptions,
    productId,
    variationId,
  });

  return data;
}

/**
 * Validate cart before checkout
 *
 * Checks product availability, stock, prices.
 * SDK calculates campaign conflicts and sends to backend.
 * Backend removes discount if campaigns apply.
 *
 * @param cartItems - Current cart items
 * @param campaigns - Active campaigns for conflict check
 */
export async function apiValidateCart(
  cartItems: CartItem[],
  campaigns?: Campaign[]
): Promise<CartValidationResponse> {
  const sessionOptions = await getCartSessionOptions();

  const data = await storefront.cart.validate(
    sessionOptions,
    cartItems,
    campaigns
  );

  return data;
}

// =============================================================================
// Discount Code Actions
// =============================================================================

/**
 * Apply a discount code to the cart
 *
 * SDK checks campaign conflict instantly (no API call if conflict).
 * API validates code and stores in Redis.
 *
 * Returns a result object instead of throwing errors to ensure
 * error messages are properly serialized in Next.js production.
 *
 * @param code - The discount code to apply
 * @param cartItems - Cart items for campaign conflict check
 * @param campaigns - Active campaigns for conflict check
 */
export async function apiApplyDiscountCode(
  code: string,
  cartItems?: CartItem[],
  campaigns?: Campaign[]
): Promise<ApplyDiscountResult> {
  const sessionOptions = await getCartSessionOptions();

  try {
    const data = await storefront.discountCode.apply({
      code,
      ...sessionOptions,
      cartItems,
      campaigns,
    });

    return { success: true, data };
  } catch (error) {
    // Extract error message and code from SDK errors
    if (error instanceof StorefrontError) {
      return { success: false, error: error.message, code: error.code };
    }
    if (error instanceof Error) {
      return { success: false, error: error.message };
    }
    return { success: false, error: "Tuntematon virhe" };
  }
}

/**
 * Get the currently applied discount code
 */
export async function apiGetDiscountCode(): Promise<GetDiscountResponse> {
  const sessionOptions = await getCartSessionOptions();

  const data = await storefront.discountCode.get(sessionOptions);

  return data;
}

/**
 * Remove the currently applied discount code
 */
export async function apiRemoveDiscountCode(): Promise<RemoveDiscountResponse> {
  const sessionOptions = await getCartSessionOptions();

  const data = await storefront.discountCode.remove(sessionOptions);

  return data;
}

// Re-export types for backwards compatibility
export type {
  CartValidationResponse,
  ApplyDiscountResponse,
  GetDiscountResponse,
  RemoveDiscountResponse,
};

"use server";

import { cookies } from "next/headers";
import { storefront } from "@/lib/storefront";
import type {
  CartItem,
  CartResponse,
  CartValidationResponse,
} from "@putiikkipalvelu/storefront-sdk";

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
 * Checks product availability, stock, and prices
 * Auto-fixes issues and returns change metadata
 */
export async function apiValidateCart(): Promise<CartValidationResponse> {
  const sessionOptions = await getCartSessionOptions();

  const data = await storefront.cart.validate(sessionOptions);

  return data;
}

// Re-export types for backwards compatibility
export type { CartValidationResponse };

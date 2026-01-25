"use client";

import type {
  ProductDetail,
  ProductVariation,
  CartItem,
  CartValidationResponse,
  Campaign,
  AppliedDiscount,
} from "@putiikkipalvelu/storefront-sdk";
import {
  getDiscountRemovalMessage,
  getDiscountApplyErrorMessage,
} from "@putiikkipalvelu/storefront-sdk";
import { create } from "zustand";
import {
  apiFetchCart,
  apiAddToCart,
  apiUpdateCartQuantity,
  apiRemoveFromCart,
  apiValidateCart,
  apiApplyDiscountCode,
  apiRemoveDiscountCode,
} from "@/lib/actions/cartActions";

// Re-export CartItem for backwards compatibility
export type { CartItem };

type CartState = {
  items: CartItem[];
  loading: boolean;
  error: string | null;
  discount: AppliedDiscount | null;
  discountLoading: boolean;
  discountError: string | null;

  // Sync with Redis
  syncWithBackend: () => Promise<void>;

  // Cart operations (all call server actions)
  addItem: (
    product: ProductDetail,
    variation?: ProductVariation
  ) => Promise<{ success: boolean; error?: string; code?: string }>;

  removeItem: (
    productId: string,
    variationId?: string
  ) => Promise<{ success: boolean; error?: string; code?: string }>;

  incrementQuantity: (
    productId: string,
    variationId?: string
  ) => Promise<{ success: boolean; error?: string; code?: string }>;

  decrementQuantity: (
    productId: string,
    variationId?: string
  ) => Promise<{ success: boolean; error?: string; code?: string }>;

  validateCart: (
    campaigns?: Campaign[]
  ) => Promise<{ success: boolean; data?: CartValidationResponse; error?: string }>;

  // Discount code operations
  applyDiscount: (
    code: string,
    campaigns?: Campaign[]
  ) => Promise<{ success: boolean; error?: string }>;
  removeDiscount: () => Promise<{ success: boolean; error?: string }>;
};

export const useCart = create<CartState>()((set, get) => ({
  items: [],
  loading: false,
  error: null,
  discount: null,
  discountLoading: false,
  discountError: null,

  // Load cart from Redis
  syncWithBackend: async () => {
    set({ loading: true, error: null });
    try {
      const data = await apiFetchCart();
      set({ items: data.items, loading: false });
    } catch (error) {
      console.error("Failed to sync cart:", error);
      set({ loading: false });
    }
  },

  // Add item to cart
  addItem: async (product, variation) => {
    set({ loading: true, error: null });

    const result = await apiAddToCart(product.id, variation?.id, 1);

    if (result.success) {
      set({ items: result.data.items, loading: false });
      return { success: true };
    } else {
      console.error("Failed to add item:", result.error);
      set({ loading: false, error: result.error });
      return { success: false, error: result.error, code: result.code };
    }
  },

  // Remove item from cart
  removeItem: async (productId, variationId) => {
    set({ loading: true, error: null });

    const result = await apiRemoveFromCart(productId, variationId);

    if (result.success) {
      set({ items: result.data.items, loading: false });
      return { success: true };
    } else {
      console.error("Failed to remove item:", result.error);
      set({ loading: false, error: result.error });
      return { success: false, error: result.error, code: result.code };
    }
  },

  // Increment quantity (optimistic update)
  incrementQuantity: async (productId, variationId) => {
    const previousItems = get().items;

    // Optimistic: update UI immediately
    set({
      items: previousItems.map((item) =>
        item.product.id === productId && item.variation?.id === variationId
          ? { ...item, cartQuantity: item.cartQuantity + 1 }
          : item
      ),
      error: null,
    });

    const result = await apiUpdateCartQuantity(productId, +1, variationId);

    if (result.success) {
      // Sync with server truth
      set({ items: result.data.items });
      return { success: true };
    } else {
      console.error("Failed to update quantity:", result.error);
      // Rollback on error
      set({ items: previousItems, error: result.error });
      return { success: false, error: result.error, code: result.code };
    }
  },

  // Decrement quantity (optimistic update)
  decrementQuantity: async (productId, variationId) => {
    const previousItems = get().items;

    // Optimistic: update UI immediately
    set({
      items: previousItems.map((item) =>
        item.product.id === productId && item.variation?.id === variationId
          ? { ...item, cartQuantity: item.cartQuantity - 1 }
          : item
      ),
      error: null,
    });

    const result = await apiUpdateCartQuantity(productId, -1, variationId);

    if (result.success) {
      // Sync with server truth
      set({ items: result.data.items });
      return { success: true };
    } else {
      console.error("Failed to update quantity:", result.error);
      // Rollback on error
      set({ items: previousItems, error: result.error });
      return { success: false, error: result.error, code: result.code };
    }
  },

  // Validate cart before checkout
  validateCart: async (campaigns?: Campaign[]) => {
    set({ loading: true, error: null });

    const cartItems = get().items;
    const result = await apiValidateCart(cartItems, campaigns);

    if (result.success) {
      // Update items from validation
      set({ items: result.data.items, loading: false });

      // Handle discount removal
      if (result.data.changes.discountCouponRemoved) {
        set({
          discount: null,
          discountError: getDiscountRemovalMessage(
            result.data.changes.discountRemovalReason
          ),
        });
      }

      return { success: true, data: result.data };
    } else {
      console.error("Failed to validate cart:", result.error);
      set({ loading: false, error: result.error });
      return { success: false, error: result.error };
    }
  },

  // Apply discount code
  applyDiscount: async (code: string, campaigns?: Campaign[]) => {
    set({ discountLoading: true, discountError: null });

    const cartItems = get().items;
    const result = await apiApplyDiscountCode(code, cartItems, campaigns);

    if (result.success) {
      set({
        discountLoading: false,
        discount: {
          code: result.data.discount.code,
          discountType: result.data.discount.discountType,
          discountValue: result.data.discount.discountValue,
        },
      });
      return { success: true };
    } else {
      // Use the specific error message from the result
      const errorMessage =
        result.error || getDiscountApplyErrorMessage(undefined);
      set({ discountLoading: false, discountError: errorMessage });
      return { success: false, error: errorMessage };
    }
  },

  // Remove discount code
  removeDiscount: async () => {
    set({ discountLoading: true, discountError: null });

    const result = await apiRemoveDiscountCode();

    if (result.success) {
      set({ discountLoading: false, discount: null });
      return { success: true };
    } else {
      console.error("Failed to remove discount:", result.error);
      set({ discountLoading: false });
      return { success: false, error: result.error };
    }
  },
}));

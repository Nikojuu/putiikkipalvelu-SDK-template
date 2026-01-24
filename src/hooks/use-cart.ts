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
  StorefrontError,
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
  discount: AppliedDiscount | null;
  discountLoading: boolean;
  discountError: string | null;

  // Sync with Redis
  syncWithBackend: () => Promise<void>;

  // Cart operations (all call server actions)
  addItem: (
    product: ProductDetail,
    variation?: ProductVariation
  ) => Promise<void>;

  removeItem: (productId: string, variationId?: string) => Promise<void>;

  incrementQuantity: (productId: string, variationId?: string) => Promise<void>;

  decrementQuantity: (productId: string, variationId?: string) => Promise<void>;

  validateCart: (campaigns?: Campaign[]) => Promise<CartValidationResponse>;

  // Discount code operations
  applyDiscount: (
    code: string,
    campaigns?: Campaign[]
  ) => Promise<{ success: boolean; error?: string }>;
  removeDiscount: () => Promise<void>;
};

export const useCart = create<CartState>()((set, get) => ({
  items: [],
  loading: false,
  discount: null,
  discountLoading: false,
  discountError: null,

  // Load cart from Redis
  syncWithBackend: async () => {
    set({ loading: true });
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
    set({ loading: true });
    try {
      const data = await apiAddToCart(product.id, variation?.id, 1);
      set({ items: data.items, loading: false });
    } catch (error) {
      console.error("Failed to add item:", error);
      set({ loading: false });
      throw error;
    }
  },

  // Remove item from cart
  removeItem: async (productId, variationId) => {
    set({ loading: true });
    try {
      const data = await apiRemoveFromCart(productId, variationId);
      set({ items: data.items, loading: false });
    } catch (error) {
      console.error("Failed to remove item:", error);
      set({ loading: false });
      throw error;
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
    });

    try {
      const data = await apiUpdateCartQuantity(
        productId,
        +1, // Delta: increment by 1
        variationId
      );
      // Sync with server truth
      set({ items: data.items });
    } catch (error) {
      console.error("Failed to update quantity:", error);
      // Rollback on error
      set({ items: previousItems });
      throw error;
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
    });

    try {
      const data = await apiUpdateCartQuantity(
        productId,
        -1, // Delta: decrement by 1
        variationId
      );
      // Sync with server truth
      set({ items: data.items });
    } catch (error) {
      console.error("Failed to update quantity:", error);
      // Rollback on error
      set({ items: previousItems });
      throw error;
    }
  },

  // Validate cart before checkout
  validateCart: async (campaigns?: Campaign[]) => {
    set({ loading: true });
    try {
      const cartItems = get().items;
      const data = await apiValidateCart(cartItems, campaigns);

      // Update items from validation
      set({ items: data.items, loading: false });

      // Handle discount removal
      if (data.changes.discountCouponRemoved) {
        set({
          discount: null,
          discountError: getDiscountRemovalMessage(data.changes.discountRemovalReason),
        });
      }

      return data;
    } catch (error) {
      console.error("Failed to validate cart:", error);
      set({ loading: false });
      throw error;
    }
  },

  // Apply discount code
  applyDiscount: async (code: string, campaigns?: Campaign[]) => {
    set({ discountLoading: true, discountError: null });
    try {
      const cartItems = get().items;
      const data = await apiApplyDiscountCode(code, cartItems, campaigns);
      set({
        discountLoading: false,
        discount: {
          code: data.discount.code,
          discountType: data.discount.discountType,
          discountValue: data.discount.discountValue,
        },
      });
      return { success: true };
    } catch (error) {
      // Use the specific error message from backend when available
      const errorMessage =
        error instanceof StorefrontError
          ? error.message
          : error instanceof Error
            ? error.message
            : getDiscountApplyErrorMessage(undefined);
      set({ discountLoading: false, discountError: errorMessage });
      return { success: false, error: errorMessage };
    }
  },

  // Remove discount code
  removeDiscount: async () => {
    set({ discountLoading: true, discountError: null });
    try {
      await apiRemoveDiscountCode();
      set({
        discountLoading: false,
        discount: null,
      });
    } catch (error) {
      console.error("Failed to remove discount:", error);
      set({ discountLoading: false });
    }
  },
}));

import type {
  ProductDetail,
  ProductVariation,
} from "@putiikkipalvelu/storefront-sdk";
import { useConsentStore } from "@/hooks/use-consent";

type GtmItem = {
  item_id: string;
  item_name: string;
  price: number;
  currency: string;
  quantity: number;
  item_category?: string;
  item_variant?: string;
};

function toGtmItem(
  product: ProductDetail,
  variation?: ProductVariation,
  quantity = 1
): GtmItem {
  const price = variation?.price ?? product.price;
  return {
    item_id: product.id,
    item_name: product.name,
    price: price / 100,
    currency: "EUR",
    quantity,
    ...(product.categories?.[0]?.name && {
      item_category: product.categories[0].name,
    }),
    ...(variation?.options?.length && {
      item_variant: variation.options.map((o) => o.value).join(" / "),
    }),
  };
}

function pushEvent(event: string, data: Record<string, unknown>) {
  if (typeof window === "undefined") return;
  // Skip if GTM isn't configured for this store
  if (!useConsentStore.getState().gtmEnabled) return;
  window.dataLayer = window.dataLayer || [];
  window.dataLayer.push({ ecommerce: null }); // Clear previous ecommerce data
  window.dataLayer.push({ event, ecommerce: data });
}

export function trackViewItem(
  product: ProductDetail,
  variation?: ProductVariation
) {
  const item = toGtmItem(product, variation);
  pushEvent("view_item", {
    currency: "EUR",
    value: item.price,
    items: [item],
  });
}

export function trackAddToCart(
  product: ProductDetail,
  variation?: ProductVariation
) {
  const item = toGtmItem(product, variation);
  pushEvent("add_to_cart", {
    currency: "EUR",
    value: item.price,
    items: [item],
  });
}

export function trackRemoveFromCart(
  product: ProductDetail,
  variation?: ProductVariation,
  quantity = 1
) {
  const item = toGtmItem(product, variation, quantity);
  pushEvent("remove_from_cart", {
    currency: "EUR",
    value: item.price * quantity,
    items: [item],
  });
}

export function trackViewCart(
  items: { product: ProductDetail; variation?: ProductVariation; cartQuantity: number }[],
  cartTotal: number
) {
  pushEvent("view_cart", {
    currency: "EUR",
    value: cartTotal / 100,
    items: items.map((i) => toGtmItem(i.product, i.variation, i.cartQuantity)),
  });
}

export function trackBeginCheckout(
  items: { product: ProductDetail; variation?: ProductVariation; cartQuantity: number }[],
  cartTotal: number,
  coupon?: string
) {
  pushEvent("begin_checkout", {
    currency: "EUR",
    value: cartTotal / 100,
    ...(coupon && { coupon }),
    items: items.map((i) => toGtmItem(i.product, i.variation, i.cartQuantity)),
  });
}

export function trackPurchase(order: {
  orderNumber: string;
  totalAmount: number;
  shippingCost?: number;
  discountCode?: string;
  items: { id: string; name: string; price: number; quantity: number }[];
}) {
  pushEvent("purchase", {
    transaction_id: order.orderNumber,
    currency: "EUR",
    value: order.totalAmount / 100,
    shipping: (order.shippingCost ?? 0) / 100,
    ...(order.discountCode && { coupon: order.discountCode }),
    items: order.items.map((item) => ({
      item_id: item.id,
      item_name: item.name,
      price: item.price / 100,
      currency: "EUR",
      quantity: item.quantity,
    })),
  });
}

// Extend Window type for dataLayer and gtag
// Uses unknown[] to support both object pushes (ecommerce) and array pushes (gtag consent)
declare global {
  // eslint-disable-next-line @typescript-eslint/consistent-type-definitions
  interface Window {
    dataLayer?: unknown[];
    gtag?: (...args: unknown[]) => void;
  }
}

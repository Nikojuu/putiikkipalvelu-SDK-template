"use client";

import { useEffect, useRef } from "react";
import { trackPurchase } from "@/lib/gtm";

type Props = {
  orderNumber: string;
  totalAmount: number;
  shippingCost?: number;
  discountCode?: string;
  items: { id: string; name: string; price: number; quantity: number }[];
};

export function PurchaseTracker({
  orderNumber,
  totalAmount,
  shippingCost,
  discountCode,
  items,
}: Props) {
  const tracked = useRef(false);

  useEffect(() => {
    if (tracked.current) return;
    tracked.current = true;

    trackPurchase({
      orderNumber,
      totalAmount,
      shippingCost,
      discountCode,
      items,
    });
  }, [orderNumber, totalAmount, shippingCost, discountCode, items]);

  return null;
}

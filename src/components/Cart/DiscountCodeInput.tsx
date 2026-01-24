"use client";

import { useState } from "react";
import { useCart } from "@/hooks/use-cart";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { X, Loader2, Tag, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Campaign } from "@putiikkipalvelu/storefront-sdk";
import { formatDiscountValue } from "@putiikkipalvelu/storefront-sdk";

interface DiscountCodeInputProps {
  className?: string;
  campaigns?: Campaign[];
}

export function DiscountCodeInput({ className, campaigns }: DiscountCodeInputProps) {
  const [code, setCode] = useState("");
  const {
    discount,
    discountLoading,
    discountError,
    applyDiscount,
    removeDiscount,
  } = useCart();

  const handleApply = async () => {
    if (!code.trim()) return;
    const result = await applyDiscount(code.trim().toUpperCase(), campaigns);
    if (result.success) {
      setCode("");
    }
  };

  const handleRemove = async () => {
    await removeDiscount();
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleApply();
    }
  };

  // Show applied discount
  if (discount) {
    return (
      <div className={cn("space-y-2", className)}>
        <label className="text-sm font-medium">Alennuskoodi</label>
        <div className="flex items-center justify-between rounded-lg border border-green-200 bg-green-50 px-3 py-2">
          <div className="flex items-center gap-2">
            <Check className="h-4 w-4 text-green-600" />
            <span className="font-mono text-sm font-medium text-green-700">
              {discount.code}
            </span>
            <span className="text-sm text-green-600">
              {formatDiscountValue(discount)}
            </span>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleRemove}
            disabled={discountLoading}
            className="h-6 w-6 p-0 text-green-600 hover:text-green-700 hover:bg-green-100"
          >
            {discountLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <X className="h-4 w-4" />
            )}
          </Button>
        </div>
      </div>
    );
  }

  // Show input form
  return (
    <div className={cn("space-y-2", className)}>
      <label htmlFor="discount-code" className="text-sm font-medium">
        Alennuskoodi
      </label>
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Tag className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            id="discount-code"
            type="text"
            placeholder="Syötä alennuskoodi"
            value={code}
            onChange={(e) => setCode(e.target.value.toUpperCase())}
            onKeyDown={handleKeyDown}
            disabled={discountLoading}
            className={cn(
              "pl-9 uppercase",
              discountError && "border-red-500 focus-visible:ring-red-500"
            )}
          />
        </div>
        <Button
          onClick={handleApply}
          disabled={discountLoading || !code.trim()}
        >
          {discountLoading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            "Käytä"
          )}
        </Button>
      </div>
      {discountError && (
        <p className="text-sm text-red-500">{discountError}</p>
      )}
    </div>
  );
}

import React from "react";

interface PriceDisplayProps {
  displayPrice: number; // Final calculated price to display
  originalPrice?: number; // Optional, original price for strikethrough
  isOnSale?: boolean; // Indicates if the product is on sale
  salePercent?: string | null; // Optional, sale percentage to display
  lowestPriceBeforeSale?: number | null; // KSL 2:11 § reference price in euros; shown while on sale
}

export const PriceDisplay: React.FC<PriceDisplayProps> = ({
  displayPrice,
  originalPrice,
  isOnSale = false,
  salePercent,
  lowestPriceBeforeSale,
}) => {
  const discountPercentage = React.useMemo(() => {
    if (salePercent && !isNaN(parseFloat(salePercent))) {
      return ((1 - parseFloat(salePercent)) * 100).toFixed(0);
    }
    return null;
  }, [salePercent]);

  return (
    <div className="flex flex-col items-end gap-1">
      <div className="flex items-center gap-2">
        {isOnSale && discountPercentage !== null ? (
          <span className="bg-red-100 text-red-500 text-xs font-medium px-2 py-0.5 rounded">
            -{discountPercentage}%
          </span>
        ) : (
          <span className="invisible"></span>
        )}
        {isOnSale && originalPrice ? (
          <span className="text-gray-400 text-sm line-through">
            €{originalPrice.toFixed(2)}
          </span>
        ) : (
          <span className="invisible"></span>
        )}
      </div>
      <span className="text-lg font-bold">€{displayPrice.toFixed(2)}</span>
      {/* Required by law (KSL 2:11 §) whenever a reduction is announced — never hide behind a link */}
      {isOnSale && lowestPriceBeforeSale != null && (
        <span className="text-sm text-gray-600">
          Alin hinta 30 pv: €{lowestPriceBeforeSale.toFixed(2)}
        </span>
      )}
    </div>
  );
};

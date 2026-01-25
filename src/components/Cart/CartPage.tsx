"use client";

import Subtitle from "@/components/subtitle";
import { useCart } from "@/hooks/use-cart";
import { Loader2 } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "@/hooks/use-toast";
import { CampaignAddedCartItems } from "./CampaignAddedCartItems";
import { DiscountCodeInput } from "./DiscountCodeInput";
import {
  calculateCartWithCampaigns,
  type Campaign,
} from "@putiikkipalvelu/storefront-sdk";

export type ShipmentMethods = {
  id: string;
  name: string;
  min_estimate_delivery_days: number | null;
  max_estimate_delivery_days: number | null;
  cost: number;
};

/**
 * Calculate discount amount from discount code
 */
function calculateDiscountAmount(
  discount: { discountType: "PERCENTAGE" | "FIXED_AMOUNT"; discountValue: number } | null,
  cartTotal: number
): number {
  if (!discount) return 0;

  if (discount.discountType === "PERCENTAGE") {
    return Math.round(cartTotal * (discount.discountValue / 100));
  }
  // FIXED_AMOUNT: discountValue is already in cents
  return discount.discountValue;
}

const CartPage = ({ campaigns }: { campaigns: Campaign[] }) => {
  const [validationError, setValidationError] = useState<string | null>(null);
  const [isValidating, setIsValidating] = useState(false);

  const router = useRouter();
  const cart = useCart();

  // Calculate cart with campaigns applied
  const { calculatedItems, cartTotal, originalTotal, totalSavings } =
    calculateCartWithCampaigns(cart.items, campaigns);

  // Calculate discount amount locally
  const discountAmount = calculateDiscountAmount(cart.discount, cartTotal);

  // Find Buy X Pay Y campaign for CampaignAddedCartItems component
  const buyXPayYCampaign = campaigns.find(
    (campaign) => campaign.type === "BUY_X_PAY_Y" && campaign.isActive
  );

  // Clear validation error when cart items change
  useEffect(() => {
    if (validationError) {
      setValidationError(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cart.items]);

  const handleCheckout = async () => {
    if (isValidating) return;
    setIsValidating(true);
    setValidationError(null); // Clear previous errors

    const result = await cart.validateCart(campaigns);

    if (!result.success) {
      console.error("Validation failed:", result.error);
      toast({
        title: "Virhe",
        description: result.error || "Ostoskorin tarkistus epäonnistui. Yritä uudelleen.",
        variant: "destructive",
      });
      setIsValidating(false);
      return;
    }

    const validation = result.data!;

    if (validation.hasChanges) {
      // Build toast message from changes
      const messages: string[] = [];
      if (validation.changes.removedItems > 0) {
        messages.push(
          `${validation.changes.removedItems} tuotetta poistettiin (loppu varastosta tai poistettu)`
        );
      }
      if (validation.changes.quantityAdjusted > 0) {
        messages.push(
          `${validation.changes.quantityAdjusted} tuotteen määrää vähennettiin varastotilanteen mukaan`
        );
      }
      if (validation.changes.priceChanged > 0) {
        messages.push(
          `${validation.changes.priceChanged} tuotteen hinta päivitettiin`
        );
      }
      if (validation.changes.discountCouponRemoved) {
        messages.push("Alennuskoodi poistettiin kampanja-alennuksen vuoksi");
      }

      // Show warning toast
      toast({
        title:
          "Ostoskorissa on tapahtunut muutoksia. Tarkista ostoskori ennen jatkamista.",
        description: messages.join(". "),
        variant: "default",
        className:
          "bg-amber-50 border-amber-200 dark:bg-amber-900 dark:border-amber-800",
      });

      // Set persistent error banner
      setValidationError(
        "Tuotteissa on tapahtunut muutoksia tarkista ostoskori ennen jatkamista"
      );

      // BLOCK navigation - user stays on cart page
      setIsValidating(false);
      return;
    }

    // Validation passed - proceed to checkout
    setIsValidating(false);
    router.push("/payment/checkout");
  };

  return (
    <section className="pt-8 md:pt-16 pb-16 bg-warm-white">
      <Subtitle subtitle="Ostoskori" />

      <div className="container mx-auto px-4 max-w-screen-xl">
        <div className="lg:grid lg:grid-cols-12 lg:gap-x-12">
          {/* Cart Items Section */}
          <div className="lg:col-span-7">
            <h2 className="sr-only">Ostoskorin tuotteet</h2>

            {cart.loading ? (
              /* Loading skeleton */
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <div
                    key={i}
                    className="relative p-6 bg-cream/30 border border-rose-gold/10 animate-pulse"
                  >
                    <div className="flex gap-6">
                      {/* Image skeleton */}
                      <div className="w-24 h-24 bg-rose-gold/20 rounded" />
                      {/* Content skeleton */}
                      <div className="flex-1 space-y-3">
                        <div className="h-5 bg-rose-gold/20 rounded w-3/4" />
                        <div className="h-4 bg-rose-gold/20 rounded w-1/2" />
                        <div className="h-4 bg-rose-gold/20 rounded w-1/4" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : cart.items.length === 0 ? (
              /* Empty cart state */
              <div className="relative p-8 md:p-12 bg-cream/30 border border-rose-gold/10">
                {/* Corner accents */}
                <div className="absolute top-0 left-0 w-6 h-6 border-l-2 border-t-2 border-rose-gold/30" />
                <div className="absolute top-0 right-0 w-6 h-6 border-r-2 border-t-2 border-rose-gold/30" />
                <div className="absolute bottom-0 left-0 w-6 h-6 border-l-2 border-b-2 border-rose-gold/30" />
                <div className="absolute bottom-0 right-0 w-6 h-6 border-r-2 border-b-2 border-rose-gold/30" />

                <div className="flex flex-col items-center justify-center text-center">
                  {/* Decorative element */}
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-8 h-[1px] bg-gradient-to-r from-transparent to-rose-gold/40" />
                    <div className="w-2 h-2 bg-rose-gold/30 diamond-shape" />
                    <div className="w-8 h-[1px] bg-gradient-to-l from-transparent to-rose-gold/40" />
                  </div>

                  <div aria-hidden="true" className="relative mb-6 h-40 w-40">
                    <Image
                      src="https://dsh3gv4ve2.ufs.sh/f/PRCJ5a0N1o4i4qKGOmoWuI5hetYs2UbcZvCKz06lFmBSQgq9"
                      fill
                      loading="eager"
                      alt="Tyhjä ostoskori"
                      className="object-contain opacity-80"
                    />
                  </div>

                  <h3 className="font-primary text-4xl text-charcoal mb-2">
                    Ostoskorisi on tyhjä
                  </h3>
                  <p className="text-base font-secondary text-charcoal/60 mb-8">
                    Löydä itsellesi sopiva koru kokoelmastamme
                  </p>

                  <Link
                    href="/products"
                    className="group inline-flex items-center gap-3 px-8 py-4 bg-charcoal text-warm-white font-secondary text-sm tracking-wider uppercase transition-all duration-300 hover:bg-rose-gold"
                  >
                    <span>Selaa koruja</span>
                    <svg
                      className="w-4 h-4 transition-transform duration-300 group-hover:translate-x-1"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={1.5}
                        d="M17 8l4 4m0 0l-4 4m4-4H3"
                      />
                    </svg>
                  </Link>
                </div>
              </div>
            ) : (
              /* Cart items list */
              <div className="space-y-4">
                <CampaignAddedCartItems
                  buyXPayYCampaign={buyXPayYCampaign}
                  calculatedItems={calculatedItems}
                />
              </div>
            )}
          </div>

          {/* Order Summary Section */}
          <section className="mt-12 lg:mt-0 lg:col-span-5">
            <div className="relative bg-cream/40 p-6 md:p-8">
              {/* Border frame */}
              <div className="absolute inset-0 border border-rose-gold/15 pointer-events-none" />

              {/* Corner accents */}
              <div className="absolute top-0 left-0 w-6 h-6 border-l-2 border-t-2 border-rose-gold/40" />
              <div className="absolute top-0 right-0 w-6 h-6 border-r-2 border-t-2 border-rose-gold/40" />
              <div className="absolute bottom-0 left-0 w-6 h-6 border-l-2 border-b-2 border-rose-gold/40" />
              <div className="absolute bottom-0 right-0 w-6 h-6 border-r-2 border-b-2 border-rose-gold/40" />

              {/* Header */}
              <div className="flex items-center gap-3 mb-6">
                <div className="w-1.5 h-1.5 bg-rose-gold/60 diamond-shape" />
                <h2 className="font-primary text-4xl text-charcoal">
                  Tilauksen yhteenveto
                </h2>
              </div>

              <div className="space-y-4">
                {/* Campaign savings */}
                {totalSavings > 0 && (
                  <div className="space-y-3 pb-4 border-b border-rose-gold/15">
                    <div className="flex items-center justify-between">
                      <span className="text-base font-secondary text-charcoal/60">
                        Alkuperäinen hinta
                      </span>
                      <span className="text-base font-secondary text-charcoal/60">
                        {`${(originalTotal / 100).toFixed(2)} €`}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-base font-secondary text-deep-burgundy">
                        Kampanja säästö
                      </span>
                      <span className="text-base font-secondary text-deep-burgundy font-medium">
                        {`-${(totalSavings / 100).toFixed(2)} €`}
                      </span>
                    </div>
                  </div>
                )}

                {/* Shipping note */}
                <div className="py-3">
                  <p className="text-sm font-secondary text-charcoal/50">
                    Toimitusmaksu lisätään kun toimitustapa on valittu
                  </p>
                </div>

                {/* Discount code - only show when no campaign discount applies */}
                {cart.items.length > 0 && totalSavings === 0 && (
                  <div className="py-3 border-t border-rose-gold/15">
                    <DiscountCodeInput campaigns={campaigns} />
                  </div>
                )}

                {/* Discount code savings */}
                {cart.discount && discountAmount > 0 && (
                  <div className="space-y-3 py-3 border-t border-rose-gold/15">
                    <div className="flex items-center justify-between">
                      <span className="text-base font-secondary text-charcoal/60">
                        Välisumma
                      </span>
                      <span className="text-base font-secondary text-charcoal/60">
                        {`${(cartTotal / 100).toFixed(2)} €`}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-base font-secondary text-deep-burgundy">
                        Alennus ({cart.discount.code})
                      </span>
                      <span className="text-base font-secondary text-deep-burgundy font-medium">
                        {`-${(discountAmount / 100).toFixed(2)} €`}
                      </span>
                    </div>
                  </div>
                )}

                {/* Total */}
                <div className="flex items-center justify-between pt-4 border-t border-rose-gold/20">
                  <span className="font-secondary text-charcoal uppercase tracking-wider text-base">
                    Yhteensä
                  </span>
                  <span className="text-lg text-charcoal ">
                    {cart.discount && discountAmount > 0
                      ? `${((cartTotal - discountAmount) / 100).toFixed(2)} €`
                      : `${(cartTotal / 100).toFixed(2)} €`}
                  </span>
                </div>

                {/* Campaign savings badge */}
                {totalSavings > 0 && (
                  <div className="text-center pt-2">
                    <span className="inline-block text-sm font-secondary text-deep-burgundy bg-deep-burgundy/10 px-4 py-2">
                      Säästät {(totalSavings / 100).toFixed(2)} € kampanjalla!
                    </span>
                  </div>
                )}

                {/* Discount code savings badge */}
                {cart.discount && discountAmount > 0 && totalSavings === 0 && (
                  <div className="text-center pt-2">
                    <span className="inline-block text-sm font-secondary text-deep-burgundy bg-deep-burgundy/10 px-4 py-2">
                      Säästät {(discountAmount / 100).toFixed(2)} € alennuskoodilla!
                    </span>
                  </div>
                )}
              </div>

              {/* Checkout button - only show if cart has items */}
              {cart.items.length > 0 && (
                <div className="mt-8">
                  {/* Validation error banner */}
                  {validationError && (
                    <div
                      className="mb-4 p-4 bg-red-50 border border-red-200 text-red-800"
                      role="alert"
                      aria-live="assertive"
                      aria-atomic="true"
                    >
                      <p className="text-sm font-secondary">
                        {validationError}
                      </p>
                    </div>
                  )}

                  <button
                    onClick={handleCheckout}
                    disabled={cart.loading || isValidating}
                    className="group w-full inline-flex items-center justify-center gap-3 px-8 py-4 bg-charcoal text-warm-white font-secondary text-sm tracking-wider uppercase transition-all duration-300 hover:bg-rose-gold disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {cart.loading || isValidating ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                      </>
                    ) : (
                      <>
                        <span>Jatka tilaukseen</span>
                        <svg
                          className="w-4 h-4 transition-transform duration-300 group-hover:translate-x-1"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={1.5}
                            d="M17 8l4 4m0 0l-4 4m4-4H3"
                          />
                        </svg>
                      </>
                    )}
                  </button>
                </div>
              )}

              {/* Continue shopping link */}
              <div className="mt-4 text-center">
                <Link
                  href="/products"
                  className="inline-flex items-center gap-2 text-sm font-secondary text-charcoal/60 hover:text-rose-gold transition-colors duration-300"
                >
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1.5}
                      d="M7 16l-4-4m0 0l4-4m-4 4h18"
                    />
                  </svg>
                  <span>Jatka ostoksia</span>
                </Link>
              </div>
            </div>
          </section>
        </div>
      </div>
    </section>
  );
};

export default CartPage;

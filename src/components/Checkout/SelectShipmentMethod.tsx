"use client";

import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import {
  type ShipmentMethodsResponse,
  type HomeDeliveryOption,
  type PickupPointOption,
} from "@putiikkipalvelu/storefront-sdk";
import { useState } from "react";

/**
 * Selection value passed to parent when user selects a shipping option
 */
export interface ShipmentSelection {
  /** ShipmentMethods.id */
  shipmentMethodId: string;
  /** Pickup point ID (null for home delivery) */
  pickupPointId: string | null;
  /** Shipit service ID (null for home delivery or custom methods) */
  serviceId: string | null;
}

interface Props {
  /** Shipping options from SDK */
  shippingOptions: ShipmentMethodsResponse | null;
  /** Callback when user selects a shipping option */
  onSelect: (selection: ShipmentSelection) => void;
  /** Current cart total in cents (for calculating remaining amount for free shipping) */
  cartTotal?: number;
}

/**
 * Shipping method selector component.
 * Shows pickup points first (more popular in Finland), then home delivery options.
 */
export function SelectShipmentMethod({
  shippingOptions,
  onSelect,
  cartTotal,
}: Props) {
  const [selectedValue, setSelectedValue] = useState<string | null>(null);
  const [showAllPickupPoints, setShowAllPickupPoints] = useState(false);

  // Number of pickup points to show initially
  const INITIAL_PICKUP_POINTS = 4;

  // Safely extract arrays with defaults
  const homeDelivery = shippingOptions?.homeDelivery ?? [];
  const pickupPoints = shippingOptions?.pickupPoints ?? [];

  // Format helpers
  const formatPrice = (cents: number) => `${(cents / 100).toFixed(2)}€`;

  /**
   * Renders free shipping badge or "add X more" message
   * Only shows for methods that have a freeShippingThreshold configured
   */
  const renderFreeShippingInfo = (freeShippingThreshold: number | null) => {
    // No free shipping threshold = no badge (e.g., "Nouto" which is just free)
    if (freeShippingThreshold === null || cartTotal === undefined) {
      return null;
    }

    // Free shipping threshold met
    if (cartTotal >= freeShippingThreshold) {
      return (
        <span className="text-xs font-secondary font-medium text-green-700 bg-green-100 px-2 py-1 border border-green-200">
          Ilmainen toimitus
        </span>
      );
    }

    // Show "add X more" to reach threshold
    const remaining = freeShippingThreshold - cartTotal;
    return (
      <span className="text-xs font-secondary text-charcoal/60">
        Lisää {formatPrice(remaining)} ilmaiseen toimitukseen
      </span>
    );
  };

  /**
   * Check if free shipping is active for this method
   */
  const isFreeShipping = (freeShippingThreshold: number | null) => {
    return (
      freeShippingThreshold !== null &&
      cartTotal !== undefined &&
      cartTotal >= freeShippingThreshold
    );
  };

  const formatDistance = (meters: number | null) => {
    if (meters === null) return null;
    if (meters < 1000) return `${meters}m`;
    return `${(meters / 1000).toFixed(1)}km`;
  };

  const handleValueChange = (value: string) => {
    setSelectedValue(value);

    const data = JSON.parse(value) as {
      type: "pickup" | "delivery";
      shipmentMethodId: string;
      pickupPointId?: string;
      serviceId?: string;
    };

    onSelect({
      shipmentMethodId: data.shipmentMethodId,
      pickupPointId:
        data.type === "pickup" ? (data.pickupPointId ?? null) : null,
      serviceId: data.type === "pickup" ? (data.serviceId ?? null) : null,
    });
  };

  // Create radio value for pickup point
  const pickupValue = (point: PickupPointOption) =>
    JSON.stringify({
      type: "pickup",
      shipmentMethodId: point.shipmentMethodId,
      pickupPointId: point.id,
      serviceId: point.serviceId,
    });

  // Create radio value for home delivery
  const deliveryValue = (option: HomeDeliveryOption) =>
    JSON.stringify({
      type: "delivery",
      shipmentMethodId: option.id,
    });

  const hasPickupPoints = pickupPoints.length > 0;
  const hasHomeDelivery = homeDelivery.length > 0;

  if (!hasPickupPoints && !hasHomeDelivery) {
    return (
      <div className="text-center py-8 text-charcoal/60">
        Ei saatavilla olevia toimitustapoja tälle postinumerolle.
      </div>
    );
  }

  return (
    <div className="space-y-8 w-full">
      {/* Header */}
      <div className="text-center">
        <div className="flex items-center justify-center gap-4 mb-4">
          <div className="w-2 h-2 bg-rose-gold/60 diamond-shape" />
          <div className="w-16 h-[1px] bg-gradient-to-r from-rose-gold/60 to-champagne/40" />
          <div className="w-1.5 h-1.5 bg-champagne/50 diamond-shape" />
          <div className="w-16 h-[1px] bg-gradient-to-l from-rose-gold/60 to-champagne/40" />
          <div className="w-2 h-2 bg-rose-gold/60 diamond-shape" />
        </div>
        <h2 className="text-3xl md:text-4xl font-primary text-charcoal tracking-tight">
          Valitse toimitustapa
        </h2>
        <div className="mt-4 h-[1px] bg-gradient-to-r from-transparent via-rose-gold/30 to-transparent max-w-xs mx-auto" />
      </div>

      <RadioGroup
        value={selectedValue ?? undefined}
        onValueChange={handleValueChange}
        className="space-y-8"
      >
        {/* ================================================================= */}
        {/* PICKUP POINTS SECTION - Shown first (more popular in Finland)    */}
        {/* ================================================================= */}
        {hasPickupPoints && (
          <div className="space-y-6">
            <div className="flex items-center gap-3">
              <div className="w-1.5 h-1.5 bg-rose-gold/60 diamond-shape" />
              <h3 className="text-xl md:text-2xl font-primary text-charcoal">
                Noutopisteet
              </h3>
              <div className="flex-1 h-[1px] bg-gradient-to-r from-rose-gold/30 to-transparent" />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {(showAllPickupPoints
                ? pickupPoints
                : pickupPoints.slice(0, INITIAL_PICKUP_POINTS)
              ).map((point) => {
                const value = pickupValue(point);
                const isSelected = selectedValue === value;

                return (
                  <div
                    key={`${point.id}-${point.shipmentMethodId}-${point.serviceId}`}
                    className={`group relative bg-warm-white cursor-pointer transition-all duration-500 ${
                      isSelected ? "shadow-lg" : "hover:shadow-md"
                    }`}
                  >
                    {/* Border frame */}
                    <div
                      className={`absolute inset-0 border pointer-events-none transition-colors duration-500 ${
                        isSelected
                          ? "border-rose-gold/40"
                          : "border-rose-gold/10 group-hover:border-rose-gold/25"
                      }`}
                    />

                    {/* Corner accents */}
                    <div
                      className={`absolute top-0 left-0 w-4 h-4 border-l border-t transition-all duration-500 ${
                        isSelected
                          ? "border-rose-gold/60 w-6 h-6"
                          : "border-rose-gold/30 group-hover:w-6 group-hover:h-6 group-hover:border-rose-gold/50"
                      }`}
                    />
                    <div
                      className={`absolute top-0 right-0 w-4 h-4 border-r border-t transition-all duration-500 ${
                        isSelected
                          ? "border-rose-gold/60 w-6 h-6"
                          : "border-rose-gold/30 group-hover:w-6 group-hover:h-6 group-hover:border-rose-gold/50"
                      }`}
                    />
                    <div
                      className={`absolute bottom-0 left-0 w-4 h-4 border-l border-b transition-all duration-500 ${
                        isSelected
                          ? "border-rose-gold/60 w-6 h-6"
                          : "border-rose-gold/30 group-hover:w-6 group-hover:h-6 group-hover:border-rose-gold/50"
                      }`}
                    />
                    <div
                      className={`absolute bottom-0 right-0 w-4 h-4 border-r border-b transition-all duration-500 ${
                        isSelected
                          ? "border-rose-gold/60 w-6 h-6"
                          : "border-rose-gold/30 group-hover:w-6 group-hover:h-6 group-hover:border-rose-gold/50"
                      }`}
                    />

                    <CardContent className="p-4 relative">
                      <div className="flex items-start space-x-3">
                        <RadioGroupItem
                          value={value}
                          id={`pickup-${point.id}-${point.shipmentMethodId}`}
                          className="mt-1.5 flex-shrink-0"
                        />

                        <Label
                          htmlFor={`pickup-${point.id}-${point.shipmentMethodId}`}
                          className="block cursor-pointer w-full min-w-0"
                        >
                          <div className="space-y-3">
                            {/* Carrier badge */}
                            <div className="flex items-center space-x-2 min-w-0 bg-cream/40 px-2 py-1 border border-rose-gold/10">
                              {point.logo && (
                                <img
                                  src={point.logo}
                                  alt={point.carrier ?? ""}
                                  className="w-5 h-5 object-contain flex-shrink-0"
                                />
                              )}
                              <span className="text-xs font-secondary font-medium text-charcoal/70 truncate">
                                {point.carrier}
                              </span>
                            </div>

                            {/* Location name */}
                            <h4 className="font-secondary font-medium text-sm leading-tight line-clamp-2 min-h-10 text-charcoal">
                              {point.name}
                            </h4>

                            {/* Address */}
                            <div className="text-xs font-secondary text-charcoal/60 space-y-1 bg-cream/30 p-2 border border-rose-gold/10">
                              <p className="truncate font-medium">
                                {point.address}
                              </p>
                              <p className="truncate">
                                {point.postalCode} {point.city}
                              </p>
                            </div>

                            {/* Price and Distance */}
                            <div className="flex flex-col gap-2 pt-1">
                              <div className="flex justify-between items-center">
                                {isFreeShipping(point.freeShippingThreshold) ? (
                                  <span className="font-primary text-base text-green-700 bg-green-100 px-2 py-1 border border-green-200">
                                    {formatPrice(point.price)}
                                  </span>
                                ) : (
                                  <span className="font-primary text-base text-charcoal bg-rose-gold/10 px-2 py-1 border border-rose-gold/20">
                                    {formatPrice(point.price)}
                                  </span>
                                )}
                                {point.distance !== null && (
                                  <span className="text-charcoal/60 text-xs font-secondary font-medium bg-cream/40 px-2 py-1 border border-rose-gold/10">
                                    {formatDistance(point.distance)}
                                  </span>
                                )}
                              </div>
                              {renderFreeShippingInfo(
                                point.freeShippingThreshold
                              )}
                            </div>
                          </div>
                        </Label>
                      </div>
                    </CardContent>
                  </div>
                );
              })}
            </div>

            {/* Show More/Less Button */}
            {pickupPoints.length > INITIAL_PICKUP_POINTS && (
              <div className="flex justify-center pt-4">
                <button
                  type="button"
                  onClick={() => setShowAllPickupPoints(!showAllPickupPoints)}
                  className="inline-flex items-center gap-3 px-8 py-3 border border-charcoal/30 text-charcoal font-secondary text-sm tracking-wider uppercase transition-all duration-300 hover:border-rose-gold hover:text-rose-gold"
                >
                  {showAllPickupPoints
                    ? `Näytä vähemmän (${INITIAL_PICKUP_POINTS}/${pickupPoints.length})`
                    : `Näytä lisää (${pickupPoints.length - INITIAL_PICKUP_POINTS} lisää)`}
                </button>
              </div>
            )}
          </div>
        )}

        {/* ================================================================= */}
        {/* HOME DELIVERY SECTION                                            */}
        {/* ================================================================= */}
        {hasHomeDelivery && (
          <div className="space-y-6">
            <div className="flex items-center gap-3">
              <div className="w-1.5 h-1.5 bg-rose-gold/60 diamond-shape" />
              <h3 className="text-xl md:text-2xl font-primary text-charcoal">
                Kotiinkuljetus
              </h3>
              <div className="flex-1 h-[1px] bg-gradient-to-r from-rose-gold/30 to-transparent" />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {homeDelivery.map((option) => {
                const value = deliveryValue(option);
                const isSelected = selectedValue === value;

                return (
                  <div
                    key={option.id}
                    className={`group relative bg-warm-white cursor-pointer transition-all duration-500 ${
                      isSelected ? "shadow-lg" : "hover:shadow-md"
                    }`}
                  >
                    {/* Border frame */}
                    <div
                      className={`absolute inset-0 border pointer-events-none transition-colors duration-500 ${
                        isSelected
                          ? "border-rose-gold/40"
                          : "border-rose-gold/10 group-hover:border-rose-gold/25"
                      }`}
                    />

                    {/* Corner accents */}
                    <div
                      className={`absolute top-0 left-0 w-6 h-6 border-l-2 border-t-2 transition-all duration-500 ${
                        isSelected
                          ? "border-rose-gold/60 w-8 h-8"
                          : "border-rose-gold/30 group-hover:w-8 group-hover:h-8 group-hover:border-rose-gold/50"
                      }`}
                    />
                    <div
                      className={`absolute top-0 right-0 w-6 h-6 border-r-2 border-t-2 transition-all duration-500 ${
                        isSelected
                          ? "border-rose-gold/60 w-8 h-8"
                          : "border-rose-gold/30 group-hover:w-8 group-hover:h-8 group-hover:border-rose-gold/50"
                      }`}
                    />
                    <div
                      className={`absolute bottom-0 left-0 w-6 h-6 border-l-2 border-b-2 transition-all duration-500 ${
                        isSelected
                          ? "border-rose-gold/60 w-8 h-8"
                          : "border-rose-gold/30 group-hover:w-8 group-hover:h-8 group-hover:border-rose-gold/50"
                      }`}
                    />
                    <div
                      className={`absolute bottom-0 right-0 w-6 h-6 border-r-2 border-b-2 transition-all duration-500 ${
                        isSelected
                          ? "border-rose-gold/60 w-8 h-8"
                          : "border-rose-gold/30 group-hover:w-8 group-hover:h-8 group-hover:border-rose-gold/50"
                      }`}
                    />

                    <CardContent className="p-6 relative">
                      <div className="flex items-start space-x-4">
                        <RadioGroupItem
                          value={value}
                          id={`delivery-${option.id}`}
                          className="mt-1.5 flex-shrink-0"
                        />
                        <div className="flex-1 min-w-0">
                          <Label
                            htmlFor={`delivery-${option.id}`}
                            className="block cursor-pointer w-full"
                          >
                            <div className="space-y-3">
                              {/* Header with logo and name */}
                              <div className="flex items-center gap-3">
                                {option.logo && (
                                  <img
                                    src={option.logo}
                                    alt={option.carrier ?? option.name}
                                    className="w-8 h-8 object-contain flex-shrink-0"
                                  />
                                )}
                                <h4 className="font-primary text-lg leading-tight line-clamp-2 text-charcoal">
                                  {option.name}
                                </h4>
                              </div>

                              {/* Description */}
                              <p className="text-sm min-h-10 font-secondary text-charcoal/60 leading-relaxed">
                                {option.description ?? option.name}
                              </p>

                              {/* Price and delivery time */}
                              <div className="flex flex-col gap-2 pt-2">
                                <div className="flex justify-between items-end">
                                  {option.estimatedDelivery && (
                                    <div className="text-sm font-secondary text-charcoal/70">
                                      <span className="font-medium text-charcoal">
                                        Toimitus:{" "}
                                      </span>
                                      {option.estimatedDelivery} päivää
                                    </div>
                                  )}
                                  {isFreeShipping(
                                    option.freeShippingThreshold
                                  ) ? (
                                    <span className="font-primary text-xl text-green-700 bg-green-100 px-3 py-1.5 border border-green-200">
                                      {formatPrice(option.price)}
                                    </span>
                                  ) : (
                                    <span className="font-primary text-xl text-charcoal bg-rose-gold/10 px-3 py-1.5 border border-rose-gold/20">
                                      {formatPrice(option.price)}
                                    </span>
                                  )}
                                </div>
                                {renderFreeShippingInfo(
                                  option.freeShippingThreshold
                                )}
                              </div>
                            </div>
                          </Label>
                        </div>
                      </div>
                    </CardContent>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </RadioGroup>
    </div>
  );
}

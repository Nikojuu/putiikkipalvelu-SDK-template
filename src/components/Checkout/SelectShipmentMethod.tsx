"use client";

import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import {
  type ShipmentMethodsResponse,
  type HomeDeliveryOption,
  type PickupPointOption,
  type OpeningHours,
} from "@putiikkipalvelu/storefront-sdk";
import { useState } from "react";
import { ChevronDown } from "lucide-react";

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
  const [expandedValue, setExpandedValue] = useState<string | null>(null);

  // Number of pickup points to show initially
  const INITIAL_PICKUP_POINTS = 4;

  // Safely extract arrays with defaults
  const homeDelivery = shippingOptions?.homeDelivery ?? [];
  const pickupPoints = shippingOptions?.pickupPoints ?? [];
  // Lowest threshold across ALL methods - for accurate "add X for free shipping" message
  const lowestFreeShippingThreshold = shippingOptions?.lowestFreeShippingThreshold ?? null;

  // Format helpers
  const formatPrice = (cents: number) => `${(cents / 100).toFixed(2)}€`;

  /**
   * "Add X more for free shipping" is computed from the LOWEST threshold across
   * every method, so it is the same sentence for every row. In the old card
   * grid it was repeated inside each card; as a single line above the list it
   * says the same thing once and keeps the rows thin.
   */
  const freeShippingHint = (() => {
    if (cartTotal === undefined) return null;
    if (
      lowestFreeShippingThreshold === null ||
      cartTotal >= lowestFreeShippingThreshold
    ) {
      return null;
    }
    return `Lisää ${formatPrice(lowestFreeShippingThreshold - cartTotal)} ilmaiseen toimitukseen`;
  })();

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

  /**
   * Collapse the seven weekday arrays into as few lines as possible by
   * grouping consecutive days that share the same hours, so a shop that is
   * open 10-20 on weekdays reads "Ma-Pe 10:00-20:00" instead of five rows.
   * Only Shipit returns these; Matkahuolto's office search has no such field.
   */
  const formatOpeningHours = (hours: OpeningHours | null) => {
    if (!hours) return [];

    const days: [string, string[]][] = [
      ["Ma", hours.monday],
      ["Ti", hours.tuesday],
      ["Ke", hours.wednesday],
      ["To", hours.thursday],
      ["Pe", hours.friday],
      ["La", hours.saturday],
      ["Su", hours.sunday],
    ];

    const rows: { days: string; hours: string }[] = [];
    for (const [label, slots] of days) {
      const value = slots?.length ? slots.join(", ") : "Suljettu";
      const previous = rows[rows.length - 1];
      if (previous && previous.hours === value) {
        // extend the run: "Ma" + "Ti" becomes "Ma-Ti"
        previous.days = `${previous.days.split("-")[0]}-${label}`;
      } else {
        rows.push({ days: label, hours: value });
      }
    }
    return rows;
  };

  const formatDistance = (meters: number | null) => {
    if (meters === null) return null;
    if (meters < 1000) return `${meters}m`;
    return `${(meters / 1000).toFixed(1)}km`;
  };

  const handleValueChange = (value: string) => {
    setSelectedValue(value);
    // Picking a delivery option reveals its details straight away — that is
    // when the shopper wants to know the opening hours and how the delivery
    // works, not after hunting for a chevron. The chevron stays for peeking
    // at rows the shopper has not committed to.
    setExpandedValue(value);

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

      {freeShippingHint && (
        <p className="text-center font-secondary text-sm text-charcoal/60">
          {freeShippingHint}
        </p>
      )}

      <RadioGroup
        value={selectedValue ?? undefined}
        onValueChange={handleValueChange}
        className="space-y-8"
      >
        {/* ================================================================= */}
        {/* PICKUP POINTS SECTION - Shown first (more popular in Finland)    */}
        {/* ================================================================= */}
        {hasPickupPoints && (
          <div className="space-y-6 min-w-0">
            <div className="flex items-center gap-3">
              <div className="w-1.5 h-1.5 bg-rose-gold/60 diamond-shape" />
              <h3 className="text-xl md:text-2xl font-primary text-charcoal">
                Noutopisteet
              </h3>
              <div className="flex-1 h-[1px] bg-gradient-to-r from-rose-gold/30 to-transparent" />
            </div>

            <div className="border border-rose-gold/15 divide-y divide-rose-gold/10 bg-warm-white">
              {(showAllPickupPoints
                ? pickupPoints
                : pickupPoints.slice(0, INITIAL_PICKUP_POINTS)
              ).map((point) => {
                const value = pickupValue(point);
                const isSelected = selectedValue === value;
                const inputId = `pickup-${point.id}-${point.shipmentMethodId}`;
                const free = isFreeShipping(point.freeShippingThreshold);

                const hours = formatOpeningHours(point.openingHours);
                const hasDetails = Boolean(point.description) || hours.length > 0;
                const isExpanded = expandedValue === value;

                return (
                  <div
                    key={`${point.id}-${point.shipmentMethodId}-${point.serviceId}`}
                    className={`border-l-2 transition-colors duration-200 ${
                      isSelected
                        ? "bg-cream/60 border-l-rose-gold"
                        : "border-l-transparent hover:bg-cream/30"
                    }`}
                  >
                    <div className="flex items-center gap-3 px-4 py-3">
                      <RadioGroupItem
                        value={value}
                        id={inputId}
                        className="shrink-0"
                      />

                      <Label
                        htmlFor={inputId}
                        className="flex flex-1 items-center gap-3 min-w-0 cursor-pointer"
                      >
                        <span className="flex-1 min-w-0">
                          <span className="font-secondary text-base font-medium text-charcoal line-clamp-2">
                            {point.name}
                          </span>
                          <span className="flex items-baseline gap-1.5 font-secondary text-sm text-charcoal/60">
                            <span className="truncate">
                              {point.address}
                              <span className="hidden sm:inline">
                                , {point.postalCode} {point.city}
                              </span>
                            </span>
                            {/* Distance lives in the right rail from sm up; on a
                                phone it rides here instead, outside the truncate
                                so the address gives way to it and not the other
                                way round. */}
                            {point.distance !== null && (
                              <span className="sm:hidden shrink-0 tabular-nums">
                                · {formatDistance(point.distance)}
                              </span>
                            )}
                          </span>
                        </span>

                        <span className="flex items-center gap-3 shrink-0">
                          {point.distance !== null && (
                            <span className="hidden sm:inline font-secondary text-sm text-charcoal/50 tabular-nums">
                              {formatDistance(point.distance)}
                            </span>
                          )}
                          {point.logo && (
                            <img
                              src={point.logo}
                              alt={point.carrier ?? ""}
                              className="w-6 h-6 object-contain"
                            />
                          )}
                          <span
                            className={`font-primary text-base tabular-nums whitespace-nowrap ${
                              free ? "text-green-700" : "text-charcoal"
                            }`}
                          >
                            {free ? "Ilmainen" : formatPrice(point.price)}
                          </span>
                        </span>
                      </Label>

                      {/* Outside the Label so opening details does not select the row */}
                      {hasDetails && (
                        <button
                          type="button"
                          onClick={() => setExpandedValue(isExpanded ? null : value)}
                          aria-expanded={isExpanded}
                          aria-label={`Lisätiedot: ${point.name}`}
                          className="shrink-0 p-1 text-charcoal/40 transition-colors hover:text-rose-gold"
                        >
                          <ChevronDown
                            className={`w-4 h-4 transition-transform duration-200 ${
                              isExpanded ? "rotate-180" : ""
                            }`}
                          />
                        </button>
                      )}
                    </div>

                    {isExpanded && (
                      <div className="px-4 pb-4 sm:pl-11 space-y-3">
                        {point.description && (
                          <p className="font-secondary text-base text-charcoal/75 leading-relaxed">
                            {point.description}
                          </p>
                        )}
                        {hours.length > 0 && (
                          <div>
                            <p className="font-secondary text-sm font-medium text-charcoal/80 mb-1">
                              Aukioloajat
                            </p>
                            <ul className="space-y-1 max-w-64">
                              {hours.map((row) => (
                                <li
                                  key={row.days}
                                  className="flex justify-between gap-4 font-secondary text-sm text-charcoal/60"
                                >
                                  <span>{row.days}</span>
                                  <span className="tabular-nums">{row.hours}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Show More/Less */}
            {pickupPoints.length > INITIAL_PICKUP_POINTS && (
              <div className="flex justify-center">
                <button
                  type="button"
                  onClick={() => setShowAllPickupPoints(!showAllPickupPoints)}
                  className="font-secondary text-sm text-charcoal/70 underline underline-offset-4 transition-colors hover:text-rose-gold"
                >
                  {showAllPickupPoints
                    ? "Näytä vähemmän"
                    : `Näytä lisää (${pickupPoints.length - INITIAL_PICKUP_POINTS})`}
                </button>
              </div>
            )}
          </div>
        )}

        {/* ================================================================= */}
        {/* HOME DELIVERY SECTION                                            */}
        {/* ================================================================= */}
        {hasHomeDelivery && (
          <div className="space-y-6 min-w-0">
            <div className="flex items-center gap-3">
              <div className="w-1.5 h-1.5 bg-rose-gold/60 diamond-shape" />
              <h3 className="text-xl md:text-2xl font-primary text-charcoal">
                Kotiinkuljetus
              </h3>
              <div className="flex-1 h-[1px] bg-gradient-to-r from-rose-gold/30 to-transparent" />
            </div>

            <div className="border border-rose-gold/15 divide-y divide-rose-gold/10 bg-warm-white">
              {homeDelivery.map((option) => {
                const value = deliveryValue(option);
                const isSelected = selectedValue === value;
                const inputId = `delivery-${option.id}`;
                const free = isFreeShipping(option.freeShippingThreshold);
                const secondary = [
                  option.description,
                  option.estimatedDelivery
                    ? `Toimitus ${option.estimatedDelivery} päivää`
                    : null,
                ]
                  .filter(Boolean)
                  .join(" · ");

                return (
                  <Label
                    key={option.id}
                    htmlFor={inputId}
                    className={`flex items-center gap-3 px-4 py-3 cursor-pointer border-l-2 transition-colors duration-200 ${
                      isSelected
                        ? "bg-cream/60 border-l-rose-gold"
                        : "border-l-transparent hover:bg-cream/30"
                    }`}
                  >
                    <RadioGroupItem
                      value={value}
                      id={inputId}
                      className="shrink-0"
                    />

                    <div className="flex-1 min-w-0">
                      <p className="font-secondary text-base font-medium text-charcoal line-clamp-2">
                        {option.name}
                      </p>
                      {secondary && (
                        <p className="font-secondary text-sm text-charcoal/60 truncate">
                          {secondary}
                        </p>
                      )}
                    </div>

                    <div className="flex items-center gap-3 shrink-0">
                      {option.logo && (
                        <img
                          src={option.logo}
                          alt={option.carrier ?? option.name}
                          className="w-6 h-6 object-contain"
                        />
                      )}
                      <span
                        className={`font-primary text-base tabular-nums whitespace-nowrap ${
                          free ? "text-green-700" : "text-charcoal"
                        }`}
                      >
                        {free ? "Ilmainen" : formatPrice(option.price)}
                      </span>
                    </div>
                  </Label>
                );
              })}
            </div>
          </div>
        )}
      </RadioGroup>
    </div>
  );
}

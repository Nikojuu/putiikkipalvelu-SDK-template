"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2 } from "lucide-react";
import type { CartItem, TicketHolderData } from "@putiikkipalvelu/storefront-sdk";

interface TicketHoldersFormProps {
  ticketItems: CartItem[];
  onSubmit: (holders: Record<string, TicketHolderData[]>) => void;
  initialData?: Record<string, TicketHolderData[]>;
  isLoading: boolean;
}

export default function TicketHoldersForm({
  ticketItems,
  onSubmit,
  initialData,
  isLoading,
}: TicketHoldersFormProps) {
  // Build initial state from props or create empty entries
  const [holders, setHolders] = useState<Record<string, TicketHolderData[]>>(
    () => {
      if (initialData) return initialData;

      const initial: Record<string, TicketHolderData[]> = {};
      for (const item of ticketItems) {
        initial[item.product.id] = Array.from(
          { length: item.cartQuantity },
          () => ({ firstName: "", lastName: "" })
        );
      }
      return initial;
    }
  );

  const [errors, setErrors] = useState<Record<string, string[]>>({});

  const updateHolder = (
    productId: string,
    index: number,
    field: "firstName" | "lastName",
    value: string
  ) => {
    setHolders((prev) => {
      const updated = { ...prev };
      updated[productId] = [...(updated[productId] || [])];
      updated[productId][index] = {
        ...updated[productId][index],
        [field]: value,
      };
      return updated;
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Validate all holder names
    const newErrors: Record<string, string[]> = {};
    let hasErrors = false;

    for (const item of ticketItems) {
      const itemHolders = holders[item.product.id] || [];
      const itemErrors: string[] = [];

      for (let i = 0; i < item.cartQuantity; i++) {
        const holder = itemHolders[i];
        if (!holder?.firstName?.trim() || !holder?.lastName?.trim()) {
          itemErrors[i] = "Etu- ja sukunimi vaaditaan";
          hasErrors = true;
        }
      }

      if (itemErrors.length > 0) {
        newErrors[item.product.id] = itemErrors;
      }
    }

    setErrors(newErrors);
    if (!hasErrors) {
      onSubmit(holders);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <div className="mx-auto max-w-2xl">
        <div className="relative bg-warm-white p-6 md:p-10">
          {/* Border frame */}
          <div className="absolute inset-0 border border-rose-gold/15 pointer-events-none" />

          {/* Corner accents */}
          <div className="absolute top-0 left-0 w-6 h-6 border-l-2 border-t-2 border-rose-gold/40" />
          <div className="absolute top-0 right-0 w-6 h-6 border-r-2 border-t-2 border-rose-gold/40" />
          <div className="absolute bottom-0 left-0 w-6 h-6 border-l-2 border-b-2 border-rose-gold/40" />
          <div className="absolute bottom-0 right-0 w-6 h-6 border-r-2 border-b-2 border-rose-gold/40" />

          {/* Header */}
          <div className="flex items-center gap-3 mb-2">
            <div className="w-1.5 h-1.5 bg-rose-gold/60 diamond-shape" />
            <h2 className="font-primary text-2xl md:text-3xl text-charcoal">
              Lipun haltijat
            </h2>
          </div>
          <p className="text-sm font-secondary text-charcoal/60 mb-8">
            Syötä jokaisen lipun haltijan nimi. Nimi tarkistetaan portilla.
          </p>

          <div className="space-y-8">
            {ticketItems.map((item) => (
              <div key={item.product.id}>
                <h3 className="font-secondary text-lg text-charcoal mb-4">
                  {item.product.name}
                  {item.cartQuantity > 1 && (
                    <span className="text-charcoal/50 text-sm ml-2">
                      ({item.cartQuantity} kpl)
                    </span>
                  )}
                </h3>

                <div className="space-y-4">
                  {Array.from({ length: item.cartQuantity }, (_, i) => (
                    <div key={i}>
                      {item.cartQuantity > 1 && (
                        <p className="text-xs font-secondary text-charcoal/50 mb-2">
                          Lippu {i + 1}
                        </p>
                      )}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label className="text-sm font-secondary text-charcoal">
                            Etunimi *
                          </Label>
                          <Input
                            type="text"
                            value={
                              holders[item.product.id]?.[i]?.firstName || ""
                            }
                            onChange={(e) =>
                              updateHolder(
                                item.product.id,
                                i,
                                "firstName",
                                e.target.value
                              )
                            }
                            placeholder="Haltijan etunimi"
                            className="bg-cream/50 border-rose-gold/20 focus:border-rose-gold/50 focus:ring-rose-gold/20 font-secondary text-charcoal placeholder:text-charcoal/40"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label className="text-sm font-secondary text-charcoal">
                            Sukunimi *
                          </Label>
                          <Input
                            type="text"
                            value={
                              holders[item.product.id]?.[i]?.lastName || ""
                            }
                            onChange={(e) =>
                              updateHolder(
                                item.product.id,
                                i,
                                "lastName",
                                e.target.value
                              )
                            }
                            placeholder="Haltijan sukunimi"
                            className="bg-cream/50 border-rose-gold/20 focus:border-rose-gold/50 focus:ring-rose-gold/20 font-secondary text-charcoal placeholder:text-charcoal/40"
                          />
                        </div>
                      </div>
                      {errors[item.product.id]?.[i] && (
                        <p className="text-sm font-secondary text-deep-burgundy mt-1">
                          {errors[item.product.id][i]}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* Decorative line before button */}
          <div className="mt-8 mb-6 h-[1px] bg-gradient-to-r from-transparent via-rose-gold/30 to-transparent" />

          {/* Submit button */}
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={isLoading}
              className="group inline-flex items-center gap-3 px-8 py-4 bg-charcoal text-warm-white font-secondary text-sm tracking-wider uppercase transition-all duration-300 hover:bg-rose-gold disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Ladataan...</span>
                </>
              ) : (
                <>
                  <span>Jatka</span>
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
        </div>
      </div>
    </form>
  );
}

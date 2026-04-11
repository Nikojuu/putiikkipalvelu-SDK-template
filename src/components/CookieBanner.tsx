"use client";

import { useEffect, useRef, useState } from "react";
import { useConsentStore } from "@/hooks/use-consent";
import {
  type ConsentCategory,
  type ConsentState,
  activeCategories,
  allGrantedState,
  defaultConsentState,
} from "@/lib/consent-config";
import type { AnalyticsConfig } from "@putiikkipalvelu/storefront-sdk";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

// =============================================================================
// Category metadata — Finnish labels and descriptions
// =============================================================================

const CATEGORY_INFO: Record<
  ConsentCategory,
  { label: string; description: string }
> = {
  necessary: {
    label: "Välttämättömät",
    description:
      "Sivuston toiminnan kannalta välttämättömät evästeet. Näitä ei voi poistaa käytöstä.",
  },
  analytics: {
    label: "Analytiikka",
    description:
      "Auttavat meitä ymmärtämään, miten sivustoa käytetään (esim. Google Analytics, Google Tag Manager).",
  },
  marketing: {
    label: "Markkinointi",
    description:
      "Mahdollistavat kohdennetun mainonnan ja uudelleenmarkkinoinnin (esim. Google Ads).",
  },
};

// =============================================================================
// Toggle component (no shadcn switch available)
// =============================================================================

function Toggle({
  checked,
  onChange,
  disabled,
}: {
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={cn(
        "relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors duration-200",
        checked ? "bg-primary" : "bg-muted-foreground/25",
        disabled && "cursor-not-allowed opacity-60"
      )}
    >
      <span
        className={cn(
          "pointer-events-none block h-4 w-4 rounded-full bg-white shadow-sm ring-0 transition-transform duration-200",
          checked ? "translate-x-5" : "translate-x-0.5"
        )}
      />
    </button>
  );
}

// =============================================================================
// CookieBanner
// =============================================================================

export default function CookieBanner({
  analytics,
}: {
  analytics: AnalyticsConfig | undefined;
}) {
  const { hasConsented, hydrated, consent, updateConsent } = useConsentStore();
  const [showPreferences, setShowPreferences] = useState(false);
  const [selections, setSelections] = useState<ConsentState>(
    defaultConsentState()
  );

  // Sync local banner state when it (re)opens — runs when hasConsented flips
  // from true to false (reopened from footer link).
  const prevHasConsented = useRef(hasConsented);
  useEffect(() => {
    if (prevHasConsented.current === true && hasConsented === false) {
      // Reopening: pre-select current saved choices, jump straight to preferences
      setSelections(consent);
      setShowPreferences(true);
    }
    prevHasConsented.current = hasConsented;
  }, [hasConsented, consent]);

  // Don't render until hydrated (avoids flash)
  if (!hydrated || hasConsented) return null;

  const categories = activeCategories(analytics);

  function handleAcceptAll() {
    updateConsent(allGrantedState());
  }

  function handleSavePreferences() {
    updateConsent(selections);
  }

  function handleNecessaryOnly() {
    updateConsent(defaultConsentState());
  }

  function toggleCategory(category: ConsentCategory) {
    if (category === "necessary") return;
    setSelections((prev) => ({ ...prev, [category]: !prev[category] }));
  }

  return (
    <div className="fixed bottom-0 left-0 z-50 p-4 w-full sm:w-auto sm:max-w-md">
      <div className="rounded-lg border border-border bg-card p-5 shadow-lg">
        {!showPreferences ? (
          // Layer 1 — Initial banner
          <>
            <h3 className="text-base font-semibold text-foreground">
              Käytämme evästeitä
            </h3>
            <p className="mt-1.5 text-sm text-muted-foreground">
              Käytämme evästeitä parantaaksemme käyttökokemustasi ja
              analysoidaksemme sivuston liikennettä.{" "}
              <a
                href="/privacy"
                className="underline underline-offset-2 hover:text-foreground"
              >
                Lue lisää
              </a>
            </p>
            <div className="mt-4 flex items-center gap-3">
              <Button onClick={handleAcceptAll} size="sm">
                Hyväksy kaikki
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleNecessaryOnly}
              >
                Hylkää
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowPreferences(true)}
              >
                Muokkaa valintoja
              </Button>
            </div>
          </>
        ) : (
          // Layer 2 — Preferences panel
          <>
            <h3 className="text-base font-semibold text-foreground">
              Evästeasetukset
            </h3>
            <p className="mt-1.5 text-sm text-muted-foreground">
              Valitse, mitkä evästeet hyväksyt. Välttämättömät evästeet ovat aina
              käytössä.{" "}
              <a
                href="/privacy"
                className="underline underline-offset-2 hover:text-foreground"
              >
                Tietosuojakäytäntö
              </a>
            </p>

            <div className="mt-4 space-y-3">
              {categories.map((category) => {
                const info = CATEGORY_INFO[category];
                const isNecessary = category === "necessary";

                return (
                  <div
                    key={category}
                    className="flex items-start justify-between gap-4"
                  >
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-foreground">
                        {info.label}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {info.description}
                      </p>
                    </div>
                    <Toggle
                      checked={isNecessary ? true : selections[category]}
                      onChange={() => toggleCategory(category)}
                      disabled={isNecessary}
                    />
                  </div>
                );
              })}
            </div>

            <div className="mt-4 flex items-center gap-3">
              <Button onClick={handleSavePreferences} size="sm">
                Tallenna valinnat
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleNecessaryOnly}
              >
                Vain välttämättömät
              </Button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

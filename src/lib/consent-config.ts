import type { AnalyticsConfig } from "@putiikkipalvelu/storefront-sdk";

// =============================================================================
// Consent Categories
// =============================================================================

export const CONSENT_CATEGORIES = ["necessary", "analytics", "marketing"] as const;
export type ConsentCategory = (typeof CONSENT_CATEGORIES)[number];

export type ConsentState = Record<ConsentCategory, boolean>;

// =============================================================================
// Integration → Category Registry
// =============================================================================
// When adding a new integration, add ONE line here mapping its
// AnalyticsConfig key to the consent category it requires.

const INTEGRATION_REGISTRY: Record<string, ConsentCategory[]> = {
  // GTM is a container that can hold both analytics and marketing tags
  gtmContainerId: ["analytics", "marketing"],
  // facebookPixelId: ["marketing"],
  // hotjarId: ["analytics"],
  // tiktokPixelId: ["marketing"],
};

/**
 * Check if any enabled integration requires cookie consent
 */
export function needsCookieBanner(analytics: AnalyticsConfig | undefined): boolean {
  if (!analytics) return false;
  return Object.keys(INTEGRATION_REGISTRY).some(
    (key) => !!analytics[key as keyof AnalyticsConfig]
  );
}

/**
 * Get which consent categories are actually needed by enabled integrations.
 * The banner only shows toggles for categories that are in use.
 * "necessary" is always included.
 */
export function activeCategories(analytics: AnalyticsConfig | undefined): ConsentCategory[] {
  const active = new Set<ConsentCategory>(["necessary"]);
  if (!analytics) return [...active];

  for (const [key, categories] of Object.entries(INTEGRATION_REGISTRY)) {
    if (analytics[key as keyof AnalyticsConfig]) {
      for (const category of categories) {
        active.add(category);
      }
    }
  }
  return [...active];
}

/**
 * Default consent state — necessary always true, everything else denied
 */
export function defaultConsentState(): ConsentState {
  return { necessary: true, analytics: false, marketing: false };
}

/**
 * All-granted consent state
 */
export function allGrantedState(): ConsentState {
  return { necessary: true, analytics: true, marketing: true };
}

"use client";

import type { AnalyticsConfig } from "@putiikkipalvelu/storefront-sdk";
import { useConsentStore } from "@/hooks/use-consent";
import { needsCookieBanner } from "@/lib/consent-config";

export function CookieSettingsLink({
  analytics,
}: {
  analytics: AnalyticsConfig | undefined;
}) {
  const { reopenBanner } = useConsentStore();

  // Only render if there are tracking integrations that need consent —
  // same check that controls whether the cookie banner is mounted at all.
  if (!needsCookieBanner(analytics)) return null;

  return (
    <button
      type="button"
      onClick={reopenBanner}
      className="text-sm font-secondary text-warm-white/70 hover:text-rose-gold transition-colors duration-300"
    >
      Evästeasetukset
    </button>
  );
}

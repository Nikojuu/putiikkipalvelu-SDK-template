"use client";

import { useEffect } from "react";
import { useConsentStore } from "@/hooks/use-consent";

/**
 * Initializes the consent store with server-side config.
 * Rendered once in layout.tsx to bridge server → client state.
 */
export default function ConsentInit({ gtmEnabled }: { gtmEnabled: boolean }) {
  const setGtmEnabled = useConsentStore((s) => s.setGtmEnabled);
  const hydrate = useConsentStore((s) => s.hydrate);

  useEffect(() => {
    setGtmEnabled(gtmEnabled);
    hydrate();
  }, [gtmEnabled, setGtmEnabled, hydrate]);

  return null;
}

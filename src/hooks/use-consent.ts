"use client";

import { create } from "zustand";
import {
  type ConsentState,
  type ConsentCategory,
  defaultConsentState,
} from "@/lib/consent-config";

const STORAGE_KEY = "cookie-consent";
const CONSENT_VERSION = 1;

type StoredConsent = {
  categories: ConsentState;
  timestamp: string;
  version: number;
};

type ConsentStore = {
  /** Current consent choices */
  consent: ConsentState;
  /** Whether the user has made a choice (banner should hide) */
  hasConsented: boolean;
  /** Whether the store has been hydrated from localStorage */
  hydrated: boolean;
  /** Whether GTM is configured for this store */
  gtmEnabled: boolean;

  /** Load saved consent from localStorage and push to GTM Consent Mode */
  hydrate: () => void;
  /** Save consent choices, persist to localStorage, and update GTM */
  updateConsent: (categories: ConsentState) => void;
  /** Check if a specific category is granted */
  isGranted: (category: ConsentCategory) => boolean;
  /** Set whether GTM is configured (called once from layout) */
  setGtmEnabled: (enabled: boolean) => void;
  /** Reopen the banner to let the user change their saved choices */
  reopenBanner: () => void;
};

/**
 * Push Google Consent Mode v2 update to dataLayer.
 * Uses the gtag consent API to update consent signals.
 * This works because layout.tsx defines gtag() before GTM loads.
 */
function pushGtmConsentUpdate(consent: ConsentState) {
  if (typeof window === "undefined" || typeof window.gtag !== "function") {
    return;
  }

  // window.gtag is defined by the inline script in layout.tsx and pushes a real
  // `arguments` object, which is what GTM's consent listener expects.
  window.gtag("consent", "update", {
    analytics_storage: consent.analytics ? "granted" : "denied",
    ad_storage: consent.marketing ? "granted" : "denied",
    ad_user_data: consent.marketing ? "granted" : "denied",
    ad_personalization: consent.marketing ? "granted" : "denied",
    functionality_storage: "granted",
    security_storage: "granted",
  });
}

function saveToStorage(consent: ConsentState) {
  try {
    const data: StoredConsent = {
      categories: consent,
      timestamp: new Date().toISOString(),
      version: CONSENT_VERSION,
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch {
    // localStorage unavailable (SSR, private browsing)
  }
}

function loadFromStorage(): ConsentState | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;

    const data: StoredConsent = JSON.parse(raw);

    // If consent version changed, force re-consent
    if (data.version !== CONSENT_VERSION) {
      localStorage.removeItem(STORAGE_KEY);
      return null;
    }

    return data.categories;
  } catch {
    return null;
  }
}

export const useConsentStore = create<ConsentStore>()((set, get) => ({
  consent: defaultConsentState(),
  hasConsented: false,
  hydrated: false,
  gtmEnabled: false,

  setGtmEnabled: (enabled: boolean) => set({ gtmEnabled: enabled }),

  hydrate: () => {
    const saved = loadFromStorage();
    if (saved) {
      set({ consent: saved, hasConsented: true, hydrated: true });
      pushGtmConsentUpdate(saved);
    } else {
      set({ hydrated: true });
    }
  },

  updateConsent: (categories: ConsentState) => {
    // Necessary is always true
    const consent = { ...categories, necessary: true };
    set({ consent, hasConsented: true });
    saveToStorage(consent);
    pushGtmConsentUpdate(consent);
  },

  isGranted: (category: ConsentCategory) => {
    return get().consent[category];
  },

  reopenBanner: () => {
    // Flip hasConsented so the banner re-renders, but keep `consent` intact
    // so the user sees their current choices pre-selected.
    set({ hasConsented: false });
  },
}));

import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getStoreConfig } from "@/lib/storeConfig";

/**
 * Customer-account routes are functional, not marketing: they are reachable
 * only by interaction and must never appear in search results. Declared here
 * so every child route (login, register, password reset, the account
 * dashboard) inherits it — the `/(auth)/*` line in robots.ts cannot do this
 * job, because a route group never appears in a URL.
 */
export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

/**
 * Gate for all customer-account routes (login, register, password reset, the
 * account dashboard, wishlist). When the store has customer accounts disabled
 * (store-config feature flag), none of these routes should be reachable —
 * redirect to the homepage.
 */
const AuthLayout = async ({ children }: { children: React.ReactNode }) => {
  const storeConfig = await getStoreConfig();
  const customerAccountsEnabled =
    storeConfig.features?.customerAccountsEnabled ?? true;

  if (!customerAccountsEnabled) {
    redirect("/");
  }

  return <>{children}</>;
};

export default AuthLayout;

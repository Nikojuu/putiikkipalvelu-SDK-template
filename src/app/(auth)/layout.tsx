import { redirect } from "next/navigation";
import { getStoreConfig } from "@/lib/storeConfig";

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

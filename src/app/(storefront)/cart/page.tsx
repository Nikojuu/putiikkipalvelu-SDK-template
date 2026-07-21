import CartPage from "@/components/Cart/CartPage";
import { Metadata } from "next";
import { getStoreConfig } from "@/lib/storeConfig";

// Functional route: noindex, so this description is never shown in a search
// snippet. Kept generic and store-agnostic on purpose — reading it from store
// settings would add an API round-trip to render text nobody sees.
export const metadata: Metadata = {
  title: "Ostoskori",
  description: "Ostoskorisi sisältö ja tilauksen yhteenveto.",
  robots: "noindex, nofollow",
};

const CartRoute = async () => {
  const storeConfig = await getStoreConfig();
  const campaigns = storeConfig.campaigns;

  return <CartPage campaigns={campaigns} />;
};

export default CartRoute;

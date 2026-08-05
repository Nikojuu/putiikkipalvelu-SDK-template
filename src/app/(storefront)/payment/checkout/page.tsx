import dynamic from "next/dynamic";
import { Metadata } from "next";

const StripeCheckoutPage = dynamic(
  () => import("@/components/Checkout/StripeCheckoutPage")
);
const PaytrailCheckoutPage = dynamic(
  () => import("@/components/Checkout/PaytrailCheckoutPage")
);
const PayPalOnlyCheckoutPage = dynamic(
  () => import("@/components/Checkout/PayPalOnlyCheckoutPage")
);
import { storefront } from "@/lib/storefront";

// Functional route: noindex (see cart/page.tsx) — description stays generic.
export const metadata: Metadata = {
  title: "Tilaus",
  description: "Viimeistele tilauksesi ja valitse maksutapa.",
  robots: {
    index: false,
    follow: false,
  },
  openGraph: {
    title: "Tilaus",
    type: "website",
  },
};

const CheckoutRoute = async () => {
  const storeConfig = await storefront.store.getConfig();
  const campaigns = storeConfig.campaigns;
  const { methods, primary, wallets } = storeConfig.payments;

  // Fallback for backends that predate primary/wallets — derive from methods
  const resolvedPrimary =
    primary ??
    (methods.includes("paytrail")
      ? "paytrail"
      : methods.includes("stripe")
        ? "stripe"
        : null);
  const showPaypal = (wallets ?? methods).includes("paypal");

  if (resolvedPrimary === "paytrail") {
    return <PaytrailCheckoutPage campaigns={campaigns} showPaypal={showPaypal} />;
  }
  if (resolvedPrimary === "stripe") {
    return <StripeCheckoutPage campaigns={campaigns} showPaypal={showPaypal} />;
  }
  if (showPaypal) {
    // PayPal as the store's only payment method
    return <PayPalOnlyCheckoutPage campaigns={campaigns} />;
  }

  // Fallback if no payment methods configured
  return (
    <div className="flex items-center justify-center min-h-[50vh]">
      <p className="text-muted-foreground">
        Maksutapoja ei ole määritetty. Ota yhteyttä kauppiaaseen.
      </p>
    </div>
  );
};

export default CheckoutRoute;

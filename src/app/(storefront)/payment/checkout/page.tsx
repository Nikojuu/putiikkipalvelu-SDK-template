import dynamic from "next/dynamic";
import { Metadata } from "next";

const StripeCheckoutPage = dynamic(
  () => import("@/components/Checkout/StripeCheckoutPage")
);
const PaytrailCheckoutPage = dynamic(
  () => import("@/components/Checkout/PaytrailCheckoutPage")
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
  const paymentMethods = storeConfig.payments.methods;

  // Show checkout based on available payment methods from store config
  if (paymentMethods.includes("paytrail")) {
    return <PaytrailCheckoutPage campaigns={campaigns} />;
  } else if (paymentMethods.includes("stripe")) {
    return <StripeCheckoutPage campaigns={campaigns} />;
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

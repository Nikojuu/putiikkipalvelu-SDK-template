import dynamic from "next/dynamic";
import { Metadata } from "next";

const StripeCheckoutPage = dynamic(
  () => import("@/components/Checkout/StripeCheckoutPage")
);
const PaytrailCheckoutPage = dynamic(
  () => import("@/components/Checkout/PaytrailCheckoutPage")
);
import { getStoreConfig } from "@/lib/storeConfig";

export const metadata: Metadata = {
  title: "Pupun Korvat | Tilaus",
  description: "Tilaa käsintehtyjä koruja Pupun Korvista.",
  robots: {
    index: false,
    follow: false,
  },
  openGraph: {
    title: "Pupun Korvat |  Tilaus",
    type: "website",
  },
};

const CheckoutRoute = async () => {
  const storeConfig = await getStoreConfig();
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

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { XCircle } from "lucide-react";
import { Metadata } from "next";
import Link from "next/link";
import { storefront } from "@/lib/storefront";

export const metadata: Metadata = {
  title: "Tilaus peruutettu",
  description: "Tilaus peruutettu",
  robots: {
    index: false,
    follow: false,
  },
  openGraph: {
    title: "Tilaus peruutettu",
    type: "website",
  },
};

export default async function CancelPage({
  params,
  searchParams,
}: {
  params: Promise<{ orderId: string }>;
  searchParams: Promise<{ release?: string }>;
}) {
  const { orderId } = await params;
  const { release } = await searchParams;

  // Release the cancelled order's reserved stock right away instead of
  // waiting for the payment-page timeout or the reconcile cron. Claim-first
  // on the backend: a no-op if a payment already finalized the order, and
  // Stripe orders are rejected there (their sessions expire on their own).
  //
  // release=0 means the platform backend already made the release decision
  // for this landing (PayPal legs) — some of those orders are DELIBERATELY
  // left reserved because the buyer can still approve the payment, and
  // releasing here would free stock mid-payment. Only release on direct
  // provider landings (Paytrail), which carry no marker.
  if (release !== "0") {
    try {
      await storefront.order.releasePending(orderId);
    } catch {
      // Best effort — the cron backstop covers it
    }
  }

  return (
    <section className="w-full min-h-[80vh] flex items-center justify-center">
      <Card className="w-[350px]">
        <div className="p-6">
          <div className="w-full flex justify-center">
            <XCircle className="w-12 h-12 rounded-full bg-red-500/30 text-red-500 p-2" />
          </div>

          <div className="mt-3 text-center sm:mt-5 w-full">
            <h3 className="text-lg leading-6 font-medium">Tilaus peruutettu</h3>
            <p className="mt-2 text-sm text-muted-foreground">
              Jotain meni pieleen tilauksen käsittelyssä. Jos sinulla on
              kysyttävää, ota yhteyttä asiakaspalveluumme. Tilausta ei ole
              veloitettu.
            </p>

            <Button asChild className="w-full mt-5 sm:mt-6">
              <Link href="/">Kotisivulle</Link>
            </Button>
          </div>
        </div>
      </Card>
    </section>
  );
}

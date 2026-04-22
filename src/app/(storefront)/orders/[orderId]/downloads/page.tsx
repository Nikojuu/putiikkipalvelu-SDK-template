import { Metadata } from "next";
import { cookies } from "next/headers";
import { DigitalDownloadsPanel } from "@/components/Downloads/DigitalDownloadsPanel";

export const metadata: Metadata = {
  title: "Lataa digitaaliset tuotteesi",
  description: "Lataa ostamasi digitaaliset tuotteet.",
  robots: {
    index: false,
    follow: false,
  },
};

export default async function OrderDownloadsPage({
  params,
  searchParams,
}: {
  params: Promise<{ orderId: string }>;
  searchParams: Promise<{ token?: string }>;
}) {
  const { orderId } = await params;
  const { token } = await searchParams;

  const cookieStore = await cookies();
  const sessionId = cookieStore.get("session-id")?.value;

  return (
    <section className="pt-8 md:pt-16 pb-16 bg-warm-white min-h-screen">
      <div className="container mx-auto px-4 max-w-screen-md">
        <div className="text-center mb-10 md:mb-12">
          <div className="flex items-center justify-center gap-3 mb-6">
            <div className="w-8 h-[1px] bg-gradient-to-r from-transparent to-rose-gold/40" />
            <div className="w-2 h-2 bg-rose-gold/30 diamond-shape" />
            <div className="w-8 h-[1px] bg-gradient-to-l from-transparent to-rose-gold/40" />
          </div>

          <h1 className="font-primary text-3xl md:text-4xl font-bold text-charcoal mb-2">
            Digitaaliset tuotteesi
          </h1>
          <p className="font-secondary text-charcoal/70">
            Tilausnumero {orderId.slice(0, 8)}…
          </p>
        </div>

        {!token && !sessionId ? (
          <div className="relative bg-cream/30 border border-rose-gold/10 p-8 text-center">
            <div className="absolute top-0 left-0 w-6 h-6 border-l-2 border-t-2 border-rose-gold/30" />
            <div className="absolute top-0 right-0 w-6 h-6 border-r-2 border-t-2 border-rose-gold/30" />
            <div className="absolute bottom-0 left-0 w-6 h-6 border-l-2 border-b-2 border-rose-gold/30" />
            <div className="absolute bottom-0 right-0 w-6 h-6 border-r-2 border-b-2 border-rose-gold/30" />
            <p className="font-secondary text-charcoal">
              Latauslinkki puuttuu. Avaa tilausvahvistussähköpostistasi löytyvä
              linkki tai kirjaudu sisään päästäksesi lataamaan tiedostosi.
            </p>
          </div>
        ) : (
          <DigitalDownloadsPanel orderId={orderId} token={token} />
        )}
      </div>
    </section>
  );
}

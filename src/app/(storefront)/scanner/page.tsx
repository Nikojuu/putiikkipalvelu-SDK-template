import type { Metadata } from "next";
import { storefront } from "@/lib/storefront";
import TicketScanner from "@/components/Scanner/TicketScanner";

export const metadata: Metadata = {
  title: "Lippuskanneri",
  robots: "noindex, nofollow",
};

export default async function ScannerPage() {
  const { events } = await storefront.tickets.events({
    cache: "no-store",
  });

  return <TicketScanner events={events} />;
}

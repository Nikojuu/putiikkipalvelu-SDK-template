"use server";

import { storefront } from "@/lib/storefront";

export async function validatePin(eventId: string, pin: string) {
  return storefront.tickets.validatePin(eventId, pin, {
    cache: "no-store",
  });
}

export async function getTicket(code: string) {
  return storefront.tickets.get(code, {
    cache: "no-store",
  });
}

export async function useTicket(code: string, eventId: string) {
  return storefront.tickets.use(code, eventId, {
    cache: "no-store",
  });
}

import { headers } from "next/headers";

/**
 * Headers that forward the visitor's IP to the Storefront API.
 *
 * The API is called from this server, so without this it sees our server's IP
 * for every visitor and its per-visitor rate limits (login, registration,
 * withdrawal) would be shared by all of them. On Vercel the first
 * x-forwarded-for entry is set by the platform, not the client.
 */
export async function clientIpHeaders(): Promise<Record<string, string>> {
  const h = await headers();
  const ip =
    h.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    h.get("x-real-ip")?.trim();
  return ip ? { "x-client-ip": ip } : {};
}

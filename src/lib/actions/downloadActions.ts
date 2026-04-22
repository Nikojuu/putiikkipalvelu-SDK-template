"use server";

import { cookies } from "next/headers";
import { storefront } from "@/lib/storefront";
import type {
  OrderDownloadsResponse,
  DownloadUrlResponse,
} from "@putiikkipalvelu/storefront-sdk";

/**
 * Fetch the list of digital downloads for an order.
 * Auth: either a ?token= from the email link, or the logged-in customer's session.
 */
export async function listOrderDownloadsAction(
  orderId: string,
  token?: string
): Promise<
  | { ok: true; data: OrderDownloadsResponse }
  | { ok: false; error: string }
> {
  try {
    const sessionId = token
      ? undefined
      : (await cookies()).get("session-id")?.value;

    if (!token && !sessionId) {
      return { ok: false, error: "Missing token or session" };
    }

    const data = await storefront.order.listDownloads(orderId, {
      token,
      sessionId,
    });
    return { ok: true, data };
  } catch (e) {
    return {
      ok: false,
      error: e instanceof Error ? e.message : "Failed to load downloads",
    };
  }
}

/**
 * Issue a short-lived presigned R2 URL for a specific file.
 * Increments the download counter and logs a DownloadEvent.
 */
export async function getDownloadUrlAction(
  orderId: string,
  downloadId: string,
  token?: string
): Promise<
  | { ok: true; url: string; expiresIn: number }
  | { ok: false; error: string }
> {
  try {
    const sessionId = token
      ? undefined
      : (await cookies()).get("session-id")?.value;

    if (!token && !sessionId) {
      return { ok: false, error: "Missing token or session" };
    }

    const res: DownloadUrlResponse = await storefront.order.getDownloadUrl(
      orderId,
      downloadId,
      { token, sessionId }
    );
    return { ok: true, url: res.url, expiresIn: res.expiresIn };
  } catch (e) {
    return {
      ok: false,
      error: e instanceof Error ? e.message : "Failed to generate download URL",
    };
  }
}

"use server";

import { cookies } from "next/headers";
import { storefront } from "@/lib/storefront";
import { ValidationError, StorefrontError } from "@putiikkipalvelu/storefront-sdk";
import type {
  SubmitReviewParams,
  SubmitReviewReward,
} from "@putiikkipalvelu/storefront-sdk";

async function getSessionId(): Promise<string | undefined> {
  const cookieStore = await cookies();
  return cookieStore.get("session-id")?.value;
}

export type SubmitReviewResult =
  | { success: true; reward: SubmitReviewReward | null; published: boolean }
  | { success: false; error: string };

/**
 * Submit a product review. Works anonymously or as the logged-in customer.
 * Reviews auto-publish unless the server holds them (anonymous link-spam).
 * `hp` is a honeypot field — only bots fill it, so we silently drop those.
 */
export async function submitReview(
  params: SubmitReviewParams & { hp?: string }
): Promise<SubmitReviewResult> {
  const { hp, ...reviewParams } = params;

  // Honeypot tripped → almost certainly a bot. Pretend success, create nothing.
  if (hp && hp.trim() !== "") {
    return { success: true, reward: null, published: true };
  }

  // Read the httpOnly session cookie server-side; client components can't.
  const sessionId = await getSessionId();

  try {
    const res = await storefront.reviews.submit(reviewParams, sessionId);
    return {
      success: true,
      reward: res.reward,
      published: res.review.status === "APPROVED",
    };
  } catch (error) {
    console.error("Submit review error:", error);
    // 409 = already reviewed (logged-in duplicate). The status lives on
    // StorefrontError.code/.status, never in the message.
    if (error instanceof StorefrontError && error.code === "ALREADY_REVIEWED") {
      return { success: false, error: "Olet jo arvostellut tämän tuotteen." };
    }
    if (error instanceof ValidationError) {
      return { success: false, error: error.message };
    }
    return {
      success: false,
      error: "Arvostelun lähettäminen epäonnistui. Yritä uudelleen.",
    };
  }
}

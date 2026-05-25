"use server";

import { z } from "zod";
import { storefront } from "@/lib/storefront";
import {
  StorefrontError,
  RateLimitError,
  type WithdrawalItem,
} from "@putiikkipalvelu/storefront-sdk";

const WithdrawalItemSchema = z.object({
  productName: z.string().min(1).max(300),
  quantity: z.number().int().positive().max(9999),
});

const WithdrawalSchema = z.object({
  name: z.string().min(1, "Nimi on pakollinen").max(200),
  email: z
    .string()
    .email("Tarkista sähköpostiosoite")
    .max(200),
  orderNumber: z.string().max(50).optional(),
  items: z.array(WithdrawalItemSchema).max(100).optional(),
  message: z.string().max(2000).optional(),
  honeypot: z.string().optional(),
});

export type SubmitWithdrawalResult =
  | { success: true; noticeNumber: string }
  | { success: false; error: string };

/**
 * Submits a withdrawal notice (KKV peruutustoiminto) via the SDK.
 *
 * The pre-submission confirmation step is handled in the multi-step UI;
 * by the time we get here `confirmRead: true` is implicit.
 */
export async function submitWithdrawal(
  payload: z.infer<typeof WithdrawalSchema>
): Promise<SubmitWithdrawalResult> {
  const parsed = WithdrawalSchema.safeParse(payload);
  if (!parsed.success) {
    return {
      success: false,
      error:
        parsed.error.issues[0]?.message ??
        "Tarkista lomakkeen tiedot ja yritä uudelleen.",
    };
  }

  const data = parsed.data;
  const items: WithdrawalItem[] | undefined =
    data.items && data.items.length > 0 ? data.items : undefined;

  try {
    const result = await storefront.withdrawal.submit({
      name: data.name.trim(),
      email: data.email.trim(),
      orderNumber: data.orderNumber?.trim() || undefined,
      items,
      message: data.message?.trim() || undefined,
      honeypot: data.honeypot ?? "",
      confirmRead: true,
    });

    return { success: true, noticeNumber: result.noticeNumber };
  } catch (err) {
    if (err instanceof RateLimitError) {
      return {
        success: false,
        error:
          "Liian monta peruutusilmoitusta lyhyessä ajassa. Yritä uudelleen myöhemmin.",
      };
    }
    if (err instanceof StorefrontError) {
      return {
        success: false,
        error: err.message || "Peruutusilmoituksen lähettäminen epäonnistui.",
      };
    }
    console.error("Unexpected withdrawal submission error:", err);
    return {
      success: false,
      error: "Peruutusilmoituksen lähettäminen epäonnistui.",
    };
  }
}

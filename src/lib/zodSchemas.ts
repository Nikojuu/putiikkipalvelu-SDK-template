import { isValidPhoneNumber } from "react-phone-number-input";
import { z } from "zod";
import { normalizeBusinessId } from "@/lib/businessId";

export const customerDataSchema = z
  .object({
    first_name: z
      .string({ message: "Anna etunimesi" })
      .min(1, "Anna etunimesi"),
    last_name: z
      .string({ message: "Anna sukunimesi" })
      .min(1, "Anna sukunimesi"),
    email: z
      .string({ message: "Sähköposti vaaditaan" })
      .email("Anna kelvollinen sähköpostiosoite"),
    address: z
      .string({ message: "Katuosoite vaaditaan" })
      .min(1, "Katuosoite vaaditaan"),
    postal_code: z
      .string({ message: "Postinumero vaaditaan" })
      .regex(/^\d{5}$/, "Postinumeron on oltava viisi numeroa"),
    city: z
      .string({ message: "Kaupunki vaaditaan" })
      .min(1, "Kaupunki vaaditaan"),
    phone: z
      .string()
      .refine(isValidPhoneNumber, { message: "Virheellinen puhelin numero" }),
    // "Tilaan yrityksenä" checkbox; form-only, stripped before checkout
    is_company: z.literal("on").optional(),
    // Optional buyer company: if either is filled in, both are required
    company_name: z
      .string()
      .trim()
      .max(100, "Yrityksen nimi on liian pitkä")
      .optional(),
    business_id: z.string().trim().optional(),
  })
  .superRefine((data, ctx) => {
    if (data.is_company && !data.company_name) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["company_name"],
        message: "Anna yrityksen nimi",
      });
    }
    if ((data.is_company || data.company_name) && !data.business_id) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["business_id"],
        message: "Anna yrityksen Y-tunnus",
      });
    }
    if (data.business_id && !data.company_name) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["company_name"],
        message: "Anna yrityksen nimi",
      });
    }
    if (data.business_id && !normalizeBusinessId(data.business_id)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["business_id"],
        message: "Tarkista Y-tunnus (muoto 1234567-8)",
      });
    }
  });
export type CustomerData = Omit<
  z.infer<typeof customerDataSchema>,
  "is_company"
>;



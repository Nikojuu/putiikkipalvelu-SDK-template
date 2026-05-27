"use client";

import { useState, useTransition } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Plus, Trash2, ArrowLeft, CheckCircle, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { toast } from "@/hooks/use-toast";
import { submitWithdrawal } from "@/lib/actions/withdrawalActions";

// Loose item shape — the form keeps a default empty row even when scope=full
// for UX reasons (so toggling to "partial" doesn't render an empty list).
// Strict per-row validation only runs in superRefine when scope === "partial".
const ItemSchema = z.object({
  productName: z.string().max(300),
  quantity: z.number().int().nonnegative().max(9999),
});

const FormSchema = z
  .object({
    name: z.string().min(1, "Nimi on pakollinen").max(200),
    email: z.string().email("Tarkista sähköpostiosoite").max(200),
    orderNumber: z.string().max(50).optional(),
    scope: z.enum(["full", "partial"]),
    items: z.array(ItemSchema).optional(),
    message: z.string().max(2000).optional(),
    honeypot: z.string().optional(),
  })
  .superRefine((data, ctx) => {
    if (data.scope !== "partial") return;

    const filled = (data.items ?? []).filter(
      (it) => it.productName.trim().length > 0
    );
    if (filled.length === 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Lisää vähintään yksi tuote.",
        path: ["items"],
      });
      return;
    }

    (data.items ?? []).forEach((it, idx) => {
      if (it.productName.trim().length === 0) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Tuotteen nimi puuttuu",
          path: ["items", idx, "productName"],
        });
      }
      if (it.quantity < 1) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Määrän tulee olla vähintään 1",
          path: ["items", idx, "quantity"],
        });
      }
    });
  });

type FormValues = z.infer<typeof FormSchema>;

type Step = "fill" | "confirm" | "success";

type Prefill = {
  name: string;
  email: string;
  orderNumber: string;
  lineItems: { lineItemId?: string; productName: string; quantity: number }[];
};

type Props = {
  defaultOrderNumber?: string;
  /** When set, the form is pre-filled from a verified withdrawal token and
   *  the order-identifying fields are locked. */
  prefill?: Prefill;
};

export function WithdrawalForm({ defaultOrderNumber, prefill }: Props) {
  const [step, setStep] = useState<Step>("fill");
  const [noticeNumber, setNoticeNumber] = useState<string | null>(null);
  const [consentChecked, setConsentChecked] = useState(false);
  const [pending, startTransition] = useTransition();

  // When prefilled via token, lock order-identifying fields (name, email,
  // orderNumber) so the consumer can't swap them — the token vouches for them.
  const locked = prefill !== undefined;

  const form = useForm<FormValues>({
    resolver: zodResolver(FormSchema),
    defaultValues: {
      name: prefill?.name ?? "",
      email: prefill?.email ?? "",
      orderNumber: prefill?.orderNumber ?? defaultOrderNumber ?? "",
      scope: "full",
      items:
        prefill && prefill.lineItems.length > 0
          ? prefill.lineItems.map((it) => ({
              productName: it.productName,
              quantity: it.quantity,
            }))
          : [{ productName: "", quantity: 1 }],
      message: "",
      honeypot: "",
    },
  });

  const scope = form.watch("scope");
  // useFieldArray gives us stable field.id keys + only re-renders the rows
  // that change — avoids the full-form re-render on every keystroke that
  // form.watch("items") would cause with a dynamic list.
  const {
    fields: items,
    append: appendItem,
    remove: removeItem,
  } = useFieldArray({ control: form.control, name: "items" });

  const onContinue = () => {
    // Don't mutate items here — onSubmit filters by scope at submit time, and
    // the confirm view only renders items when scope === "partial". Clearing
    // items on "full" would wipe the user's rows if they navigate back and
    // re-pick "partial".
    setStep("confirm");
  };

  const onSubmit = () => {
    if (!consentChecked) return;

    const values = form.getValues();
    const itemsForSubmit =
      values.scope === "partial" && values.items
        ? values.items.filter((it) => it.productName.trim().length > 0)
        : undefined;

    startTransition(async () => {
      const result = await submitWithdrawal({
        name: values.name,
        email: values.email,
        orderNumber: values.orderNumber || undefined,
        items: itemsForSubmit,
        message: values.message || undefined,
        honeypot: values.honeypot,
      });

      if (result.success) {
        setNoticeNumber(result.noticeNumber);
        setStep("success");
        toast({
          title: "Peruutusilmoitus lähetetty",
          description: `Numero: ${result.noticeNumber}`,
          className:
            "bg-green-50 border-green-200 dark:bg-green-900 dark:border-green-800",
          action: (
            <div className="flex items-center space-x-2">
              <CheckCircle className="h-5 w-5 text-green-500 dark:text-green-400" />
            </div>
          ),
        });
      } else {
        toast({
          title: "Lähettäminen epäonnistui",
          description: result.error,
          className:
            "bg-red-50 border-red-200 dark:bg-red-900 dark:border-red-800",
          action: (
            <div className="flex items-center space-x-2">
              <XCircle className="h-5 w-5 text-red-500 dark:text-red-400" />
            </div>
          ),
        });
      }
    });
  };

  // ---------- Step 3: Success ----------
  if (step === "success" && noticeNumber) {
    return (
      <div className="relative bg-warm-white p-6 md:p-10">
        <div className="absolute inset-0 border border-rose-gold/15 pointer-events-none" />
        <div className="absolute top-0 left-0 w-6 h-6 border-l-2 border-t-2 border-rose-gold/40" />
        <div className="absolute top-0 right-0 w-6 h-6 border-r-2 border-t-2 border-rose-gold/40" />
        <div className="absolute bottom-0 left-0 w-6 h-6 border-l-2 border-b-2 border-rose-gold/40" />
        <div className="absolute bottom-0 right-0 w-6 h-6 border-r-2 border-b-2 border-rose-gold/40" />

        <div className="relative text-center space-y-5">
          <CheckCircle className="w-12 h-12 text-rose-gold mx-auto" />
          <h2 className="text-2xl font-primary text-charcoal">
            Peruutusilmoituksesi on vastaanotettu
          </h2>
          <p className="text-sm font-secondary text-charcoal/70">
            Ilmoituksen numero:{" "}
            <span className="font-semibold text-charcoal">{noticeNumber}</span>
          </p>
          <p className="text-sm font-secondary text-charcoal/60 max-w-md mx-auto">
            Olemme lähettäneet vahvistuksen antamaasi sähköpostiosoitteeseen.
            Mahdollinen palautus käsitellään erikseen, ja siitä saat oman
            vahvistuksen.
          </p>
        </div>
      </div>
    );
  }

  // ---------- Step 2: Confirmation ----------
  if (step === "confirm") {
    const values = form.getValues();
    const partialItems =
      values.scope === "partial"
        ? (values.items ?? []).filter((it) => it.productName.trim().length > 0)
        : [];

    return (
      <div className="relative bg-warm-white p-6 md:p-10">
        <div className="absolute inset-0 border border-rose-gold/15 pointer-events-none" />
        <div className="absolute top-0 left-0 w-6 h-6 border-l-2 border-t-2 border-rose-gold/40" />
        <div className="absolute top-0 right-0 w-6 h-6 border-r-2 border-t-2 border-rose-gold/40" />
        <div className="absolute bottom-0 left-0 w-6 h-6 border-l-2 border-b-2 border-rose-gold/40" />
        <div className="absolute bottom-0 right-0 w-6 h-6 border-r-2 border-b-2 border-rose-gold/40" />

        <div className="relative space-y-6">
          <div>
            <h2 className="text-xl font-primary text-charcoal">
              Tarkista tiedot
            </h2>
            <p className="text-sm font-secondary text-charcoal/60 mt-1">
              Vahvista vielä tiedot ennen lähetystä.
            </p>
          </div>

          <dl className="space-y-3 text-sm font-secondary">
            <div className="flex justify-between gap-4 border-b border-rose-gold/15 pb-2">
              <dt className="text-charcoal/60">Nimi</dt>
              <dd className="text-charcoal text-right">{values.name}</dd>
            </div>
            <div className="flex justify-between gap-4 border-b border-rose-gold/15 pb-2">
              <dt className="text-charcoal/60">Sähköposti</dt>
              <dd className="text-charcoal text-right break-all">
                {values.email}
              </dd>
            </div>
            {values.orderNumber ? (
              <div className="flex justify-between gap-4 border-b border-rose-gold/15 pb-2">
                <dt className="text-charcoal/60">Tilausnumero</dt>
                <dd className="text-charcoal text-right">
                  {values.orderNumber}
                </dd>
              </div>
            ) : null}
            <div className="border-b border-rose-gold/15 pb-2">
              <dt className="text-charcoal/60 mb-1">Peruutuksen sisältö</dt>
              {values.scope === "full" ? (
                <dd className="text-charcoal">Koko tilaus</dd>
              ) : (
                <dd>
                  <ul className="space-y-1">
                    {partialItems.map((it, idx) => (
                      <li
                        key={idx}
                        className="flex justify-between text-charcoal"
                      >
                        <span>{it.productName}</span>
                        <span className="text-charcoal/60">
                          {it.quantity} kpl
                        </span>
                      </li>
                    ))}
                  </ul>
                </dd>
              )}
            </div>
            {values.message ? (
              <div>
                <dt className="text-charcoal/60 mb-1">Viesti</dt>
                <dd className="text-charcoal whitespace-pre-wrap">
                  {values.message}
                </dd>
              </div>
            ) : null}
          </dl>

          <div className="border border-rose-gold/30 bg-cream/40 p-4 space-y-3">
            <p className="text-sm font-secondary text-charcoal/80 leading-relaxed">
              Lähettämällä peruutusilmoituksen vahvistat, että haluat peruuttaa
              tilauksen tai sen osan. Ilmoitus on sitova oikeudellinen toimi ja
              tallennetaan järjestelmäämme.
            </p>
            <div className="flex items-start gap-2">
              <input
                id="confirm-read"
                type="checkbox"
                checked={consentChecked}
                onChange={(e) => setConsentChecked(e.target.checked)}
                disabled={pending}
                className="mt-0.5 h-4 w-4 rounded border-rose-gold/40 accent-charcoal"
              />
              <label
                htmlFor="confirm-read"
                className="text-sm font-secondary text-charcoal cursor-pointer leading-snug"
              >
                Olen lukenut yllä olevan ja vahvistan peruutusilmoituksen.
              </label>
            </div>
          </div>

          <div className="flex flex-col-reverse sm:flex-row sm:items-center sm:justify-between gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => setStep("fill")}
              disabled={pending}
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Takaisin muokkaamaan
            </Button>
            <Button
              type="button"
              onClick={onSubmit}
              disabled={!consentChecked || pending}
              className="bg-charcoal text-warm-white hover:bg-deep-burgundy"
            >
              {pending ? "Lähetetään…" : "Lähetä peruutusilmoitus"}
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // ---------- Step 1: Fill ----------
  return (
    <div className="relative bg-warm-white p-6 md:p-10">
      <div className="absolute inset-0 border border-rose-gold/15 pointer-events-none" />
      <div className="absolute top-0 left-0 w-6 h-6 border-l-2 border-t-2 border-rose-gold/40" />
      <div className="absolute top-0 right-0 w-6 h-6 border-r-2 border-t-2 border-rose-gold/40" />
      <div className="absolute bottom-0 left-0 w-6 h-6 border-l-2 border-b-2 border-rose-gold/40" />
      <div className="absolute bottom-0 right-0 w-6 h-6 border-r-2 border-b-2 border-rose-gold/40" />

      <Form {...form}>
        <form
          onSubmit={form.handleSubmit(onContinue)}
          className="relative space-y-6"
        >
          {/* Honeypot — off-screen, leave empty */}
          <div
            aria-hidden="true"
            style={{
              position: "absolute",
              left: "-10000px",
              width: "1px",
              height: "1px",
              overflow: "hidden",
            }}
          >
            <label htmlFor="hp_website">Älä täytä tätä kenttää</label>
            <input
              id="hp_website"
              type="text"
              tabIndex={-1}
              autoComplete="off"
              {...form.register("honeypot")}
            />
          </div>

          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Nimi *</FormLabel>
                <FormControl>
                  <Input {...field} autoComplete="name" readOnly={locked} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Sähköposti *</FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    type="email"
                    autoComplete="email"
                    readOnly={locked}
                  />
                </FormControl>
                <FormDescription>
                  Vahvistus peruutusilmoituksesta lähetetään tähän osoitteeseen.
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="orderNumber"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Tilausnumero</FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    placeholder="esim. 1024"
                    autoComplete="off"
                    readOnly={locked}
                  />
                </FormControl>
                <FormDescription>
                  {locked
                    ? "Tilaus on vahvistettu sähköpostilinkin kautta."
                    : "Tilausnumero löytyy tilausvahvistuksesta. Voit jättää tyhjäksi, jos et muista."}
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="scope"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Mitä haluat peruuttaa?</FormLabel>
                <FormControl>
                  <RadioGroup
                    value={field.value}
                    onValueChange={field.onChange}
                    className="space-y-2"
                  >
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="full" id="scope-full" />
                      <label
                        htmlFor="scope-full"
                        className="text-sm font-secondary text-charcoal cursor-pointer"
                      >
                        Koko tilaus
                      </label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="partial" id="scope-partial" />
                      <label
                        htmlFor="scope-partial"
                        className="text-sm font-secondary text-charcoal cursor-pointer"
                      >
                        Yksittäisiä tuotteita
                      </label>
                    </div>
                  </RadioGroup>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {scope === "partial" ? (
            <div className="space-y-3">
              <FormLabel>Peruutettavat tuotteet</FormLabel>
              {items.map((field, idx) => (
                <div key={field.id} className="flex items-start gap-2">
                  <FormField
                    control={form.control}
                    name={`items.${idx}.productName`}
                    render={({ field: nameField }) => (
                      <FormItem className="flex-1">
                        <FormControl>
                          <Input
                            {...nameField}
                            placeholder="Tuotteen nimi"
                            readOnly={locked}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name={`items.${idx}.quantity`}
                    render={({ field: qtyField }) => (
                      <FormItem className="w-24">
                        <FormControl>
                          <Input
                            type="number"
                            min={1}
                            {...qtyField}
                            onChange={(e) =>
                              qtyField.onChange(
                                e.target.value === ""
                                  ? 0
                                  : Number(e.target.value)
                              )
                            }
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    onClick={() => removeItem(idx)}
                    disabled={items.length <= 1}
                    aria-label="Poista rivi"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              ))}
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={locked}
                onClick={() =>
                  appendItem({ productName: "", quantity: 1 })
                }
              >
                <Plus className="w-4 h-4 mr-1" />
                Lisää tuote
              </Button>
              {form.formState.errors.items?.message ? (
                <p className="text-sm text-deep-burgundy">
                  {form.formState.errors.items.message}
                </p>
              ) : null}
            </div>
          ) : null}

          <FormField
            control={form.control}
            name="message"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Viesti (valinnainen)</FormLabel>
                <FormControl>
                  <Textarea {...field} rows={4} maxLength={2000} />
                </FormControl>
                <FormDescription>
                  Voit halutessasi kertoa lisätietoja. Peruuttamiselle ei
                  tarvitse antaa syytä.
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="flex justify-end pt-2">
            <Button
              type="submit"
              className="bg-charcoal text-warm-white hover:bg-deep-burgundy"
            >
              Jatka vahvistukseen
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}

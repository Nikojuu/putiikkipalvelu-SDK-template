"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { CheckCircle, XCircle, ArrowLeft } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import Subtitle from "@/components/subtitle";
import { forgotPassword } from "@/lib/actions/authActions";
import Link from "next/link";

const ForgotPasswordSchema = z.object({
  email: z.string().email("Virheellinen sähköpostiosoite"),
});

export default function ForgotPasswordForm() {
  const [isLoading, setIsLoading] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [formSuccess, setFormSuccess] = useState<string | null>(null);

  const form = useForm<z.infer<typeof ForgotPasswordSchema>>({
    resolver: zodResolver(ForgotPasswordSchema),
    defaultValues: {
      email: "",
    },
  });

  async function onSubmit(data: z.infer<typeof ForgotPasswordSchema>) {
    setIsLoading(true);
    setFormError(null);
    setFormSuccess(null);

    const formData = new FormData();
    formData.append("email", data.email);

    try {
      const result = await forgotPassword(formData);

      if (result.error) {
        const errorMessage =
          typeof result.error === "string"
            ? result.error
            : "Virhe lähettäessä sähköpostia.";
        setFormError(errorMessage);
        toast({
          title: "Virhe",
          description: errorMessage,
          className:
            "bg-red-50 border-red-200 dark:bg-red-900 dark:border-red-800",
          action: (
            <div className="flex items-center space-x-2">
              <XCircle className="h-5 w-5 text-red-500 dark:text-red-400" />
            </div>
          ),
        });
      } else if (result.success) {
        setFormSuccess(result.message);
        toast({
          title: "Sähköposti lähetetty",
          description: result.message,
          className:
            "bg-green-50 border-green-200 dark:bg-green-900 dark:border-green-800",
          action: (
            <div className="flex items-center space-x-2">
              <CheckCircle className="h-5 w-5 text-green-500 dark:text-green-400" />
            </div>
          ),
        });
        form.reset();
      }
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="w-full pt-8 md:pt-16 pb-16 md:pb-24 bg-warm-white min-h-screen">
      <div className="container mx-auto px-4">
        <Subtitle subtitle="Unohditko salasanasi?" />

        <div className="max-w-lg mx-auto mt-12">
          {/* Form card */}
          <div className="relative bg-warm-white p-8 md:p-10">
            {/* Border frame */}
            <div className="absolute inset-0 border border-rose-gold/15 pointer-events-none" />

            {/* Corner accents */}
            <div className="absolute top-0 left-0 w-8 h-8 border-l-2 border-t-2 border-rose-gold/40" />
            <div className="absolute top-0 right-0 w-8 h-8 border-r-2 border-t-2 border-rose-gold/40" />
            <div className="absolute bottom-0 left-0 w-8 h-8 border-l-2 border-b-2 border-rose-gold/40" />
            <div className="absolute bottom-0 right-0 w-8 h-8 border-r-2 border-b-2 border-rose-gold/40" />

            {/* Header */}
            <div className="flex items-center gap-3 mb-4">
              <div className="w-1.5 h-1.5 bg-rose-gold/60 diamond-shape" />
              <h2 className="font-primary text-2xl md:text-3xl text-charcoal">
                Palauta salasana
              </h2>
            </div>

            <p className="font-secondary text-sm text-charcoal/70 mb-8">
              Syötä sähköpostiosoitteesi, niin lähetämme sinulle ohjeet salasanan
              vaihtamiseen.
            </p>

            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                {/* Form Status Messages */}
                {formError && (
                  <div className="flex items-center space-x-3 p-4 bg-deep-burgundy/10 border border-deep-burgundy/30">
                    <XCircle className="h-5 w-5 text-deep-burgundy flex-shrink-0" />
                    <p className="text-sm font-secondary text-charcoal/80">
                      {formError}
                    </p>
                  </div>
                )}

                {formSuccess && (
                  <div className="flex items-center space-x-3 p-4 bg-rose-gold/10 border border-rose-gold/30">
                    <CheckCircle className="h-5 w-5 text-rose-gold flex-shrink-0" />
                    <p className="text-sm font-secondary text-charcoal/80">
                      {formSuccess}
                    </p>
                  </div>
                )}

                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm font-secondary text-charcoal">
                        Sähköposti *
                      </FormLabel>
                      <FormControl>
                        <Input
                          type="email"
                          {...field}
                          className="bg-cream/50 border-rose-gold/20 focus:border-rose-gold/50 focus:ring-rose-gold/20 font-secondary text-charcoal placeholder:text-charcoal/40"
                          placeholder="anna@esimerkki.fi"
                        />
                      </FormControl>
                      <FormMessage className="text-sm font-secondary text-deep-burgundy" />
                    </FormItem>
                  )}
                />

                {/* Decorative line before buttons */}
                <div className="h-[1px] bg-gradient-to-r from-transparent via-rose-gold/30 to-transparent" />

                <div className="flex flex-col sm:flex-row gap-3">
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="group flex-1 inline-flex items-center justify-center gap-3 px-8 py-4 bg-charcoal text-warm-white font-secondary text-sm tracking-wider uppercase transition-all duration-300 hover:bg-rose-gold disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isLoading ? "Lähetetään..." : "Lähetä palautuslinkki"}
                  </button>
                </div>

                {/* Back to login link */}
                <div className="text-center pt-4">
                  <Link
                    href="/login"
                    className="inline-flex items-center gap-2 text-sm font-secondary text-charcoal/70 hover:text-rose-gold transition-colors"
                  >
                    <ArrowLeft className="h-4 w-4" />
                    Takaisin kirjautumiseen
                  </Link>
                </div>
              </form>
            </Form>
          </div>
        </div>
      </div>
    </div>
  );
}

"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";

import { CheckCircle, XCircle, Eye, EyeOff, MailCheck } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import Subtitle from "@/components/subtitle";
import { registerCustomer } from "@/lib/actions/authActions";
import Link from "next/link";

const RegisterSchema = z.object({
  firstName: z.string().min(1, "Etunimi on pakollinen"),
  lastName: z.string().min(1, "Sukunimi on pakollinen"),
  email: z.string().email("Virheellinen sähköpostiosoite"),
  password: z.string().min(8, "Salasanan on oltava vähintään 8 merkkiä pitkä"),
  subscribeToNewsletter: z.boolean().default(false),
});

export default function RegisterForm() {
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [registeredEmail, setRegisteredEmail] = useState<string | null>(null);

  const form = useForm<z.infer<typeof RegisterSchema>>({
    resolver: zodResolver(RegisterSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
      password: "",
      subscribeToNewsletter: false,
    },
  });
  async function onSubmit(data: z.infer<typeof RegisterSchema>) {
    setIsLoading(true);
    const formData = new FormData();
    Object.entries(data).forEach(([key, value]) =>
      formData.append(key, String(value))
    );

    try {
      const result = await registerCustomer(formData);
      if (result.error) {
        toast({
          title: "Rekisteröinti epäonnistui",
          description:
            typeof result.error === "string"
              ? result.error
              : "Tarkista tietosi ja yritä uudelleen",
          className:
            "bg-red-50 border-red-200 dark:bg-red-900 dark:border-red-800",
          action: (
            <div className="flex items-center space-x-2">
              <XCircle className="h-5 w-5 text-red-500 dark:text-red-400" />
            </div>
          ),
        });
      } else if (result.success) {
        toast({
          title: "Rekisteröinti onnistui",
          description:
            "Tili luotu! Tarkista sähköpostisi vahvistaaksesi tilisi.",
          className:
            "bg-green-50 border-green-200 dark:bg-green-900 dark:border-green-800",
          action: (
            <div className="flex items-center space-x-2">
              <CheckCircle className="h-5 w-5 text-green-500 dark:text-green-400" />
            </div>
          ),
        });
        form.reset();
        setRegisteredEmail(data.email);
      }
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="w-full pt-8 md:pt-16 pb-16 md:pb-24 bg-warm-white min-h-screen">
      <div className="container mx-auto px-4">
        <Subtitle subtitle="Luo tilisi" />

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
            <div className="flex items-center gap-3 mb-8">
              <div className="w-1.5 h-1.5 bg-rose-gold/60 diamond-shape" />
              <h2 className="font-primary text-2xl md:text-3xl text-charcoal">
                {registeredEmail ? "Tarkista sähköpostisi" : "Liity mukaan"}
              </h2>
            </div>

            {registeredEmail ? (
              <div className="space-y-6">
                <div className="flex items-start space-x-3 p-4 bg-rose-gold/10 border border-rose-gold/30">
                  <MailCheck className="h-5 w-5 text-rose-gold flex-shrink-0 mt-0.5" />
                  <div className="space-y-1">
                    <p className="text-sm font-secondary text-charcoal/80">
                      Tilisi on luotu! Lähetimme vahvistuslinkin osoitteeseen{" "}
                      <span className="font-medium text-charcoal">
                        {registeredEmail}
                      </span>
                      .
                    </p>
                    <p className="text-sm font-secondary text-charcoal/60">
                      Vahvista sähköpostiosoitteesi ennen kirjautumista. Linkki
                      on voimassa 24 tuntia.
                    </p>
                  </div>
                </div>

                <div className="h-[1px] bg-gradient-to-r from-transparent via-rose-gold/30 to-transparent" />

                <Link
                  href="/login"
                  className="w-full inline-flex items-center justify-center gap-3 px-8 py-4 bg-charcoal text-warm-white font-secondary text-sm tracking-wider uppercase transition-all duration-300 hover:bg-rose-gold"
                >
                  Siirry kirjautumaan
                </Link>
              </div>
            ) : (
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="firstName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-sm font-secondary text-charcoal">
                          Etunimi *
                        </FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            className="bg-cream/50 border-rose-gold/20 focus:border-rose-gold/50 focus:ring-rose-gold/20 font-secondary text-charcoal placeholder:text-charcoal/40"
                            placeholder="Anna"
                          />
                        </FormControl>
                        <FormMessage className="text-sm font-secondary text-deep-burgundy" />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="lastName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-sm font-secondary text-charcoal">
                          Sukunimi *
                        </FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            className="bg-cream/50 border-rose-gold/20 focus:border-rose-gold/50 focus:ring-rose-gold/20 font-secondary text-charcoal placeholder:text-charcoal/40"
                            placeholder="Korhonen"
                          />
                        </FormControl>
                        <FormMessage className="text-sm font-secondary text-deep-burgundy" />
                      </FormItem>
                    )}
                  />
                </div>

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

                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm font-secondary text-charcoal">
                        Salasana *
                      </FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Input
                            type={showPassword ? "text" : "password"}
                            {...field}
                            className="bg-cream/50 border-rose-gold/20 focus:border-rose-gold/50 focus:ring-rose-gold/20 font-secondary text-charcoal placeholder:text-charcoal/40"
                            placeholder="Vähintään 8 merkkiä"
                          />
                          <button
                            type="button"
                            className="absolute right-0 top-0 h-full px-3 py-2 text-charcoal/60 hover:text-rose-gold transition-colors"
                            onClick={() => setShowPassword(!showPassword)}
                            aria-label={
                              showPassword ? "Piilota salasana" : "Näytä salasana"
                            }
                          >
                            {showPassword ? (
                              <EyeOff className="h-4 w-4" aria-hidden="true" />
                            ) : (
                              <Eye className="h-4 w-4" aria-hidden="true" />
                            )}
                          </button>
                        </div>
                      </FormControl>
                      <FormMessage className="text-sm font-secondary text-deep-burgundy" />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="subscribeToNewsletter"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-start gap-3 space-y-0">
                      <FormControl>
                        <input
                          type="checkbox"
                          name={field.name}
                          ref={field.ref}
                          checked={field.value}
                          onBlur={field.onBlur}
                          onChange={(e) => field.onChange(e.target.checked)}
                          className="mt-0.5 h-4 w-4 shrink-0 cursor-pointer accent-rose-gold"
                        />
                      </FormControl>
                      <div className="space-y-1 leading-none">
                        <FormLabel className="text-sm font-secondary text-charcoal cursor-pointer">
                          Tilaa uutiskirje
                        </FormLabel>
                        <p className="text-xs font-secondary text-charcoal/50">
                          Saat tietoa uutuuksista ja tarjouksista. Voit perua
                          tilauksen milloin tahansa.
                        </p>
                      </div>
                    </FormItem>
                  )}
                />

                {/* Decorative line before button */}
                <div className="h-[1px] bg-gradient-to-r from-transparent via-rose-gold/30 to-transparent" />

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full inline-flex items-center justify-center gap-3 px-8 py-4 bg-charcoal text-warm-white font-secondary text-sm tracking-wider uppercase transition-all duration-300 hover:bg-rose-gold disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoading ? "Luodaan tiliä..." : "Rekisteröidy"}
                </button>
              </form>
            </Form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

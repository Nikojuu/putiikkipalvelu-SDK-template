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
import { CheckCircle, XCircle, Eye, EyeOff } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import Subtitle from "@/components/subtitle";
import { resetPassword } from "@/lib/actions/authActions";
import { useRouter } from "next/navigation";
import Link from "next/link";

const ResetPasswordSchema = z
  .object({
    password: z
      .string()
      .min(8, "Salasanan on oltava vähintään 8 merkkiä pitkä"),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Salasanat eivät täsmää",
    path: ["confirmPassword"],
  });

interface ResetPasswordFormProps {
  token: string;
}

export default function ResetPasswordForm({ token }: ResetPasswordFormProps) {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [formSuccess, setFormSuccess] = useState<string | null>(null);

  const form = useForm<z.infer<typeof ResetPasswordSchema>>({
    resolver: zodResolver(ResetPasswordSchema),
    defaultValues: {
      password: "",
      confirmPassword: "",
    },
  });

  async function onSubmit(data: z.infer<typeof ResetPasswordSchema>) {
    setIsLoading(true);
    setFormError(null);
    setFormSuccess(null);

    const formData = new FormData();
    formData.append("token", token);
    formData.append("password", data.password);
    formData.append("confirmPassword", data.confirmPassword);

    try {
      const result = await resetPassword(formData);

      if (result.error) {
        const errorMessage =
          typeof result.error === "string"
            ? result.error
            : "Virheellinen tai vanhentunut palautuskoodi.";
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
          title: "Salasana vaihdettu",
          description: result.message,
          className:
            "bg-green-50 border-green-200 dark:bg-green-900 dark:border-green-800",
          action: (
            <div className="flex items-center space-x-2">
              <CheckCircle className="h-5 w-5 text-green-500 dark:text-green-400" />
            </div>
          ),
        });

        // Redirect to login after 2 seconds
        setTimeout(() => {
          router.push("/login?reset=success");
        }, 2000);
      }
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="w-full pt-8 md:pt-16 pb-16 md:pb-24 bg-warm-white min-h-screen">
      <div className="container mx-auto px-4">
        <Subtitle subtitle="Vaihda salasana" />

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
                Uusi salasana
              </h2>
            </div>

            <p className="font-secondary text-sm text-charcoal/70 mb-8">
              Syötä uusi salasanasi. Salasanan tulee olla vähintään 8 merkkiä
              pitkä.
            </p>

            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                {/* Form Status Messages */}
                {formError && (
                  <div className="flex items-start space-x-3 p-4 bg-deep-burgundy/10 border border-deep-burgundy/30">
                    <XCircle className="h-5 w-5 text-deep-burgundy flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-secondary text-charcoal/80">
                        {formError}
                      </p>
                      <Link
                        href="/forgot-password"
                        className="text-sm font-secondary text-rose-gold hover:underline mt-2 inline-block"
                      >
                        Pyydä uusi palautuslinkki
                      </Link>
                    </div>
                  </div>
                )}

                {formSuccess && (
                  <div className="flex items-center space-x-3 p-4 bg-rose-gold/10 border border-rose-gold/30">
                    <CheckCircle className="h-5 w-5 text-rose-gold flex-shrink-0" />
                    <div>
                      <p className="text-sm font-secondary text-charcoal/80">
                        {formSuccess}
                      </p>
                      <p className="text-sm font-secondary text-charcoal/60 mt-1">
                        Sinut ohjataan kirjautumissivulle...
                      </p>
                    </div>
                  </div>
                )}

                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm font-secondary text-charcoal">
                        Uusi salasana *
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
                  name="confirmPassword"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm font-secondary text-charcoal">
                        Vahvista salasana *
                      </FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Input
                            type={showConfirmPassword ? "text" : "password"}
                            {...field}
                            className="bg-cream/50 border-rose-gold/20 focus:border-rose-gold/50 focus:ring-rose-gold/20 font-secondary text-charcoal placeholder:text-charcoal/40"
                            placeholder="Kirjoita salasana uudelleen"
                          />
                          <button
                            type="button"
                            className="absolute right-0 top-0 h-full px-3 py-2 text-charcoal/60 hover:text-rose-gold transition-colors"
                            onClick={() =>
                              setShowConfirmPassword(!showConfirmPassword)
                            }
                            aria-label={
                              showConfirmPassword
                                ? "Piilota salasana"
                                : "Näytä salasana"
                            }
                          >
                            {showConfirmPassword ? (
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

                {/* Decorative line before buttons */}
                <div className="h-[1px] bg-gradient-to-r from-transparent via-rose-gold/30 to-transparent" />

                <button
                  type="submit"
                  disabled={isLoading || !!formSuccess}
                  className="w-full inline-flex items-center justify-center gap-3 px-8 py-4 bg-charcoal text-warm-white font-secondary text-sm tracking-wider uppercase transition-all duration-300 hover:bg-rose-gold disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoading ? "Vaihdetaan..." : "Vaihda salasana"}
                </button>
              </form>
            </Form>
          </div>
        </div>
      </div>
    </div>
  );
}

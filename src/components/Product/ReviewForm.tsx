"use client";

import { useState, useTransition } from "react";
import { Star, Loader2 } from "lucide-react";
import { Button } from "../ui/button";
import { useRouter } from "next/navigation";
import { submitReview } from "@/lib/actions/reviewActions";

interface ReviewFormProps {
  slug: string;
  /** When true, the name field is hidden (the customer is identified server-side). */
  isLoggedIn: boolean;
  /**
   * Whether to reveal the reward code on success. Only the /myorders (verified
   * purchase) flow sets this — the product page never shows the code.
   */
  showReward?: boolean;
}

export default function ReviewForm({
  slug,
  isLoggedIn,
  showReward = false,
}: ReviewFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [rating, setRating] = useState(0);
  const [hover, setHover] = useState(0);
  const [submitted, setSubmitted] = useState(false);
  const [rewardCode, setRewardCode] = useState<string | null>(null);
  const [published, setPublished] = useState(true);
  // Inline error — the form lives in a modal, where toasts render behind the
  // overlay and aren't visible. Show feedback inside the dialog instead.
  const [error, setError] = useState<string | null>(null);

  const onSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);

    if (rating < 1) {
      setError("Valitse arvosana.");
      return;
    }

    const fd = new FormData(e.currentTarget);
    const body = ((fd.get("body") as string) || "").trim();
    if (!body) {
      setError("Kirjoita arvostelu.");
      return;
    }

    const title = ((fd.get("title") as string) || "").trim() || undefined;
    const authorName = isLoggedIn
      ? undefined
      : ((fd.get("authorName") as string) || "").trim() || undefined;
    const hp = ((fd.get("website") as string) || "").trim() || undefined;

    startTransition(async () => {
      const res = await submitReview({ slug, rating, body, title, authorName, hp });
      if (res.success) {
        setRewardCode(res.reward?.code ?? null);
        setPublished(res.published);
        setSubmitted(true);
        router.refresh();
      } else {
        setError(res.error);
      }
    });
  };

  if (submitted) {
    return (
      <div className="rounded border border-gray-200 p-4 bg-gray-50 max-w-lg">
        <p className="font-medium">Kiitos arvostelustasi!</p>
        <p className="text-sm text-gray-600 mt-1">
          {published
            ? "Arvostelusi on julkaistu."
            : "Arvostelusi tarkistetaan ennen julkaisua."}
        </p>
        {showReward && rewardCode && (
          <p className="mt-2 text-sm">
            Käytä alennuskoodia seuraavaan tilaukseesi:{" "}
            <span className="font-mono font-semibold">{rewardCode}</span>
          </p>
        )}
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      {/* Honeypot — hidden from humans; bots that fill it are dropped server-side */}
      <input
        type="text"
        name="website"
        tabIndex={-1}
        autoComplete="off"
        aria-hidden="true"
        className="hidden"
      />

      <div
        className="flex items-center gap-1"
        role="radiogroup"
        aria-label="Arvosana"
      >
        {[1, 2, 3, 4, 5].map((n) => (
          <button
            type="button"
            key={n}
            onClick={() => setRating(n)}
            onMouseEnter={() => setHover(n)}
            onMouseLeave={() => setHover(0)}
            aria-label={`${n} tähteä`}
            aria-pressed={rating === n}
            className="p-0.5"
          >
            <Star
              className={
                (hover || rating) >= n
                  ? "h-6 w-6 fill-yellow-400 text-yellow-400"
                  : "h-6 w-6 text-gray-300"
              }
            />
          </button>
        ))}
      </div>

      {!isLoggedIn && (
        <div>
          <label htmlFor="authorName" className="block text-sm font-medium mb-1">
            Nimi (valinnainen)
          </label>
          <input
            id="authorName"
            name="authorName"
            type="text"
            maxLength={100}
            className="w-full border border-gray-300 rounded px-3 py-2"
            placeholder="Nimimerkki"
          />
        </div>
      )}

      <div>
        <label htmlFor="title" className="block text-sm font-medium mb-1">
          Otsikko (valinnainen)
        </label>
        <input
          id="title"
          name="title"
          type="text"
          maxLength={200}
          className="w-full border border-gray-300 rounded px-3 py-2"
        />
      </div>

      <div>
        <label htmlFor="body" className="block text-sm font-medium mb-1">
          Arvostelu
        </label>
        <textarea
          id="body"
          name="body"
          maxLength={5000}
          rows={4}
          className="w-full border border-gray-300 rounded px-3 py-2"
        />
      </div>

      {error && (
        <p className="text-sm text-red-600" role="alert">
          {error}
        </p>
      )}

      <Button type="submit" disabled={isPending}>
        {isPending ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Lähetetään...
          </>
        ) : (
          "Lähetä arvostelu"
        )}
      </Button>
    </form>
  );
}

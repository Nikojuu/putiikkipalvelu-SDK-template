import { Star } from "lucide-react";
import { storefront } from "@/lib/storefront";

function StarRow({ rating }: { rating: number }) {
  return (
    <span className="inline-flex" aria-label={`${rating}/5`}>
      {[1, 2, 3, 4, 5].map((n) => (
        <Star
          key={n}
          className={
            n <= rating
              ? "h-4 w-4 fill-yellow-400 text-yellow-400"
              : "h-4 w-4 text-gray-300"
          }
        />
      ))}
    </span>
  );
}

/**
 * Server component: renders approved reviews for a product. Returns null when
 * there are no reviews yet (no sad empty-state — the ReviewForm still shows).
 */
export default async function ReviewList({ slug }: { slug: string }) {
  let data;
  try {
    data = await storefront.reviews.list(slug);
  } catch {
    return null; // fail soft — never block the product page on reviews
  }

  if (!data || data.reviewCount === 0) return null;

  const avg = data.averageRating ?? 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <StarRow rating={Math.round(avg)} />
        <span className="text-lg font-semibold">{avg.toFixed(1)}</span>
        <span className="text-sm text-gray-500">
          ({data.reviewCount}{" "}
          {data.reviewCount === 1 ? "arvostelu" : "arvostelua"})
        </span>
      </div>

      <div className="space-y-1 max-w-xs">
        {[5, 4, 3, 2, 1].map((star) => {
          const count = data.distribution[String(star)] ?? 0;
          const pct = data.reviewCount ? (count / data.reviewCount) * 100 : 0;
          return (
            <div key={star} className="flex items-center gap-2 text-sm">
              <span className="w-8 text-gray-500">{star} ★</span>
              <div className="flex-1 h-2 bg-gray-200 rounded">
                <div
                  className="h-2 bg-yellow-400 rounded"
                  style={{ width: `${pct}%` }}
                />
              </div>
              <span className="w-8 text-right text-gray-500">{count}</span>
            </div>
          );
        })}
      </div>

      <ul className="space-y-6">
        {data.reviews.map((r) => (
          <li key={r.id} className="border-b border-gray-200 pb-4">
            <div className="flex items-center gap-2">
              <StarRow rating={r.rating} />
              {r.verifiedPurchase && (
                <span className="text-xs bg-green-100 text-green-800 px-2 py-0.5 rounded">
                  Vahvistettu ostaja
                </span>
              )}
            </div>
            {r.contentHidden ? (
              <p className="mt-1 text-sm italic text-gray-400">
                Arvostelun teksti on piilotettu.
              </p>
            ) : (
              <>
                {r.title && <p className="font-medium mt-1">{r.title}</p>}
                <p className="text-gray-700 mt-1 whitespace-pre-line">
                  {r.body}
                </p>
              </>
            )}
            <p className="text-xs text-gray-500 mt-1">
              {r.reviewerName} ·{" "}
              {new Date(r.createdAt).toLocaleDateString("fi-FI")}
            </p>
            {r.merchantReply && (
              <div className="mt-2 ml-4 border-l-2 border-gray-300 pl-3 text-sm">
                <p className="font-medium">Myyjän vastaus</p>
                <p className="text-gray-700 whitespace-pre-line">
                  {r.merchantReply}
                </p>
              </div>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}

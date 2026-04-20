import { LoadingProductCard } from "@/components/ProductCard";

export function ProductGridSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8 max-w-screen-xl mx-auto my-8">
      {Array.from({ length: count }).map((_, i) => (
        <LoadingProductCard key={i} />
      ))}
    </div>
  );
}

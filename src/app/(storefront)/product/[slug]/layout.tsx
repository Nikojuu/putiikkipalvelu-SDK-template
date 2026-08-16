import { getProductBySlug } from "@/lib/product";

/**
 * Resolves the product ABOVE the loading.tsx Suspense boundary so a renamed
 * product's permanent redirect is sent as a real HTTP 308 before streaming
 * starts. The result is cached (React cache), so the page and generateMetadata
 * reuse this same fetch — no extra API call.
 */
export default async function ProductLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  await getProductBySlug(slug);
  return children;
}

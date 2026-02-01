import { Metadata } from "next";
import { getSEOValue, SEO_FALLBACKS } from "@/lib/storeConfig";
import { storefront } from "@/lib/storefront";
import { HomepageBlockRenderer } from "@/components/Homepage/HomepageBlockRenderer";

export async function generateMetadata(): Promise<Metadata> {
  try {
    const page = await storefront.pages.getBySlug("homepage", {
      next: { revalidate: 3600, tags: ["page", "homepage"] },
    });

    const storeName = page.storeName;
    const seo = page.seo;

    const description = getSEOValue(
      seo?.seoDescription,
      `Tutustu ${storeName} valikoimaan. ${SEO_FALLBACKS.description}`
    );
    const domain = getSEOValue(seo?.domain, SEO_FALLBACKS.domain);

    // Don't set title here — let layout's title.default apply.
    // Only override description and canonical for the homepage.
    return {
      description,
      alternates: {
        canonical: domain,
      },
    };
  } catch (error) {
    console.error("Error generating homepage metadata:", error);

    // Fallback metadata
    return {
      title: SEO_FALLBACKS.title,
      description: SEO_FALLBACKS.description,
      robots: "noindex, nofollow",
    };
  }
}

export const revalidate = 3600;

export default async function Home() {
  let page;
  try {
    page = await storefront.pages.getBySlug("homepage", {
      next: { revalidate: 3600, tags: ["page", "homepage"] },
    });
  } catch {
    // Homepage page not found — render empty
    return <main className="bg-warm-white" />;
  }

  const blocks = [...page.blocks].sort((a, b) => a.order - b.order);

  return (
    <main className="bg-warm-white">
      {blocks.map((block) => (
        <HomepageBlockRenderer key={block.id} block={block} />
      ))}
    </main>
  );
}

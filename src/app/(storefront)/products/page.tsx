import { Metadata } from "next";
import ProductsPage from "./[...slug]/page";
import { getStoreConfig, getSEOValue, SEO_FALLBACKS } from "@/lib/storeConfig";
import { SEO_ENABLED } from "@/app/utils/constants";

export async function generateMetadata(): Promise<Metadata> {
  try {
    const config = await getStoreConfig();

    const title = "Kaikki tuotteet";
    // Derived per store rather than read from StoreSeo.seoDescription: the
    // homepage already uses that value (layout.tsx), so reading it here shipped
    // an identical meta description on / and /products. Note the hyphen in
    // "-verkkokaupan" — Finnish attaches the case ending to the common noun, so
    // this stays grammatical for any store name.
    const description = `Selaa ${config.store.name} -verkkokaupan koko tuotevalikoimaa. Löydä uutuudet ja suosikit helposti.`;
    const domain = getSEOValue(config.seo.domain, SEO_FALLBACKS.domain);
    const ogImage = getSEOValue(config.seo.openGraphImageUrl, SEO_FALLBACKS.openGraphImage);
    const twitterImage = getSEOValue(config.seo.twitterImageUrl, SEO_FALLBACKS.twitterImage);

    return {
      title,
      description,
      robots: SEO_ENABLED
        ? "index, follow, max-snippet:-1, max-image-preview:large, max-video-preview:-1"
        : "noindex, nofollow",
      alternates: {
        canonical: `${domain}/products`,
      },
      openGraph: {
        title,
        description,
        url: `${domain}/products`,
        images: [
          {
            url: ogImage,
            width: 1200,
            height: 630,
            alt: `${config.store.name} - Tuotteet`,
          },
        ],
        locale: "fi_FI",
        type: "website",
        siteName: config.store.name,
      },
      twitter: {
        card: "summary_large_image",
        title,
        description,
        images: [twitterImage],
      },
    };
  } catch (error) {
    console.error("Error generating products page metadata:", error);

    return {
      title: "Kaikki tuotteet",
      description: "Tutustu tuotevalikoimaamme.",
      robots: "noindex, nofollow",
    };
  }
}

export default ProductsPage;

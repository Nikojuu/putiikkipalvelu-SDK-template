import { Store, WithContext } from "schema-dts";
import { getStoreConfig, getSEOValue, SEO_FALLBACKS } from "@/lib/storeConfig";

export default async function LocalBusinessSchema() {
  try {
    const config = await getStoreConfig();
    const domain = getSEOValue(config.seo.domain, SEO_FALLBACKS.domain);
    const logoUrl = getSEOValue(config.store.logoUrl, SEO_FALLBACKS.logoUrl);
    const description = getSEOValue(config.seo.seoDescription, SEO_FALLBACKS.description);
    const priceRange = getSEOValue(config.seo.priceRange, SEO_FALLBACKS.priceRange);
    const businessType = getSEOValue(config.seo.businessType, SEO_FALLBACKS.businessType);

    // Build social media links array (sameAs property)
    const sameAs: string[] = [];
    if (config.seo.instagramUrl) sameAs.push(config.seo.instagramUrl);
    if (config.seo.facebookUrl) sameAs.push(config.seo.facebookUrl);
    if (config.seo.tiktokUrl) sameAs.push(config.seo.tiktokUrl);
    if (config.seo.youtubeUrl) sameAs.push(config.seo.youtubeUrl);
    if (config.seo.pinterestUrl) sameAs.push(config.seo.pinterestUrl);
    if (config.seo.linkedinUrl) sameAs.push(config.seo.linkedinUrl);

    // Format payment methods from config
    const paymentMethods = config.payments.methods
      .map((method) => {
        if (method === "stripe") return "Credit Card, Debit Card";
        if (method === "paytrail") return "Paytrail";
        return method;
      })
      .join(", ");

    const fullLogoUrl = logoUrl.startsWith("http") ? logoUrl : `${domain}${logoUrl}`;

    const schema: WithContext<Store> = {
      "@context": "https://schema.org",
      "@type": "Store",
      "@id": `${domain}/#store`,
      name: config.store.name,
      description,
      url: domain,
      logo: fullLogoUrl,
      image: fullLogoUrl,
      address: {
        "@type": "PostalAddress",
        addressLocality: config.store.city,
        addressCountry: config.store.country,
      },
      priceRange,
      currenciesAccepted: config.store.currency,
      paymentAccepted: paymentMethods,
      openingHoursSpecification: {
        "@type": "OpeningHoursSpecification",
        dayOfWeek: [
          "Monday",
          "Tuesday",
          "Wednesday",
          "Thursday",
          "Friday",
          "Saturday",
          "Sunday",
        ],
        opens: "00:00",
        closes: "23:59",
        description: "Verkkokauppa avoinna 24/7",
      },
      ...(sameAs.length > 0 && { sameAs }),
      ...(config.seo.foundingDate && {
        foundingDate: config.seo.foundingDate.split("T")[0],
      }),
      contactPoint: {
        "@type": "ContactPoint",
        contactType: "customer service",
        email: config.store.email,
        availableLanguage: "Finnish",
      },
    };

    return (
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
      />
    );
  } catch (error) {
    console.error("Error generating LocalBusiness schema:", error);
    return null;
  }
}

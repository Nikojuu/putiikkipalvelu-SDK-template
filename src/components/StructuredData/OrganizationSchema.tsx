import { Organization, WithContext } from "schema-dts";
import { getStoreConfig, getSEOValue, SEO_FALLBACKS } from "@/lib/storeConfig";

export default async function OrganizationSchema() {
  try {
    const config = await getStoreConfig();
    const domain = getSEOValue(config.seo.domain, SEO_FALLBACKS.domain);
    const logoUrl = getSEOValue(config.store.logoUrl, SEO_FALLBACKS.logoUrl);
    const description = getSEOValue(config.seo.seoDescription, SEO_FALLBACKS.description);

    // Build social media links array (sameAs property)
    const sameAs: string[] = [];
    if (config.seo.instagramUrl) sameAs.push(config.seo.instagramUrl);
    if (config.seo.facebookUrl) sameAs.push(config.seo.facebookUrl);
    if (config.seo.tiktokUrl) sameAs.push(config.seo.tiktokUrl);
    if (config.seo.youtubeUrl) sameAs.push(config.seo.youtubeUrl);
    if (config.seo.pinterestUrl) sameAs.push(config.seo.pinterestUrl);
    if (config.seo.linkedinUrl) sameAs.push(config.seo.linkedinUrl);

    const schema: WithContext<Organization> = {
      "@context": "https://schema.org",
      "@type": "Organization",
      name: config.store.name,
      url: domain,
      logo: logoUrl.startsWith("http") ? logoUrl : `${domain}${logoUrl}`,
      description,
      address: {
        "@type": "PostalAddress",
        addressCountry: config.store.country,
      },
      contactPoint: {
        "@type": "ContactPoint",
        contactType: "customer service",
        email: config.store.email,
        availableLanguage: "Finnish",
      },
      ...(sameAs.length > 0 && { sameAs }),
      ...(config.seo.foundingDate && {
        foundingDate: config.seo.foundingDate.split("T")[0],
      }),
    };

    return (
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
      />
    );
  } catch (error) {
    console.error("Error generating Organization schema:", error);
    return null;
  }
}

import { MetadataRoute } from "next";
import { SEO_ENABLED } from "./utils/constants";

export default function robots(): MetadataRoute.Robots {
  // Get domain from environment variable (fallback to constant if needed)
  const domain =
    process.env.NEXT_PUBLIC_BASE_URL || "https://example.com";

  // If SEO is disabled, disallow all crawling
  if (!SEO_ENABLED) {
    return {
      rules: [
        {
          userAgent: "*",
          disallow: "/",
        },
      ],
    };
  }

  // Normal SEO configuration when enabled
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: [
          "/cart",
          "/payment/*",
          "/api/*",
          "/_next/*",
          "/static/*",
          // Customer-account and transactional routes. These must be listed as
          // real URL paths — "/(auth)/*" never matched anything, because a
          // Next.js route group is not part of the URL.
          "/login",
          "/register",
          "/forgot-password",
          "/reset-password",
          "/mypage",
          "/myinfo",
          "/myorders",
          "/mywishlist",
          "/verify-email",
          "/orders/*",
          "/scanner",
        ],
      },
    ],
    sitemap: `${domain}/sitemap.xml`,
  };
}

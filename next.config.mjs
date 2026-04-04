/** @type {import('next').NextConfig} */
const nextConfig = {
  // Disable streaming metadata to prevent duplicate meta tags in <head>
  // See: https://nextjs.org/docs/app/api-reference/functions/generate-metadata#streaming-metadata
  htmlLimitedBots: /.*/,
  // Transpile the linked SDK package
  transpilePackages: ["@putiikkipalvelu/storefront-sdk"],
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "cdn.putiikkipalvelu.fi",
      },
      {
        protocol: "https",
        hostname: "images.putiikkipalvelu.fi",
      },
      {
        protocol: "https",
        hostname: "pub-93d6c2a1c0274c318eeb70253a796faa.r2.dev",
      },
      {
        protocol: "https",
        hostname: "utfs.io",
        port: "",
      },
      {
        protocol: "https",
        hostname: "www.shipit.fi",
        port: "",
      },
      {
        protocol: "https",
        hostname: "resources.paytrail.com",
        port: "",
      },
      {
        protocol: "https",
        hostname: "dsh3gv4ve2.ufs.sh",
      },
      {
        protocol: "https",
        hostname: "picsum.photos",
      },
      {
        protocol: "https",
        hostname: "apitest.shipit.ax",
      },
    ],
  },
};

export default nextConfig;

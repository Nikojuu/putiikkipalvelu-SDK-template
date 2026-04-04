const IMGPROXY_URL = process.env.NEXT_PUBLIC_IMGPROXY_URL!;

export function imgproxyLoader({
  src,
  width,
}: {
  src: string;
  width: number;
  quality?: number;
}) {
  return `${IMGPROXY_URL}/insecure/rs:fit:${width}:0/plain/${src}`;
}

/** Build an imgproxy URL directly (for <img> tags and preloading) */
export function imgproxyUrl(src: string, width: number): string {
  return `${IMGPROXY_URL}/insecure/rs:fit:${width}:0/plain/${src}`;
}

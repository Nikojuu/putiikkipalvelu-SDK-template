"use client";

import Image from "next/image";
import { imgproxyLoader } from "@/lib/imgproxy-loader";
import { sanitizeHtml } from "@/lib/sanitize";

interface ImageGridItem {
  id: string;
  imageUrl?: string;
  alt?: string;
  content?: string;
  order: number;
}

interface ImageGridBlockProps {
  title?: string;
  columns: number;
  items: ImageGridItem[];
}

export default function ImageGridBlock({
  title,
  columns,
  items,
}: ImageGridBlockProps) {
  const sorted = [...items].sort((a, b) => a.order - b.order);
  const cols = Math.max(2, Math.min(4, columns));

  const gridCols =
    cols === 2
      ? "sm:grid-cols-2"
      : cols === 3
        ? "sm:grid-cols-2 lg:grid-cols-3"
        : "sm:grid-cols-2 lg:grid-cols-4";

  return (
    <div>
      {title && (
        <h2 className="text-2xl font-semibold mb-4">{title}</h2>
      )}
      <div className={`grid grid-cols-1 ${gridCols} gap-6`}>
        {sorted.map((item) => (
          <div key={item.id}>
            {item.imageUrl && (
              <div className="relative aspect-[4/3] overflow-hidden rounded-lg mb-3">
                <Image
                  loader={imgproxyLoader}
                  src={item.imageUrl}
                  fill
                  sizes="(max-width: 640px) 100vw, 50vw"
                  alt={item.alt || ""}
                  className="object-cover"
                />
              </div>
            )}
            {item.content && (
              <div
                className="prose prose-sm max-w-none"
                dangerouslySetInnerHTML={{
                  __html: sanitizeHtml(item.content),
                }}
              />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

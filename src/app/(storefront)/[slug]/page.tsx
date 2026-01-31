import { Metadata } from "next";
import { notFound } from "next/navigation";
import DOMPurify from "isomorphic-dompurify";
import { storefront } from "@/lib/storefront";
import type { PageBlock } from "@putiikkipalvelu/storefront-sdk";
import Subtitle from "@/components/subtitle";
import PhotoGallery from "@/components/Aboutpage/PhotoGallery";

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { slug } = await params;

  try {
    const page = await storefront.pages.getBySlug(slug, {
      next: { revalidate: 60, tags: ["page", slug] },
    });

    return {
      title: page.title,
      description: page.description ?? undefined,
    };
  } catch {
    return {
      title: "Sivua ei löytynyt",
    };
  }
}

export default async function CmsPage({ params }: PageProps) {
  const { slug } = await params;

  let page;
  try {
    page = await storefront.pages.getBySlug(slug, {
      next: { revalidate: 60, tags: ["page", slug] },
    });
  } catch {
    notFound();
  }

  return (
    <section className="pt-8 md:pt-16 container mx-auto px-4 bg-warm-white mb-16">
      <Subtitle subtitle={page.title} as="h1" />
      <div className="max-w-screen-xl mx-auto space-y-8">
        {page.blocks.map((block) => (
          <BlockRenderer key={block.id} block={block} />
        ))}
      </div>
    </section>
  );
}

function BlockRenderer({ block }: { block: PageBlock }) {
  switch (block.type) {
    case "markdown": {
      if (!block.data.content) return null;
      const clean = DOMPurify.sanitize(block.data.content);
      return (
        <div
          className="prose max-w-none"
          dangerouslySetInnerHTML={{ __html: clean }}
        />
      );
    }

    case "accordion":
      return (
        <div className="space-y-3">
          {block.data.title && (
            <h2 className="text-2xl font-semibold mb-4">{block.data.title}</h2>
          )}
          {block.data.description && (
            <p className="text-muted-foreground mb-4">
              {block.data.description}
            </p>
          )}
          {block.data.items.map((item) => (
            <details key={item.id} className="border rounded-lg p-4">
              <summary className="font-medium cursor-pointer">
                {item.question}
              </summary>
              <p className="mt-2 text-muted-foreground">{item.answer}</p>
            </details>
          ))}
        </div>
      );

    case "gallery":
      return (
        <PhotoGallery
          items={block.data.items}
          title={block.data.title}
        />
      );

    case "about":
      return (
        <div
          className={`flex gap-6 ${block.data.imagePosition === "right" ? "flex-row-reverse" : ""}`}
        >
          {block.data.imageUrl && (
            <img
              src={block.data.imageUrl}
              alt={block.data.title}
              className="rounded-lg w-1/3 h-auto object-cover"
            />
          )}
          <div className="flex-1">
            <h2 className="text-2xl font-semibold mb-2">{block.data.title}</h2>
            <p className="text-muted-foreground">{block.data.description}</p>
          </div>
        </div>
      );

    case "showcase":
      return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {block.data.items.map((item, i) => (
            <a
              key={i}
              href={`/products/${item.categorySlug}`}
              className="rounded-lg border overflow-hidden group"
            >
              <img
                src={item.imageUrl}
                alt=""
                className="w-full h-48 object-cover group-hover:scale-105 transition-transform"
              />
              <div className="p-4">
                <h3 className="font-semibold">{item.title}</h3>
                {item.description && (
                  <p className="text-sm text-muted-foreground">
                    {item.description}
                  </p>
                )}
              </div>
            </a>
          ))}
        </div>
      );

    default:
      return null;
  }
}

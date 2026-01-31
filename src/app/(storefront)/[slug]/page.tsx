import { Metadata } from "next";
import { notFound } from "next/navigation";
import DOMPurify from "isomorphic-dompurify";
import { storefront } from "@/lib/storefront";
import type { PageBlock } from "@putiikkipalvelu/storefront-sdk";
import Subtitle from "@/components/subtitle";
import PhotoGallery from "@/components/Aboutpage/PhotoGallery";
import AboutBlock from "@/components/Aboutpage/AboutBlock";
import ShowcaseBlock from "@/components/ShowcaseBlock";

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
        {[...page.blocks]
          .sort((a, b) => a.order - b.order)
          .map((block) => (
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
              <div
                className="mt-2 text-muted-foreground prose prose-sm max-w-none"
                dangerouslySetInnerHTML={{
                  __html: DOMPurify.sanitize(item.answer),
                }}
              />
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
      return block.data.imageUrl ? (
        <AboutBlock
          blockInfo={{
            imgSrc: block.data.imageUrl,
            title: block.data.title,
            text: block.data.description,
            reverse: block.data.imagePosition === "right",
          }}
        />
      ) : (
        <div className="max-w-screen-xl mx-auto px-4 sm:px-8 mb-20">
          <h2 className="font-primary text-2xl md:text-3xl font-bold text-charcoal mb-4">
            {block.data.title}
          </h2>
          <div
            className="prose max-w-none"
            dangerouslySetInnerHTML={{
              __html: DOMPurify.sanitize(block.data.description),
            }}
          />
        </div>
      );

    case "showcase":
      return (
        <ShowcaseBlock
          title={block.data.title}
          description={block.data.description}
          items={block.data.items}
        />
      );

    default:
      return null;
  }
}

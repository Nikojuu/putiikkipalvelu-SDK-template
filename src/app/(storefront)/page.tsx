import { storefront } from "@/lib/storefront";
import { HomepageBlockRenderer } from "@/components/Homepage/HomepageBlockRenderer";

export default async function Home() {
  let page;
  try {
    page = await storefront.pages.getBySlug("homepage");
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

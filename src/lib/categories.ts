import { cache } from "react";
import type { Category } from "@putiikkipalvelu/storefront-sdk";
import { storefront } from "./storefront";

export const ALL_PRODUCTS_SLUG = "all-products";

export const getCategories = cache(async (): Promise<Category[]> => {
  try {
    return await storefront.categories.list();
  } catch (error) {
    console.error("Error fetching categories:", error);
    return [];
  }
});

export function findCategoryBySlug(
  categories: Category[],
  slug: string,
): Category | null {
  for (const category of categories) {
    if (category.slug === slug) return category;
    if (category.children && category.children.length > 0) {
      const found = findCategoryBySlug(category.children, slug);
      if (found) return found;
    }
  }
  return null;
}

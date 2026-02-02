"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { ChevronDown } from "lucide-react";
import type { Category, NavPage } from "@putiikkipalvelu/storefront-sdk";
import { motion, AnimatePresence } from "framer-motion";

const buildCategoryPath = (
  category: Category,
  parentPath: string = ""
): string => {
  return parentPath ? `${parentPath}/${category.slug}` : category.slug;
};

const dispatchMegaMenu = (open: boolean) => {
  window.dispatchEvent(new CustomEvent("megamenu", { detail: { open } }));
};

/** Check if any child in a category has children (3 levels deep) */
const hasGrandchildren = (category: Category): boolean => {
  return category.children?.some(
    (child) => child.children && child.children.length > 0
  ) ?? false;
};

/** Category nav item — renders mega menu (3+ levels) or simple dropdown (2 levels) */
const CategoryNavItem: React.FC<{
  category: Category;
  onMegaOpen: () => void;
  onMegaClose: () => void;
}> = ({ category, onMegaOpen, onMegaClose }) => {
  const [isHovered, setIsHovered] = useState(false);
  const hasChildren = category.children && category.children.length > 0;
  const isMega = hasChildren && hasGrandchildren(category);
  const categoryPath = `/products/${category.slug}`;

  const handleEnter = useCallback(() => {
    setIsHovered(true);
    if (isMega) onMegaOpen();
  }, [isMega, onMegaOpen]);

  const handleLeave = useCallback(() => {
    setIsHovered(false);
    if (isMega) onMegaClose();
  }, [isMega, onMegaClose]);

  return (
    <div
      className="relative"
      onMouseEnter={handleEnter}
      onMouseLeave={handleLeave}
    >
      <Link
        href={categoryPath}
        className="relative px-4 py-2 font-secondary text-sm tracking-[0.05em] uppercase text-charcoal/80 transition-all duration-300 hover:text-rose-gold group flex items-center gap-1.5"
      >
        {category.name}
        {hasChildren && (
          <ChevronDown
            className={`h-3 w-3 transition-transform duration-300 ${
              isHovered ? "rotate-180" : ""
            }`}
          />
        )}
        <span className="absolute bottom-0 left-4 right-4 h-[1px] bg-gradient-to-r from-rose-gold to-champagne scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left" />
      </Link>

      <AnimatePresence>
        {hasChildren && isHovered && (
          isMega ? (
            /* Full-width mega menu for 3-level categories */
            <motion.div
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 4 }}
              transition={{ duration: 0.15 }}
              className="fixed left-0 right-0 top-[80px] z-50"
            >
              <div className="absolute -top-2 left-0 right-0 h-2" />

              <div className="w-full bg-warm-white backdrop-blur-md border-b border-rose-gold/10 shadow-lg">
                <div className="max-w-screen-xl mx-auto px-8 py-6">
                  <div className="flex items-start justify-between gap-8">
                    <div className="flex flex-wrap flex-1 divide-x divide-rose-gold/10">
                      {category.children.map((child) => {
                        const childPath = buildCategoryPath(child, category.slug);
                        const childHasChildren =
                          child.children && child.children.length > 0;

                        return (
                          <div key={child.id} className="min-w-[160px] px-6 first:pl-0 last:pr-0">
                            <Link
                              href={`/products/${childPath}`}
                              className="block font-secondary text-base font-semibold tracking-wide capitalize text-charcoal hover:text-rose-gold transition-colors duration-150 mb-3"
                            >
                              {child.name}
                            </Link>
                            {childHasChildren && (
                              <ul className="space-y-1.5">
                                {child.children.map((grandchild) => (
                                  <li key={grandchild.id}>
                                    <Link
                                      href={`/products/${buildCategoryPath(grandchild, childPath)}`}
                                      className="block text-base text-charcoal/60 hover:text-rose-gold transition-colors duration-150 py-0.5 capitalize"
                                    >
                                      {grandchild.name}
                                    </Link>
                                  </li>
                                ))}
                              </ul>
                            )}
                          </div>
                        );
                      })}
                    </div>

                    <Link
                      href="/products"
                      className="flex-shrink-0 px-5 py-2.5 bg-rose-gold/10 hover:bg-rose-gold/20 text-charcoal font-secondary text-sm font-semibold tracking-wide uppercase rounded-sm transition-colors duration-150"
                    >
                      Kaikki tuotteet
                    </Link>
                  </div>
                </div>
              </div>
            </motion.div>
          ) : (
            /* Simple dropdown for 2-level categories */
            <motion.div
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 4 }}
              transition={{ duration: 0.15 }}
              className="absolute left-0 top-full z-50"
            >
              <div className="h-2 w-full" />

              <div className="min-w-[200px] bg-warm-white backdrop-blur-md border border-rose-gold/10 rounded-sm shadow-lg py-2">
                {category.children.map((child) => (
                  <Link
                    key={child.id}
                    href={`/products/${buildCategoryPath(child, category.slug)}`}
                    className="block px-5 py-2 text-base text-charcoal/80 capitalize hover:text-rose-gold border-l-2 border-transparent hover:border-rose-gold transition-colors duration-150"
                  >
                    {child.name}
                  </Link>
                ))}
              </div>
            </motion.div>
          )
        )}
      </AnimatePresence>
    </div>
  );
};

export function NavbarLinks({
  categories,
  navPages,
}: {
  categories: Category[];
  navPages: NavPage[];
}) {
  const [openCount, setOpenCount] = useState(0);

  // Dispatch megamenu event when any mega menu opens/closes
  useEffect(() => {
    dispatchMegaMenu(openCount > 0);
  }, [openCount]);

  const handleOpen = useCallback(() => {
    setOpenCount((c) => c + 1);
  }, []);

  const handleClose = useCallback(() => {
    setOpenCount((c) => Math.max(0, c - 1));
  }, []);

  const navLinkClasses =
    "relative px-4 py-2 font-secondary text-sm tracking-[0.05em] uppercase text-charcoal/80 transition-all duration-300 hover:text-rose-gold group";

  return (
    <div className="flex h-20 items-center">
      <nav className="hidden md:flex items-center gap-1 lg:gap-2">
        {/* Each top-level category is its own nav item with mega menu */}
        {categories.map((category) => (
          <CategoryNavItem
            key={category.id}
            category={category}
            onMegaOpen={handleOpen}
            onMegaClose={handleClose}
          />
        ))}

        {/* Dynamic CMS pages */}
        {navPages.map((page) => (
          <Link
            key={page.slug}
            href={`/${page.slug}`}
            className={navLinkClasses}
          >
            {page.title}
            <span className="absolute bottom-0 left-4 right-4 h-[1px] bg-gradient-to-r from-rose-gold to-champagne scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left" />
          </Link>
        ))}

        {/* Contact Link */}
        <Link href="/contact" className={navLinkClasses}>
          Yhteydenotto
          <span className="absolute bottom-0 left-4 right-4 h-[1px] bg-gradient-to-r from-rose-gold to-champagne scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left" />
        </Link>
      </nav>
    </div>
  );
}

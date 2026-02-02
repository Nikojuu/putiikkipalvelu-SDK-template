"use client";

import { useState, useCallback, memo } from "react";
import Link from "next/link";
import { Menu, Plus, Minus } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetTrigger,
} from "@/components/ui/sheet";
import { AnimatePresence, motion } from "framer-motion";
import Image from "next/image";
import type { Category, NavPage } from "@putiikkipalvelu/storefront-sdk";

const MAX_DEPTH = 3;

const buildCategoryPath = (
  category: Category,
  parentPath: string = ""
): string => {
  return parentPath ? `${parentPath}/${category.slug}` : category.slug;
};

const getIndentClass = (depth: number) => {
  const indentSizes = ["ml-0", "ml-4", "ml-8"];
  return indentSizes[Math.min(depth, indentSizes.length - 1)];
};

/** Renders a category and its children up to MAX_DEPTH levels */
const MobileCategory = memo(
  ({
    category,
    parentPath = "",
    depth,
    onLinkClick,
  }: {
    category: Category;
    parentPath?: string;
    depth: number;
    onLinkClick: () => void;
  }) => {
    const [isExpanded, setIsExpanded] = useState(false);
    const hasChildren =
      depth < MAX_DEPTH - 1 &&
      category.children &&
      category.children.length > 0;
    const slugPath = buildCategoryPath(category, parentPath);
    const categoryPath = `/products/${slugPath}`;

    const toggleExpanded = useCallback(() => {
      setIsExpanded((prev) => !prev);
    }, []);

    const handleCategoryClick = useCallback(() => {
      onLinkClick();
      setIsExpanded(false);
    }, [onLinkClick]);

    return (
      <div className={`${getIndentClass(depth)}`}>
        <div className="flex items-center border-b border-rose-gold/10">
          <Link
            href={categoryPath}
            onClick={handleCategoryClick}
            className="flex-grow py-2.5 px-2 text-charcoal/80 font-secondary text-sm tracking-wide capitalize transition-colors duration-300 hover:text-rose-gold"
          >
            {category.name}
          </Link>
          {hasChildren && (
            <button
              onClick={toggleExpanded}
              className="flex-shrink-0 p-2 text-charcoal/50 hover:text-rose-gold transition-colors duration-300"
              aria-label={isExpanded ? "Collapse" : "Expand"}
            >
              {isExpanded ? (
                <Minus className="h-4 w-4" />
              ) : (
                <Plus className="h-4 w-4" />
              )}
            </button>
          )}
        </div>
        <AnimatePresence initial={false}>
          {hasChildren && isExpanded && (
            <motion.div
              initial="collapsed"
              animate="open"
              exit="collapsed"
              variants={{
                open: { opacity: 1, height: "auto" },
                collapsed: { opacity: 0, height: 0 },
              }}
              transition={{ duration: 0.3, ease: "easeInOut" }}
              className="overflow-hidden"
            >
              <div className="py-1 bg-soft-blush/20">
                {category.children?.map((child) => (
                  <MobileCategory
                    key={child.id}
                    category={child}
                    parentPath={slugPath}
                    depth={depth + 1}
                    onLinkClick={onLinkClick}
                  />
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  }
);

MobileCategory.displayName = "MobileCategory";

const MobileLinks = memo(
  ({
    categories,
    logoUrl,
    navPages,
  }: {
    categories: Category[];
    logoUrl: string;
    navPages: NavPage[];
  }) => {
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [expandedCategory, setExpandedCategory] = useState<string | null>(
      null
    );

    const handleLinkClick = useCallback(() => {
      setIsMobileMenuOpen(false);
    }, []);

    const toggleCategory = useCallback((categoryId: string) => {
      setExpandedCategory((prev) => (prev === categoryId ? null : categoryId));
    }, []);

    return (
      <div className="md:hidden">
        <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
          <SheetTrigger asChild className="md:hidden">
            <Button
              variant="ghost"
              size="icon"
              aria-label="Open Menu"
              className="m-2 bg-warm-white/80 backdrop-blur-sm hover:bg-soft-blush/50 transition-colors duration-300"
            >
              <Menu className="h-5 w-5 text-charcoal" />
            </Button>
          </SheetTrigger>
          <SheetContent
            side="left"
            className="w-[300px] sm:w-[350px] bg-warm-white border-r border-rose-gold/10 p-0 overflow-y-auto"
          >
            <SheetHeader className="px-5 pt-5 pb-3 border-b border-rose-gold/10">
              <SheetTitle className="sr-only">Navigaatio</SheetTitle>
              <SheetDescription className="sr-only">
                Siirry eri sivuille tai selaa tuotekategorioita
              </SheetDescription>

              <Link
                href="/"
                className="group inline-block"
                onClick={handleLinkClick}
              >
                <Image
                  src={logoUrl}
                  alt="Logo"
                  width={56}
                  height={56}
                  className="w-12 h-12 transition-transform duration-300 group-hover:scale-105"
                />
              </Link>
            </SheetHeader>

            <nav className="flex flex-col px-5 py-4">
              {/* Each top-level category as its own expandable section */}
              {categories.map((category) => {
                const hasChildren =
                  category.children && category.children.length > 0;
                const isExpanded = expandedCategory === category.id;

                return (
                  <div key={category.id} className="border-b border-rose-gold/10">
                    <div className="flex items-center">
                      <Link
                        href={`/products/${category.slug}`}
                        className="flex-grow py-3 text-charcoal font-secondary text-base tracking-[0.05em] uppercase transition-colors duration-300 hover:text-rose-gold"
                        onClick={handleLinkClick}
                      >
                        {category.name}
                      </Link>
                      {hasChildren && (
                        <button
                          onClick={() => toggleCategory(category.id)}
                          className="flex-shrink-0 p-2 text-charcoal/50 hover:text-rose-gold transition-colors duration-300"
                          aria-label={isExpanded ? "Collapse" : "Expand"}
                        >
                          {isExpanded ? (
                            <Minus className="h-4 w-4" />
                          ) : (
                            <Plus className="h-4 w-4" />
                          )}
                        </button>
                      )}
                    </div>

                    <AnimatePresence initial={false}>
                      {hasChildren && isExpanded && (
                        <motion.div
                          initial="collapsed"
                          animate="open"
                          exit="collapsed"
                          variants={{
                            open: { opacity: 1, height: "auto" },
                            collapsed: { opacity: 0, height: 0 },
                          }}
                          transition={{ duration: 0.3, ease: "easeInOut" }}
                          className="overflow-hidden"
                        >
                          <div className="py-2 pl-4 bg-cream/30">
                            {category.children?.map((child) => (
                              <MobileCategory
                                key={child.id}
                                category={child}
                                parentPath={category.slug}
                                depth={1}
                                onLinkClick={handleLinkClick}
                              />
                            ))}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                );
              })}

              {/* Dynamic CMS pages */}
              {navPages.map((page) => (
                <Link
                  key={page.slug}
                  href={`/${page.slug}`}
                  onClick={handleLinkClick}
                  className="py-3 text-charcoal font-secondary text-base tracking-[0.05em] uppercase border-b border-rose-gold/10 transition-colors duration-300 hover:text-rose-gold"
                >
                  {page.title}
                </Link>
              ))}

              <Link
                href="/contact"
                onClick={handleLinkClick}
                className="py-3 text-charcoal font-secondary text-base tracking-[0.05em] uppercase border-b border-rose-gold/10 transition-colors duration-300 hover:text-rose-gold"
              >
                Yhteydenotto
              </Link>
            </nav>
          </SheetContent>
        </Sheet>
      </div>
    );
  }
);

MobileLinks.displayName = "MobileLinks";

export default MobileLinks;

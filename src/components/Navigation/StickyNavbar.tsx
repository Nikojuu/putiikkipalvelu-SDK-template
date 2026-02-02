"use client";

import type { Campaign } from "@putiikkipalvelu/storefront-sdk";
import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import { useState, useEffect, useRef } from "react";

export default function StickyNavbar({
  children,
  campaigns,
  logoUrl,
}: {
  children: React.ReactNode;
  campaigns: Campaign[];
  logoUrl: string;
}) {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMegaMenuOpen, setIsMegaMenuOpen] = useState(false);
  const lastScrollY = useRef(0);

  const getCampaignEmoji = (type: string) => {
    switch (type) {
      case "BUY_X_PAY_Y":
        return "\u{1F4B0}";
      default:
        return "\u{1F3AF}";
    }
  };

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;

      if (currentScrollY <= 10) {
        setIsScrolled(false);
      } else if (currentScrollY > lastScrollY.current) {
        setIsScrolled(true);
      } else if (currentScrollY < lastScrollY.current) {
        setIsScrolled(false);
      }

      lastScrollY.current = currentScrollY;
    };

    const handleMegaMenu = (e: Event) => {
      setIsMegaMenuOpen((e as CustomEvent).detail.open);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    window.addEventListener("megamenu", handleMegaMenu);
    return () => {
      window.removeEventListener("scroll", handleScroll);
      window.removeEventListener("megamenu", handleMegaMenu);
    };
  }, []);

  const showCampaign =
    !isScrolled && !isMegaMenuOpen && campaigns.length > 0;

  return (
    <header
      className={`fixed top-0 w-full z-50 transition-colors duration-300 ${
        lastScrollY.current > 10
          ? "bg-white/90 backdrop-blur-md border-b border-gray-100"
          : "bg-transparent md:bg-white/90 md:backdrop-blur-md md:border-b md:border-gray-100"
      }`}
    >
      <nav className="w-full max-w-screen-2xl mx-auto px-4 flex items-center h-20">
        <Link href="/" className="lg:mr-20 flex-shrink-0">
          <Image
            src={logoUrl}
            alt="logo"
            width={80}
            height={80}
            sizes="80px"
            className="w-12 h-12 md:w-20 md:h-20"
          />
        </Link>
        {children}
      </nav>
      {showCampaign && (
        <motion.div
          initial={{ y: -50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -50, opacity: 0 }}
          transition={{
            duration: 0.3,
            ease: "easeOut",
          }}
          className="bg-gradient-to-r from-deep-burgundy to-rose-gold text-white text-center py-2 px-4 shadow-sm"
        >
          <div className="flex flex-wrap justify-center items-center gap-x-4">
            {campaigns.map((campaign, index) => (
              <span key={campaign.id}>
                <span className="text-white text-sm font-medium tracking-wide">
                  {getCampaignEmoji(campaign.type)} {campaign.name}
                </span>
                {index < campaigns.length - 1 && (
                  <span className="text-white/60 text-sm ml-4">|</span>
                )}
              </span>
            ))}
          </div>
        </motion.div>
      )}
    </header>
  );
}

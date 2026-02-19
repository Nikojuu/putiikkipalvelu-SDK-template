"use client";

import Image from "next/image";
import { useRef } from "react";
import { motion, useInView } from "framer-motion";
import DOMPurify from "isomorphic-dompurify";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselPrevious,
  CarouselNext,
} from "@/components/ui/carousel";

interface CarouselContentItem {
  id: string;
  src: string;
  alt?: string;
  order: number;
}

interface CarouselContentBlockProps {
  content: string;
  items: CarouselContentItem[];
  contentPosition: "left" | "right";
}

export default function CarouselContentBlock({
  content,
  items,
  contentPosition,
}: CarouselContentBlockProps) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });
  const reverse = contentPosition === "right";
  const sorted = [...items].sort((a, b) => a.order - b.order);

  return (
    <div
      ref={ref}
      className={`mx-auto mb-20 md:mb-32 flex w-full max-w-screen-xl flex-col px-4 sm:px-8 lg:flex-row lg:items-center gap-8 lg:gap-0 ${
        reverse ? "lg:flex-row-reverse" : ""
      }`}
    >
      {/* Carousel side */}
      <motion.div
        initial={{ x: reverse ? 60 : -60, opacity: 0 }}
        animate={{
          x: isInView ? 0 : reverse ? 60 : -60,
          opacity: isInView ? 1 : 0,
        }}
        transition={{ duration: 0.8, ease: [0.25, 0.46, 0.45, 0.94] }}
        className="relative w-full lg:w-1/2 group"
      >
        {/* Decorative frame */}
        <div
          className={`absolute -inset-3 border border-rose-gold/20 ${
            reverse ? "translate-x-3" : "-translate-x-3"
          } translate-y-3 transition-all duration-500 group-hover:border-rose-gold/40`}
        />

        {/* Corner accents */}
        <div className="absolute -top-1 -left-1 w-6 h-6 border-l-2 border-t-2 border-rose-gold/50 z-10 transition-all duration-500 group-hover:w-10 group-hover:h-10 group-hover:border-rose-gold/70" />
        <div className="absolute -top-1 -right-1 w-6 h-6 border-r-2 border-t-2 border-rose-gold/50 z-10 transition-all duration-500 group-hover:w-10 group-hover:h-10 group-hover:border-rose-gold/70" />
        <div className="absolute -bottom-1 -left-1 w-6 h-6 border-l-2 border-b-2 border-rose-gold/50 z-10 transition-all duration-500 group-hover:w-10 group-hover:h-10 group-hover:border-rose-gold/70" />
        <div className="absolute -bottom-1 -right-1 w-6 h-6 border-r-2 border-b-2 border-rose-gold/50 z-10 transition-all duration-500 group-hover:w-10 group-hover:h-10 group-hover:border-rose-gold/70" />

        {/* Carousel */}
        <div className="relative overflow-hidden bg-cream">
          <Carousel opts={{ loop: true }} className="w-full">
            <CarouselContent>
              {sorted.map((item) => (
                <CarouselItem key={item.id}>
                  <div className="relative aspect-[4/3] overflow-hidden">
                    <Image
                      fill
                      src={item.src}
                      alt={item.alt ?? ""}
                      sizes="(min-width: 1024px) 50vw, 100vw"
                      className="object-cover"
                    />
                  </div>
                </CarouselItem>
              ))}
            </CarouselContent>
            <CarouselPrevious className="left-3 bg-warm-white/80 border-rose-gold/20 hover:bg-warm-white hover:border-rose-gold/50" />
            <CarouselNext className="right-3 bg-warm-white/80 border-rose-gold/20 hover:bg-warm-white hover:border-rose-gold/50" />
          </Carousel>
          {/* Subtle overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-charcoal/5 via-transparent to-warm-white/5 pointer-events-none" />
        </div>
      </motion.div>

      {/* Content side */}
      <motion.div
        initial={{ x: reverse ? -60 : 60, opacity: 0 }}
        animate={{
          x: isInView ? 0 : reverse ? -60 : 60,
          opacity: isInView ? 1 : 0,
        }}
        transition={{
          duration: 0.8,
          delay: 0.15,
          ease: [0.25, 0.46, 0.45, 0.94],
        }}
        className={`relative flex-1 ${
          reverse ? "lg:pr-16 lg:-mr-8" : "lg:pl-16 lg:-ml-8"
        } lg:py-12 z-10`}
      >
        <div className="relative bg-warm-white/95 backdrop-blur-sm p-8 md:p-10 lg:p-12 border border-rose-gold/10 shadow-lg">
          {/* Small decorative diamond */}
          <div className="flex items-center gap-3 mb-6">
            <div className="w-1.5 h-1.5 bg-rose-gold/60 diamond-shape" />
            <div className="w-12 h-[1px] bg-gradient-to-r from-rose-gold/50 to-transparent" />
          </div>

          {/* Text content */}
          <div
            className="prose prose-sm md:prose-base prose-p:leading-relaxed prose-p:text-charcoal/70 prose-p:font-secondary max-w-none"
            dangerouslySetInnerHTML={{
              __html: DOMPurify.sanitize(content),
            }}
          />

          {/* Bottom decorative line */}
          <div className="mt-8 h-[1px] bg-gradient-to-r from-rose-gold/40 via-champagne/30 to-transparent max-w-32" />
        </div>
      </motion.div>
    </div>
  );
}

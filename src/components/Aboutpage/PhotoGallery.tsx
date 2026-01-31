"use client";
import { useState } from "react";

import PhotoAlbum from "react-photo-album";

import Lightbox from "yet-another-react-lightbox";
import "yet-another-react-lightbox/styles.css";

import Thumbnails from "yet-another-react-lightbox/plugins/thumbnails";
import "yet-another-react-lightbox/plugins/thumbnails.css";
import Zoom from "yet-another-react-lightbox/plugins/zoom";

import Image from "next/image";
import type { Photo, RenderPhotoProps } from "react-photo-album";
import type { GalleryItem } from "@putiikkipalvelu/storefront-sdk";

interface PhotoGalleryProps {
  items: GalleryItem[];
  title?: string;
}

const PhotoGallery = ({ items, title }: PhotoGalleryProps) => {
  const [index, setIndex] = useState(-1);

  // Map items to react-photo-album format with alternating sizes
  const sizePatterns = [
    { width: 1600, height: 1200 }, // 4:3 standard
    { width: 1200, height: 1600 }, // 3:4 portrait
    { width: 1600, height: 900 },  // 16:9 wide
    { width: 1200, height: 1200 }, // 1:1 square
    { width: 1600, height: 1200 }, // 4:3 standard
    { width: 1600, height: 900 },  // 16:9 wide
  ];

  const photos: Photo[] = items.map((item, i) => ({
    src: item.src,
    ...sizePatterns[i % sizePatterns.length],
    alt: item.alt || "",
  }));

  return (
    <div className="mx-auto mb-12">
      {title && <h2 className="text-2xl font-semibold mb-4">{title}</h2>}
      <PhotoAlbum
        photos={photos}
        layout="masonry"
        renderPhoto={NextJsImage}
        columns={(containerWidth) => {
          if (containerWidth < 400) return 2;
          if (containerWidth < 800) return 3;
          return 4;
        }}
        targetRowHeight={150}
        onClick={({ index }) => setIndex(index)}
        defaultContainerWidth={1200}
        sizes={{
          size: "calc(100vw - 40px)",
          sizes: [
            { viewport: "(max-width: 299px)", size: "calc(100vw - 10px)" },
            { viewport: "(max-width: 599px)", size: "calc(100vw - 20px)" },
            { viewport: "(max-width: 1199px)", size: "calc(100vw - 30px)" },
          ],
        }}
      />

      <Lightbox
        slides={photos}
        open={index >= 0}
        index={index}
        close={() => setIndex(-1)}
        plugins={[Thumbnails, Zoom]}
      />
    </div>
  );
};

function NextJsImage({
  photo,
  imageProps: { alt, title, sizes, onClick },
  wrapperStyle,
}: RenderPhotoProps) {
  return (
    <div style={{ ...wrapperStyle, position: "relative", overflow: "hidden" }}>
      <Image
        fill
        className="rounded-sm object-contain transition-transform duration-300 hover:scale-105"
        src={photo}
        placeholder={"blurDataURL" in photo ? "blur" : undefined}
        {...{ alt, title, sizes, onClick }}
      />
    </div>
  );
}

export default PhotoGallery;

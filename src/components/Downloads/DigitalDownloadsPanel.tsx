"use client";

import { useEffect, useState, useTransition } from "react";
import { Download, FileDown, Loader2 } from "lucide-react";
import type {
  OrderDownloadLineItem,
  OrderDownload,
} from "@putiikkipalvelu/storefront-sdk";
import {
  listOrderDownloadsAction,
  getDownloadUrlAction,
} from "@/lib/actions/downloadActions";

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 * 1024 * 1024)
    return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
  return `${(bytes / 1024 / 1024 / 1024).toFixed(2)} GB`;
}

type Props = {
  orderId: string;
  /** Token from the order confirmation email URL. Guest access. */
  token?: string;
};

export function DigitalDownloadsPanel({ orderId, token }: Props) {
  const [items, setItems] = useState<OrderDownloadLineItem[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const result = await listOrderDownloadsAction(orderId, token);
      if (cancelled) return;
      if (result.ok) {
        setItems(result.data.items);
      } else {
        setError(result.error);
      }
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [orderId, token]);

  const handleDownload = (download: OrderDownload) => {
    setBusyId(download.id);
    startTransition(async () => {
      const urlResult = await getDownloadUrlAction(orderId, download.id, token);
      if (!urlResult.ok) {
        setError(urlResult.error);
        setBusyId(null);
        return;
      }
      // Trigger the browser download — R2 serves the file with
      // Content-Disposition: attachment so it downloads rather than navigates.
      window.location.href = urlResult.url;

      setTimeout(async () => {
        const refreshed = await listOrderDownloadsAction(orderId, token);
        if (refreshed.ok) {
          setItems(refreshed.data.items);
        }
        setBusyId(null);
      }, 1500);
    });
  };

  if (loading) {
    return (
      <div className="flex items-center gap-2 text-charcoal/60">
        <Loader2 className="w-4 h-4 animate-spin" />
        <span className="font-secondary">Ladataan...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-burnt-orange font-secondary text-sm">{error}</div>
    );
  }

  if (!items || items.length === 0) {
    return null;
  }

  return (
    <div className="space-y-6">
      {items.map((item) => (
        <div
          key={item.id}
          className="relative bg-cream/30 border border-rose-gold/10 p-6"
        >
          <div className="absolute top-0 left-0 w-6 h-6 border-l-2 border-t-2 border-rose-gold/30" />
          <div className="absolute top-0 right-0 w-6 h-6 border-r-2 border-t-2 border-rose-gold/30" />
          <div className="absolute bottom-0 left-0 w-6 h-6 border-l-2 border-b-2 border-rose-gold/30" />
          <div className="absolute bottom-0 right-0 w-6 h-6 border-r-2 border-b-2 border-rose-gold/30" />

          <h3 className="font-primary text-lg font-semibold text-charcoal mb-2 flex items-center gap-2">
            <FileDown className="w-5 h-5 text-burnt-orange" />
            {item.name}
          </h3>

          {item.digitalContent && (
            <div
              className="font-secondary text-sm text-charcoal/80 prose prose-sm max-w-none mb-4"
              dangerouslySetInnerHTML={{ __html: item.digitalContent }}
            />
          )}

          {item.downloads.length > 0 && (
            <ul className="divide-y divide-rose-gold/10">
              {item.downloads.map((d) => {
                const exhausted =
                  d.maxDownloads !== null &&
                  d.downloadCount >= d.maxDownloads;
                return (
                  <li
                    key={d.id}
                    className="flex items-center justify-between gap-3 py-3"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="font-secondary text-sm font-medium text-charcoal truncate">
                        {d.displayName}
                      </p>
                      <p className="font-secondary text-xs text-charcoal/60">
                        {formatBytes(d.sizeBytes)}
                        {d.maxDownloads !== null && (
                          <>
                            {" · "}
                            {d.downloadCount} / {d.maxDownloads} käytetty
                          </>
                        )}
                      </p>
                    </div>
                    <button
                      type="button"
                      disabled={exhausted || busyId === d.id}
                      onClick={() => handleDownload(d)}
                      className="inline-flex items-center gap-2 h-10 px-5 rounded-md bg-charcoal text-warm-white text-sm font-semibold tracking-wide shadow-md hover:bg-deep-burgundy hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all shrink-0"
                    >
                      {busyId === d.id ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Download className="w-4 h-4" />
                      )}
                      <span>Lataa</span>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      ))}
    </div>
  );
}

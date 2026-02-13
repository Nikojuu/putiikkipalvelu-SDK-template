"use client";

import { useState } from "react";
import { useTicket } from "@/app/(storefront)/scanner/actions";
import type { PurchasedTicket } from "@putiikkipalvelu/storefront-sdk";
import QrScanner from "./QrScanner";
import TicketResult from "./TicketResult";

interface UseTicketTabProps {
  eventId: string;
}

export default function UseTicketTab({ eventId }: UseTicketTabProps) {
  const [result, setResult] = useState<{
    success: boolean;
    message: string;
    ticket: PurchasedTicket;
  } | null>(null);
  const [loading, setLoading] = useState(false);
  const [manualCode, setManualCode] = useState("");
  const [error, setError] = useState("");

  async function handleUseTicket(code: string) {
    setLoading(true);
    setError("");
    setResult(null);

    try {
      const response = await useTicket(code, eventId);
      setResult(response);
    } catch {
      setError("Lippua ei löytynyt tai virhe lipun käytössä");
    } finally {
      setLoading(false);
    }
  }

  function handleScan(code: string) {
    if (!loading) handleUseTicket(code);
  }

  function handleManualSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (manualCode.trim()) handleUseTicket(manualCode.trim());
  }

  function handleReset() {
    setResult(null);
    setError("");
    setManualCode("");
  }

  return (
    <div className="p-4 space-y-4">
      {!result ? (
        <>
          {/* QR Scanner */}
          <QrScanner onScan={handleScan} paused={loading} />

          {/* Manual code input */}
          <form onSubmit={handleManualSubmit} className="flex gap-2">
            <input
              type="text"
              value={manualCode}
              onChange={(e) => setManualCode(e.target.value)}
              placeholder="Syötä koodi käsin"
              className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-black focus:outline-none"
            />
            <button
              type="submit"
              disabled={loading || !manualCode.trim()}
              className="rounded-lg bg-black px-4 py-2 text-sm text-white font-medium disabled:opacity-50"
            >
              Käytä
            </button>
          </form>

          {loading && (
            <p className="text-center text-sm text-gray-500">Käsitellään...</p>
          )}
          {error && (
            <p className="text-center text-sm text-red-600">{error}</p>
          )}
        </>
      ) : (
        <>
          <TicketResult
            success={result.success}
            message={result.message}
            ticket={result.ticket}
          />
          <button
            onClick={handleReset}
            className="w-full rounded-lg bg-black py-3 text-white font-medium"
          >
            Skannaa seuraava
          </button>
        </>
      )}
    </div>
  );
}

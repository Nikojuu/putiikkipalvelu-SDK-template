"use client";

import { useState } from "react";
import { getTicket } from "@/app/(storefront)/scanner/actions";
import type { PurchasedTicket } from "@putiikkipalvelu/storefront-sdk";
import QrScanner from "./QrScanner";
import TicketResult from "./TicketResult";

export default function CheckTicketTab() {
  const [ticket, setTicket] = useState<PurchasedTicket | null>(null);
  const [loading, setLoading] = useState(false);
  const [manualCode, setManualCode] = useState("");
  const [error, setError] = useState("");

  async function checkTicket(code: string) {
    setLoading(true);
    setError("");
    setTicket(null);

    try {
      const response = await getTicket(code);
      setTicket(response.ticket);
    } catch {
      setError("Lippua ei löytynyt");
    } finally {
      setLoading(false);
    }
  }

  function handleScan(code: string) {
    if (!loading) checkTicket(code);
  }

  function handleManualSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (manualCode.trim()) checkTicket(manualCode.trim());
  }

  function handleReset() {
    setTicket(null);
    setError("");
    setManualCode("");
  }

  return (
    <div className="p-4 space-y-4">
      {!ticket ? (
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
              Tarkista
            </button>
          </form>

          {loading && (
            <p className="text-center text-sm text-gray-500">Haetaan...</p>
          )}
          {error && (
            <p className="text-center text-sm text-red-600">{error}</p>
          )}
        </>
      ) : (
        <>
          <TicketResult
            success={ticket.status === "VALID"}
            ticket={ticket}
          />
          <button
            onClick={handleReset}
            className="w-full rounded-lg bg-black py-3 text-white font-medium"
          >
            Tarkista toinen
          </button>
        </>
      )}
    </div>
  );
}

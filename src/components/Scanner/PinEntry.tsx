"use client";

import { useState } from "react";
import { validatePin } from "@/app/(storefront)/scanner/actions";
import type { TicketEvent } from "@putiikkipalvelu/storefront-sdk";

interface PinEntryProps {
  event: TicketEvent;
  onSuccess: (event: TicketEvent) => void;
  onBack: () => void;
}

export default function PinEntry({ event, onSuccess, onBack }: PinEntryProps) {
  const [pin, setPin] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const result = await validatePin(event.id, pin);
      if (result.success) {
        onSuccess(result.event);
      }
    } catch {
      setError("Virheellinen PIN-koodi");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <button
          onClick={onBack}
          className="mb-4 text-sm text-gray-500 hover:text-black"
        >
          &larr; Takaisin
        </button>
        <h1 className="mb-2 text-center text-2xl font-bold">{event.name}</h1>
        <p className="mb-6 text-center text-sm text-gray-500">
          {event.location}
        </p>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="pin" className="mb-1 block text-sm font-medium">
              Syötä PIN-koodi
            </label>
            <input
              id="pin"
              type="text"
              inputMode="numeric"
              value={pin}
              onChange={(e) => setPin(e.target.value)}
              placeholder="PIN"
              className="w-full rounded-lg border border-gray-300 px-4 py-3 text-center text-2xl tracking-widest focus:border-black focus:outline-none"
              autoFocus
            />
          </div>
          {error && (
            <p className="text-center text-sm text-red-600">{error}</p>
          )}
          <button
            type="submit"
            disabled={loading || !pin}
            className="w-full rounded-lg bg-black py-3 text-white font-medium disabled:opacity-50"
          >
            {loading ? "Tarkistetaan..." : "Kirjaudu"}
          </button>
        </form>
      </div>
    </div>
  );
}

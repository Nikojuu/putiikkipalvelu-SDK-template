"use client";

import type { TicketEvent } from "@putiikkipalvelu/storefront-sdk";

interface EventListProps {
  events: TicketEvent[];
  onSelect: (event: TicketEvent) => void;
}

function formatDate(dateStr: string | null): string {
  if (!dateStr) return "";
  return new Date(dateStr).toLocaleDateString("fi-FI", {
    day: "numeric",
    month: "numeric",
    year: "numeric",
  });
}

export default function EventList({ events, onSelect }: EventListProps) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <h1 className="mb-6 text-center text-2xl font-bold">Lippuskanneri</h1>
        <p className="mb-4 text-center text-sm text-gray-500">
          Valitse tapahtuma
        </p>

        {events.length === 0 && (
          <p className="text-center text-sm text-gray-500">
            Ei tapahtumia joissa skannaus käytössä
          </p>
        )}

        <div className="space-y-2">
          {events.map((event) => (
            <button
              key={event.id}
              onClick={() => onSelect(event)}
              className="w-full rounded-lg border border-gray-200 p-4 text-left transition-colors hover:bg-gray-50"
            >
              <div className="font-medium">{event.name}</div>
              <div className="mt-1 text-sm text-gray-500">
                {event.location}
                {event.startDate && ` — ${formatDate(event.startDate)}`}
                {event.endDate && ` – ${formatDate(event.endDate)}`}
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

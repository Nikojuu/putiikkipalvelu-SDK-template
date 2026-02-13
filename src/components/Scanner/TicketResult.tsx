"use client";

import type { PurchasedTicket } from "@putiikkipalvelu/storefront-sdk";

interface TicketResultProps {
  success: boolean;
  message?: string;
  ticket: PurchasedTicket;
}

const statusLabels: Record<string, string> = {
  VALID: "Voimassa",
  USED: "Käytetty",
  EXPIRED: "Vanhentunut",
  CANCELLED: "Peruutettu",
};

function formatDate(dateStr: string | null): string {
  if (!dateStr) return "-";
  return new Date(dateStr).toLocaleDateString("fi-FI", {
    day: "numeric",
    month: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatPrice(cents: number | null): string {
  if (cents === null) return "-";
  return (cents / 100).toLocaleString("fi-FI", {
    style: "currency",
    currency: "EUR",
  });
}

export default function TicketResult({
  success,
  message,
  ticket,
}: TicketResultProps) {
  const borderColor = success ? "border-green-500" : "border-red-500";
  const bgColor = success ? "bg-green-50" : "bg-red-50";
  const statusColor = success ? "text-green-700" : "text-red-700";

  const usageText =
    ticket.maxUses === 0
      ? `${ticket.usedCount} (rajaton)`
      : `${ticket.usedCount} / ${ticket.maxUses}`;

  return (
    <div className={`rounded-lg border-2 ${borderColor} ${bgColor} p-4`}>
      {/* Status banner */}
      <div className={`mb-3 text-center text-lg font-bold ${statusColor}`}>
        {message || statusLabels[ticket.status] || ticket.status}
      </div>

      {/* Ticket info */}
      <div className="space-y-2 text-sm">
        {ticket.productName && (
          <Row label="Tuote" value={ticket.productName} />
        )}
        {ticket.eventName && (
          <Row label="Tapahtuma" value={ticket.eventName} />
        )}
        {ticket.eventDate && (
          <Row label="Päivämäärä" value={formatDate(ticket.eventDate)} />
        )}
        {(ticket.firstName || ticket.lastName) && (
          <Row label="Haltija" value={`${ticket.firstName ?? ""} ${ticket.lastName ?? ""}`.trim()} />
        )}
        <Row label="Sähköposti" value={ticket.customerEmail} />
        <Row label="Hinta" value={formatPrice(ticket.price)} />
        <Row label="Tila" value={statusLabels[ticket.status] || ticket.status} />
        <Row label="Käyttökerrat" value={usageText} />
        <Row label="Voimassa alkaen" value={formatDate(ticket.validFrom)} />
        <Row
          label="Voimassa asti"
          value={ticket.validUntil ? formatDate(ticket.validUntil) : "Ei päättymispäivää"}
        />
        {ticket.lastUsedAt && (
          <Row label="Viimeksi käytetty" value={formatDate(ticket.lastUsedAt)} />
        )}
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between">
      <span className="text-gray-600">{label}</span>
      <span className="font-medium">{value}</span>
    </div>
  );
}

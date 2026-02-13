"use client";

import { useState, useEffect } from "react";
import type { TicketEvent } from "@putiikkipalvelu/storefront-sdk";
import EventList from "./EventList";
import PinEntry from "./PinEntry";
import ScannerDashboard from "./ScannerDashboard";

interface ScannerSession {
  eventId: string;
  eventName: string;
}

interface TicketScannerProps {
  events: TicketEvent[];
}

export default function TicketScanner({ events }: TicketScannerProps) {
  const [session, setSession] = useState<ScannerSession | null>(null);
  const [selectedEvent, setSelectedEvent] = useState<TicketEvent | null>(null);

  useEffect(() => {
    const stored = sessionStorage.getItem("scanner-session");
    if (stored) {
      try {
        setSession(JSON.parse(stored));
      } catch {
        sessionStorage.removeItem("scanner-session");
      }
    }
  }, []);

  function handleEventSelect(event: TicketEvent) {
    setSelectedEvent(event);
  }

  function handlePinSuccess(event: TicketEvent) {
    const newSession = { eventId: event.id, eventName: event.name };
    sessionStorage.setItem("scanner-session", JSON.stringify(newSession));
    setSession(newSession);
    setSelectedEvent(null);
  }

  function handleBack() {
    setSelectedEvent(null);
  }

  function handleLogout() {
    sessionStorage.removeItem("scanner-session");
    setSession(null);
    setSelectedEvent(null);
  }

  return (
    <div className="fixed inset-0 z-50 bg-white overflow-auto">
      {session ? (
        <ScannerDashboard
          eventId={session.eventId}
          eventName={session.eventName}
          onLogout={handleLogout}
        />
      ) : selectedEvent ? (
        <PinEntry
          event={selectedEvent}
          onSuccess={handlePinSuccess}
          onBack={handleBack}
        />
      ) : (
        <EventList events={events} onSelect={handleEventSelect} />
      )}
    </div>
  );
}

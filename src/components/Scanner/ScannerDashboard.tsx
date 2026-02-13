"use client";

import { useState } from "react";
import UseTicketTab from "./UseTicketTab";
import CheckTicketTab from "./CheckTicketTab";

interface ScannerDashboardProps {
  eventId: string;
  eventName: string;
  onLogout: () => void;
}

export default function ScannerDashboard({
  eventId,
  eventName,
  onLogout,
}: ScannerDashboardProps) {
  const [activeTab, setActiveTab] = useState<"use" | "check">("use");

  return (
    <div className="flex min-h-screen flex-col">
      {/* Header */}
      <div className="flex items-center justify-between border-b px-4 py-3">
        <div>
          <h1 className="text-lg font-bold">{eventName}</h1>
          <p className="text-xs text-gray-500">Lippuskanneri</p>
        </div>
        <button
          onClick={onLogout}
          className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm"
        >
          Kirjaudu ulos
        </button>
      </div>

      {/* Tabs */}
      <div className="flex border-b">
        <button
          onClick={() => setActiveTab("use")}
          className={`flex-1 py-3 text-center text-sm font-medium ${
            activeTab === "use"
              ? "border-b-2 border-black text-black"
              : "text-gray-500"
          }`}
        >
          Käytä lippu
        </button>
        <button
          onClick={() => setActiveTab("check")}
          className={`flex-1 py-3 text-center text-sm font-medium ${
            activeTab === "check"
              ? "border-b-2 border-black text-black"
              : "text-gray-500"
          }`}
        >
          Tarkista lippu
        </button>
      </div>

      {/* Tab content */}
      <div className="flex-1">
        {activeTab === "use" ? (
          <UseTicketTab eventId={eventId} />
        ) : (
          <CheckTicketTab />
        )}
      </div>
    </div>
  );
}

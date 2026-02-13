"use client";

import { useState } from "react";
import dynamic from "next/dynamic";

const Scanner = dynamic(
  () => import("@yudiel/react-qr-scanner").then((mod) => mod.Scanner),
  { ssr: false }
);

interface QrScannerProps {
  onScan: (code: string) => void;
  paused?: boolean;
}

export default function QrScanner({ onScan, paused }: QrScannerProps) {
  const [error, setError] = useState("");

  return (
    <div className="relative">
      {error && (
        <div className="rounded-lg bg-red-50 p-4 text-center text-sm text-red-600">
          {error}
        </div>
      )}
      <div className="overflow-hidden rounded-lg">
        <Scanner
          onScan={(codes) => {
            if (codes.length > 0 && codes[0].rawValue) {
              onScan(codes[0].rawValue);
            }
          }}
          onError={() => setError("Kameraa ei voitu avata")}
          constraints={{ facingMode: "environment" }}
          formats={["qr_code"]}
          paused={paused}
          scanDelay={1000}
          styles={{ container: { width: "100%" } }}
        />
      </div>
    </div>
  );
}

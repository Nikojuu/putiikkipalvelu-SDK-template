"use client";

import { useMemo, useState } from "react";
import { ChevronLeft, ChevronRight, Clock, Diamond } from "lucide-react";
import { cn } from "@/lib/utils";

const WEEKDAYS = ["ma", "ti", "ke", "to", "pe", "la", "su"];
const MONTH_NAMES = [
  "Tammikuu",
  "Helmikuu",
  "Maaliskuu",
  "Huhtikuu",
  "Toukokuu",
  "Kesäkuu",
  "Heinäkuu",
  "Elokuu",
  "Syyskuu",
  "Lokakuu",
  "Marraskuu",
  "Joulukuu",
];

interface OpeningHoursCalendarProps {
  title?: string;
  days: Record<string, { open: string; close: string; note?: string }>;
}

export default function OpeningHoursCalendar({
  title,
  days,
}: OpeningHoursCalendarProps) {
  const today = useMemo(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
  }, []);

  const initialMonth = useMemo(() => {
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth() + 1;

    const keys = Object.keys(days);
    if (keys.length === 0) {
      return { year: currentYear, month: currentMonth };
    }

    const currentPrefix = `${currentYear}-${String(currentMonth).padStart(2, "0")}`;
    if (keys.some((k) => k.startsWith(currentPrefix))) {
      return { year: currentYear, month: currentMonth };
    }

    const months = [...new Set(keys.map((k) => k.slice(0, 7)))].sort();
    const futureMonth = months.find((m) => m > currentPrefix);
    if (futureMonth) {
      const [y, m] = futureMonth.split("-").map(Number);
      return { year: y, month: m };
    }

    const pastMonth = months[months.length - 1];
    const [y, m] = pastMonth.split("-").map(Number);
    return { year: y, month: m };
  }, [days]);

  const [year, setYear] = useState(initialMonth.year);
  const [month, setMonth] = useState(initialMonth.month);
  const [hoveredDay, setHoveredDay] = useState<string | null>(null);

  function goNext() {
    if (month === 12) {
      setMonth(1);
      setYear((y) => y + 1);
    } else {
      setMonth((m) => m + 1);
    }
  }

  function goPrev() {
    if (month === 1) {
      setMonth(12);
      setYear((y) => y - 1);
    } else {
      setMonth((m) => m - 1);
    }
  }

  const cells = useMemo(() => {
    const firstDay = new Date(year, month - 1, 1);
    const daysInMonth = new Date(year, month, 0).getDate();
    const startOffset = (firstDay.getDay() + 6) % 7;

    const result: (number | null)[] = [];
    for (let i = 0; i < startOffset; i++) result.push(null);
    for (let d = 1; d <= daysInMonth; d++) result.push(d);
    while (result.length % 7 !== 0) result.push(null);
    return result;
  }, [year, month]);

  const openDaysCount = useMemo(() => {
    const prefix = `${year}-${String(month).padStart(2, "0")}`;
    return Object.keys(days).filter((k) => k.startsWith(prefix)).length;
  }, [days, year, month]);

  if (Object.keys(days).length === 0) {
    return (
      <div className="px-8 py-12 text-center">
        {title && (
          <h2 className="font-primary text-xl font-bold mb-4 text-charcoal">
            {title}
          </h2>
        )}
        <p className="text-sm text-charcoal/50">Ei aukioloaikoja asetettu.</p>
      </div>
    );
  }

  return (
    <div className="group/cal relative max-w-2xl mx-auto px-10 py-12">
      {/* Corner accents */}
      <div className="absolute top-0 left-0 w-10 h-10 border-l border-t border-rose-gold/25 transition-all duration-500 group-hover/cal:w-14 group-hover/cal:h-14 group-hover/cal:border-rose-gold/40" />
      <div className="absolute top-0 right-0 w-10 h-10 border-r border-t border-rose-gold/25 transition-all duration-500 group-hover/cal:w-14 group-hover/cal:h-14 group-hover/cal:border-rose-gold/40" />
      <div className="absolute bottom-0 left-0 w-10 h-10 border-l border-b border-rose-gold/25 transition-all duration-500 group-hover/cal:w-14 group-hover/cal:h-14 group-hover/cal:border-rose-gold/40" />
      <div className="absolute bottom-0 right-0 w-10 h-10 border-r border-b border-rose-gold/25 transition-all duration-500 group-hover/cal:w-14 group-hover/cal:h-14 group-hover/cal:border-rose-gold/40" />

      {/* Title */}
      {title && (
        <div className="text-center mb-8">
          <h2 className="font-primary text-3xl font-bold text-charcoal tracking-wide">
            {title}
          </h2>
          <div className="flex items-center justify-center gap-4 mt-3">
            <div className="h-px w-16 bg-gradient-to-r from-transparent to-rose-gold/40" />
            <Diamond className="h-3.5 w-3.5 text-rose-gold/50 rotate-0" />
            <div className="h-px w-16 bg-gradient-to-l from-transparent to-rose-gold/40" />
          </div>
        </div>
      )}

      {/* Month navigation */}
      <div className="flex items-center justify-between mb-5">
        <button
          onClick={goPrev}
          className="p-3 border border-rose-gold/15 hover:border-rose-gold/40 hover:bg-soft-blush/40 transition-all duration-300"
          aria-label="Edellinen kuukausi"
        >
          <ChevronLeft className="h-6 w-6 text-charcoal/50" />
        </button>

        <div className="text-center">
          <span className="font-primary text-xl font-semibold text-charcoal tracking-wider uppercase">
            {MONTH_NAMES[month - 1]}
          </span>
          <span className="text-charcoal/40 text-lg ml-2.5 font-secondary">
            {year}
          </span>
        </div>

        <button
          onClick={goNext}
          className="p-3 border border-rose-gold/15 hover:border-rose-gold/40 hover:bg-soft-blush/40 transition-all duration-300"
          aria-label="Seuraava kuukausi"
        >
          <ChevronRight className="h-6 w-6 text-charcoal/50" />
        </button>
      </div>

      {/* Weekday header */}
      <div className="grid grid-cols-7 mb-1.5">
        {WEEKDAYS.map((wd) => (
          <div
            key={wd}
            className="text-sm font-semibold text-center text-rose-gold/70 uppercase tracking-widest py-3"
          >
            {wd}
          </div>
        ))}
      </div>

      {/* Divider */}
      <div className="h-px bg-gradient-to-r from-transparent via-rose-gold/30 to-transparent mb-1.5" />

      {/* Calendar grid */}
      <div className="grid grid-cols-7 gap-px bg-rose-gold/[0.07]">
        {cells.map((day, i) => {
          if (day === null) {
            return (
              <div
                key={`empty-${i}`}
                className="bg-warm-white min-h-[5rem]"
              />
            );
          }

          const dateStr = `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
          const entry = days[dateStr];
          const isOpen = !!entry;
          const isToday = dateStr === today;
          const isHovered = hoveredDay === dateStr;
          const hasNote = entry?.note;

          return (
            <div
              key={dateStr}
              className={cn(
                "relative min-h-[5rem] px-1.5 py-2.5 flex flex-col items-center justify-start transition-all duration-300 cursor-default",
                isOpen
                  ? hasNote
                    ? "bg-amber-50/80"
                    : "bg-emerald-50/80"
                  : "bg-warm-white",
                isOpen && !hasNote && "hover:bg-emerald-100/70",
                isOpen && hasNote && "hover:bg-amber-100/60",
                isToday && "ring-1 ring-inset ring-rose-gold/50"
              )}
              onMouseEnter={() => isOpen && setHoveredDay(dateStr)}
              onMouseLeave={() => setHoveredDay(null)}
            >
              {/* Today indicator dot */}
              {isToday && (
                <div className="absolute top-1 right-1 w-2 h-2 rounded-full bg-rose-gold/60" />
              )}

              {/* Day number */}
              <span
                className={cn(
                  "text-base leading-none font-semibold transition-colors duration-200",
                  isOpen
                    ? hasNote
                      ? "text-amber-800"
                      : "text-emerald-800"
                    : "text-charcoal/25",
                  isToday && "text-rose-gold"
                )}
              >
                {day}
              </span>

              {/* Opening hours */}
              {entry && (
                <>
                  <span
                    className={cn(
                      "text-xs leading-tight mt-2 whitespace-nowrap font-medium transition-colors duration-200",
                      hasNote
                        ? "text-amber-700/70"
                        : "text-emerald-700/70"
                    )}
                  >
                    {entry.open}–{entry.close}
                  </span>
                  {hasNote && (
                    <span className="text-[10px] leading-tight mt-1 text-amber-700/60 text-center line-clamp-2 px-0.5 font-medium">
                      {entry.note}
                    </span>
                  )}
                </>
              )}

              {/* Hover shimmer */}
              {isOpen && isHovered && (
                <div className={cn(
                  "absolute inset-0 pointer-events-none",
                  hasNote
                    ? "bg-gradient-to-br from-amber-200/10 to-amber-100/10"
                    : "bg-gradient-to-br from-emerald-200/10 to-emerald-100/10"
                )} />
              )}
            </div>
          );
        })}
      </div>

      {/* Bottom divider */}
      <div className="h-px bg-gradient-to-r from-transparent via-rose-gold/30 to-transparent mt-1" />

      {/* Footer */}
      <div className="flex items-center justify-center gap-2.5 mt-6">
        <Clock className="h-4 w-4 text-rose-gold/40" />
        <p className="text-sm text-charcoal/45 font-secondary tracking-wide">
          {openDaysCount > 0
            ? `${openDaysCount} aukiolopäivää tässä kuussa`
            : "Ei aukiolopäiviä tässä kuussa"}
        </p>
      </div>

      {/* Legend */}
      <div className="flex items-center justify-center gap-6 mt-4">
        <div className="flex items-center gap-2">
          <div className="w-3.5 h-3.5 bg-emerald-50 border border-emerald-200/60" />
          <span className="text-xs text-charcoal/45 font-secondary">Avoinna</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3.5 h-3.5 bg-amber-50 border border-amber-200/60" />
          <span className="text-xs text-charcoal/45 font-secondary">Poikkeava</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded-full bg-rose-gold/60" />
          <span className="text-xs text-charcoal/45 font-secondary">Tänään</span>
        </div>
      </div>
    </div>
  );
}

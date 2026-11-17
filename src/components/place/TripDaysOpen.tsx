"use client";

import type { Place } from "@/types";
import { useHydrated } from "@/lib/hooks/useHydrated";
import { useItinerary } from "@/lib/store/useTripStore";
import { formatDateKo } from "@/lib/time/dates";
import { formatRanges, isOpenOnDate, rangesOn } from "@/lib/time/openingHours";
import { cn } from "@/lib/utils";

/** 내 여행 날짜별 영업 여부 — 한눈에 비교 */
export function TripDaysOpen({ place, compact }: { place: Place; compact?: boolean }) {
  const hydrated = useHydrated();
  const { itinerary } = useItinerary(place.cityId);
  if (!hydrated || !itinerary) return null;

  if (compact)
    return (
      <span className="flex items-center gap-1" aria-label="여행 날짜별 영업 여부">
        {itinerary.days.map((d) => {
          const open = isOpenOnDate(place.openingHours, d.date);
          return (
            <span
              key={d.date}
              title={`${formatDateKo(d.date)} ${open ? "영업" : "휴무"}`}
              className={cn("flex h-5 min-w-5 items-center justify-center rounded px-1 text-[10px] font-bold", open ? "bg-success/12 text-success" : "bg-danger/12 text-danger line-through")}
            >
              {d.date.slice(8).replace(/^0/, "")}
            </span>
          );
        })}
      </span>
    );

  return (
    <ul className="grid grid-cols-2 gap-2 sm:grid-cols-4">
      {itinerary.days.map((d, i) => {
        const open = isOpenOnDate(place.openingHours, d.date);
        return (
          <li key={d.date} className={cn("rounded-xl border px-3 py-2.5", open ? "bg-card" : "border-danger/30 bg-danger/5")}>
            <p className="text-xs text-muted-foreground">
              Day {i + 1} · {formatDateKo(d.date)}
            </p>
            <p className={cn("text-sm font-semibold", open ? "text-success" : "text-danger")}>
              {open ? (place.openingHours.alwaysOpen ? "상시 개방" : formatRanges(rangesOn(place.openingHours, d.date))) : "휴무"}
            </p>
          </li>
        );
      })}
    </ul>
  );
}

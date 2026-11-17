"use client";

import Link from "next/link";
import { useState } from "react";
import { CalendarPlus, Check } from "lucide-react";
import type { Place } from "@/types";
import { Button } from "@/components/ui/button";
import { useHydrated } from "@/lib/hooks/useHydrated";
import { useItinerary, useTripStore } from "@/lib/store/useTripStore";
import { formatDateKo } from "@/lib/time/dates";
import { isOpenOnDate } from "@/lib/time/openingHours";
import { cn } from "@/lib/utils";

/** 날짜 선택 + 일정에 추가. 휴무일은 선택지에 표시 */
export function AddToItinerary({ place, className }: { place: Place; className?: string }) {
  const hydrated = useHydrated();
  const { itinerary } = useItinerary(place.cityId);
  const addToDay = useTripStore((s) => s.addToDay);
  const [date, setDate] = useState("");
  const [added, setAdded] = useState<string | null>(null);

  if (!hydrated || !itinerary) return <div className={cn("h-11", className)} />;
  const firstOpen = itinerary.days.find((d) => isOpenOnDate(place.openingHours, d.date))?.date;
  const selected = date || firstOpen || itinerary.days[0]?.date || "";
  const already = itinerary.days.find((d) => d.date === selected)?.items.some((i) => i.placeId === place.id);
  const closed = selected && !isOpenOnDate(place.openingHours, selected);
  const done = already || added === selected;

  return (
    <div className={cn("space-y-1.5", className)}>
      <div className="flex gap-2">
        <label className="min-w-0 flex-1">
          <span className="sr-only">일정 날짜 선택</span>
          <select
            value={selected}
            onChange={(e) => setDate(e.target.value)}
            className="h-11 w-full rounded-full border bg-card px-4 text-sm font-medium"
          >
            {itinerary.days.map((d, i) => (
              <option key={d.date} value={d.date}>
                Day {i + 1} · {formatDateKo(d.date)}
                {isOpenOnDate(place.openingHours, d.date) ? "" : " (휴무)"}
              </option>
            ))}
          </select>
        </label>
        <Button
          disabled={done}
          onClick={() => {
            addToDay(place.cityId, selected, place.id);
            setAdded(selected);
          }}
          className="shrink-0"
        >
          {done ? <Check /> : <CalendarPlus />}
          {done ? "추가됨" : "일정에 추가"}
        </Button>
      </div>
      {closed && <p className="text-xs font-medium text-danger">이 날은 휴무입니다 — 다른 날을 선택하세요.</p>}
      {done && !closed && (
        <p className="text-xs text-muted-foreground">
          <Link href={`/${place.cityId}/itinerary`} className="font-semibold text-secondary underline underline-offset-2">
            일정에서 확인
          </Link>
          하면 이동시간과 순서가 자동 계산됩니다.
        </p>
      )}
    </div>
  );
}

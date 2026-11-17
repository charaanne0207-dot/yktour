"use client";

import Link from "next/link";
import { ArrowRight, Heart } from "lucide-react";
import type { CityId } from "@/types";
import { useHydrated } from "@/lib/hooks/useHydrated";
import { useTripStore } from "@/lib/store/useTripStore";

/** 저장한 장소가 있으면 하단에 '일정 만들기' 바로가기 (탐색 → 저장 → 일정 최소 동선) */
export function SavedCta({ cityId }: { cityId: CityId }) {
  const hydrated = useHydrated();
  const count = useTripStore((s) => Object.values(s.saved).filter((x) => x.cityId === cityId).length);
  const hasPlan = useTripStore((s) => (s.itineraries[cityId]?.days ?? []).some((d) => d.items.length));
  if (!hydrated || count === 0) return null;
  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-[calc(68px+env(safe-area-inset-bottom))] z-30 flex justify-center px-4 md:bottom-6 md:left-64">
      <Link
        href={`/${cityId}/itinerary`}
        className="pointer-events-auto flex h-12 items-center gap-3 rounded-full bg-foreground pl-4 pr-5 text-sm font-semibold text-background shadow-lg transition-transform active:scale-[0.98]"
      >
        <span className="flex items-center gap-1.5">
          <Heart className="size-4 fill-current text-primary" aria-hidden /> {count}곳 저장
        </span>
        <span className="h-4 w-px bg-background/30" aria-hidden />
        <span className="flex items-center gap-1">
          {hasPlan ? "일정 보기" : "일정 만들기"} <ArrowRight className="size-4" aria-hidden />
        </span>
      </Link>
    </div>
  );
}

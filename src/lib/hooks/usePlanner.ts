"use client";

import { useCallback, useMemo } from "react";
import type { City, Place } from "@/types";
import { getCityPlaces, getPlaceById } from "@/data/cities";
import { generateItinerary, PACE_CAPACITY, type Candidate } from "@/lib/engine/generate";
import { rankPlaces } from "@/lib/engine/recommend";
import { simulateDay, type TimelineContext } from "@/lib/engine/timeline";
import { useItinerary, useTripStore } from "@/lib/store/useTripStore";

/** 도시별 일정 계산 컨텍스트 + 생성/재계산 함수 */
export function usePlanner(city: City) {
  const { leg, itinerary } = useItinerary(city.id);
  const prefs = useTripStore((s) => s.trip.prefs);
  const saved = useTripStore((s) => s.saved);
  const setItinerary = useTripStore((s) => s.setItinerary);
  const lodging = leg?.lodging;

  const ctx: TimelineContext = useMemo(
    () => ({
      getPlace: getPlaceById,
      lodging,
      cityCenter: city.center,
      timezone: city.timezone,
      dayStart: prefs.dayStart,
      dayEnd: prefs.dayEnd,
    }),
    [lodging, city, prefs.dayStart, prefs.dayEnd],
  );

  /** 재계산: 일정이 바뀔 때마다 타임라인을 다시 시뮬레이션 */
  const timelines = useMemo(() => itinerary?.days.map((d) => simulateDay(d, ctx)) ?? [], [itinerary, ctx]);

  const savedHere = useMemo(() => Object.values(saved).filter((s) => s.cityId === city.id), [saved, city.id]);

  const generate = useCallback(
    (opts: { fillWithRecommendations: boolean }) => {
      if (!itinerary) return { added: 0 };
      const dates = itinerary.days.map((d) => d.date);
      const all = getCityPlaces(city.id);
      const ranked = rankPlaces(all, prefs, lodging);
      const scoreOf = new Map(ranked.map((r) => [r.place.id, r.score]));

      const candidates: Candidate[] = savedHere
        .map((s) => getPlaceById(s.placeId))
        .filter((p): p is Place => Boolean(p))
        .map((p) => ({ place: p, must: Boolean(saved[p.id]?.mustVisit), score: scoreOf.get(p.id) ?? 0 }));

      if (opts.fillWithRecommendations) {
        const sightTarget = dates.length * PACE_CAPACITY[prefs.pace];
        const foodTarget = dates.length * 2;
        const have = new Set(candidates.map((c) => c.place.id));
        let sights = candidates.filter((c) => c.place.category !== "food").length;
        let foods = candidates.length - sights;
        for (const r of ranked) {
          if (have.has(r.place.id)) continue;
          const isFood = r.place.category === "food";
          if (isFood ? foods >= foodTarget : sights >= sightTarget) continue;
          candidates.push({ place: r.place, must: false, score: r.score });
          if (isFood) foods++;
          else sights++;
        }
      }

      // 기존 예약(고정 시각)은 날짜와 함께 유지
      const bookings: Record<string, { date: string; time: string }> = {};
      itinerary.days.forEach((d) =>
        d.items.forEach((i) => {
          if (i.placeId && i.fixedTime) bookings[i.placeId] = { date: d.date, time: i.fixedTime };
        }),
      );
      const rainyDates = itinerary.days.filter((d) => d.rainy).map((d) => d.date);

      const res = generateItinerary({
        cityId: city.id,
        dates,
        candidates,
        pace: prefs.pace,
        lodging,
        rainyDates,
        bookings,
        ctx,
      });
      setItinerary(city.id, res.itinerary, res.unscheduled);
      return { added: candidates.length - res.unscheduled.length };
    },
    [itinerary, city.id, prefs, lodging, savedHere, saved, ctx, setItinerary],
  );

  return { leg, itinerary, prefs, ctx, timelines, generate, savedCount: savedHere.length };
}

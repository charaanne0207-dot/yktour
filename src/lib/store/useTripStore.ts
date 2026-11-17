"use client";

import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import type { CityId, Itinerary, ItineraryItem, Lodging, Place, Preferences, SavedPlace, Trip, TripLeg } from "@/types";
import type { Unscheduled } from "@/lib/engine/generate";
import { dateRange } from "@/lib/time/dates";
import { uid } from "@/lib/utils";

/** Local Storage 키 — 스키마 변경 시 version 을 올리고 migrate 추가 */
export const STORAGE_KEY = "ciao-ai:v1";
const VERSION = 2;

export const DEFAULT_PREFS: Preferences = { interests: [], pace: "normal", budget: 2, dayStart: "09:00", dayEnd: "21:30" };

const DEFAULT_TRIP: Trip = {
  id: "default",
  legs: [{ cityId: "rome", startDate: "2027-01-28", endDate: "2027-01-31" }],
  prefs: DEFAULT_PREFS,
};

type Items = ItineraryItem[];

interface TripState {
  trip: Trip;
  onboarded: boolean;
  saved: Record<string, SavedPlace>;
  itineraries: Partial<Record<CityId, Itinerary>>;
  unscheduled: Partial<Record<CityId, Unscheduled[]>>;

  // 설정
  setPrefs: (p: Partial<Preferences>) => void;
  setLegDates: (cityId: CityId, startDate: string, endDate: string) => void;
  setLodging: (cityId: CityId, lodging: Lodging | undefined) => void;
  completeOnboarding: () => void;

  // 저장 장소
  toggleSaved: (place: Place) => void;
  toggleMustVisit: (place: Place) => void;
  removeSaved: (placeId: string) => void;
  setSavedNote: (placeId: string, note: string) => void;

  // 일정
  setItinerary: (cityId: CityId, it: Itinerary, unscheduled: Unscheduled[]) => void;
  addToDay: (cityId: CityId, date: string, placeId: string) => void;
  addMeal: (cityId: CityId, date: string, meal: "lunch" | "dinner") => void;
  removeFromDay: (cityId: CityId, date: string, itemId: string) => void;
  moveItem: (cityId: CityId, date: string, itemId: string, dir: -1 | 1) => void;
  moveToDay: (cityId: CityId, from: string, itemId: string, to: string) => void;
  replaceItemPlace: (cityId: CityId, date: string, itemId: string, placeId: string) => void;
  setFixedTime: (cityId: CityId, date: string, itemId: string, time: string) => void;
  toggleRainy: (cityId: CityId, date: string) => void;
  clearItinerary: (cityId: CityId) => void;

  // 백업
  exportData: () => string;
  importData: (json: string) => void;
  reset: () => void;
}

const now = () => new Date().toISOString();

function buildItinerary(leg: TripLeg, prev?: Itinerary): Itinerary {
  const byDate = new Map(prev?.days.map((d) => [d.date, d]));
  return {
    cityId: leg.cityId,
    days: dateRange(leg.startDate, leg.endDate).map((date) => byDate.get(date) ?? { date, items: [] }),
    updatedAt: now(),
  };
}

export const useTripStore = create<TripState>()(
  persist(
    (set, get) => {
      const updateItinerary = (cityId: CityId, fn: (it: Itinerary) => Itinerary) => {
        const leg = get().trip.legs.find((l) => l.cityId === cityId);
        if (!leg) return;
        const current = get().itineraries[cityId] ?? buildItinerary(leg);
        set({ itineraries: { ...get().itineraries, [cityId]: { ...fn(current), updatedAt: now() } } });
      };
      const mapDay = (cityId: CityId, date: string, fn: (items: Items) => Items) =>
        updateItinerary(cityId, (it) => ({
          ...it,
          days: it.days.map((d) => (d.date === date ? { ...d, items: fn(d.items) } : d)),
        }));
      const updateLeg = (cityId: CityId, patch: Partial<TripLeg>) => {
        const exists = get().trip.legs.some((l) => l.cityId === cityId);
        const legs = exists
          ? get().trip.legs.map((l) => (l.cityId === cityId ? { ...l, ...patch } : l))
          : [...get().trip.legs, { cityId, startDate: "2027-01-28", endDate: "2027-01-31", ...patch }];
        set({ trip: { ...get().trip, legs } });
        return legs.find((l) => l.cityId === cityId)!;
      };

      return {
        trip: DEFAULT_TRIP,
        onboarded: false,
        saved: {},
        itineraries: {},
        unscheduled: {},

        setPrefs: (p) => set({ trip: { ...get().trip, prefs: { ...get().trip.prefs, ...p } } }),
        setLegDates: (cityId, startDate, endDate) => {
          if (!startDate || !endDate || startDate > endDate) return;
          const leg = updateLeg(cityId, { startDate, endDate });
          set({ itineraries: { ...get().itineraries, [cityId]: buildItinerary(leg, get().itineraries[cityId]) } });
        },
        setLodging: (cityId, lodging) => void updateLeg(cityId, { lodging }),
        completeOnboarding: () => set({ onboarded: true }),

        toggleSaved: (place) => {
          const saved = { ...get().saved };
          if (saved[place.id]) delete saved[place.id];
          else saved[place.id] = { placeId: place.id, cityId: place.cityId, savedAt: now(), mustVisit: false };
          set({ saved });
        },
        toggleMustVisit: (place) => {
          const cur = get().saved[place.id];
          const next: SavedPlace = cur
            ? { ...cur, mustVisit: !cur.mustVisit }
            : { placeId: place.id, cityId: place.cityId, savedAt: now(), mustVisit: true };
          set({ saved: { ...get().saved, [place.id]: next } });
        },
        removeSaved: (placeId) => {
          const saved = { ...get().saved };
          delete saved[placeId];
          set({ saved });
        },
        setSavedNote: (placeId, note) => {
          const cur = get().saved[placeId];
          if (cur) set({ saved: { ...get().saved, [placeId]: { ...cur, note } } });
        },

        setItinerary: (cityId, it, unscheduled) =>
          set({ itineraries: { ...get().itineraries, [cityId]: it }, unscheduled: { ...get().unscheduled, [cityId]: unscheduled } }),
        addToDay: (cityId, date, placeId) => mapDay(cityId, date, (items) => [...items, { id: uid(), kind: "place", placeId }]),
        addMeal: (cityId, date, meal) => mapDay(cityId, date, (items) => [...items, { id: uid(), kind: "meal", meal }]),
        removeFromDay: (cityId, date, itemId) => mapDay(cityId, date, (items) => items.filter((i) => i.id !== itemId)),
        moveItem: (cityId, date, itemId, dir) =>
          mapDay(cityId, date, (items) => {
            const i = items.findIndex((x) => x.id === itemId);
            const j = i + dir;
            if (i < 0 || j < 0 || j >= items.length) return items;
            const copy = [...items];
            [copy[i], copy[j]] = [copy[j], copy[i]];
            return copy;
          }),
        moveToDay: (cityId, from, itemId, to) =>
          updateItinerary(cityId, (it) => {
            const item = it.days.find((d) => d.date === from)?.items.find((i) => i.id === itemId);
            if (!item || from === to) return it;
            return {
              ...it,
              days: it.days.map((d) =>
                d.date === from
                  ? { ...d, items: d.items.filter((i) => i.id !== itemId) }
                  : d.date === to
                    ? { ...d, items: [...d.items, { ...item, fixedTime: undefined }] }
                    : d,
              ),
            };
          }),
        replaceItemPlace: (cityId, date, itemId, placeId) =>
          mapDay(cityId, date, (items) =>
            items.map((i) =>
              i.id === itemId
                ? { id: i.id, kind: "place", placeId, note: i.kind === "meal" ? i.meal : i.note }
                : i,
            ),
          ),
        setFixedTime: (cityId, date, itemId, time) =>
          mapDay(cityId, date, (items) => items.map((x) => (x.id === itemId ? { ...x, fixedTime: time || undefined } : x))),
        toggleRainy: (cityId, date) =>
          updateItinerary(cityId, (it) => ({ ...it, days: it.days.map((d) => (d.date === date ? { ...d, rainy: !d.rainy || undefined } : d)) })),
        clearItinerary: (cityId) => {
          const leg = get().trip.legs.find((l) => l.cityId === cityId);
          if (!leg) return;
          const empty = buildItinerary(leg);
          set({ itineraries: { ...get().itineraries, [cityId]: { ...empty, days: empty.days.map((d) => ({ date: d.date, items: [] })) } }, unscheduled: { ...get().unscheduled, [cityId]: [] } });
        },

        exportData: () => {
          const { trip, saved, itineraries, onboarded } = get();
          return JSON.stringify({ app: "ciao-ai", version: VERSION, exportedAt: now(), trip, saved, itineraries, onboarded }, null, 2);
        },
        importData: (json) => {
          const data = JSON.parse(json);
          if (data?.app !== "ciao-ai" || !data.trip) throw new Error("Ciao, AI! 백업 파일이 아닙니다.");
          const migrated = migrate(data, data.version ?? 1);
          set({ trip: migrated.trip, saved: migrated.saved ?? {}, itineraries: migrated.itineraries ?? {}, onboarded: Boolean(migrated.onboarded), unscheduled: {} });
        },
        reset: () => set({ trip: DEFAULT_TRIP, saved: {}, itineraries: {}, unscheduled: {}, onboarded: false }),
      };
    },
    {
      name: STORAGE_KEY,
      version: VERSION,
      storage: createJSONStorage(() => localStorage),
      partialize: ({ trip, saved, itineraries, unscheduled, onboarded }) => ({ trip, saved, itineraries, unscheduled, onboarded }),
      migrate: (state, version) => migrate(state as Record<string, never>, version) as never,
    },
  ),
);

/** v1 → v2: 일정 항목 startTime → fixedTime, kind 추가 / 취향 기본값 병합 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function migrate(s: any, version: number) {
  if (version < 2 && s) {
    s.trip = { ...s.trip, prefs: { ...DEFAULT_PREFS, ...(s.trip?.prefs ?? {}) } };
    for (const it of Object.values(s.itineraries ?? {}) as Itinerary[]) {
      for (const d of it.days) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        d.items = d.items.map((i: any) => ({ id: i.id, kind: "place", placeId: i.placeId, fixedTime: i.startTime }));
      }
    }
  }
  return s;
}

/** 현재 도시의 일정 (없으면 구간 날짜로 빈 일정 생성) */
export function useItinerary(cityId: CityId): { leg?: TripLeg; itinerary?: Itinerary } {
  const leg = useTripStore((s) => s.trip.legs.find((l) => l.cityId === cityId));
  const stored = useTripStore((s) => s.itineraries[cityId]);
  return { leg, itinerary: stored ?? (leg ? emptyFor(leg) : undefined) };
}

const emptyCache = new Map<string, Itinerary>();
function emptyFor(leg: TripLeg): Itinerary {
  const key = `${leg.cityId}:${leg.startDate}:${leg.endDate}`;
  if (!emptyCache.has(key)) emptyCache.set(key, buildItinerary(leg));
  return emptyCache.get(key)!;
}

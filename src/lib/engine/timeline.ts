// 일자별 타임라인 시뮬레이션 — 일정이 바뀔 때마다 호출되는 "재계산" (순수 함수)
import type { ItineraryDay, ItineraryItem, LatLng, Place } from "@/types";
import { rangesOn } from "@/lib/time/openingHours";
import { hhmmToMin, sunTimes } from "@/lib/time/sun";
import { estimateTravel, type TravelEstimate } from "./geo";

export type WarningCode =
  | "closed_day"
  | "arrive_after_close"
  | "ends_after_close"
  | "too_short"
  | "long_wait"
  | "booking_late"
  | "booking_missing"
  | "after_sunset"
  | "rain_outdoor"
  | "late_lunch"
  | "over_day_end"
  | "duplicate";

export interface Warning {
  code: WarningCode;
  level: "error" | "warn" | "info";
  message: string;
}

export interface TimelineEntry {
  item: ItineraryItem;
  place?: Place;
  travel?: TravelEstimate;
  arrive: number; // 분 (자정 기준)
  start: number;
  end: number;
  warnings: Warning[];
}

export interface DayTimeline {
  date: string;
  sunset: string;
  entries: TimelineEntry[];
  returnTravel?: TravelEstimate;
  endAt: number;
  travelMinutes: number;
  walkMeters: number;
  warnings: Warning[];
}

export interface TimelineContext {
  getPlace: (id: string) => Place | undefined;
  lodging?: LatLng;
  cityCenter: LatLng;
  timezone: string;
  dayStart: string;
  dayEnd: string;
}

export const MEAL = {
  lunch: { earliest: hhmmToMin("12:15"), latest: hhmmToMin("14:30"), duration: 75, label: "점심" },
  dinner: { earliest: hhmmToMin("19:15"), latest: hhmmToMin("21:30"), duration: 90, label: "저녁" },
} as const;

const fmt = (m: number) => `${String(Math.floor(m / 60)).padStart(2, "0")}:${String(m % 60).padStart(2, "0")}`;

export function simulateDay(day: ItineraryDay, ctx: TimelineContext): DayTimeline {
  const sunset = sunTimes(day.date, ctx.cityCenter, ctx.timezone).sunset;
  const sunsetMin = hhmmToMin(sunset);
  let t = hhmmToMin(ctx.dayStart);
  let pos: LatLng | undefined = ctx.lodging;
  let travelMinutes = 0;
  let walkMeters = 0;
  const seen = new Set<string>();
  const entries: TimelineEntry[] = [];

  for (const item of day.items) {
    const warnings: Warning[] = [];

    if (item.kind === "meal") {
      const m = MEAL[item.meal ?? "lunch"];
      const start = Math.max(t, item.fixedTime ? hhmmToMin(item.fixedTime) : m.earliest);
      if (start > m.latest) warnings.push({ code: "late_lunch", level: "warn", message: `${m.label} 시작이 ${fmt(start)}로 늦습니다` });
      entries.push({ item, arrive: t, start, end: start + m.duration, warnings });
      t = start + m.duration;
      continue;
    }

    const place = item.placeId ? ctx.getPlace(item.placeId) : undefined;
    if (!place) {
      entries.push({ item, arrive: t, start: t, end: t, warnings });
      continue;
    }
    if (seen.has(place.id)) warnings.push({ code: "duplicate", level: "warn", message: "같은 날 중복된 장소입니다" });
    seen.add(place.id);

    const travel = pos ? estimateTravel(pos, place.location) : undefined;
    if (travel) {
      travelMinutes += travel.minutes;
      if (travel.mode === "walk") walkMeters += travel.meters;
    }
    const arrive = t + (travel?.minutes ?? 0);
    let start = arrive;
    const ranges = place.openingHours.alwaysOpen ? [] : rangesOn(place.openingHours, day.date);
    let closeAt: number | undefined;

    if (!place.openingHours.alwaysOpen) {
      if (!ranges.length) {
        warnings.push({ code: "closed_day", level: "error", message: "이 날은 휴무입니다" });
      } else {
        const slot = ranges
          .map((r) => ({ open: hhmmToMin(r.open), close: hhmmToMin(r.close) < hhmmToMin(r.open) ? 1440 : hhmmToMin(r.close) }))
          .find((r) => arrive < r.close);
        if (!slot) {
          warnings.push({ code: "arrive_after_close", level: "error", message: `도착(${fmt(arrive)}) 시 이미 영업 종료 (${ranges.at(-1)!.close})` });
        } else {
          if (arrive < slot.open) {
            start = slot.open;
            if (slot.open - arrive > 25) warnings.push({ code: "long_wait", level: "info", message: `오픈(${fmt(slot.open)})까지 ${slot.open - arrive}분 대기` });
          }
          closeAt = slot.close;
        }
      }
    }

    // 일몰 명소: 일몰 30분 전 도착이 되도록 대기 (최대 2시간 30분)
    if (place.bestTime === "sunset" && !item.fixedTime) {
      const ideal = sunsetMin - 30;
      if (start < ideal && ideal - start <= 150) {
        warnings.push({ code: "long_wait", level: "info", message: `일몰 감상을 위해 ${fmt(ideal)} 시작 (그 전 ${ideal - start}분 자유 시간)` });
        start = ideal;
      }
    }

    if (item.fixedTime) {
      const fixed = hhmmToMin(item.fixedTime);
      if (arrive > fixed) warnings.push({ code: "booking_late", level: "error", message: `예약 ${item.fixedTime}보다 ${arrive - fixed}분 늦게 도착` });
      start = Math.max(start, fixed);
    } else if (place.reservation.required === "yes") {
      warnings.push({ code: "booking_missing", level: "info", message: "예약 필수 — 예약 시각을 입력하면 일정이 맞춰집니다" });
    }

    const mealNote = item.note === "lunch" || item.note === "dinner" ? MEAL[item.note] : undefined;
    if (mealNote && start > mealNote.latest) {
      warnings.push({ code: "late_lunch", level: "warn", message: `${mealNote.label} 시작이 ${fmt(start)}로 늦습니다` });
    }

    const end = start + place.durationMin;
    if (closeAt !== undefined && end > closeAt) {
      const left = closeAt - start;
      if (left < place.durationMin / 2) {
        warnings.push({ code: "too_short", level: "error", message: `영업 종료(${fmt(closeAt)})까지 ${left}분 — 권장 ${place.durationMin}분의 절반 미만` });
      } else {
        warnings.push({ code: "ends_after_close", level: "warn", message: `관람 중 영업 종료(${fmt(closeAt)}) — 체류 ${left}분만 가능` });
      }
    }
    if (!place.indoor && place.bestTime !== "night" && place.bestTime !== "sunset" && start >= sunsetMin - 10) {
      warnings.push({ code: "after_sunset", level: "warn", message: `일몰(${sunset}) 이후 야외 방문 — 낮 시간으로 옮기세요` });
    }
    if (day.rainy && !place.indoor) warnings.push({ code: "rain_outdoor", level: "warn", message: "비 오는 날 야외 장소" });

    entries.push({ item, place, travel, arrive, start, end, warnings });
    t = end;
    pos = place.location;
  }

  const returnTravel = pos && ctx.lodging && pos !== ctx.lodging ? estimateTravel(pos, ctx.lodging) : undefined;
  if (returnTravel) {
    travelMinutes += returnTravel.minutes;
    if (returnTravel.mode === "walk") walkMeters += returnTravel.meters;
  }
  const endAt = t + (returnTravel?.minutes ?? 0);
  const warnings: Warning[] = [];
  if (endAt > hhmmToMin(ctx.dayEnd)) {
    warnings.push({ code: "over_day_end", level: "warn", message: `숙소 복귀 예상 ${fmt(endAt)} — 희망 종료(${ctx.dayEnd})를 넘습니다` });
  }
  return { date: day.date, sunset, entries, returnTravel, endAt, travelMinutes, walkMeters, warnings };
}

export const minutesToHHMM = fmt;

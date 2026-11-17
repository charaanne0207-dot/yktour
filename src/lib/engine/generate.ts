// 일정 자동 생성 (PRD F6) — 규칙 기반. LLM 미사용.
// 1) 후보 선정(필수 → 저장 → 추천 채우기) 2) 영업일·용량을 지키며 지역 클러스터로 일자 배정
// 3) 일자 내 순서: 아침형 → 근접 순회 → 일몰형 → 야간형, 영업 종료 충돌 시 앞당김 4) 점심·저녁 삽입
import type { Itinerary, ItineraryDay, ItineraryItem, LatLng, Pace, Place } from "@/types";
import { uid } from "@/lib/utils";
import { isOpenOnDate, rangesOn } from "@/lib/time/openingHours";
import { hhmmToMin } from "@/lib/time/sun";
import { centroid, distanceM } from "./geo";
import { MEAL, simulateDay, type TimelineContext } from "./timeline";

export const PACE_CAPACITY: Record<Pace, number> = { relaxed: 3, normal: 5, packed: 7 };

export interface Candidate {
  place: Place;
  must: boolean;
  score: number;
}

export interface GenerateInput {
  cityId: Itinerary["cityId"];
  dates: string[];
  candidates: Candidate[];
  pace: Pace;
  lodging?: LatLng;
  rainyDates?: string[];
  /** 기존 예약: placeId → { date, time } — 해당 날짜에 고정 */
  bookings?: Record<string, { date: string; time: string }>;
  ctx: TimelineContext;
}

export interface Unscheduled {
  placeId: string;
  reason: string;
}

export interface GenerateResult {
  itinerary: Itinerary;
  unscheduled: Unscheduled[];
}

const isFood = (p: Place) => p.category === "food";
const openAt = (p: Place, date: string, hhmm: string) => {
  if (p.openingHours.alwaysOpen) return true;
  const t = hhmmToMin(hhmm);
  return rangesOn(p.openingHours, date).some((r) => hhmmToMin(r.open) <= t && t < hhmmToMin(r.close));
};

export function generateItinerary(input: GenerateInput): GenerateResult {
  const { dates, pace, lodging, bookings = {} } = input;
  const rainy = new Set(input.rainyDates ?? []);
  const cap = PACE_CAPACITY[pace];
  const unscheduled: Unscheduled[] = [];
  const dayPlaces: Place[][] = dates.map(() => []);

  const sights = input.candidates.filter((c) => !isFood(c.place));
  const foods = input.candidates.filter((c) => isFood(c.place));

  // ── 1. 일자 배정 (관광·카페·쇼핑) ─────────────────────────────
  // 필수 우선, 그다음 가능한 날이 적은 장소 우선
  const feasible = (p: Place) => dates.map((d, i) => (isOpenOnDate(p.openingHours, d) ? i : -1)).filter((i) => i >= 0);
  const ordered = [...sights].sort(
    (a, b) => Number(b.must) - Number(a.must) || feasible(a.place).length - feasible(b.place).length || b.score - a.score,
  );

  const seeds = pickSeeds(ordered.map((c) => c.place.location), dates.length, lodging);
  const centers = [...seeds];

  for (let iter = 0; iter < 3; iter++) {
    dayPlaces.forEach((d) => (d.length = 0));
    const dropped: Unscheduled[] = [];
    for (const c of ordered) {
      const p = c.place;
      const booked = bookings[p.id];
      const bookedIdx = booked ? dates.indexOf(booked.date) : -1;
      if (bookedIdx >= 0) {
        dayPlaces[bookedIdx].push(p);
        continue;
      }
      const options = feasible(p);
      if (!options.length) {
        dropped.push({ placeId: p.id, reason: "여행 기간 중 모두 휴무" });
        continue;
      }
      const cost = (i: number) => distanceM(centers[i], p.location) + (rainy.has(dates[i]) && !p.indoor ? 3000 : 0);
      const withRoom = options.filter((i) => dayPlaces[i].length < cap).sort((a, b) => cost(a) - cost(b));
      if (withRoom.length) dayPlaces[withRoom[0]].push(p);
      else if (c.must) {
        // 필수 방문지는 용량을 초과해서라도 포함 (경고로 안내)
        dayPlaces[options.sort((a, b) => cost(a) - cost(b))[0]].push(p);
      } else dropped.push({ placeId: p.id, reason: "여행 페이스 기준 일정이 가득 참" });
    }
    if (iter === 2) unscheduled.push(...dropped);
    // 중심 재계산 (k-means 갱신)
    dayPlaces.forEach((ps, i) => {
      if (ps.length) centers[i] = centroid(ps.map((p) => p.location));
    });
  }

  // ── 2. 식당 배정: 하루 점심 1 + 저녁 1 ───────────────────────
  const meals: { lunch?: Place; dinner?: Place }[] = dates.map(() => ({}));
  const foodOrdered = [...foods].sort((a, b) => Number(b.must) - Number(a.must) || b.score - a.score);
  for (const c of foodOrdered) {
    const p = c.place;
    const slots: { i: number; meal: "lunch" | "dinner"; cost: number }[] = [];
    dates.forEach((d, i) => {
      for (const meal of ["lunch", "dinner"] as const) {
        if (meals[i][meal]) continue;
        if (!openAt(p, d, meal === "lunch" ? "13:00" : "20:00")) continue;
        slots.push({ i, meal, cost: distanceM(centers[i], p.location) });
      }
    });
    slots.sort((a, b) => a.cost - b.cost);
    if (slots[0]) meals[slots[0].i][slots[0].meal] = p;
    else unscheduled.push({ placeId: p.id, reason: "식사 시간대에 영업하는 날이 없음 또는 식사 슬롯 부족" });
  }

  // ── 3. 일자 내 순서 + 식사 삽입 ──────────────────────────────
  const days: ItineraryDay[] = dates.map((date, i) => {
    const day: ItineraryDay = { date, rainy: rainy.has(date) || undefined, items: [] };
    const order = orderDay(dayPlaces[i], lodging);
    day.items = order.map((p) => placeItem(p.id, bookings[p.id]?.date === date ? bookings[p.id].time : undefined));
    day.items = fixClosures(day, input.ctx);
    insertMeals(day, meals[i], input.ctx);
    day.items = fixClosures(day, input.ctx); // 식사 삽입 후 재조정
    // 그래도 영업 종료 후 도착하는 선택 장소는 제외하고 사유 기록 (필수는 유지 + 경고)
    const mustIds = new Set(input.candidates.filter((c) => c.must).map((c) => c.place.id));
    const tl = simulateDay(day, input.ctx);
    const drop = new Set(
      tl.entries
        .filter((e) => e.place && !mustIds.has(e.place.id) && !e.item.fixedTime && e.warnings.some((w) => w.code === "arrive_after_close" || w.code === "too_short"))
        .map((e) => e.item.id),
    );
    if (drop.size) {
      tl.entries.filter((e) => drop.has(e.item.id)).forEach((e) => unscheduled.push({ placeId: e.place!.id, reason: "하루 일정에 시간이 부족 (영업 종료 전 도착 불가)" }));
      day.items = day.items.filter((it) => !drop.has(it.id));
    }
    return day;
  });

  return { itinerary: { cityId: input.cityId, days, updatedAt: new Date().toISOString() }, unscheduled };
}

const placeItem = (placeId: string, fixedTime?: string): ItineraryItem => ({ id: uid(), kind: "place", placeId, fixedTime });
const mealItem = (meal: "lunch" | "dinner", placeId?: string): ItineraryItem =>
  placeId ? { id: uid(), kind: "place", placeId, note: meal } : { id: uid(), kind: "meal", meal };

/** k-means++ 방식 초기 중심: 서로 멀리 떨어진 지점 선택 */
function pickSeeds(points: LatLng[], k: number, lodging?: LatLng): LatLng[] {
  if (!points.length) return Array.from({ length: k }, () => lodging ?? { lat: 0, lng: 0 });
  const seeds: LatLng[] = [points[0]];
  while (seeds.length < k) {
    let best = points[0];
    let bestD = -1;
    for (const p of points) {
      const d = Math.min(...seeds.map((s) => distanceM(s, p)));
      if (d > bestD) {
        bestD = d;
        best = p;
      }
    }
    seeds.push(bestD <= 0 ? seeds[seeds.length - 1] : best);
  }
  return seeds;
}

/** 아침형 → 근접 순회(일반) → 일몰형 → 야간형 */
export function orderDay(places: Place[], start?: LatLng): Place[] {
  const bucket = (b: (p: Place) => boolean) => places.filter(b);
  const morning = bucket((p) => p.bestTime === "morning");
  const sunset = bucket((p) => p.bestTime === "sunset");
  const night = bucket((p) => p.bestTime === "night");
  const normal = bucket((p) => !p.bestTime || p.bestTime === "afternoon");
  // 오후형은 일반 그룹 뒤쪽으로
  const out: Place[] = [];
  let pos = start;
  for (const group of [morning, normal, sunset, night]) {
    const nn = nearestNeighbor(group, pos);
    out.push(...nn);
    if (nn.length) pos = nn[nn.length - 1].location;
  }
  return out;
}

function nearestNeighbor(places: Place[], start?: LatLng): Place[] {
  const rest = [...places];
  const out: Place[] = [];
  let pos = start ?? rest[0]?.location;
  while (rest.length) {
    let bi = 0;
    rest.forEach((p, i) => {
      if (pos && distanceM(pos, p.location) < distanceM(pos, rest[bi].location)) bi = i;
    });
    const [p] = rest.splice(bi, 1);
    out.push(p);
    pos = p.location;
  }
  return out;
}

/** 순서 평가: 문제(영업 종료·일몰 후 야외 등) 1건당 큰 비용 + 총 이동시간 */
const FIXABLE = new Set(["arrive_after_close", "too_short", "ends_after_close", "after_sunset", "over_day_end", "late_lunch"]);
function cost(day: ItineraryDay, items: ItineraryItem[], ctx: TimelineContext): number {
  const tl = simulateDay({ ...day, items }, ctx);
  const weight = (code: string) => (code === "arrive_after_close" || code === "too_short" || code === "closed_day" ? 5000 : FIXABLE.has(code) ? 1000 : 0);
  const problems =
    tl.entries.reduce((n, e) => n + e.warnings.reduce((m, w) => m + weight(w.code), 0), 0) +
    tl.warnings.reduce((m, w) => m + weight(w.code), 0);
  return problems + tl.travelMinutes;
}

/** 지역 탐색: 문제 항목을 가능한 모든 위치로 옮겨 보고 비용이 줄면 채택 */
function fixClosures(day: ItineraryDay, ctx: TimelineContext): ItineraryItem[] {
  let items = day.items;
  let best = cost(day, items, ctx);
  for (let round = 0; round < items.length * 2; round++) {
    const tl = simulateDay({ ...day, items }, ctx);
    let bad = tl.entries.findIndex((e) => e.warnings.some((w) => FIXABLE.has(w.code)));
    // 일자 단위 문제(복귀 지연)는 마지막 항목 이동을 시도
    if (bad < 0 && tl.warnings.some((w) => FIXABLE.has(w.code))) bad = items.length - 1;
    if (bad < 0) break;
    let improved = false;
    for (let to = 0; to < items.length; to++) {
      if (to === bad) continue;
      const rest = items.filter((_, i) => i !== bad);
      const next = [...rest.slice(0, to), items[bad], ...rest.slice(to)];
      const c = cost(day, next, ctx);
      if (c < best) {
        best = c;
        items = next;
        improved = true;
      }
    }
    if (!improved) break;
  }
  return items;
}

/** 점심: 12:15 이후 처음 끝나는 일정 뒤 / 저녁: 야간형 장소 앞 또는 마지막 */
function insertMeals(day: ItineraryDay, meals: { lunch?: Place; dinner?: Place }, ctx: TimelineContext) {
  const tl = simulateDay(day, ctx);
  // 13:00 이후까지 이어지는 첫 일정: 11:30 이후 시작이면 그 앞에, 아니면 그 뒤에 점심
  const i = tl.entries.findIndex((e) => e.end > hhmmToMin("13:00"));
  const lunch = mealItem("lunch", meals.lunch?.id);
  if (i === -1) day.items.push(lunch);
  else day.items.splice(tl.entries[i].start >= hhmmToMin("11:30") ? i : i + 1, 0, lunch);

  const dinner = mealItem("dinner", meals.dinner?.id);
  const nightIdx = day.items.findIndex((it) => it.placeId && ctx.getPlace(it.placeId)?.bestTime === "night");
  if (nightIdx === -1) day.items.push(dinner);
  else day.items.splice(nightIdx, 0, dinner);
}

import type { OpeningHours, TimeRange, Weekday } from "@/types";
import { weekdayKo, weekdayOf } from "./dates";

/** 특정 날짜의 영업 구간 (예외일 우선). 빈 배열 = 휴무 */
export function rangesOn(hours: OpeningHours, isoDate: string): TimeRange[] {
  const ex = hours.exceptions?.find((e) => e.date === isoDate);
  if (ex) return ex.ranges;
  return hours.weekly[weekdayOf(isoDate) as Weekday] ?? [];
}

export function isOpenOnDate(hours: OpeningHours, isoDate: string): boolean {
  return rangesOn(hours, isoDate).length > 0;
}

export const formatRanges = (ranges: TimeRange[]) =>
  ranges.length ? ranges.map((r) => `${r.open}–${r.close}`).join(", ") : "휴무";

/** 월요일부터 일요일까지 요일별 표기 */
export function weeklySummary(hours: OpeningHours): { day: string; text: string }[] {
  if (hours.alwaysOpen) return [{ day: "매일", text: "24시간 / 상시 개방" }];
  const order: Weekday[] = [1, 2, 3, 4, 5, 6, 0];
  return order.map((d) => ({ day: weekdayKo(d), text: formatRanges(hours.weekly[d] ?? []) }));
}

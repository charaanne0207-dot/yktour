import type { Place } from "@/types";
import { isOpenOnDate } from "@/lib/time/openingHours";
import { distanceM } from "./geo";

export interface Alternative {
  place: Place;
  distanceM: number;
  reason: string;
}

/**
 * 대체 장소 제안 — 휴무·예약 실패·우천 시 (PRD F8)
 * 같은 날 영업, 일정 미포함, (우천 시) 실내, 같은 카테고리·가까운 거리·높은 등급 우선
 */
export function suggestAlternatives(
  target: Place,
  date: string,
  pool: Place[],
  opts: { excludeIds: Set<string>; rainy?: boolean; limit?: number },
): Alternative[] {
  const tierBonus = { must: 0, recommended: 400, hidden: 600 };
  return pool
    .filter((p) => p.id !== target.id && !opts.excludeIds.has(p.id))
    .filter((p) => isOpenOnDate(p.openingHours, date))
    .filter((p) => !opts.rainy || p.indoor)
    .filter((p) => (target.category === "food") === (p.category === "food"))
    .map((p) => {
      const d = distanceM(target.location, p.location);
      const same = p.category === target.category;
      return { p, d, cost: d + (same ? 0 : 800) + tierBonus[p.tier] };
    })
    .sort((a, b) => a.cost - b.cost)
    .slice(0, opts.limit ?? 3)
    .map(({ p, d }) => ({
      place: p,
      distanceM: Math.round(d),
      reason: [opts.rainy && "실내", p.category === target.category && "같은 유형", `${(d / 1000).toFixed(1)}km 거리`].filter(Boolean).join(" · "),
    }));
}

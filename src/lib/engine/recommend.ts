import type { Interest, LatLng, Place, Preferences } from "@/types";
import { distanceM } from "./geo";

const TIER_SCORE = { must: 30, recommended: 18, hidden: 14 } as const;

const INTEREST_LABEL: Record<Interest, string> = {
  history: "역사",
  art: "미술",
  architecture: "건축",
  food: "미식",
  cafe: "카페·디저트",
  shopping: "쇼핑",
  photo: "사진",
  night: "야경·밤",
  local: "로컬",
};
export const INTERESTS = Object.keys(INTEREST_LABEL) as Interest[];
export const interestLabel = (i: Interest) => INTEREST_LABEL[i];

function matchesInterest(p: Place, i: Interest): boolean {
  if (i === "food") return p.category === "food" || p.tags.includes("food");
  if (i === "cafe") return p.category === "cafe";
  if (i === "shopping") return p.category === "shopping";
  if (i === "photo") return p.tags.includes("photo") || p.category === "viewpoint";
  return p.tags.includes(i);
}

export interface Scored {
  place: Place;
  score: number;
  reasons: string[]; // 설명 가능한 추천 근거
}

/** 규칙 기반 취향 점수 (PRD F4) — 등급 + 관심사 일치 + 예산 + 숙소 거리 */
export function scorePlace(place: Place, prefs: Preferences, lodging?: LatLng): Scored {
  let score = TIER_SCORE[place.tier];
  const reasons: string[] = [];

  const matched = prefs.interests.filter((i) => matchesInterest(place, i));
  if (matched.length) {
    score += Math.min(matched.length, 3) * 12;
    reasons.push(`관심사 일치: ${matched.map(interestLabel).join(", ")}`);
  }
  if (place.priceLevel && place.priceLevel > prefs.budget) {
    score -= (place.priceLevel - prefs.budget) * 10;
    reasons.push("예산보다 높은 가격대");
  }
  if (lodging) {
    const km = distanceM(lodging, place.location) / 1000;
    score -= Math.min(10, km * 2);
    if (km < 1) reasons.push("숙소에서 도보 15분 이내");
  }
  return { place, score: Math.round(score * 10) / 10, reasons };
}

export function rankPlaces(places: Place[], prefs: Preferences, lodging?: LatLng): Scored[] {
  return places.map((p) => scorePlace(p, prefs, lodging)).sort((a, b) => b.score - a.score);
}

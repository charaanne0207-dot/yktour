import type { Place } from "@/types";

/** 비공식 재판매·투어 사이트 검색 링크 (브라우저 접속 확인: GetYourGuide, Tiqets — 2026-11-17) */
export function resellerLinks(place: Place): { name: string; url: string }[] {
  const q = place.booking?.resellerQuery;
  if (!q) return [];
  const enc = encodeURIComponent(q);
  return [
    { name: "GetYourGuide", url: `https://www.getyourguide.com/s/?q=${enc}` },
    { name: "Tiqets", url: `https://www.tiqets.com/en/search?q=${enc}` },
  ];
}

export const ADMISSION_STATUS_LABEL = {
  official: "공식 확인",
  reported: "복수 출처 보고",
  check: "출처 상이 · 공식 확인 필요",
  free: "무료",
  none: "입장료 없음",
} as const;

/** 카드·목록용 짧은 입장료 표기 (입장료 개념이 없는 곳은 undefined → 가격대 표시) */
export function admissionShort(place: Place): string | undefined {
  const a = place.admission;
  if (!a || a.status === "none") return undefined;
  if (a.status === "free") return "입장 무료";
  const mark = a.status === "check" ? " (확인 필요)" : "";
  return (a.price.startsWith("€") ? `입장 ${a.price}` : a.price) + mark;
}

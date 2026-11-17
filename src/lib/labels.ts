import type { Category, Tier } from "@/types";

export const TIER_LABEL: Record<Tier, string> = {
  must: "Must Visit",
  recommended: "Recommended",
  hidden: "Hidden Gem",
};

export const TIER_ORDER: Tier[] = ["must", "recommended", "hidden"];

export const CATEGORY_LABEL: Record<Category, string> = {
  sight: "관광",
  food: "맛집",
  cafe: "카페",
  shopping: "쇼핑",
  hidden: "숨은 명소",
  viewpoint: "전망·일몰",
};

export const CATEGORY_ORDER: Category[] = ["sight", "food", "cafe", "shopping", "hidden", "viewpoint"];

export const RESERVATION_LABEL = {
  yes: "예약 필수",
  recommended: "예약 권장",
  no: "예약 불필요",
} as const;

export const priceLabel = (lv?: number) => (lv ? "€".repeat(lv) : "무료/정보 없음");

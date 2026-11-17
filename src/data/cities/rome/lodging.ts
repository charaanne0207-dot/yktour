import type { Lodging } from "@/types";

/** 숙소 지역 프리셋 — 정확한 숙소 좌표를 모를 때 사용 (지역 대표 지점) */
export const romeLodgingPresets: (Lodging & { presetId: string; desc: string })[] = [
  { presetId: "termini", name: "테르미니역 주변", lat: 41.9009, lng: 12.5016, desc: "교통 허브, 공항·기차 이동 편리" },
  { presetId: "centro", name: "판테온·나보나 (센트로 스토리코)", lat: 41.8986, lng: 12.4745, desc: "주요 명소 도보권" },
  { presetId: "monti", name: "몬티", lat: 41.8953, lng: 12.4920, desc: "콜로세움 인접, 로컬 분위기" },
  { presetId: "trastevere", name: "트라스테베레", lat: 41.8890, lng: 12.4700, desc: "식당·야간 분위기" },
  { presetId: "prati", name: "프라티 (바티칸)", lat: 41.9070, lng: 12.4610, desc: "조용하고 바티칸 접근 좋음" },
  { presetId: "spagna", name: "스페인 광장", lat: 41.9059, lng: 12.4823, desc: "쇼핑가 중심" },
];

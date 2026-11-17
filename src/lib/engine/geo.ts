import type { LatLng } from "@/types";

/** 두 좌표 간 직선 거리(m) — haversine */
export function distanceM(a: LatLng, b: LatLng): number {
  const R = 6371000;
  const rad = Math.PI / 180;
  const dLat = (b.lat - a.lat) * rad;
  const dLng = (b.lng - a.lng) * rad;
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(a.lat * rad) * Math.cos(b.lat * rad) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

export interface TravelEstimate {
  mode: "walk" | "transit";
  minutes: number;
  meters: number; // 추정 실제 이동 거리
  estimated: true; // 경로 API 미사용 — 간이 추정
}

/** 도로 우회 계수 — 직선 대비 실제 보행 거리 근사 */
const DETOUR = 1.35;
const WALK_KMH = 4.5;
const WALK_MAX_M = 2200; // 이 이상은 대중교통/택시 가정

/** 간이 이동시간 추정 (Routes API 연동 전 대체) */
export function estimateTravel(a: LatLng, b: LatLng): TravelEstimate {
  const meters = Math.round(distanceM(a, b) * DETOUR);
  if (meters <= WALK_MAX_M) {
    return { mode: "walk", minutes: Math.max(3, Math.round((meters / 1000 / WALK_KMH) * 60)), meters, estimated: true };
  }
  // 대중교통: 접근·대기 12분 + 평균 14km/h
  return { mode: "transit", minutes: Math.round(12 + (meters / 1000 / 14) * 60), meters, estimated: true };
}

export function centroid(points: LatLng[]): LatLng {
  if (!points.length) return { lat: 0, lng: 0 };
  return {
    lat: points.reduce((s, p) => s + p.lat, 0) / points.length,
    lng: points.reduce((s, p) => s + p.lng, 0) / points.length,
  };
}

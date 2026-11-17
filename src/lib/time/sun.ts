import type { LatLng } from "@/types";

/**
 * NOAA 근사식 기반 일출·일몰 계산 (오차 ±2분 내외).
 * 반환값은 현지 시각 "HH:mm". 타임존 오프셋은 Intl 로 해당 날짜 기준 계산(서머타임 반영).
 */
export function sunTimes(isoDate: string, pos: LatLng, timeZone: string): { sunrise: string; sunset: string } {
  const date = new Date(`${isoDate}T12:00:00Z`);
  const start = Date.UTC(date.getUTCFullYear(), 0, 0);
  const dayOfYear = Math.floor((date.getTime() - start) / 86400000);
  const rad = Math.PI / 180;

  const gamma = ((2 * Math.PI) / 365) * (dayOfYear - 1);
  const eqTime =
    229.18 *
    (0.000075 + 0.001868 * Math.cos(gamma) - 0.032077 * Math.sin(gamma) - 0.014615 * Math.cos(2 * gamma) - 0.040849 * Math.sin(2 * gamma));
  const decl =
    0.006918 -
    0.399912 * Math.cos(gamma) +
    0.070257 * Math.sin(gamma) -
    0.006758 * Math.cos(2 * gamma) +
    0.000907 * Math.sin(2 * gamma) -
    0.002697 * Math.cos(3 * gamma) +
    0.00148 * Math.sin(3 * gamma);
  const ha = Math.acos(Math.cos(90.833 * rad) / (Math.cos(pos.lat * rad) * Math.cos(decl)) - Math.tan(pos.lat * rad) * Math.tan(decl)) / rad;

  const offsetMin = tzOffsetMinutes(isoDate, timeZone);
  const sunriseUtc = 720 - 4 * (pos.lng + ha) - eqTime;
  const sunsetUtc = 720 - 4 * (pos.lng - ha) - eqTime;
  return { sunrise: minToHHMM(sunriseUtc + offsetMin), sunset: minToHHMM(sunsetUtc + offsetMin) };
}

function tzOffsetMinutes(isoDate: string, timeZone: string): number {
  const d = new Date(`${isoDate}T12:00:00Z`);
  const parts = new Intl.DateTimeFormat("en-US", { timeZone, hour: "2-digit", minute: "2-digit", hourCycle: "h23" }).formatToParts(d);
  const h = Number(parts.find((p) => p.type === "hour")?.value);
  const m = Number(parts.find((p) => p.type === "minute")?.value);
  return h * 60 + m - 12 * 60;
}

export const hhmmToMin = (t: string) => {
  const [h, m] = t.split(":").map(Number);
  return h * 60 + m;
};

export const minToHHMM = (min: number) => {
  const v = ((Math.round(min) % 1440) + 1440) % 1440;
  return `${String(Math.floor(v / 60)).padStart(2, "0")}:${String(v % 60).padStart(2, "0")}`;
};

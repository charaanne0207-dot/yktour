// Open-Meteo (키 불필요). 예보는 약 16일 이내만 제공 → 그 이전은 도시 meta 의 평년 안내 사용.
import type { LatLng } from "@/types";

export interface DailyWeather {
  date: string;
  tMax: number;
  tMin: number;
  precipProb: number | null;
  sunset: string; // HH:mm (현지)
}

export async function fetchForecast(pos: LatLng, timezone: string, signal?: AbortSignal): Promise<DailyWeather[]> {
  const url = new URL("https://api.open-meteo.com/v1/forecast");
  url.search = new URLSearchParams({
    latitude: String(pos.lat),
    longitude: String(pos.lng),
    daily: "temperature_2m_max,temperature_2m_min,precipitation_probability_max,sunset",
    timezone,
    forecast_days: "5",
  }).toString();
  const res = await fetch(url, { signal });
  if (!res.ok) throw new Error(`날씨 정보를 불러오지 못했습니다 (${res.status})`);
  const d = (await res.json()).daily;
  return d.time.map((date: string, i: number) => ({
    date,
    tMax: Math.round(d.temperature_2m_max[i]),
    tMin: Math.round(d.temperature_2m_min[i]),
    precipProb: d.precipitation_probability_max?.[i] ?? null,
    sunset: String(d.sunset[i]).slice(11, 16),
  }));
}

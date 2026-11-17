"use client";

import { useEffect, useState } from "react";
import { CloudRain, CloudSun, RefreshCw, Sunset } from "lucide-react";
import type { City } from "@/types";
import { Button } from "@/components/ui/button";
import { SectionHeader, Skeleton } from "@/components/ui/misc";
import { fetchForecast, type DailyWeather } from "@/lib/services/weather";
import { formatDateKo } from "@/lib/time/dates";

type State = { status: "loading" } | { status: "error"; message: string } | { status: "ok"; data: DailyWeather[] };

export function WeatherStrip({ city }: { city: City }) {
  const [state, setState] = useState<State>({ status: "loading" });
  const [nonce, setNonce] = useState(0);

  useEffect(() => {
    const ctrl = new AbortController();
    let timedOut = false;
    const timer = setTimeout(() => {
      timedOut = true;
      ctrl.abort();
    }, 8000);
    setState({ status: "loading" });
    fetchForecast(city.center, city.timezone, ctrl.signal)
      .then((data) => setState({ status: "ok", data }))
      .catch((e) => {
        if (timedOut) setState({ status: "error", message: "날씨 서버 응답이 없습니다. 네트워크를 확인해 주세요." });
        else if (!ctrl.signal.aborted) setState({ status: "error", message: e instanceof Error ? e.message : "오류" });
      })
      .finally(() => clearTimeout(timer));
    return () => {
      clearTimeout(timer);
      ctrl.abort();
    };
  }, [city, nonce]);

  return (
    <section aria-labelledby="weather-title">
      <SectionHeader id="weather-title" eyebrow="Weather · Open-Meteo" title={`지금 ${city.name.ko}의 날씨`} />
      {state.status === "loading" && (
        <div className="flex gap-2.5 overflow-hidden" aria-busy="true" aria-label="날씨 불러오는 중">
          {Array.from({ length: 5 }, (_, i) => (
            <Skeleton key={i} className="h-[112px] min-w-[104px] flex-1" />
          ))}
        </div>
      )}
      {state.status === "error" && (
        <div className="surface flex flex-wrap items-center justify-between gap-3 p-4 text-sm">
          <span className="flex items-center gap-2 text-muted-foreground">
            <CloudSun className="size-5" aria-hidden /> {state.message}
          </span>
          <Button size="sm" variant="outline" onClick={() => setNonce((n) => n + 1)}>
            <RefreshCw /> 다시 시도
          </Button>
        </div>
      )}
      {state.status === "ok" && (
        <ul className="scrollbar-none -mx-4 flex gap-2.5 overflow-x-auto px-4 md:mx-0 md:grid md:grid-cols-5 md:px-0">
          {state.data.map((d, i) => (
            <li key={d.date} className="surface min-w-[104px] shrink-0 p-3.5 text-sm">
              <p className="text-xs font-semibold text-muted-foreground">{i === 0 ? "오늘" : formatDateKo(d.date)}</p>
              <p className="mt-1 font-serif text-xl">
                {d.tMax}°<span className="ml-1 text-sm text-muted-foreground">/ {d.tMin}°</span>
              </p>
              {d.precipProb !== null && (
                <p className={`mt-1 flex items-center gap-1 text-xs ${d.precipProb >= 60 ? "font-semibold text-secondary" : "text-muted-foreground"}`}>
                  <CloudRain className="size-3.5" aria-hidden /> 강수 {d.precipProb}%
                </p>
              )}
              <p className="mt-0.5 flex items-center gap-1 text-xs text-muted-foreground">
                <Sunset className="size-3.5" aria-hidden /> {d.sunset}
              </p>
            </li>
          ))}
        </ul>
      )}
      <p className="mt-3 text-xs leading-relaxed text-muted-foreground">
        {city.winterNote && <>1~2월 평년: {city.winterNote} </>}
        여행 날짜 예보는 출발 약 2주 전부터 제공되며, 비 예보가 있는 날은 일정 화면에서 &lsquo;비 오는 날&rsquo;로 표시해 실내 대안을 받을 수 있어요.
      </p>
    </section>
  );
}

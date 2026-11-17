"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { ArrowRight, ExternalLink, Info, MapPinned, Navigation, X } from "lucide-react";
import type { City, Place } from "@/types";
import { EmptyState } from "@/components/common/states";
import { TierBadge } from "@/components/place/badges";
import { PlacePhoto } from "@/components/place/PlacePhoto";
import { buttonVariants } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/misc";
import { features } from "@/lib/config/env";
import { useHydrated } from "@/lib/hooks/useHydrated";
import { CATEGORY_LABEL } from "@/lib/labels";
import { googleMapsDirectionsUrl, googleMapsPlaceUrl } from "@/lib/services/maps";
import { placesService } from "@/lib/services/places";
import { useItinerary, useTripStore } from "@/lib/store/useTripStore";
import { formatDateKo } from "@/lib/time/dates";
import { cn } from "@/lib/utils";
import type { MapMarker } from "./types";

const loading = () => <Skeleton className="size-full rounded-none" />;
const GoogleCanvas = dynamic(() => import("./GoogleCanvas"), { ssr: false, loading });
const LeafletCanvas = dynamic(() => import("./LeafletCanvas"), { ssr: false, loading });

const TIER_COLOR = { must: "#A9472F", recommended: "#8A6912", hidden: "#4E5D24" } as const;

export function MapView({ city, initialDay }: { city: City; initialDay?: string }) {
  const hydrated = useHydrated();
  const { leg, itinerary } = useItinerary(city.id);
  const saved = useTripStore((s) => s.saved);
  const [mode, setMode] = useState<string>(initialDay ?? "all"); // all | saved | YYYY-MM-DD
  const [selected, setSelected] = useState<string | null>(null);
  const listRef = useRef<HTMLOListElement>(null);

  const places: Place[] = useMemo(() => {
    if (mode === "all") return placesService.list(city.id);
    if (mode === "saved") return placesService.list(city.id).filter((p) => saved[p.id]);
    const day = itinerary?.days.find((d) => d.date === mode);
    return (day?.items ?? []).map((i) => (i.placeId ? placesService.get(i.placeId) : undefined)).filter((p): p is Place => Boolean(p));
  }, [mode, city.id, itinerary, saved]);

  const mapRef = useRef<HTMLDivElement>(null);
  const isDesktop = () => typeof window !== "undefined" && window.matchMedia("(min-width: 1024px)").matches;

  // 데스크톱: 마커 선택 → 목록(스크롤 영역) 안에서 해당 항목으로 이동
  useEffect(() => {
    if (!selected || !isDesktop()) return;
    listRef.current?.querySelector(`[data-id="${selected}"]`)?.scrollIntoView({ block: "nearest", behavior: "smooth" });
  }, [selected]);

  // 모바일: 목록에서 선택 → 지도가 보이도록 위로 스크롤
  const selectFromList = (id: string) => {
    setSelected(id);
    if (!isDesktop()) mapRef.current?.scrollIntoView({ block: "start", behavior: "smooth" });
  };

  if (city.status !== "active")
    return <EmptyState icon={MapPinned} title={`${city.name.ko} 지도는 준비 중입니다`} action={{ href: "/rome/map", label: "로마 지도 보기" }} />;
  if (!hydrated) return <Skeleton className="h-[60dvh]" />;

  const isDay = mode !== "all" && mode !== "saved";
  const lodging = leg?.lodging;
  const markers: MapMarker[] = places.map((p, i) => ({
    id: p.id,
    position: p.location,
    title: p.name.ko,
    color: TIER_COLOR[p.tier],
    label: isDay ? String(i + 1) : saved[p.id]?.mustVisit ? "★" : undefined,
    href: `/${city.id}/place/${p.id}`,
  }));
  const path = isDay && places.length ? [...(lodging ? [lodging] : []), ...places.map((p) => p.location), ...(lodging ? [lodging] : [])] : undefined;
  const directions = isDay ? googleMapsDirectionsUrl(path ?? []) : null;
  const useGoogle = features.map();
  const Canvas = useGoogle ? GoogleCanvas : LeafletCanvas;
  const sel = places.find((p) => p.id === selected);
  const savedCount = Object.values(saved).filter((s) => s.cityId === city.id).length;

  const tabs = [
    { key: "all", label: "전체 추천" },
    { key: "saved", label: `저장 ${savedCount}` },
    ...(itinerary?.days ?? []).map((d, i) => ({ key: d.date, label: `Day ${i + 1} · ${formatDateKo(d.date)}` })),
  ];

  return (
    <div className="space-y-4">
      <div role="tablist" aria-label="지도에 표시할 장소" className="scrollbar-none -mx-4 flex gap-2 overflow-x-auto px-4 md:mx-0 md:px-0">
        {tabs.map((t) => (
          <button
            key={t.key}
            role="tab"
            aria-selected={mode === t.key}
            onClick={() => {
              setMode(t.key);
              setSelected(null);
            }}
            className={cn(
              "h-10 shrink-0 rounded-full border px-4 text-sm font-medium",
              mode === t.key ? "border-foreground bg-foreground text-background" : "bg-card hover:bg-muted",
            )}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[340px_minmax(0,1fr)] lg:gap-6">
        {/* 지도 (모바일 위, 데스크톱 오른쪽) */}
        <div className="min-w-0 lg:order-2">
          <div ref={mapRef} className="relative z-0 -mx-4 h-[48dvh] scroll-mt-16 overflow-hidden border-y lg:sticky lg:top-8 md:mx-0 md:h-[420px] lg:h-[calc(100dvh-220px)] lg:min-h-[480px] md:rounded-3xl md:border">
            <Canvas center={city.center} zoom={city.zoom} markers={markers} path={path} lodging={lodging} selectedId={selected} onSelect={setSelected} />

            {/* 선택 장소 미리보기 */}
            {sel && (
              <div className="absolute inset-x-3 bottom-3 z-[500] md:inset-x-auto md:bottom-4 md:left-4 md:w-80">
                <div className="surface relative flex gap-3 p-2.5 pr-12 shadow-lg">
                  <PlacePhoto place={sel} className="size-20 shrink-0 rounded-xl [&_span]:hidden" />
                  <div className="min-w-0 py-0.5">
                    <TierBadge tier={sel.tier} className="px-2 text-[10px]" />
                    <p className="mt-1 truncate font-serif text-lg leading-tight">{sel.name.ko}</p>
                    <Link href={`/${city.id}/place/${sel.id}`} className="mt-1 inline-flex items-center gap-1 text-sm font-semibold text-secondary">
                      상세 보기 <ArrowRight className="size-3.5" />
                    </Link>
                  </div>
                  <button onClick={() => setSelected(null)} aria-label="미리보기 닫기" className="absolute right-1 top-1 flex size-10 items-center justify-center rounded-full text-muted-foreground hover:bg-muted">
                    <X className="size-4" />
                  </button>
                </div>
              </div>
            )}
          </div>
          <p className="mt-2 flex items-start gap-1.5 text-xs leading-relaxed text-muted-foreground">
            <Info className="mt-0.5 size-3.5 shrink-0" aria-hidden />
            <span>
              {useGoogle ? "Google Maps" : "OpenStreetMap (Google Maps 키 미설정 — 대체 지도)"}
              {isDay && " · 점선은 방문 순서를 이은 간이 동선(직선)이며 실제 도로 경로가 아닙니다."}
              {lodging && " · H = 숙소"}
            </span>
          </p>
        </div>

        {/* 목록 */}
        <div className="min-w-0 space-y-3 lg:order-1">
          {directions && (
            <a href={directions} target="_blank" rel="noreferrer" className={buttonVariants({ variant: "dark", className: "w-full" })}>
              <Navigation /> Google 지도 실제 경로 길찾기
            </a>
          )}
          {places.length === 0 ? (
            <EmptyState
              icon={MapPinned}
              title={mode === "saved" ? "저장한 장소가 없어요" : "이 날은 일정이 비어 있어요"}
              description={mode === "saved" ? "탐색에서 ♡로 장소를 저장해 보세요." : "일정 화면에서 자동 생성하거나 장소를 추가하세요."}
              action={{ href: mode === "saved" ? `/${city.id}/explore` : `/${city.id}/itinerary`, label: mode === "saved" ? "장소 찾기" : "일정으로" }}
            />
          ) : (
            <ol ref={listRef} className="space-y-2 lg:max-h-[calc(100dvh-260px)] lg:overflow-y-auto lg:pr-1">
              {places.map((p, i) => {
                const active = selected === p.id;
                return (
                  <li key={`${p.id}-${i}`} data-id={p.id}>
                    <div className={cn("surface relative flex items-center gap-3 p-2.5 transition-colors", active && "border-foreground ring-1 ring-foreground")}>
                      <span
                        className="flex size-7 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white"
                        style={{ background: TIER_COLOR[p.tier] }}
                        aria-hidden
                      >
                        {isDay ? i + 1 : saved[p.id]?.mustVisit ? "★" : ""}
                      </span>
                      <PlacePhoto place={p} className="size-14 shrink-0 rounded-lg [&_span]:hidden" />
                      <button className="min-w-0 flex-1 py-1 text-left" onClick={() => selectFromList(p.id)} aria-pressed={active}>
                        <span className="block truncate font-semibold">{p.name.ko}</span>
                        <span className="text-xs text-muted-foreground">
                          {CATEGORY_LABEL[p.category]} · {p.location.area}
                        </span>
                      </button>
                      <a
                        href={googleMapsPlaceUrl(p)}
                        target="_blank"
                        rel="noreferrer"
                        aria-label={`${p.name.ko} Google 지도에서 열기`}
                        className="flex size-11 shrink-0 items-center justify-center rounded-full text-muted-foreground hover:bg-muted"
                      >
                        <ExternalLink className="size-4" />
                      </a>
                    </div>
                  </li>
                );
              })}
            </ol>
          )}
          {!isDay && places.length > 0 && <SaveHint />}
        </div>
      </div>
    </div>
  );
}

function SaveHint() {
  return <p className="text-xs text-muted-foreground">장소를 누르면 지도에서 위치를 보여 드려요. 상세 화면에서 저장·일정 추가가 가능합니다.</p>;
}


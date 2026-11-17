"use client";

import { useMemo, useState } from "react";
import { Search, SearchX, SlidersHorizontal, X } from "lucide-react";
import type { Category, CityId, Tier } from "@/types";
import { EmptyState } from "@/components/common/states";
import { SavedCta } from "@/components/common/SavedCta";
import { PlaceCard } from "@/components/place/PlaceCard";
import { rankPlaces } from "@/lib/engine/recommend";
import { useHydrated } from "@/lib/hooks/useHydrated";
import { CATEGORY_LABEL, CATEGORY_ORDER, TIER_LABEL, TIER_ORDER } from "@/lib/labels";
import { placesService } from "@/lib/services/places";
import { useItinerary, useTripStore } from "@/lib/store/useTripStore";
import { formatDateKo } from "@/lib/time/dates";
import { cn } from "@/lib/utils";

export function Chip({ active, onClick, children, className }: { active: boolean; onClick: () => void; children: React.ReactNode; className?: string }) {
  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={onClick}
      className={cn(
        "h-10 shrink-0 rounded-full border px-4 text-sm font-medium transition-colors",
        active ? "border-foreground bg-foreground text-background" : "bg-card text-foreground hover:bg-muted",
        className,
      )}
    >
      {children}
    </button>
  );
}

const toggle = <T,>(arr: T[], v: T) => (arr.includes(v) ? arr.filter((x) => x !== v) : [...arr, v]);
type Sort = "recommended" | "tier" | "distance";

export function ExploreView({
  cityId,
  initialCategory,
  initialTier,
  initialSort,
}: {
  cityId: CityId;
  initialCategory?: Category;
  initialTier?: Tier;
  initialSort?: Sort;
}) {
  const hydrated = useHydrated();
  const prefs = useTripStore((s) => s.trip.prefs);
  const { leg, itinerary } = useItinerary(cityId);
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<Category | null>(initialCategory ?? null);
  const [tiers, setTiers] = useState<Tier[]>(initialTier ? [initialTier] : []);
  const [indoorOnly, setIndoorOnly] = useState(false);
  const [openOn, setOpenOn] = useState("");
  const [sort, setSort] = useState<Sort>(initialSort ?? "recommended");
  const [showMore, setShowMore] = useState(false);

  const lodging = hydrated ? leg?.lodging : undefined;
  const ranked = useMemo(() => {
    const list = placesService.list(cityId, { query, categories: category ? [category] : [], tiers, indoorOnly, openOn: openOn || undefined });
    const scored = rankPlaces(list, hydrated ? prefs : { ...prefs, interests: [] }, lodging);
    if (sort === "tier") return scored.sort((a, b) => TIER_ORDER.indexOf(a.place.tier) - TIER_ORDER.indexOf(b.place.tier));
    if (sort === "distance" && lodging) {
      const d = (s: (typeof scored)[number]) => (s.place.location.lat - lodging.lat) ** 2 + (s.place.location.lng - lodging.lng) ** 2;
      return scored.sort((a, b) => d(a) - d(b));
    }
    return scored;
  }, [cityId, query, category, tiers, indoorOnly, openOn, sort, prefs, lodging, hydrated]);
  const total = placesService.list(cityId).length;
  const advancedCount = tiers.length + (indoorOnly ? 1 : 0) + (openOn ? 1 : 0);
  const reset = () => {
    setQuery("");
    setCategory(null);
    setTiers([]);
    setIndoorOnly(false);
    setOpenOn("");
  };

  if (total === 0)
    return <EmptyState title="아직 등록된 장소가 없습니다" description="이 도시는 큐레이션 준비 중입니다." action={{ href: "/rome/explore", label: "로마 탐색하기" }} />;

  return (
    <div className="space-y-5">
      {/* 고정 검색·필터 바 */}
      <div className="sticky top-14 z-20 -mx-4 space-y-3 border-b bg-background/92 px-4 pb-3 pt-2 backdrop-blur-md md:top-0 md:mx-0 md:rounded-b-2xl md:px-0">
        <div className="flex gap-2">
          <label className="relative block flex-1">
            <span className="sr-only">장소 검색</span>
            <Search className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="장소·지역·키워드 검색"
              className="h-12 w-full rounded-full border bg-card pl-11 pr-4 text-base outline-none transition-colors focus:border-primary"
            />
          </label>
          <button
            type="button"
            onClick={() => setShowMore(!showMore)}
            aria-expanded={showMore}
            aria-label="상세 필터"
            className={cn("relative flex size-12 shrink-0 items-center justify-center rounded-full border bg-card", showMore && "border-foreground")}
          >
            <SlidersHorizontal className="size-5" />
            {advancedCount > 0 && (
              <span className="absolute -right-0.5 -top-0.5 flex size-5 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground">
                {advancedCount}
              </span>
            )}
          </button>
        </div>

        <div className="scrollbar-none -mx-4 flex gap-2 overflow-x-auto px-4 md:mx-0 md:flex-wrap md:px-0">
          <Chip active={category === null} onClick={() => setCategory(null)}>
            전체
          </Chip>
          {CATEGORY_ORDER.map((c) => (
            <Chip key={c} active={category === c} onClick={() => setCategory(category === c ? null : c)}>
              {CATEGORY_LABEL[c]}
            </Chip>
          ))}
        </div>

      </div>

      {showMore && (
        <div className="surface space-y-3 p-4">
          <div>
            <p className="eyebrow mb-2">추천 등급</p>
            <div className="flex flex-wrap gap-2">
              {TIER_ORDER.map((t) => (
                <Chip key={t} active={tiers.includes(t)} onClick={() => setTiers(toggle(tiers, t))}>
                  {TIER_LABEL[t]}
                </Chip>
              ))}
              <Chip active={indoorOnly} onClick={() => setIndoorOnly(!indoorOnly)}>
                ☔ 실내만
              </Chip>
            </div>
          </div>
          <label className="block">
            <span className="eyebrow mb-2 block">이 날 영업하는 곳만</span>
            <select value={openOn} onChange={(e) => setOpenOn(e.target.value)} className="input w-full sm:w-64">
              <option value="">날짜 무관</option>
              {itinerary?.days.map((d) => (
                <option key={d.date} value={d.date}>
                  {formatDateKo(d.date)}
                </option>
              ))}
            </select>
          </label>
        </div>
      )}

      <div className="flex items-center justify-between gap-3">
        <p className="text-sm text-muted-foreground" aria-live="polite">
          <strong className="text-foreground">{ranked.length}</strong>곳{ranked.length !== total && ` / 전체 ${total}곳`}
          {(query || category || advancedCount > 0) && (
            <button onClick={reset} className="ml-2 inline-flex items-center gap-0.5 text-xs font-semibold text-secondary">
              <X className="size-3" /> 초기화
            </button>
          )}
        </p>
        <label className="flex items-center gap-2 text-sm">
          <span className="sr-only">정렬</span>
          <select value={sort} onChange={(e) => setSort(e.target.value as Sort)} className="input h-10 pr-8 font-medium">
            <option value="recommended">취향 추천순</option>
            <option value="tier">등급순</option>
            <option value="distance" disabled={!lodging}>
              숙소 가까운 순{!lodging ? " (숙소 설정 필요)" : ""}
            </option>
          </select>
        </label>
      </div>

      {ranked.length === 0 ? (
        <EmptyState icon={SearchX} title="조건에 맞는 장소가 없어요" description="필터를 줄이거나 다른 키워드로 검색해 보세요." />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 lg:gap-5">
          {ranked.map((s) => (
            <PlaceCard key={s.place.id} place={s.place} note={sort === "recommended" ? s.reasons[0] : undefined} />
          ))}
        </div>
      )}
      <SavedCta cityId={cityId} />
    </div>
  );
}

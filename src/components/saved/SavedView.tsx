"use client";

import Link from "next/link";
import { useMemo, useRef, useState } from "react";
import { CalendarCheck, Check, Clock, Download, Heart, Pin, Search, Trash2, Upload, Wand2 } from "lucide-react";
import type { Category, CityId, Place, SavedPlace } from "@/types";
import { EmptyState, RowSkeleton } from "@/components/common/states";
import { Chip } from "@/components/explore/ExploreView";
import { TierBadge } from "@/components/place/badges";
import { PlacePhoto } from "@/components/place/PlacePhoto";
import { TripDaysOpen } from "@/components/place/TripDaysOpen";
import { Button, buttonVariants } from "@/components/ui/button";
import { useHydrated } from "@/lib/hooks/useHydrated";
import { CATEGORY_LABEL, CATEGORY_ORDER, TIER_ORDER, priceLabel } from "@/lib/labels";
import { placesService } from "@/lib/services/places";
import { useTripStore } from "@/lib/store/useTripStore";
import { admissionShort } from "@/lib/booking";
import { cn } from "@/lib/utils";

type Row = { s: SavedPlace; p: Place };
type Sort = "recent" | "tier" | "duration" | "price";

export function SavedView({ cityId }: { cityId: CityId }) {
  const hydrated = useHydrated();
  const saved = useTripStore((s) => s.saved);
  const itinerary = useTripStore((s) => s.itineraries[cityId]);
  const [query, setQuery] = useState("");
  const [cat, setCat] = useState<Category | "">("");
  const [mustOnly, setMustOnly] = useState(false);
  const [sort, setSort] = useState<Sort>("recent");

  const rows: Row[] = useMemo(
    () =>
      Object.values(saved)
        .filter((s) => s.cityId === cityId)
        .sort((a, b) => b.savedAt.localeCompare(a.savedAt))
        .map((s) => ({ s, p: placesService.get(s.placeId) }))
        .filter((r): r is Row => Boolean(r.p)),
    [saved, cityId],
  );
  const scheduled = useMemo(() => new Set(itinerary?.days.flatMap((d) => d.items.map((i) => i.placeId))), [itinerary]);

  if (!hydrated) return <RowSkeleton rows={4} />;

  const q = query.trim().toLowerCase();
  const filtered = rows
    .filter(
      ({ s, p }) =>
        (!mustOnly || s.mustVisit) &&
        (!cat || p.category === cat) &&
        (!q || [p.name.ko, p.name.en, p.location.area, s.note ?? ""].some((x) => x.toLowerCase().includes(q))),
    )
    .sort((a, b) => {
      if (sort === "tier") return TIER_ORDER.indexOf(a.p.tier) - TIER_ORDER.indexOf(b.p.tier);
      if (sort === "duration") return b.p.durationMin - a.p.durationMin;
      if (sort === "price") return (a.p.priceLevel ?? 0) - (b.p.priceLevel ?? 0);
      return 0;
    });
  const mustCount = rows.filter((r) => r.s.mustVisit).length;
  const inPlan = rows.filter((r) => scheduled.has(r.p.id)).length;
  const totalMin = rows.reduce((n, r) => n + r.p.durationMin, 0);

  // 백업 패널은 빈 화면/목록 화면 모두 같은 위치에 두어 가져오기 직후에도 상태 메시지가 유지되게 한다
  return (
    <div className="space-y-6">
      {rows.length === 0 ? (
        <EmptyState
          icon={Heart}
          title="아직 저장한 장소가 없어요"
          description="탐색에서 사진 위의 ♡ 를 눌러 저장하세요. 꼭 가야 할 곳은 '필수'로 지정하면 일정에 반드시 포함됩니다."
          action={{ href: `/${cityId}/explore`, label: "장소 둘러보기" }}
          secondary={{ href: `/${cityId}/itinerary`, label: "추천으로 일정 만들기" }}
        />
      ) : (
        <SavedList rows={rows} filtered={filtered} cityId={cityId} scheduled={scheduled} mustCount={mustCount} inPlan={inPlan} totalMin={totalMin}
          query={query} setQuery={setQuery} sort={sort} setSort={setSort} cat={cat} setCat={setCat} mustOnly={mustOnly} setMustOnly={setMustOnly} />
      )}
      <BackupPanel />
    </div>
  );
}

function SavedList({
  rows, filtered, cityId, scheduled, mustCount, inPlan, totalMin, query, setQuery, sort, setSort, cat, setCat, mustOnly, setMustOnly,
}: {
  rows: Row[]; filtered: Row[]; cityId: CityId; scheduled: Set<string | undefined>; mustCount: number; inPlan: number; totalMin: number;
  query: string; setQuery: (v: string) => void; sort: Sort; setSort: (v: Sort) => void; cat: Category | ""; setCat: (v: Category | "") => void;
  mustOnly: boolean; setMustOnly: (v: boolean) => void;
}) {
  return (
    <>
      {/* 요약 + 다음 행동 */}
      <section className="surface flex flex-wrap items-center justify-between gap-4 p-5">
        <dl className="flex gap-6">
          <Summary label="저장" value={`${rows.length}곳`} />
          <Summary label="필수 방문" value={`${mustCount}곳`} />
          <Summary label="일정 포함" value={`${inPlan}곳`} />
          <Summary label="총 관람" value={`${Math.round(totalMin / 60)}시간`} className="hidden sm:block" />
        </dl>
        <Link href={`/${cityId}/itinerary`} className={buttonVariants({ className: "w-full sm:w-auto" })}>
          <Wand2 /> {inPlan ? "일정 보기" : "이 장소들로 일정 만들기"}
        </Link>
      </section>

      {/* 검색·필터 */}
      <div className="space-y-3">
        <div className="flex gap-2">
          <label className="relative block flex-1">
            <span className="sr-only">저장 장소 검색</span>
            <Search className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="이름·지역·메모 검색"
              className="h-11 w-full rounded-full border bg-card pl-11 pr-4 outline-none focus:border-primary"
            />
          </label>
          <label>
            <span className="sr-only">정렬</span>
            <select value={sort} onChange={(e) => setSort(e.target.value as Sort)} className="input font-medium">
              <option value="recent">최근 저장순</option>
              <option value="tier">등급순</option>
              <option value="duration">관람시간 긴 순</option>
              <option value="price">가격 낮은 순</option>
            </select>
          </label>
        </div>
        <div className="scrollbar-none -mx-4 flex gap-2 overflow-x-auto px-4 md:mx-0 md:flex-wrap md:px-0">
          <Chip active={mustOnly} onClick={() => setMustOnly(!mustOnly)}>
            📌 필수만
          </Chip>
          <Chip active={cat === ""} onClick={() => setCat("")}>
            전체
          </Chip>
          {CATEGORY_ORDER.map((c) => (
            <Chip key={c} active={cat === c} onClick={() => setCat(cat === c ? "" : c)}>
              {CATEGORY_LABEL[c]}
            </Chip>
          ))}
        </div>
      </div>

      {filtered.length === 0 ? (
        <EmptyState icon={Search} title="조건에 맞는 저장 장소가 없습니다" description="필터를 해제하거나 다른 검색어를 입력해 보세요." />
      ) : (
        <ul className="grid gap-3 lg:grid-cols-2">
          {filtered.map((r) => (
            <SavedRow key={r.p.id} row={r} cityId={cityId} inItinerary={scheduled.has(r.p.id)} />
          ))}
        </ul>
      )}
      <p className="text-xs text-muted-foreground">날짜 칸: 내 여행 날짜별 영업(초록) / 휴무(빨강, 취소선)</p>
    </>
  );
}

function Summary({ label, value, className }: { label: string; value: string; className?: string }) {
  return (
    <div className={className}>
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className="font-serif text-xl">{value}</dd>
    </div>
  );
}

function SavedRow({ row: { s, p }, cityId, inItinerary }: { row: Row; cityId: CityId; inItinerary: boolean }) {
  const { toggleMustVisit, removeSaved, setSavedNote } = useTripStore.getState();
  const [note, setNote] = useState(s.note ?? "");
  return (
    <li className={cn("surface flex gap-3 p-3", s.mustVisit && "border-foreground/30")}>
      <Link href={`/${cityId}/place/${p.id}`} className="shrink-0 overflow-hidden rounded-xl" aria-label={`${p.name.ko} 상세`}>
        <PlacePhoto place={p} className="size-24 [&_span.eyebrow]:hidden [&_span]:text-xs" />
      </Link>
      <div className="min-w-0 flex-1 space-y-1.5">
        <div className="flex flex-wrap items-center gap-1.5">
          <Link href={`/${cityId}/place/${p.id}`} className="font-serif text-lg leading-tight hover:underline">
            {p.name.ko}
          </Link>
          <TierBadge tier={p.tier} className="text-[10px]" />
        </div>
        <p className="flex flex-wrap items-center gap-x-2.5 gap-y-0.5 text-xs text-muted-foreground">
          <span>{CATEGORY_LABEL[p.category]}</span>
          <span>{admissionShort(p) ?? priceLabel(p.priceLevel)}</span>
          <span className="inline-flex items-center gap-0.5">
            <Clock className="size-3" aria-hidden /> {p.durationMin}분
          </span>
          {p.reservation.required === "yes" && (
            <span className="inline-flex items-center gap-0.5 font-semibold text-secondary">
              <CalendarCheck className="size-3" aria-hidden /> 예약 필수
            </span>
          )}
          {inItinerary && (
            <span className="inline-flex items-center gap-0.5 font-semibold text-success">
              <Check className="size-3" aria-hidden /> 일정 포함
            </span>
          )}
        </p>
        <TripDaysOpen place={p} compact />
        <input
          value={note}
          onChange={(e) => setNote(e.target.value)}
          onBlur={() => setSavedNote(p.id, note)}
          placeholder="메모 추가 (예: 예약번호)"
          className="h-9 w-full rounded-lg border border-transparent bg-muted/60 px-2.5 text-xs outline-none focus:border-primary focus:bg-card"
          aria-label={`${p.name.ko} 메모`}
        />
      </div>
      <div className="flex flex-col gap-1">
        <Button
          variant={s.mustVisit ? "dark" : "outline"}
          size="icon"
          aria-pressed={s.mustVisit}
          aria-label={s.mustVisit ? `${p.name.ko} 필수 방문 해제` : `${p.name.ko} 필수 방문 지정`}
          onClick={() => toggleMustVisit(p)}
        >
          <Pin className={cn(s.mustVisit && "fill-current")} />
        </Button>
        <Button variant="ghost" size="icon" aria-label={`${p.name.ko} 저장 삭제`} onClick={() => removeSaved(p.id)}>
          <Trash2 />
        </Button>
      </div>
    </li>
  );
}

/** 일정·저장 데이터 JSON 백업/복원 (PRD F10) */
function BackupPanel() {
  const exportData = useTripStore((s) => s.exportData);
  const importData = useTripStore((s) => s.importData);
  const fileRef = useRef<HTMLInputElement>(null);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  const download = () => {
    const blob = new Blob([exportData()], { type: "application/json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `ciao-ai-backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(a.href);
  };

  const onFile = async (file?: File) => {
    if (!file) return;
    try {
      importData(await file.text());
      setMsg({ ok: true, text: "복원했습니다." });
    } catch (e) {
      setMsg({ ok: false, text: e instanceof Error ? e.message : "파일을 읽을 수 없습니다." });
    } finally {
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  return (
    <section className="rounded-2xl border border-dashed p-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-sm font-semibold">백업 · 복원</h2>
          <p className="text-xs text-muted-foreground">데이터는 이 기기 브라우저에 자동 저장됩니다. 기기를 바꾸기 전 백업하세요.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={download}>
            <Download /> 내보내기
          </Button>
          <Button variant="outline" size="sm" onClick={() => fileRef.current?.click()}>
            <Upload /> 가져오기
          </Button>
          <input ref={fileRef} type="file" accept="application/json" hidden onChange={(e) => onFile(e.target.files?.[0])} />
        </div>
      </div>
      {msg && (
        <p role="status" className={`mt-2 text-sm ${msg.ok ? "text-success" : "text-danger"}`}>
          {msg.text}
        </p>
      )}
    </section>
  );
}


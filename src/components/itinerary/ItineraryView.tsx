"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import {
  ArrowDown, ArrowUp, Bus, CalendarDays, ChevronDown, CircleAlert, Footprints, Hotel, Info, Map as MapIcon, Navigation, Plus,
  RefreshCw, Replace, Sparkles, Sunset, Trash2, TriangleAlert, Umbrella, UtensilsCrossed, Wand2,
} from "lucide-react";
import type { City, Place } from "@/types";
import { EmptyState, RowSkeleton } from "@/components/common/states";
import { TierBadge } from "@/components/place/badges";
import { PlacePhoto } from "@/components/place/PlacePhoto";
import { Button, buttonVariants } from "@/components/ui/button";
import { getCityPlaces, getPlaceById } from "@/data/cities";
import { suggestAlternatives } from "@/lib/engine/alternatives";
import type { TravelEstimate } from "@/lib/engine/geo";
import { minutesToHHMM, type DayTimeline, type TimelineEntry, type Warning } from "@/lib/engine/timeline";
import { useHydrated } from "@/lib/hooks/useHydrated";
import { usePlanner } from "@/lib/hooks/usePlanner";
import { googleMapsDirectionsUrl } from "@/lib/services/maps";
import { useTripStore } from "@/lib/store/useTripStore";
import { formatDateKo } from "@/lib/time/dates";
import { hhmmToMin } from "@/lib/time/sun";
import { cn } from "@/lib/utils";

export function ItineraryView({ city }: { city: City }) {
  const hydrated = useHydrated();
  const { leg, itinerary, timelines, generate, savedCount } = usePlanner(city);
  const unscheduled = useTripStore((s) => s.unscheduled[city.id]);
  const clearItinerary = useTripStore((s) => s.clearItinerary);
  const [dayIdx, setDayIdx] = useState(0);
  const [fill, setFill] = useState(true);
  const [msg, setMsg] = useState("");

  if (!hydrated) return <RowSkeleton rows={4} />;
  if (city.status !== "active")
    return <EmptyState icon={CalendarDays} title={`${city.name.ko} 일정은 준비 중입니다`} action={{ href: "/rome/itinerary", label: "로마 일정 보기" }} />;
  if (!itinerary || !leg) return <EmptyState title="여행 날짜를 먼저 설정하세요" action={{ href: `/${city.id}/trip`, label: "여행 설정" }} />;

  const idx = Math.min(dayIdx, itinerary.days.length - 1);
  const day = itinerary.days[idx];
  const tl = timelines[idx];
  const totalItems = itinerary.days.reduce((n, d) => n + d.items.length, 0);
  const hasPlan = totalItems > 0;

  const onGenerate = () => {
    if (hasPlan && !window.confirm("현재 일정을 새로 생성한 일정으로 바꿀까요? (예약 시각을 입력한 장소는 유지됩니다)")) return;
    const { added } = generate({ fillWithRecommendations: fill });
    setMsg(added ? `${added}곳으로 ${itinerary.days.length}일 일정을 만들었어요.` : "배치할 장소가 없습니다. 장소를 저장하거나 '추천 장소로 채우기'를 켜세요.");
  };

  const fillToggle = (
    <label className="flex min-h-11 cursor-pointer items-center gap-2.5 text-sm">
      <input type="checkbox" checked={fill} onChange={(e) => setFill(e.target.checked)} className="size-5 accent-[var(--primary)]" />
      <span>
        저장한 {savedCount}곳 + <strong>추천 장소로 채우기</strong>
      </span>
    </label>
  );

  return (
    <div className="space-y-6">
      {!hasPlan ? (
        /* 첫 생성 카드 */
        <section className="surface overflow-hidden">
          <div className="bg-foreground p-6 text-background md:p-8">
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] opacity-70">Smart Planner</p>
            <h2 className="mt-2 font-serif text-2xl leading-snug md:text-3xl">
              {formatDateKo(leg.startDate)}부터 {itinerary.days.length}일,
              <br />
              동선을 자동으로 짜 드릴게요
            </h2>
            <ul className="mt-4 grid gap-1.5 text-sm opacity-85 sm:grid-cols-2">
              <li>✓ 영업일·운영시간·예약 시각 반영</li>
              <li>✓ 가까운 곳끼리 묶어 이동 최소화</li>
              <li>✓ 점심·저녁과 겨울 일몰 시간 고려</li>
              <li>✓ 필수 방문지는 반드시 포함</li>
            </ul>
          </div>
          <div className="space-y-3 p-5 md:p-6">
            {!leg.lodging && (
              <p className="flex items-start gap-2 rounded-xl bg-warning/10 p-3 text-sm text-warning">
                <Hotel className="mt-0.5 size-4 shrink-0" aria-hidden />
                <span>
                  숙소를 정하면 출발·복귀 이동시간까지 계산돼요.{" "}
                  <Link href={`/${city.id}/trip`} className="font-semibold underline">
                    숙소 설정
                  </Link>
                </span>
              </p>
            )}
            {fillToggle}
            <Button size="lg" className="w-full sm:w-auto" onClick={onGenerate}>
              <Wand2 /> 일정 자동 생성
            </Button>
            {msg && <p className="text-sm text-danger" role="status">{msg}</p>}
          </div>
        </section>
      ) : (
        /* 생성 후 툴바 */
        <section className="surface space-y-3 p-4">
          <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
            <p className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm">
              <span className="flex items-center gap-1.5 font-semibold">
                <CalendarDays className="size-4 text-primary" aria-hidden />
                {formatDateKo(leg.startDate)} – {formatDateKo(leg.endDate)}
              </span>
              <span className="flex items-center gap-1.5 text-muted-foreground">
                <Hotel className="size-4" aria-hidden />
                {leg.lodging ? leg.lodging.name : <span className="text-warning">숙소 미설정</span>}
              </span>
              <Link href={`/${city.id}/trip`} className="text-xs font-semibold text-secondary underline underline-offset-2">
                변경
              </Link>
            </p>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={onGenerate}>
                <RefreshCw /> 다시 생성
              </Button>
              <Button variant="ghost" size="sm" onClick={() => window.confirm("모든 날짜의 일정을 비울까요?") && clearItinerary(city.id)}>
                <Trash2 /> 비우기
              </Button>
            </div>
          </div>
          <details className="text-sm">
            <summary className="flex min-h-9 cursor-pointer items-center gap-1 text-muted-foreground">
              <ChevronDown className="size-4" aria-hidden /> 생성 옵션
            </summary>
            <div className="pt-1">{fillToggle}</div>
          </details>
          {msg && <p className="text-sm font-medium text-success" role="status">{msg}</p>}
          {unscheduled && unscheduled.length > 0 && (
            <details className="rounded-xl bg-warning/8 px-3 py-2 text-sm">
              <summary className="cursor-pointer font-semibold text-warning">일정에 넣지 못한 장소 {unscheduled.length}곳</summary>
              <ul className="mt-1.5 space-y-1 text-xs">
                {unscheduled.map((u) => (
                  <li key={u.placeId}>
                    <Link href={`/${city.id}/place/${u.placeId}`} className="font-semibold underline">
                      {getPlaceById(u.placeId)?.name.ko ?? u.placeId}
                    </Link>{" "}
                    — {u.reason}
                  </li>
                ))}
                <li className="text-muted-foreground">꼭 가야 한다면 My Places에서 &lsquo;필수&rsquo;로 지정 후 다시 생성하세요.</li>
              </ul>
            </details>
          )}
        </section>
      )}

      {/* 일자 선택 (고정) */}
      <div className="sticky top-14 z-20 -mx-4 border-b bg-background/92 px-4 py-2.5 backdrop-blur-md md:top-0 md:mx-0 md:px-0">
        <div role="tablist" aria-label="일자 선택" className="scrollbar-none flex gap-2 overflow-x-auto">
          {itinerary.days.map((d, i) => {
            const errs = countIssues(timelines[i]);
            const n = d.items.length;
            const active = i === idx;
            return (
              <button
                key={d.date}
                role="tab"
                aria-selected={active}
                onClick={() => setDayIdx(i)}
                className={cn(
                  "relative min-w-[92px] shrink-0 rounded-2xl border px-3.5 py-2 text-left transition-colors",
                  active ? "border-foreground bg-foreground text-background" : "bg-card hover:bg-muted",
                )}
              >
                <span className="block text-[11px] font-semibold uppercase tracking-wider opacity-70">
                  Day {i + 1} {d.rainy && "☔"}
                </span>
                <span className="block text-sm font-semibold">{formatDateKo(d.date)}</span>
                <span className="block text-[11px] opacity-70">{n ? `${n}개 일정` : "비어 있음"}</span>
                {errs > 0 && (
                  <span className="absolute -right-1 -top-1 flex size-5 items-center justify-center rounded-full bg-danger text-[10px] font-bold text-white" aria-label={`확인 필요 ${errs}건`}>
                    {errs}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {day && tl && <DayView city={city} dayIndex={idx} timeline={tl} rainy={Boolean(day.rainy)} lodgingSet={Boolean(leg.lodging)} />}
    </div>
  );
}

const countIssues = (tl?: DayTimeline) =>
  tl ? tl.entries.reduce((n, e) => n + e.warnings.filter((w) => w.level !== "info").length, 0) + tl.warnings.length : 0;

function DayView({ city, dayIndex, timeline: tl, rainy, lodgingSet }: { city: City; dayIndex: number; timeline: DayTimeline; rainy: boolean; lodgingSet: boolean }) {
  const { itinerary } = usePlanner(city);
  const s = useTripStore.getState();
  const saved = useTripStore((st) => st.saved);
  const date = tl.date;
  const used = useMemo(() => new Set(itinerary?.days.flatMap((d) => d.items.map((i) => i.placeId)).filter(Boolean) as string[]), [itinerary]);
  const addable = Object.values(saved)
    .filter((x) => x.cityId === city.id && !used.has(x.placeId))
    .map((x) => getPlaceById(x.placeId))
    .filter((p): p is Place => Boolean(p));
  const [addId, setAddId] = useState("");
  const sunsetMin = hhmmToMin(tl.sunset);
  const sunsetIdx = tl.entries.findIndex((e) => e.start >= sunsetMin);
  const directions = googleMapsDirectionsUrl(tl.entries.flatMap((e) => (e.place ? [e.place.location] : [])));
  const first = tl.entries[0];

  const SunsetLine = () => (
    <li className="relative flex items-center gap-2 py-1 pl-14 text-xs font-semibold text-primary">
      <Sunset className="absolute left-[18px] size-4 bg-background" aria-hidden />
      일몰 {tl.sunset}
      <span className="h-px flex-1 bg-primary/30" />
    </li>
  );

  return (
    <section className="space-y-5" aria-label={`Day ${dayIndex + 1} 일정`}>
      {/* 하루 요약 */}
      <div className="surface p-4 md:p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="eyebrow">Day {dayIndex + 1}</p>
            <p className="font-serif text-2xl">{formatDateKo(date)}</p>
          </div>
          <div className="flex gap-2">
            <Link href={`/${city.id}/map?day=${date}`} className={buttonVariants({ variant: "outline", size: "sm" })}>
              <MapIcon /> 지도
            </Link>
            <Button variant={rainy ? "dark" : "outline"} size="sm" aria-pressed={rainy} onClick={() => s.toggleRainy(city.id, date)}>
              <Umbrella /> {rainy ? "비 오는 날" : "비 예보?"}
            </Button>
          </div>
        </div>
        {tl.entries.length > 0 && (
          <dl className="mt-4 grid grid-cols-4 gap-2 text-center">
            <DayStat label="시작" value={first ? minutesToHHMM(first.start) : "-"} />
            <DayStat label="복귀" value={minutesToHHMM(tl.endAt)} />
            <DayStat label="이동" value={`${tl.travelMinutes}분`} />
            <DayStat label="도보" value={`${(tl.walkMeters / 1000).toFixed(1)}km`} />
          </dl>
        )}
        <p className="mt-3 flex items-center gap-1.5 text-xs text-muted-foreground">
          <Sunset className="size-3.5 text-primary" aria-hidden /> 일몰 {tl.sunset}
          <span aria-hidden>·</span> 이동시간은 직선거리 기반 <strong className="font-semibold">간이 추정</strong>
        </p>
        {rainy && <p className="mt-2 text-xs font-medium text-secondary">☔ 비 오는 날: 야외 장소에 경고와 실내 대안이 표시됩니다.</p>}
        {tl.warnings.map((w) => (
          <WarningLine key={w.code} w={w} />
        ))}
      </div>

      {tl.entries.length === 0 ? (
        <EmptyState
          icon={CalendarDays}
          title={`${formatDateKo(date)}은 아직 비어 있어요`}
          description="위의 '일정 자동 생성'을 누르거나, 아래에서 저장한 장소·식사를 직접 추가하세요."
        />
      ) : (
        <ol className="relative">
          {/* 세로 레일 */}
          <span className="absolute bottom-4 left-[25px] top-4 w-px bg-border" aria-hidden />
          {lodgingSet && (
            <li className="relative flex items-center gap-3 pb-3 pl-14 text-sm text-muted-foreground">
              <span className="absolute left-[13px] flex size-6 items-center justify-center rounded-full border bg-card">
                <Hotel className="size-3.5" aria-hidden />
              </span>
              숙소 출발
            </li>
          )}
          {tl.entries.map((e, i) => (
            <li key={e.item.id}>
              <ol>
                {i === sunsetIdx && <SunsetLine />}
                {e.travel && <TravelChip t={e.travel} />}
                <li className="relative pb-3 pl-14">
                  <span
                    className={cn(
                      "absolute left-[11px] top-4 flex size-[30px] items-center justify-center rounded-full border-2 border-background text-xs font-bold",
                      e.item.kind === "meal" ? "bg-muted text-foreground" : "bg-foreground text-background",
                    )}
                    aria-hidden
                  >
                    {e.item.kind === "meal" ? <UtensilsCrossed className="size-3.5" /> : i + 1}
                  </span>
                  <EntryCard
                    city={city}
                    date={date}
                    entry={e}
                    anchor={tl.entries.slice(0, i).reverse().find((x) => x.place)?.place ?? tl.entries.slice(i + 1).find((x) => x.place)?.place}
                    index={i}
                    count={tl.entries.length}
                    rainy={rainy}
                    used={used}
                    days={itinerary?.days.map((d) => d.date) ?? []}
                  />
                </li>
              </ol>
            </li>
          ))}
          {sunsetIdx === -1 && <SunsetLine />}
          {tl.returnTravel && (
            <>
              <TravelChip t={tl.returnTravel} />
              <li className="relative flex items-center gap-3 pl-14 text-sm text-muted-foreground">
                <span className="absolute left-[13px] flex size-6 items-center justify-center rounded-full border bg-card">
                  <Hotel className="size-3.5" aria-hidden />
                </span>
                숙소 도착 <strong className="text-foreground">{minutesToHHMM(tl.endAt)}</strong>
              </li>
            </>
          )}
        </ol>
      )}

      {/* 추가 */}
      <div className="surface space-y-3 p-4">
        <p className="eyebrow">이 날에 추가</p>
        <div className="flex gap-2">
          <select value={addId} onChange={(e) => setAddId(e.target.value)} className="input min-w-0 flex-1" aria-label="저장한 장소 추가">
            <option value="">{addable.length ? "저장한 장소 선택…" : "추가할 저장 장소 없음"}</option>
            {addable.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name.ko}
              </option>
            ))}
          </select>
          <Button disabled={!addId} onClick={() => { s.addToDay(city.id, date, addId); setAddId(""); }}>
            <Plus /> 추가
          </Button>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button size="sm" variant="subtle" onClick={() => s.addMeal(city.id, date, "lunch")}>
            <UtensilsCrossed /> 점심 슬롯
          </Button>
          <Button size="sm" variant="subtle" onClick={() => s.addMeal(city.id, date, "dinner")}>
            <UtensilsCrossed /> 저녁 슬롯
          </Button>
          <Link href={`/${city.id}/explore`} className={buttonVariants({ size: "sm", variant: "ghost" })}>
            장소 더 찾기
          </Link>
        </div>
      </div>

      {directions && (
        <a href={directions} target="_blank" rel="noreferrer" className={buttonVariants({ variant: "dark", size: "lg", className: "w-full" })}>
          <Navigation /> 이 순서로 Google 지도 길찾기
        </a>
      )}
    </section>
  );
}

function DayStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl bg-muted/70 px-1 py-2">
      <dt className="text-[11px] text-muted-foreground">{label}</dt>
      <dd className="text-sm font-semibold">{value}</dd>
    </div>
  );
}

function TravelChip({ t }: { t: TravelEstimate }) {
  const Icon = t.mode === "walk" ? Footprints : Bus;
  return (
    <li className="relative flex items-center gap-1.5 py-1.5 pl-14 text-xs text-muted-foreground">
      <Icon className="size-3.5" aria-hidden />
      {t.mode === "walk" ? "도보" : "대중교통·택시"} 약 {t.minutes}분 · {(t.meters / 1000).toFixed(1)}km
    </li>
  );
}

function WarningLine({ w }: { w: Warning }) {
  const Icon = w.level === "error" ? CircleAlert : w.level === "warn" ? TriangleAlert : Info;
  return (
    <p className={cn("mt-1.5 flex items-start gap-1.5 text-xs leading-snug", w.level === "error" ? "font-semibold text-danger" : w.level === "warn" ? "text-warning" : "text-muted-foreground")}>
      <Icon className="mt-px size-3.5 shrink-0" aria-hidden />
      <span>
        {w.code === "closed_day" || w.code === "arrive_after_close" || w.code === "too_short" ? "방문 불가: " : w.code === "booking_late" ? "시간 충돌: " : ""}
        {w.message}
      </span>
    </p>
  );
}

function EntryCard({
  city, date, entry: e, anchor, index, count, rainy, used, days,
}: {
  city: City; date: string; entry: TimelineEntry; anchor?: Place; index: number; count: number; rainy: boolean; used: Set<string>; days: string[];
}) {
  const s = useTripStore.getState();
  const hasProblem = e.warnings.some((w) => w.level !== "info");
  const needsAlt = hasProblem || (rainy && e.place && !e.place.indoor);
  const [editing, setEditing] = useState(false);
  const [showAlt, setShowAlt] = useState(false);
  const isMeal = e.item.kind === "meal";
  const mealLabel = e.item.meal === "dinner" || e.item.note === "dinner" ? "저녁" : e.item.meal === "lunch" || e.item.note === "lunch" ? "점심" : null;

  const alts = useMemo(() => {
    if (!showAlt) return [];
    const pool = getCityPlaces(city.id);
    if (isMeal || !e.place) {
      const base = e.place ?? anchor ?? pool.find((p) => p.category === "food");
      if (!base) return [];
      return suggestAlternatives({ ...base, id: "__meal__", category: "food" }, date, pool, { excludeIds: used, limit: 3 });
    }
    return suggestAlternatives(e.place, date, pool, { excludeIds: used, rainy, limit: 3 });
  }, [showAlt, city.id, isMeal, e.place, anchor, date, used, rainy]);

  return (
    <div className={cn("surface overflow-hidden", hasProblem && "border-danger/40")}>
      <div className="flex gap-3 p-3">
        {e.place && !isMeal ? (
          <Link href={`/${city.id}/place/${e.place.id}`} className="shrink-0 overflow-hidden rounded-xl" aria-label={`${e.place.name.ko} 상세`}>
            <PlacePhoto place={e.place} className="size-[72px] [&_span]:hidden" />
          </Link>
        ) : null}
        <div className="min-w-0 flex-1">
          <p className="text-xs font-semibold text-muted-foreground">
            <span className="text-foreground">{minutesToHHMM(e.start)}</span> – {minutesToHHMM(e.end)}
            {e.item.fixedTime && <span className="ml-1.5 rounded bg-secondary/12 px-1.5 py-0.5 text-[10px] text-secondary">예약 {e.item.fixedTime}</span>}
            {mealLabel && !isMeal && <span className="ml-1.5 rounded bg-muted px-1.5 py-0.5 text-[10px]">{mealLabel}</span>}
          </p>
          {isMeal ? (
            <p className="mt-0.5 font-semibold">{mealLabel} · 주변 식당 자유</p>
          ) : e.place ? (
            <div className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-1">
              <Link href={`/${city.id}/place/${e.place.id}`} className="font-serif text-[1.1rem] leading-snug hover:underline">
                {e.place.name.ko}
              </Link>
              <TierBadge tier={e.place.tier} className="px-2 text-[10px]" />
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">삭제된 장소</p>
          )}
          {e.start > e.arrive + 5 && (
            <p className="mt-0.5 text-xs text-muted-foreground">
              {minutesToHHMM(e.arrive)} 도착 · {e.start - e.arrive}분 여유
            </p>
          )}
          {e.warnings.map((w) => (
            <WarningLine key={w.code} w={w} />
          ))}
          {(needsAlt || isMeal) && !editing && (
            <Button size="sm" variant={needsAlt ? "default" : "subtle"} className="mt-2" onClick={() => setShowAlt(!showAlt)}>
              {isMeal ? <Sparkles /> : <Replace />} {isMeal ? "근처 추천 식당" : "대안 장소 보기"}
            </Button>
          )}
        </div>
        <div className="-my-1 -mr-1 flex flex-col">
          <Button variant="ghost" size="icon" aria-label="위로 이동" disabled={index === 0} onClick={() => s.moveItem(city.id, date, e.item.id, -1)}>
            <ArrowUp />
          </Button>
          <Button variant="ghost" size="icon" aria-label="아래로 이동" disabled={index === count - 1} onClick={() => s.moveItem(city.id, date, e.item.id, 1)}>
            <ArrowDown />
          </Button>
        </div>
      </div>

      {/* 편집 패널 */}
      <div className="border-t bg-muted/40">
        <button
          type="button"
          onClick={() => setEditing(!editing)}
          aria-expanded={editing}
          className="flex h-10 w-full items-center justify-center gap-1 text-xs font-semibold text-muted-foreground hover:text-foreground"
          aria-label={editing ? "편집 닫기" : "예약 시각·날짜 이동·교체·삭제 편집"}
        >
          <ChevronDown className={cn("size-3.5 transition-transform", editing && "rotate-180")} aria-hidden />
          {editing ? "닫기" : "편집"}
        </button>
        {editing && (
          <div className="flex flex-wrap items-end gap-2 px-3 pb-3">
            {!isMeal && (
              <label className="flex flex-col gap-1 text-[11px] font-semibold text-muted-foreground">
                예약 시각
                <input type="time" value={e.item.fixedTime ?? ""} onChange={(ev) => s.setFixedTime(city.id, date, e.item.id, ev.target.value)} className="input h-10 w-32" />
              </label>
            )}
            <label className="flex flex-col gap-1 text-[11px] font-semibold text-muted-foreground">
              다른 날로
              <select value={date} onChange={(ev) => s.moveToDay(city.id, date, e.item.id, ev.target.value)} className="input h-10">
                {days.map((d, i) => (
                  <option key={d} value={d}>
                    {d === date ? "현재 날짜" : `Day ${i + 1} · ${formatDateKo(d)}`}
                  </option>
                ))}
              </select>
            </label>
            <Button size="sm" variant="outline" className="h-10" onClick={() => setShowAlt(!showAlt)}>
              {isMeal ? <Sparkles /> : <Replace />} {isMeal ? "식당 추천" : "대안"}
            </Button>
            <Button size="sm" variant="ghost" className="h-10 text-danger" onClick={() => s.removeFromDay(city.id, date, e.item.id)}>
              <Trash2 /> 삭제
            </Button>
          </div>
        )}
      </div>

      {showAlt && (
        <div className="space-y-2 border-t bg-card p-3">
          <p className="eyebrow">{isMeal ? "이 근처 추천 식당" : rainy ? "실내 대안" : "같은 날 갈 수 있는 대안"}</p>
          {alts.length === 0 ? (
            <p className="text-xs text-muted-foreground">
              {isMeal ? "이 날 영업하는 추천 식당이 모두 일정에 포함되어 있습니다. 주변 식당을 자유롭게 이용하세요." : "이 날 영업하는 조건에 맞는 대안이 없습니다 (이미 일정에 포함된 장소 제외)."}
            </p>
          ) : (
            alts.map((a) => (
              <div key={a.place.id} className="flex items-center gap-3">
                <PlacePhoto place={a.place} className="size-12 shrink-0 rounded-lg [&_span]:hidden" />
                <div className="min-w-0 flex-1">
                  <Link href={`/${city.id}/place/${a.place.id}`} className="text-sm font-semibold hover:underline">
                    {a.place.name.ko}
                  </Link>
                  <p className="text-xs text-muted-foreground">{a.reason}</p>
                </div>
                <Button size="sm" variant="outline" onClick={() => { s.replaceItemPlace(city.id, date, e.item.id, a.place.id); setShowAlt(false); }}>
                  {isMeal ? "지정" : "교체"}
                </Button>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}

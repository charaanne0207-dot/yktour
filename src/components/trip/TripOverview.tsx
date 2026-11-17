"use client";

import Link from "next/link";
import { ArrowRight, CalendarDays, Check, Heart, Hotel, MapPinned, Pin } from "lucide-react";
import type { City } from "@/types";
import { buttonVariants } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/misc";
import { useHydrated } from "@/lib/hooks/useHydrated";
import { useItinerary, useTripStore } from "@/lib/store/useTripStore";
import { cn } from "@/lib/utils";

const fmtLong = (iso: string) => {
  const d = new Date(`${iso}T12:00:00Z`);
  return `${d.getUTCMonth() + 1}월 ${d.getUTCDate()}일`;
};

function dday(start: string) {
  const today = new Date();
  const t = Date.UTC(today.getFullYear(), today.getMonth(), today.getDate());
  const s = Date.parse(`${start}T00:00:00Z`);
  const diff = Math.round((s - t) / 86400000);
  return diff > 0 ? `D-${diff}` : diff === 0 ? "D-Day" : "여행 중";
}

/** 홈: 여행 개요 + 다음 할 일 (탐색 → 저장 → 일정 생성 → 지도) */
export function TripOverview({ city }: { city: City }) {
  const hydrated = useHydrated();
  const { leg, itinerary } = useItinerary(city.id);
  const onboarded = useTripStore((s) => s.onboarded);
  const saved = useTripStore((s) => s.saved);

  if (!hydrated || !leg) return <Skeleton className="h-56" />;

  const savedHere = Object.values(saved).filter((s) => s.cityId === city.id);
  const mustCount = savedHere.filter((s) => s.mustVisit).length;
  const scheduled = itinerary?.days.reduce((n, d) => n + d.items.filter((i) => i.placeId).length, 0) ?? 0;
  const days = itinerary?.days.length ?? 0;
  const base = `/${city.id}`;

  const steps = [
    { done: onboarded, label: "여행 설정", desc: "날짜·숙소·취향", href: `${base}/trip` },
    { done: savedHere.length > 0, label: "장소 저장", desc: "마음에 드는 곳 ♡", href: `${base}/explore` },
    { done: scheduled > 0, label: "일정 생성", desc: "자동으로 동선 구성", href: `${base}/itinerary` },
  ];
  const next = steps.find((s) => !s.done);
  const cta = next
    ? { href: next.href, label: next.label === "여행 설정" ? "여행 설정 시작하기" : next.label === "장소 저장" ? "가볼 곳 고르기" : "일정 자동 생성하기" }
    : { href: `${base}/itinerary`, label: "내 일정 보기" };

  return (
    <section aria-label="내 여행 개요" className="surface relative overflow-hidden p-5 md:p-7">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="eyebrow">My Trip</p>
          <p className="mt-1 font-serif text-2xl leading-tight md:text-[1.75rem]">
            {fmtLong(leg.startDate)} – {fmtLong(leg.endDate)}
          </p>
          <p className="mt-1 flex items-center gap-1.5 text-sm text-muted-foreground">
            <CalendarDays className="size-4" aria-hidden /> {Math.max(days - 1, 0)}박 {days}일
            <span aria-hidden>·</span>
            <Hotel className="size-4" aria-hidden /> {leg.lodging?.name ?? "숙소 미정"}
          </p>
        </div>
        <span className="rounded-full bg-primary px-3 py-1 text-sm font-semibold text-primary-foreground">{dday(leg.startDate)}</span>
      </div>

      <dl className="mt-5 grid grid-cols-3 divide-x rounded-2xl bg-muted/70 py-3 text-center">
        <Stat Icon={Heart} label="저장" value={savedHere.length} />
        <Stat Icon={Pin} label="필수 방문" value={mustCount} />
        <Stat Icon={MapPinned} label="일정 장소" value={scheduled} />
      </dl>

      <ol className="mt-5 grid gap-2 sm:grid-cols-3">
        {steps.map((s, i) => (
          <li key={s.label}>
            <Link
              href={s.href}
              className={cn(
                "flex h-full items-center gap-3 rounded-xl border px-3 py-2.5 text-sm transition-colors hover:bg-muted",
                next === s && "border-primary/50 bg-primary/5",
              )}
            >
              <span
                className={cn(
                  "flex size-7 shrink-0 items-center justify-center rounded-full text-xs font-bold",
                  s.done ? "bg-success text-white" : next === s ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground",
                )}
                aria-hidden
              >
                {s.done ? <Check className="size-4" /> : i + 1}
              </span>
              <span>
                <span className="block font-semibold">{s.label}</span>
                <span className="text-xs text-muted-foreground">{s.done ? "완료" : s.desc}</span>
              </span>
            </Link>
          </li>
        ))}
      </ol>

      <Link href={cta.href} className={buttonVariants({ size: "lg", className: "mt-5 w-full sm:w-auto" })}>
        {cta.label} <ArrowRight />
      </Link>
    </section>
  );
}

function Stat({ Icon, label, value }: { Icon: typeof Heart; label: string; value: number }) {
  return (
    <div className="px-2">
      <dt className="flex items-center justify-center gap-1 text-xs text-muted-foreground">
        <Icon className="size-3.5" aria-hidden /> {label}
      </dt>
      <dd className="mt-0.5 font-serif text-2xl">{value}</dd>
    </div>
  );
}

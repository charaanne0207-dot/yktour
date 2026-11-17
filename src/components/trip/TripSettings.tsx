"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Check, Hotel } from "lucide-react";
import type { City, Interest, Pace } from "@/types";
import { ListSkeleton } from "@/components/common/states";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/misc";
import { getLodgingPresets } from "@/data/cities";
import { INTERESTS, interestLabel } from "@/lib/engine/recommend";
import { PACE_CAPACITY } from "@/lib/engine/generate";
import { useHydrated } from "@/lib/hooks/useHydrated";
import { useItinerary, useTripStore } from "@/lib/store/useTripStore";
import { cn } from "@/lib/utils";

const PACE_LABEL: Record<Pace, string> = { relaxed: "여유", normal: "보통", packed: "빡빡" };

export function TripSettings({ city }: { city: City }) {
  const hydrated = useHydrated();
  const router = useRouter();
  const { leg } = useItinerary(city.id);
  const prefs = useTripStore((s) => s.trip.prefs);
  const { setPrefs, setLegDates, setLodging, completeOnboarding } = useTripStore.getState();
  const presets = getLodgingPresets(city.id);
  const [custom, setCustom] = useState({ name: "", lat: "", lng: "" });
  const [customErr, setCustomErr] = useState("");

  if (!hydrated) return <ListSkeleton rows={3} />;

  const start = leg?.startDate ?? "2027-01-28";
  const end = leg?.endDate ?? "2027-01-31";
  const lodging = leg?.lodging;

  /** 날짜 변경 시 범위 밖으로 빠지는 일정이 있으면 확인 후 적용 */
  const changeDates = (nextStart: string, nextEnd: string) => {
    if (!nextStart || !nextEnd || nextStart > nextEnd) return;
    const days = useTripStore.getState().itineraries[city.id]?.days ?? [];
    const lost = days.filter((d) => d.date < nextStart || d.date > nextEnd).reduce((n, d) => n + d.items.length, 0);
    if (lost > 0 && !window.confirm(`변경한 기간 밖에 있는 일정 ${lost}개가 삭제됩니다. 계속할까요?`)) return;
    setLegDates(city.id, nextStart, nextEnd);
  };

  const saveCustom = () => {
    const lat = Number(custom.lat);
    const lng = Number(custom.lng);
    if (!custom.name.trim() || !Number.isFinite(lat) || !Number.isFinite(lng) || Math.abs(lat - city.center.lat) > 0.5 || Math.abs(lng - city.center.lng) > 0.5) {
      setCustomErr(`이름과 ${city.name.ko} 시내 좌표(위도·경도)를 입력하세요. Google 지도에서 숙소를 길게 눌러 좌표를 복사할 수 있습니다.`);
      return;
    }
    setCustomErr("");
    setLodging(city.id, { name: custom.name.trim(), lat, lng });
  };

  return (
    <div className="space-y-5">
      <Section title="여행 날짜" desc={`${city.name.ko} 체류 기간 (최대 21일)`}>
        <div className="flex flex-wrap gap-3">
          <Field label="도착">
            <input type="date" value={start} onChange={(e) => e.target.value && changeDates(e.target.value, end < e.target.value ? e.target.value : end)} className="input" />
          </Field>
          <Field label="출발">
            <input type="date" value={end} min={start} onChange={(e) => e.target.value && changeDates(start, e.target.value)} className="input" />
          </Field>
          <Field label="하루 시작">
            <input type="time" value={prefs.dayStart} onChange={(e) => e.target.value && e.target.value < prefs.dayEnd && setPrefs({ dayStart: e.target.value })} className="input" />
          </Field>
          <Field label="하루 종료(숙소 복귀)">
            <input type="time" value={prefs.dayEnd} onChange={(e) => e.target.value && e.target.value > prefs.dayStart && setPrefs({ dayEnd: e.target.value })} className="input" />
          </Field>
        </div>
      </Section>

      <Section title="숙소" desc="일정 출발·복귀 지점이며 거리 계산에 사용됩니다.">
        {lodging && (
          <p className="mb-3 flex items-center gap-2 text-sm">
            <Hotel className="size-4 text-primary" aria-hidden /> 현재: <strong>{lodging.name}</strong>
            <span className="text-xs text-muted-foreground">({lodging.lat.toFixed(4)}, {lodging.lng.toFixed(4)}){lodging.presetId && " · 지역 대표 지점"}</span>
          </p>
        )}
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {presets.map((p) => {
            const active = lodging?.presetId === p.presetId;
            return (
              <button
                key={p.presetId}
                type="button"
                aria-pressed={active}
                onClick={() => setLodging(city.id, { name: p.name, lat: p.lat, lng: p.lng, presetId: p.presetId })}
                className={cn("rounded-xl border p-3 text-left text-sm", active ? "border-primary bg-primary/10" : "bg-card hover:bg-muted")}
              >
                <span className="flex items-center gap-1 font-medium">
                  {active && <Check className="size-4 text-primary" />} {p.name}
                </span>
                <span className="text-xs text-muted-foreground">{p.desc}</span>
              </button>
            );
          })}
        </div>
        <details className="mt-3 text-sm">
          <summary className="cursor-pointer text-secondary">정확한 숙소 좌표 직접 입력</summary>
          <div className="mt-2 flex flex-wrap items-end gap-2">
            <Field label="숙소 이름">
              <input value={custom.name} onChange={(e) => setCustom({ ...custom, name: e.target.value })} className="input" placeholder="Hotel ..." />
            </Field>
            <Field label="위도">
              <input value={custom.lat} onChange={(e) => setCustom({ ...custom, lat: e.target.value })} className="input w-32" inputMode="decimal" placeholder="41.9" />
            </Field>
            <Field label="경도">
              <input value={custom.lng} onChange={(e) => setCustom({ ...custom, lng: e.target.value })} className="input w-32" inputMode="decimal" placeholder="12.48" />
            </Field>
            <Button size="sm" onClick={saveCustom}>저장</Button>
          </div>
          {customErr && <p className="mt-1 text-xs text-danger">{customErr}</p>}
        </details>
      </Section>

      <Section title="관심사" desc="추천 정렬과 자동 일정 후보 선정에 반영됩니다.">
        <div className="flex flex-wrap gap-2">
          {INTERESTS.map((i: Interest) => {
            const on = prefs.interests.includes(i);
            return (
              <button
                key={i}
                type="button"
                aria-pressed={on}
                onClick={() => setPrefs({ interests: on ? prefs.interests.filter((x) => x !== i) : [...prefs.interests, i] })}
                className={cn("h-9 rounded-full border px-3.5 text-sm", on ? "border-primary bg-primary text-primary-foreground" : "bg-card")}
              >
                {interestLabel(i)}
              </button>
            );
          })}
        </div>
      </Section>

      <div className="grid gap-5 md:grid-cols-2">
        <Section title="여행 스타일" desc="하루 관광 장소 수 (식사 제외)">
          <div className="flex gap-2">
            {(Object.keys(PACE_LABEL) as Pace[]).map((p) => (
              <button
                key={p}
                type="button"
                aria-pressed={prefs.pace === p}
                onClick={() => setPrefs({ pace: p })}
                className={cn("flex-1 rounded-xl border p-3 text-sm", prefs.pace === p ? "border-primary bg-primary/10 font-semibold" : "bg-card")}
              >
                {PACE_LABEL[p]}
                <span className="block text-xs text-muted-foreground">하루 {PACE_CAPACITY[p]}곳</span>
              </button>
            ))}
          </div>
        </Section>
        <Section title="예산" desc="장소 가격대 기준">
          <div className="flex gap-2">
            {([1, 2, 3, 4] as const).map((b) => (
              <button
                key={b}
                type="button"
                aria-pressed={prefs.budget === b}
                onClick={() => setPrefs({ budget: b })}
                className={cn("flex-1 rounded-xl border p-3 text-sm", prefs.budget === b ? "border-primary bg-primary/10 font-semibold" : "bg-card")}
              >
                {"€".repeat(b)}
              </button>
            ))}
          </div>
        </Section>
      </div>

      <div className="flex flex-wrap gap-2">
        <Button
          onClick={() => {
            completeOnboarding();
            router.push(`/${city.id}/explore?sort=recommended`);
          }}
        >
          설정 완료 · 맞춤 추천 보기
        </Button>
        <Button
          variant="outline"
          onClick={() => {
            completeOnboarding();
            router.push(`/${city.id}/itinerary`);
          }}
        >
          일정으로 이동
        </Button>
      </div>
      <p className="text-xs text-muted-foreground">모든 변경 사항은 이 기기에 자동 저장됩니다.</p>
    </div>
  );
}

function Section({ title, desc, children }: { title: string; desc?: string; children: React.ReactNode }) {
  return (
    <Card className="p-4 md:p-5">
      <h2 className="font-serif text-lg">{title}</h2>
      {desc && <p className="mb-3 text-xs text-muted-foreground">{desc}</p>}
      {children}
    </Card>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="flex flex-col gap-1 text-xs text-muted-foreground">
      {label}
      {children}
    </label>
  );
}

"use client";

import { useEffect, useState } from "react";
import { FlaskConical, Star } from "lucide-react";
import type { GoogleEnrichment } from "@/lib/services/places";
import { Card, Skeleton } from "@/components/ui/misc";

type State =
  | { status: "loading" }
  | { status: "demo" }
  | { status: "error"; message: string }
  | { status: "live"; google: GoogleEnrichment | null };

/** Google Places 평점·사진·운영시간 (키 없으면 DEMO MODE 안내 — 가짜 값을 만들지 않음) */
export function GoogleInfo({ placeId }: { placeId: string }) {
  const [state, setState] = useState<State>({ status: "loading" });

  useEffect(() => {
    const ctrl = new AbortController();
    fetch(`/api/places/${placeId}`, { signal: ctrl.signal })
      .then(async (r) => {
        const j = await r.json();
        if (j.mode === "demo") setState({ status: "demo" });
        else if (j.mode === "live") setState({ status: "live", google: j.google });
        else setState({ status: "error", message: j.error ?? `HTTP ${r.status}` });
      })
      .catch((e) => !ctrl.signal.aborted && setState({ status: "error", message: String(e) }));
    return () => ctrl.abort();
  }, [placeId]);

  if (state.status === "loading") return <Skeleton className="h-20" />;

  if (state.status === "demo")
    return (
      <div className="flex gap-2.5 rounded-xl bg-warning/8 px-3.5 py-3 text-sm">
        <FlaskConical className="mt-0.5 size-4 shrink-0 text-warning" aria-hidden />
        <p className="text-xs leading-relaxed text-muted-foreground">
          <strong className="text-warning">DEMO · Google 평점 미연동</strong> — 평점·리뷰 수는 <code>GOOGLE_PLACES_API_KEY</code> 설정 후 실제 데이터로
          표시됩니다. 임의의 값은 보여 주지 않아요.
        </p>
      </div>
    );

  if (state.status === "error")
    return <Card className="p-4 text-sm text-danger">Google Places 정보를 불러오지 못했습니다 ({state.message}). 큐레이션 정보만 표시합니다.</Card>;

  const g = state.google;
  if (!g) return <Card className="p-4 text-sm text-muted-foreground">Google Places에서 일치하는 장소를 찾지 못했습니다.</Card>;

  return (
    <Card className="space-y-3 p-4">
      <div className="flex flex-wrap items-center gap-3 text-sm">
        {g.rating !== undefined && (
          <span className="flex items-center gap-1 font-semibold">
            <Star className="size-4 fill-recommended text-recommended" aria-hidden /> {g.rating.toFixed(1)}
            <span className="font-normal text-muted-foreground">
              ({g.userRatingCount?.toLocaleString()}개 리뷰{(g.userRatingCount ?? 0) < 50 ? " · 표본 적음" : ""})
            </span>
          </span>
        )}
        <span className="text-xs text-muted-foreground">Google Places · {g.fetchedAt.slice(0, 10)} 조회</span>
      </div>
      {g.photos.length > 0 && (
        <div className="scrollbar-none flex gap-2 overflow-x-auto">
          {g.photos.map((p) => (
            <figure key={p.name} className="shrink-0">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={`/api/places/photo?name=${encodeURIComponent(p.name)}`} alt="" className="h-36 w-52 rounded-xl object-cover" loading="lazy" />
              <figcaption className="mt-0.5 text-[10px] text-muted-foreground">
                {p.attributions.map((a) => a.displayName).join(", ") || "Google"}
              </figcaption>
            </figure>
          ))}
        </div>
      )}
      {g.weekdayDescriptions && (
        <details className="text-sm">
          <summary className="cursor-pointer text-secondary">Google 기준 운영시간 (큐레이션과 교차 확인)</summary>
          <ul className="mt-1 text-xs text-muted-foreground">
            {g.weekdayDescriptions.map((d) => (
              <li key={d}>{d}</li>
            ))}
          </ul>
        </details>
      )}
    </Card>
  );
}

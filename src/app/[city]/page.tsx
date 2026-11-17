import Link from "next/link";
import { ArrowRight, Coffee, ExternalLink, Eye, Gem, Hourglass, Landmark, ShoppingBag, UtensilsCrossed } from "lucide-react";
import type { Category } from "@/types";
import { EmptyState } from "@/components/common/states";
import { WeatherStrip } from "@/components/common/WeatherStrip";
import { PhotoCredit } from "@/components/place/PlacePhoto";
import { PlaceCard } from "@/components/place/PlaceCard";
import { TripOverview } from "@/components/trip/TripOverview";
import { Badge, SectionHeader } from "@/components/ui/misc";
import { getCityEvents, getCityPlaces } from "@/data/cities";
import { resolveCity } from "@/lib/city";
import { CATEGORY_LABEL, CATEGORY_ORDER, TIER_LABEL, TIER_ORDER } from "@/lib/labels";
import { placesService } from "@/lib/services/places";

const EVENT_STATUS = { confirmed: "공식 확인", expected: "정기 일정 기반 예상", check: "일정표 확인 필요" } as const;
const EVENT_KIND = { "free-entry": "무료 입장", exhibition: "전시", performance: "공연", sale: "쇼핑", festival: "축제" } as const;
const CATEGORY_ICON: Record<Category, typeof Landmark> = {
  sight: Landmark,
  food: UtensilsCrossed,
  cafe: Coffee,
  shopping: ShoppingBag,
  hidden: Gem,
  viewpoint: Eye,
};
const TIER_DESC = {
  must: "놓치면 후회할 로마의 대표 장면",
  recommended: "취향이 맞는다면 꼭 들러 볼 곳",
  hidden: "관광객이 드문 로컬의 공간",
} as const;

export default async function CityHome({ params }: { params: Promise<{ city: string }> }) {
  const city = resolveCity((await params).city);
  const events = getCityEvents(city.id);
  const base = `/${city.id}`;
  const counts = Object.fromEntries(CATEGORY_ORDER.map((c) => [c, getCityPlaces(city.id).filter((p) => p.category === c).length]));
  const hero = city.heroPhoto;

  return (
    <div className="space-y-12 md:space-y-16">
      {/* 히어로 */}
      <section className="-mx-4 -mt-5 md:mx-0 md:mt-0">
        <div className="relative h-[52vh] min-h-[340px] overflow-hidden bg-[#2b2420] md:h-[440px] md:rounded-3xl">
          {hero && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={hero.url} alt={`${city.name.ko} 풍경`} className="absolute inset-0 size-full object-cover" fetchPriority="high" />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-[#1b1411]/90 via-[#1b1411]/25 to-transparent" aria-hidden />
          <div className="absolute inset-x-0 bottom-0 p-6 text-white md:p-10">
            <p className="text-[11px] font-semibold uppercase tracking-[0.3em] text-white/80">
              {city.name.local} · {city.country === "IT" ? "Italia" : "España"}
            </p>
            <h1 className="mt-2 font-serif text-5xl leading-none md:text-7xl">{city.name.ko}</h1>
            <p className="mt-3 max-w-md text-[15px] text-white/90">{city.tagline}</p>
          </div>
        </div>
        <PhotoCredit photo={hero} className="mt-2 px-4 md:px-1" />
      </section>

      {city.status === "coming-soon" ? (
        <EmptyState
          icon={Hourglass}
          title={`${city.name.ko} 큐레이션 준비 중`}
          description="로마에서 검증을 마친 뒤 순차적으로 추가됩니다. 그동안 로마 일정을 먼저 완성해 보세요."
          action={{ href: "/rome", label: "로마 보러 가기" }}
        />
      ) : (
        <>
          <div className="-mt-6 md:-mt-8">
            <TripOverview city={city} />
          </div>

          <WeatherStrip city={city} />

          <section aria-labelledby="cat-title">
            <SectionHeader id="cat-title" eyebrow="Explore" title="무엇을 찾고 있나요?" />
            <ul className="grid grid-cols-3 gap-2.5 md:grid-cols-6">
              {CATEGORY_ORDER.map((c) => {
                const Icon = CATEGORY_ICON[c];
                return (
                  <li key={c}>
                    <Link
                      href={`${base}/explore?category=${c}`}
                      className="surface flex h-full flex-col items-center gap-2 px-2 py-4 text-center transition-colors hover:bg-muted"
                    >
                      <Icon className="size-6 text-primary" aria-hidden />
                      <span className="text-sm font-semibold">{CATEGORY_LABEL[c]}</span>
                      <span className="text-[11px] text-muted-foreground">{counts[c]}곳</span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </section>

          {TIER_ORDER.map((tier) => {
            const places = placesService.byTier(city.id, tier);
            if (!places.length) return null;
            return (
              <section key={tier} aria-labelledby={`tier-${tier}`}>
                <SectionHeader
                  id={`tier-${tier}`}
                  eyebrow={TIER_LABEL[tier]}
                  title={TIER_DESC[tier]}
                  action={
                    <Link href={`${base}/explore?tier=${tier}`} className="flex shrink-0 items-center gap-1 text-sm font-semibold text-secondary">
                      전체 <ArrowRight className="size-4" />
                    </Link>
                  }
                />
                <div className="scrollbar-none -mx-4 flex snap-x snap-mandatory gap-3 overflow-x-auto px-4 pb-2 md:mx-0 md:grid md:grid-cols-3 md:gap-5 md:overflow-visible md:px-0 lg:grid-cols-4">
                  {places.slice(0, 8).map((p) => (
                    <PlaceCard key={p.id} place={p} compact className="w-[72%] shrink-0 snap-start sm:w-64 md:w-auto" />
                  ))}
                </div>
              </section>
            );
          })}

          {events.length > 0 && (
            <section aria-labelledby="events-title">
              <SectionHeader id="events-title" eyebrow="Local Calendar" title="여행 기간 행사·전시·공연" />
              <ul className="surface divide-y">
                {events.map((e) => {
                  const d = new Date(`${e.start}T12:00:00Z`);
                  return (
                    <li key={e.id} className="flex gap-4 p-4">
                      <div className="w-14 shrink-0 rounded-xl bg-muted py-2 text-center">
                        <p className="text-[11px] font-semibold text-muted-foreground">{d.getUTCMonth() + 1}월</p>
                        <p className="font-serif text-2xl leading-none">{d.getUTCDate()}</p>
                      </div>
                      <div className="min-w-0 flex-1 space-y-1">
                        <div className="flex flex-wrap items-center gap-1.5">
                          <Badge className="bg-muted text-foreground">{EVENT_KIND[e.kind]}</Badge>
                          <Badge className={e.status === "confirmed" ? "bg-success/12 text-success" : "bg-warning/12 text-warning"}>{EVENT_STATUS[e.status]}</Badge>
                        </div>
                        <p className="font-semibold leading-snug">{e.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {e.end !== e.start && `${e.start.slice(5).replace("-", "/")} – ${e.end.slice(5).replace("-", "/")} · `}
                          {e.description}
                        </p>
                        <a href={e.sources[0]?.url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-xs font-semibold text-secondary">
                          {e.sources[0]?.name} <ExternalLink className="size-3" />
                        </a>
                      </div>
                    </li>
                  );
                })}
              </ul>
            </section>
          )}
        </>
      )}
    </div>
  );
}

import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, CalendarCheck, Clock, ExternalLink, Home, Info, MapPin, ShieldCheck, Timer, Umbrella, Wallet } from "lucide-react";
import { AddToItinerary } from "@/components/itinerary/AddToItinerary";
import { ReservationBadge, TierBadge } from "@/components/place/badges";
import { AdmissionCard } from "@/components/place/AdmissionCard";
import { GoogleInfo } from "@/components/place/GoogleInfo";
import { PhotoCredit, PlacePhoto } from "@/components/place/PlacePhoto";
import { SaveButtons, SaveHeart } from "@/components/place/SaveButtons";
import { TripDaysOpen } from "@/components/place/TripDaysOpen";
import { Badge } from "@/components/ui/misc";
import { buttonVariants } from "@/components/ui/button";
import { getAllPlaces, getCityEvents } from "@/data/cities";
import { resolveCity } from "@/lib/city";
import { CATEGORY_LABEL, RESERVATION_LABEL, priceLabel } from "@/lib/labels";
import { googleMapsPlaceUrl } from "@/lib/services/maps";
import { placesService } from "@/lib/services/places";
import { weeklySummary } from "@/lib/time/openingHours";

type Params = Promise<{ city: string; id: string }>;

export const generateStaticParams = () => getAllPlaces().map((p) => ({ city: p.cityId, id: p.id }));
export const dynamicParams = false;

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const place = placesService.get((await params).id);
  return { title: place?.name.ko ?? "장소" };
}

export default async function PlaceDetail({ params }: { params: Params }) {
  const { city: cityParam, id } = await params;
  const city = resolveCity(cityParam);
  const place = placesService.get(id);
  if (!place || place.cityId !== city.id) notFound();
  const events = getCityEvents(city.id).filter((e) => e.placeId === place.id);
  const photo = place.photos[0];
  const bookingUrl = place.booking?.official?.url ?? place.reservation.url;

  const facts = [
    place.admission && place.admission.status !== "none"
      ? { Icon: Wallet, label: "입장료", value: place.admission.price }
      : { Icon: Wallet, label: "가격대", value: priceLabel(place.priceLevel) },
    { Icon: Timer, label: "권장 체류", value: `${place.durationMin}분` },
    { Icon: CalendarCheck, label: "예약", value: RESERVATION_LABEL[place.reservation.required] },
    { Icon: place.indoor ? Home : Umbrella, label: "공간", value: place.indoor ? "실내 (우천 OK)" : "야외" },
  ];

  return (
    <article className="pb-24 md:pb-0">
      {/* 사진 히어로 */}
      <div className="relative -mx-4 -mt-5 md:mx-0 md:mt-0">
        <PlacePhoto place={place} priority className="aspect-[4/3] w-full md:aspect-[21/9] md:rounded-3xl" />
        <div className="absolute inset-x-0 top-0 flex justify-between p-3 md:p-4">
          <Link href={`/${city.id}/explore`} className={buttonVariants({ variant: "glass", size: "icon" })} aria-label="탐색으로 돌아가기">
            <ArrowLeft className="size-5" />
          </Link>
          <SaveHeart place={place} />
        </div>
      </div>
      <PhotoCredit photo={photo} className="mt-2" />

      <div className="mt-6 grid gap-8 md:grid-cols-[minmax(0,1fr)_340px] md:gap-10">
        <div className="min-w-0 space-y-8">
          {/* 제목 */}
          <header>
            <p className="eyebrow">
              {CATEGORY_LABEL[place.category]} · {place.location.area}
            </p>
            <h1 className="mt-2 font-serif text-[2.1rem] leading-[1.15] md:text-5xl">{place.name.ko}</h1>
            <p className="mt-1 font-serif text-lg italic text-muted-foreground">{place.name.local}</p>
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <TierBadge tier={place.tier} />
              <ReservationBadge place={place} />
              {place.verifiedAt ? (
                <Badge className="bg-success/12 text-success">
                  <ShieldCheck aria-hidden /> 검증 {place.verifiedAt}
                </Badge>
              ) : (
                <Badge className="bg-warning/12 text-warning">
                  <Info aria-hidden /> 운영정보 검수 전
                </Badge>
              )}
            </div>
          </header>

          <SaveButtons place={place} className="md:hidden" />

          {/* 핵심 정보 */}
          <dl className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
            {facts.map(({ Icon, label, value }) => (
              <div key={label} className="surface p-3.5">
                <dt className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <Icon className="size-3.5" aria-hidden /> {label}
                </dt>
                <dd className="mt-1 text-sm font-semibold">{value}</dd>
              </div>
            ))}
          </dl>

          <AdmissionCard place={place} />

          {/* 추천 이유 */}
          <section aria-labelledby="why">
            <h2 id="why" className="eyebrow mb-3">왜 가야 할까</h2>
            <blockquote className="border-l-2 border-primary pl-5 font-serif text-xl leading-relaxed md:text-2xl">{place.reason.text}</blockquote>
          </section>

          {place.tips.length > 0 && (
            <section aria-labelledby="tips">
              <h2 id="tips" className="section-title mb-4">방문 팁</h2>
              <ol className="space-y-3">
                {place.tips.map((t, i) => (
                  <li key={t} className="flex gap-3">
                    <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-bold text-primary">{i + 1}</span>
                    <span className="pt-0.5 leading-relaxed">{t}</span>
                  </li>
                ))}
              </ol>
            </section>
          )}

          {events.length > 0 && (
            <section className="rounded-2xl bg-secondary/8 p-4">
              <h2 className="mb-2 text-sm font-semibold text-secondary">여행 기간 관련 행사</h2>
              {events.map((e) => (
                <p key={e.id} className="text-sm">
                  <strong>{e.start.slice(5).replace("-", "/")}</strong> {e.name} — <span className="text-muted-foreground">{e.description}</span>
                </p>
              ))}
            </section>
          )}

          {/* 운영시간 */}
          <section aria-labelledby="hours">
            <h2 id="hours" className="section-title mb-4">운영시간</h2>
            <p className="eyebrow mb-2">내 여행 날짜</p>
            <TripDaysOpen place={place} />
            <details className="mt-4 rounded-2xl border bg-card">
              <summary className="flex cursor-pointer items-center justify-between px-4 py-3 text-sm font-semibold">
                <span className="flex items-center gap-2">
                  <Clock className="size-4 text-muted-foreground" aria-hidden /> 요일별 운영시간
                </span>
              </summary>
              <table className="w-full text-sm">
                <tbody>
                  {weeklySummary(place.openingHours).map((r) => (
                    <tr key={r.day} className="border-t">
                      <th scope="row" className="w-16 px-4 py-2 text-left font-normal text-muted-foreground">{r.day}</th>
                      <td className={r.text === "휴무" ? "px-4 py-2 font-semibold text-danger" : "px-4 py-2"}>{r.text}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </details>
            {place.openingHours.note && <p className="mt-2 text-sm text-muted-foreground">※ {place.openingHours.note}</p>}
          </section>

          {/* 위치 */}
          <section aria-labelledby="loc">
            <h2 id="loc" className="section-title mb-3">위치</h2>
            <div className="surface flex items-center justify-between gap-3 p-4">
              <p className="flex items-start gap-2 text-sm">
                <MapPin className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden />
                <span>
                  {place.location.address}
                  <span className="block text-xs text-muted-foreground">{place.location.area}</span>
                </span>
              </p>
              <a href={googleMapsPlaceUrl(place)} target="_blank" rel="noreferrer" className={buttonVariants({ variant: "outline", size: "sm" })}>
                지도 열기 <ExternalLink className="size-3.5" />
              </a>
            </div>
          </section>

          <GoogleInfo placeId={place.id} />

          <footer className="border-t pt-4 text-xs leading-relaxed text-muted-foreground">
            <p className="mb-1 font-semibold text-foreground">출처</p>
            <ul className="space-y-0.5">
              {place.sources.map((s) => (
                <li key={s.url}>
                  <a href={s.url} target="_blank" rel="noreferrer" className="underline underline-offset-2">
                    {s.name}
                  </a>
                  {s.checkedAt && ` · 확인 ${s.checkedAt}`}
                </li>
              ))}
            </ul>
            <p className="mt-2">운영시간·가격은 현지 사정으로 바뀔 수 있습니다. 방문 전 공식 사이트에서 다시 확인하세요.</p>
          </footer>
        </div>

        {/* 데스크톱: 고정 액션 카드 */}
        <aside className="hidden md:block">
          <div className="surface sticky top-8 space-y-4 p-5">
            <p className="eyebrow">이 장소를 내 여행에</p>
            <SaveButtons place={place} />
            <AddToItinerary place={place} />
            {bookingUrl && (
              <a href={bookingUrl} target="_blank" rel="noreferrer" className={buttonVariants({ variant: "dark", className: "w-full" })}>
                {place.reservation.required === "yes" ? "공식 사이트에서 예약" : "공식 사이트"} <ExternalLink />
              </a>
            )}
            {place.admission && place.admission.status !== "none" && (
              <p className="text-sm">
                입장료 <strong>{place.admission.price}</strong>
              </p>
            )}
            {place.reservation.note && <p className="text-xs leading-relaxed text-muted-foreground">{place.reservation.note}</p>}
          </div>
        </aside>
      </div>

      {/* 모바일: 하단 고정 액션 바 (탭 바 위) */}
      <div className="fixed inset-x-0 bottom-[calc(60px+env(safe-area-inset-bottom))] z-30 border-t bg-card/95 px-4 py-3 backdrop-blur-md md:hidden">
        <AddToItinerary place={place} />
        {bookingUrl && place.reservation.required === "yes" && (
          <a href={bookingUrl} target="_blank" rel="noreferrer" className="mt-2 flex items-center justify-center gap-1 text-xs font-semibold text-secondary">
            예약 필수 · 공식 사이트에서 예약하기 <ExternalLink className="size-3" />
          </a>
        )}
      </div>
    </article>
  );
}

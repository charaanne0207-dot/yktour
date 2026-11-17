import Link from "next/link";
import { CalendarCheck, Clock } from "lucide-react";
import type { Place } from "@/types";
import { CATEGORY_LABEL, priceLabel } from "@/lib/labels";
import { admissionShort } from "@/lib/booking";
import { cn } from "@/lib/utils";
import { TierBadge } from "./badges";
import { PlacePhoto } from "./PlacePhoto";
import { SaveHeart } from "./SaveButtons";

/** 사진 중심 추천 카드 (매거진 스타일) */
export function PlaceCard({
  place,
  compact,
  className,
  note,
}: {
  place: Place;
  compact?: boolean;
  className?: string;
  note?: string;
}) {
  return (
    <article className={cn("group surface relative flex flex-col overflow-hidden transition-shadow hover:shadow-md", className)}>
      <div className="relative overflow-hidden">
        <PlacePhoto place={place} className={cn("w-full transition-transform duration-500 group-hover:scale-[1.02]", compact ? "aspect-[4/3]" : "aspect-[3/2]")} />
        <TierBadge tier={place.tier} className="absolute left-3 top-3 shadow-sm" />
      </div>
      <div className="flex flex-1 flex-col gap-1.5 p-4">
        <p className="eyebrow truncate">
          {CATEGORY_LABEL[place.category]} · {place.location.area}
        </p>
        <h3 className="font-serif text-[1.2rem] leading-snug">
          {/* 카드 전체 클릭 영역 */}
          <Link href={`/${place.cityId}/place/${place.id}`} className="after:absolute after:inset-0 after:content-[''] focus-visible:outline-none">
            {place.name.ko}
          </Link>
        </h3>
        {!compact && <p className="line-clamp-2 text-sm leading-relaxed text-muted-foreground">{place.reason.text}</p>}
        {note && <p className="text-xs font-medium text-secondary">✓ {note}</p>}
        <div className="mt-auto flex flex-wrap items-center gap-x-3 gap-y-1 pt-2 text-xs text-muted-foreground">
          <span>{admissionShort(place) ?? priceLabel(place.priceLevel)}</span>
          <span className="inline-flex items-center gap-1">
            <Clock className="size-3" aria-hidden /> {place.durationMin}분
          </span>
          {place.reservation.required !== "no" && (
            <span className={cn("inline-flex items-center gap-1", place.reservation.required === "yes" && "font-semibold text-secondary")}>
              <CalendarCheck className="size-3" aria-hidden />
              {place.reservation.required === "yes" ? "예약 필수" : "예약 권장"}
            </span>
          )}
        </div>
      </div>
      {/* 카드 링크 위에 떠 있는 저장 버튼 */}
      <SaveHeart place={place} className="absolute right-3 top-3 z-10" />
    </article>
  );
}

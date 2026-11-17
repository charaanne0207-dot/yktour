"use client";

import { useState } from "react";
import { Coffee, Eye, Gem, Landmark, ShoppingBag, UtensilsCrossed } from "lucide-react";
import type { Category, Photo, Place } from "@/types";
import { CATEGORY_LABEL } from "@/lib/labels";
import { cn } from "@/lib/utils";

const ICON: Record<Category, typeof Landmark> = {
  sight: Landmark,
  food: UtensilsCrossed,
  cafe: Coffee,
  shopping: ShoppingBag,
  hidden: Gem,
  viewpoint: Eye,
};

/** 장소 사진 — 실제 사진(Wikimedia/Places) 우선, 없거나 실패하면 타이포그래피 플레이스홀더 */
export function PlacePhoto({
  place,
  className,
  priority,
  sizes,
}: {
  place: Place;
  className?: string;
  priority?: boolean;
  sizes?: string;
}) {
  const [failed, setFailed] = useState(false);
  const photo = place.photos[0];
  const Icon = ICON[place.category];

  if (photo && !failed) {
    return (
      <div className={cn("relative overflow-hidden bg-muted", className)}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={photo.url}
          alt={photo.caption ? `${place.name.ko} — ${photo.caption}` : place.name.ko}
          className="size-full object-cover"
          loading={priority ? "eager" : "lazy"}
          decoding="async"
          sizes={sizes}
          onError={() => setFailed(true)}
        />
      </div>
    );
  }
  return (
    <div
      className={cn("relative flex flex-col items-center justify-center gap-2 overflow-hidden bg-muted text-center", className)}
      role="img"
      aria-label={`${place.name.ko} — 사진 없음`}
    >
      <div
        aria-hidden
        className="absolute inset-0 opacity-[0.35]"
        style={{ backgroundImage: "radial-gradient(var(--border) 1px, transparent 1px)", backgroundSize: "14px 14px" }}
      />
      <Icon className="relative size-7 text-primary/70" aria-hidden />
      <span className="relative px-4 font-serif text-lg italic leading-tight text-foreground/80">{place.name.local}</span>
      <span className="eyebrow relative">{CATEGORY_LABEL[place.category]}</span>
    </div>
  );
}

/** 사진 저작자·라이선스 표기 (CC 라이선스 요건) */
export function PhotoCredit({ photo, className }: { photo?: Photo; className?: string }) {
  if (!photo) return null;
  return (
    <p className={cn("text-[11px] leading-snug text-muted-foreground", className)}>
      {photo.caption && <span className="mr-1 text-foreground/80">{photo.caption} ·</span>}
      사진 {photo.attribution}
      {photo.license && ` · ${photo.license}`} ·{" "}
      {photo.sourceUrl ? (
        <a href={photo.sourceUrl} target="_blank" rel="noreferrer" className="underline underline-offset-2">
          Wikimedia Commons
        </a>
      ) : (
        "Google"
      )}
    </p>
  );
}

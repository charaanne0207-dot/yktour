import { CalendarCheck, Clock, Gem, Sparkles, Star } from "lucide-react";
import type { OpeningHours, Place, Tier } from "@/types";
import { Badge } from "@/components/ui/misc";
import { RESERVATION_LABEL, TIER_LABEL } from "@/lib/labels";
import { isOpenOnDate } from "@/lib/time/openingHours";
import { cn } from "@/lib/utils";

const TIER_STYLE: Record<Tier, { cls: string; Icon: typeof Star }> = {
  must: { cls: "bg-must text-white", Icon: Star },
  recommended: { cls: "bg-recommended text-white", Icon: Sparkles },
  hidden: { cls: "bg-hidden text-white", Icon: Gem },
};

export function TierBadge({ tier, className }: { tier: Tier; className?: string }) {
  const { cls, Icon } = TIER_STYLE[tier];
  return (
    <Badge className={cn("font-semibold tracking-wide", cls, className)}>
      <Icon aria-hidden className="fill-current" />
      {TIER_LABEL[tier]}
    </Badge>
  );
}

/** 선택한 날짜 기준 영업 여부 (색 + 텍스트) */
export function OpenOnBadge({ hours, date }: { hours: OpeningHours; date: string }) {
  const open = isOpenOnDate(hours, date);
  return (
    <Badge className={open ? "bg-success/12 text-success" : "bg-danger/12 text-danger"}>
      <Clock aria-hidden />
      {open ? "영업일" : "휴무"}
    </Badge>
  );
}

export function ReservationBadge({ place }: { place: Place }) {
  if (place.reservation.required === "no") return null;
  return (
    <Badge className="bg-secondary/12 text-secondary">
      <CalendarCheck aria-hidden />
      {RESERVATION_LABEL[place.reservation.required]}
    </Badge>
  );
}

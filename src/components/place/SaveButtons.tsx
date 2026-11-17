"use client";

import { Heart, Pin } from "lucide-react";
import type { Place } from "@/types";
import { Button } from "@/components/ui/button";
import { useHydrated } from "@/lib/hooks/useHydrated";
import { useTripStore } from "@/lib/store/useTripStore";
import { cn } from "@/lib/utils";

function useSaveState(place: Place) {
  const hydrated = useHydrated();
  const entry = useTripStore((s) => s.saved[place.id]);
  return {
    saved: hydrated && Boolean(entry),
    must: hydrated && Boolean(entry?.mustVisit),
    toggleSaved: () => useTripStore.getState().toggleSaved(place),
    toggleMust: () => useTripStore.getState().toggleMustVisit(place),
  };
}

const stop = (fn: () => void) => (e: React.MouseEvent) => {
  e.preventDefault();
  e.stopPropagation();
  fn();
};

/** 사진 위 원형 저장(하트) 버튼 — 44px 터치 영역 */
export function SaveHeart({ place, className }: { place: Place; className?: string }) {
  const { saved, toggleSaved } = useSaveState(place);
  return (
    <Button
      variant="glass"
      size="icon"
      aria-pressed={saved}
      aria-label={saved ? `${place.name.ko} 저장 해제` : `${place.name.ko} 저장`}
      onClick={stop(toggleSaved)}
      className={cn("[&_svg]:size-5", className)}
    >
      <Heart className={cn(saved ? "fill-[#a9472f] text-[#a9472f]" : "text-[#231d19]")} />
    </Button>
  );
}

/** 라벨이 있는 저장·필수 방문 토글 (상세 화면용) */
export function SaveButtons({ place, className }: { place: Place; className?: string }) {
  const { saved, must, toggleSaved, toggleMust } = useSaveState(place);
  return (
    <div className={cn("flex gap-2", className)}>
      <Button variant={saved ? "default" : "outline"} aria-pressed={saved} onClick={stop(toggleSaved)} className="flex-1 sm:flex-none">
        <Heart className={cn(saved && "fill-current")} />
        {saved ? "저장됨" : "저장"}
      </Button>
      <Button variant={must ? "dark" : "outline"} aria-pressed={must} onClick={stop(toggleMust)} className="flex-1 sm:flex-none">
        <Pin className={cn(must && "fill-current")} />
        {must ? "필수 방문" : "필수로 지정"}
      </Button>
    </div>
  );
}

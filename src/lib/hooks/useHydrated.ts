"use client";

import { useSyncExternalStore } from "react";
import { useTripStore } from "@/lib/store/useTripStore";

/** Local Storage 복원 완료 여부 — SSR 하이드레이션 불일치 방지용 */
export function useHydrated(): boolean {
  return useSyncExternalStore(
    (cb) => useTripStore.persist.onFinishHydration(cb),
    () => useTripStore.persist.hasHydrated(),
    () => false,
  );
}

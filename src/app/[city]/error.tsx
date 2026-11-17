"use client";

import { useEffect } from "react";
import { RefreshCw, TriangleAlert } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function CityError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => console.error(error), [error]);
  return (
    <div className="flex flex-col items-center rounded-3xl border border-dashed bg-card/60 px-6 py-14 text-center" role="alert">
      <span className="mb-4 flex size-14 items-center justify-center rounded-full bg-danger/10">
        <TriangleAlert className="size-6 text-danger" aria-hidden />
      </span>
      <p className="font-serif text-xl">화면을 불러오지 못했어요</p>
      <p className="mt-2 max-w-sm text-sm text-muted-foreground">일시적인 문제일 수 있습니다. 저장한 장소와 일정은 이 기기에 안전하게 남아 있어요.</p>
      <Button className="mt-6" onClick={reset}>
        <RefreshCw /> 다시 시도
      </Button>
    </div>
  );
}

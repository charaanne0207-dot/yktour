import { ExternalLink, ShieldAlert, Ticket } from "lucide-react";
import type { Place } from "@/types";
import { buttonVariants } from "@/components/ui/button";
import { Badge } from "@/components/ui/misc";
import { ADMISSION_STATUS_LABEL, resellerLinks } from "@/lib/booking";
import { cn } from "@/lib/utils";

const STATUS_STYLE = {
  official: "bg-success/12 text-success",
  reported: "bg-secondary/12 text-secondary",
  check: "bg-warning/12 text-warning",
  free: "bg-success/12 text-success",
  none: "bg-muted text-muted-foreground",
} as const;

const host = (url: string) => {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return url;
  }
};

/** 입장료 + 공식 예약처 + 비공식(재판매·투어) 예약처 */
export function AdmissionCard({ place }: { place: Place }) {
  const a = place.admission;
  const official = place.booking?.official;
  const resellers = resellerLinks(place);
  if (!a && !official) return null;

  return (
    <section aria-labelledby="admission" className="surface overflow-hidden">
      <div className="p-5">
        <h2 id="admission" className="eyebrow mb-3 flex items-center gap-1.5">
          <Ticket className="size-3.5" aria-hidden /> 입장료 · 예약
        </h2>
        {a && (
          <>
            <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1.5">
              <p className="font-serif text-3xl leading-none">{a.price}</p>
              <Badge className={STATUS_STYLE[a.status]}>{ADMISSION_STATUS_LABEL[a.status]}</Badge>
            </div>
            {a.detail && <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{a.detail}</p>}
            {(a.checkedAt || a.sourceUrl) && (
              <p className="mt-1.5 text-xs text-muted-foreground">
                {a.checkedAt && `${a.checkedAt} 조사`}
                {a.sourceUrl && (
                  <>
                    {a.checkedAt && " · "}
                    <a href={a.sourceUrl} target="_blank" rel="noreferrer" className="underline underline-offset-2">
                      근거 출처
                    </a>
                  </>
                )}
              </p>
            )}
          </>
        )}
      </div>

      {official && (
        <div className="border-t p-5">
          <p className="mb-2 text-sm font-semibold">공식 예약</p>
          <a href={official.url} target="_blank" rel="noreferrer" className={buttonVariants({ variant: "dark", className: "w-full justify-between" })}>
            <span className="truncate">{official.name}</span>
            <span className="flex shrink-0 items-center gap-1 text-xs font-medium opacity-80">
              {host(official.url) !== official.name && host(official.url)} <ExternalLink />
            </span>
          </a>
          {official.note && <p className="mt-2 text-xs text-muted-foreground">{official.note}</p>}
        </div>
      )}

      {resellers.length > 0 && (
        <div className="border-t bg-muted/40 p-5">
          <p className="text-sm font-semibold">비공식 예약 (재판매·투어)</p>
          <p className="mb-3 mt-0.5 text-xs leading-relaxed text-muted-foreground">
            수수료가 붙어 공식가보다 비쌀 수 있어요. 공식 매진 시 대안이나 가이드 투어 비교용으로 쓰세요.
          </p>
          <div className="grid grid-cols-2 gap-2">
            {resellers.map((r) => (
              <a key={r.name} href={r.url} target="_blank" rel="noreferrer" className={buttonVariants({ variant: "outline", size: "sm", className: "h-11" })}>
                {r.name} <ExternalLink />
              </a>
            ))}
          </div>
        </div>
      )}

      {place.booking?.warning && (
        <p className={cn("flex gap-2 border-t bg-danger/5 px-5 py-3 text-xs leading-relaxed text-danger")}>
          <ShieldAlert className="mt-0.5 size-4 shrink-0" aria-hidden /> {place.booking.warning}
        </p>
      )}
    </section>
  );
}

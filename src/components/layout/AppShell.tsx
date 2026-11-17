"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { CalendarDays, ChevronDown, Compass, FlaskConical, Heart, Home, Map, Settings2 } from "lucide-react";
import type { City } from "@/types";
import { CITIES, CITY_ORDER } from "@/data/cities";
import { cn } from "@/lib/utils";

const NAV = [
  { href: "", label: "홈", Icon: Home },
  { href: "/explore", label: "탐색", Icon: Compass },
  { href: "/saved", label: "My Places", Icon: Heart },
  { href: "/itinerary", label: "일정", Icon: CalendarDays },
  { href: "/map", label: "지도", Icon: Map },
] as const;

function Logo({ href, className }: { href: string; className?: string }) {
  return (
    <Link href={href} className={cn("whitespace-nowrap font-serif text-[1.35rem] leading-none tracking-tight", className)} aria-label="Ciao, AI! 홈">
      Ciao, <em className="text-primary">AI!</em>
    </Link>
  );
}

export function AppShell({ city, demo, children }: { city: City; demo: string[]; children: React.ReactNode }) {
  const pathname = usePathname();
  const base = `/${city.id}`;
  const isActive = (href: string) =>
    href === "" ? pathname === base : pathname.startsWith(base + href) || (href === "/explore" && pathname.startsWith(`${base}/place`));

  return (
    <div className="min-h-dvh md:flex" style={{ ["--city-accent" as string]: city.accent }}>
      <a href="#main" className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-full focus:bg-card focus:px-4 focus:py-2">
        본문으로 건너뛰기
      </a>

      {/* 데스크톱 사이드바 */}
      <aside className="sticky top-0 hidden h-dvh w-64 shrink-0 flex-col border-r bg-card/70 px-5 py-7 md:flex">
        <Logo href={base} className="px-2 text-2xl" />
        <p className="eyebrow mt-2 px-2">Winter Grand Tour 2027</p>
        <CitySwitcher current={city.id} className="mt-7" />
        <nav className="mt-6 flex flex-col gap-1" aria-label="주 메뉴">
          {NAV.map(({ href, label, Icon }) => (
            <Link
              key={href}
              href={base + href}
              aria-current={isActive(href) ? "page" : undefined}
              className={cn(
                "flex h-11 items-center gap-3 rounded-xl px-3 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground",
                isActive(href) && "bg-muted font-semibold text-foreground",
              )}
            >
              <Icon className={cn("size-[18px]", isActive(href) && "text-primary")} aria-hidden />
              {label}
            </Link>
          ))}
          <Link
            href={`${base}/trip`}
            aria-current={pathname === `${base}/trip` ? "page" : undefined}
            className={cn(
              "flex h-11 items-center gap-3 rounded-xl px-3 text-sm text-muted-foreground hover:bg-muted hover:text-foreground",
              pathname === `${base}/trip` && "bg-muted font-semibold text-foreground",
            )}
          >
            <Settings2 className="size-[18px]" aria-hidden /> 여행 설정
          </Link>
        </nav>
        <div className="mt-auto px-2">
          <DemoBadge demo={demo} />
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        {/* 모바일 상단 바 */}
        <header className="sticky top-0 z-30 flex h-14 items-center justify-between gap-2 border-b bg-background/85 px-4 backdrop-blur-md md:hidden">
          <Logo href={base} />
          <div className="flex items-center gap-1">
            <DemoBadge demo={demo} compact />
            <Link href={`${base}/trip`} aria-label="여행 설정" className="flex size-11 items-center justify-center rounded-full hover:bg-muted">
              <Settings2 className="size-5" />
            </Link>
            <CitySwitcher current={city.id} compact />
          </div>
        </header>

        <main id="main" className="mx-auto w-full max-w-6xl flex-1 px-4 pb-32 pt-5 md:px-10 md:pb-16 md:pt-10">
          {children}
        </main>

        {/* 모바일 하단 탭 — 엄지 영역 */}
        <nav className="fixed inset-x-0 bottom-0 z-40 border-t bg-card/95 pb-[env(safe-area-inset-bottom)] backdrop-blur-md md:hidden" aria-label="주 메뉴">
          <div className="grid grid-cols-5">
            {NAV.map(({ href, label, Icon }) => {
              const active = isActive(href);
              return (
                <Link
                  key={href}
                  href={base + href}
                  aria-current={active ? "page" : undefined}
                  className={cn("flex min-h-[60px] flex-col items-center justify-center gap-1 text-[11px]", active ? "font-semibold text-foreground" : "text-muted-foreground")}
                >
                  <span className={cn("flex h-7 w-12 items-center justify-center rounded-full transition-colors", active && "bg-primary/12")}>
                    <Icon className={cn("size-5", active && "text-primary")} aria-hidden />
                  </span>
                  {label}
                </Link>
              );
            })}
          </div>
        </nav>
      </div>
    </div>
  );
}

function CitySwitcher({ current, compact, className }: { current: string; compact?: boolean; className?: string }) {
  const router = useRouter();
  return (
    <label className={cn("relative block", className)}>
      <span className="sr-only">도시 선택</span>
      <select
        value={current}
        onChange={(e) => router.push(`/${e.target.value}`)}
        className={cn("h-11 w-full cursor-pointer appearance-none rounded-full border bg-card pl-4 pr-9 text-sm font-semibold", compact && "h-9 w-[104px] truncate pl-3 pr-7 text-[13px]")}
      >
        {CITY_ORDER.map((id) => (
          <option key={id} value={id}>
            {CITIES[id].name.ko}
            {CITIES[id].status === "coming-soon" ? " · 준비 중" : ""}
          </option>
        ))}
      </select>
      <ChevronDown className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
    </label>
  );
}

/** API 키 미설정 기능 표시 — 실제 데이터처럼 보이지 않도록 명시 */
function DemoBadge({ demo, compact }: { demo: string[]; compact?: boolean }) {
  if (!demo.length) return null;
  return (
    <span
      title={`DEMO MODE: ${demo.join(", ")} 미연동`}
      className={cn("inline-flex items-center gap-1 rounded-full bg-warning/12 font-semibold text-warning", compact ? "hidden px-2 py-0.5 text-[10px] min-[400px]:inline-flex" : "px-2.5 py-1 text-[11px] leading-snug")}
    >
      <FlaskConical className="size-3 shrink-0" aria-hidden /> DEMO{!compact && ` · ${demo.join(", ")} 미연동`}
    </span>
  );
}

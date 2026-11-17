import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import { Compass } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/misc";
import { cn } from "@/lib/utils";

export function EmptyState({
  icon: Icon = Compass,
  title,
  description,
  action,
  secondary,
  className,
}: {
  icon?: LucideIcon;
  title: string;
  description?: string;
  action?: { href: string; label: string };
  secondary?: { href: string; label: string };
  className?: string;
}) {
  return (
    <div className={cn("flex flex-col items-center rounded-3xl border border-dashed bg-card/60 px-6 py-12 text-center", className)}>
      <span className="mb-4 flex size-14 items-center justify-center rounded-full bg-muted">
        <Icon className="size-6 text-primary" aria-hidden />
      </span>
      <p className="font-serif text-xl">{title}</p>
      {description && <p className="mt-2 max-w-sm text-sm leading-relaxed text-muted-foreground">{description}</p>}
      {(action || secondary) && (
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          {action && (
            <Link href={action.href} className={buttonVariants()}>
              {action.label}
            </Link>
          )}
          {secondary && (
            <Link href={secondary.href} className={buttonVariants({ variant: "outline" })}>
              {secondary.label}
            </Link>
          )}
        </div>
      )}
    </div>
  );
}

/** 카드 그리드 스켈레톤 — 실제 카드와 같은 비율 */
export function ListSkeleton({ rows = 4 }: { rows?: number }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3" aria-busy="true" aria-label="불러오는 중">
      {Array.from({ length: rows }, (_, i) => (
        <div key={i} className="surface overflow-hidden">
          <Skeleton className="aspect-[4/3] rounded-none" />
          <div className="space-y-2 p-4">
            <Skeleton className="h-3 w-24" />
            <Skeleton className="h-5 w-3/4" />
            <Skeleton className="h-3 w-full" />
          </div>
        </div>
      ))}
    </div>
  );
}

export function RowSkeleton({ rows = 3 }: { rows?: number }) {
  return (
    <div className="space-y-3" aria-busy="true" aria-label="불러오는 중">
      {Array.from({ length: rows }, (_, i) => (
        <div key={i} className="surface flex gap-3 p-3">
          <Skeleton className="size-20 shrink-0" />
          <div className="flex-1 space-y-2 py-1">
            <Skeleton className="h-4 w-1/2" />
            <Skeleton className="h-3 w-3/4" />
            <Skeleton className="h-3 w-1/3" />
          </div>
        </div>
      ))}
    </div>
  );
}

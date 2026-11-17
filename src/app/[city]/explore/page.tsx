import type { Metadata } from "next";
import type { Category, Tier } from "@/types";
import { ExploreView } from "@/components/explore/ExploreView";
import { PageHeader } from "@/components/ui/misc";
import { resolveCity } from "@/lib/city";
import { CATEGORY_ORDER, TIER_ORDER } from "@/lib/labels";

export const metadata: Metadata = { title: "탐색" };

export default async function ExplorePage({
  params,
  searchParams,
}: {
  params: Promise<{ city: string }>;
  searchParams: Promise<{ category?: string; tier?: string; sort?: string }>;
}) {
  const city = resolveCity((await params).city);
  const sp = await searchParams;
  const category = CATEGORY_ORDER.find((c) => c === sp.category) as Category | undefined;
  const tier = TIER_ORDER.find((t) => t === sp.tier) as Tier | undefined;

  return (
    <div>
      <PageHeader eyebrow={`${city.name.local} · Curated`} title="탐색" description="사진으로 둘러보고 ♡로 저장하세요. 저장한 장소로 일정을 자동으로 만들어 드려요." />
      <ExploreView cityId={city.id} initialCategory={category} initialTier={tier} initialSort={tier ? "tier" : "recommended"} />
    </div>
  );
}

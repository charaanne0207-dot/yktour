import type { Metadata } from "next";
import { ItineraryView } from "@/components/itinerary/ItineraryView";
import { PageHeader } from "@/components/ui/misc";
import { resolveCity } from "@/lib/city";

export const metadata: Metadata = { title: "일정" };

export default async function ItineraryPage({ params }: { params: Promise<{ city: string }> }) {
  const city = resolveCity((await params).city);
  return (
    <div>
      <PageHeader eyebrow="Itinerary" title={`${city.name.ko} 일정`} description="저장한 장소·숙소·영업시간·일몰을 반영해 자동으로 만들고, 수정하면 즉시 다시 계산됩니다." />
      <ItineraryView city={city} />
    </div>
  );
}

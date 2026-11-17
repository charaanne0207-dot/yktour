import type { Metadata } from "next";
import { MapView } from "@/components/map/MapView";
import { PageHeader } from "@/components/ui/misc";
import { resolveCity } from "@/lib/city";

export const metadata: Metadata = { title: "지도" };

export default async function MapPage({ params, searchParams }: { params: Promise<{ city: string }>; searchParams: Promise<{ day?: string }> }) {
  const city = resolveCity((await params).city);
  const day = (await searchParams).day;
  return (
    <div>
      <PageHeader eyebrow="Map" title={`${city.name.ko} 지도`} description="장소나 일정을 고르면 지도와 목록이 함께 움직여요." />
      <MapView city={city} initialDay={day && /^\d{4}-\d{2}-\d{2}$/.test(day) ? day : undefined} />
    </div>
  );
}

import type { Metadata } from "next";
import { TripSettings } from "@/components/trip/TripSettings";
import { PageHeader } from "@/components/ui/misc";
import { resolveCity } from "@/lib/city";

export const metadata: Metadata = { title: "여행 설정" };

export default async function TripPage({ params }: { params: Promise<{ city: string }> }) {
  const city = resolveCity((await params).city);
  return (
    <div>
      <PageHeader eyebrow="Settings" title="여행 설정" description="날짜·숙소·취향을 알려 주시면 추천과 일정이 맞춰집니다." />
      <TripSettings city={city} />
    </div>
  );
}

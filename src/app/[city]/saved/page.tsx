import type { Metadata } from "next";
import { SavedView } from "@/components/saved/SavedView";
import { PageHeader } from "@/components/ui/misc";
import { resolveCity } from "@/lib/city";

export const metadata: Metadata = { title: "My Places" };

export default async function SavedPage({ params }: { params: Promise<{ city: string }> }) {
  const city = resolveCity((await params).city);
  return (
    <div>
      <PageHeader eyebrow="Saved" title="My Places" description={`${city.name.ko}에서 저장한 장소를 비교하고, 꼭 갈 곳을 필수로 지정하세요.`} />
      <SavedView cityId={city.id} />
    </div>
  );
}

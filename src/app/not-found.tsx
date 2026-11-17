import { MapPinOff } from "lucide-react";
import { EmptyState } from "@/components/common/states";
import { DEFAULT_CITY } from "@/data/cities";

export default function NotFound() {
  return (
    <main className="mx-auto max-w-lg px-4 py-20">
      <EmptyState
        icon={MapPinOff}
        title="길을 잃으셨나요?"
        description="요청한 페이지나 장소를 찾을 수 없습니다."
        action={{ href: `/${DEFAULT_CITY}`, label: "홈으로" }}
      />
    </main>
  );
}

import { ListSkeleton } from "@/components/common/states";
import { Skeleton } from "@/components/ui/misc";

export default function Loading() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-8 w-48" />
      <ListSkeleton rows={6} />
    </div>
  );
}

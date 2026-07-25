import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <div className="container max-w-3xl py-12">
      <div className="mb-8 space-y-3 text-center">
        <Skeleton className="mx-auto h-9 w-96 max-w-full" />
        <Skeleton className="mx-auto h-5 w-80 max-w-full" />
      </div>
      <Skeleton className="h-40 w-full rounded-lg" />
    </div>
  );
}

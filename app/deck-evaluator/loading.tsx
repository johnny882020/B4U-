import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <div className="container max-w-3xl py-12">
      <div className="mb-8 space-y-3 text-center">
        <Skeleton className="mx-auto h-9 w-72" />
        <Skeleton className="mx-auto h-5 w-96 max-w-full" />
      </div>
      <Skeleton className="h-56 w-full rounded-lg" />
    </div>
  );
}

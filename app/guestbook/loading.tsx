import { Card } from "@/components/card";
import { Skeleton } from "@/components/skeleton";

const CardSkeleton = () => {
    return (
        <div className="rounded-xl flex flex-col justify-between space-y-4 h-full w-full p-6 bg-white/5 dark:bg-grey-900/20 border border-grey-200/20 dark:border-grey-800/20">
            <Skeleton className="w-full h-16" />
            <div className="flex items-center justify-between">
                <div className="space-y-2">
                    <Skeleton className="w-24 h-4" />
                    <Skeleton className="w-20 h-3" />
                </div>
                <Skeleton className="w-[120px] h-[60px] rounded-lg" />
            </div>
        </div>
    );
};

export default function Loading() {
    return (
        <div className="grid grid-cols-12 gap-6 mt-8">
            {[...Array(10)].map((_, i) => (
                <div key={i} className="flex col-span-12 sm:col-span-6">
                    <CardSkeleton />
                </div>
            ))}
        </div>
    );
}

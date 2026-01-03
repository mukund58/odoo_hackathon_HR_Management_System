import { Skeleton } from "@/components/ui/skeleton"

export function SkeletonCard() {
	return (
		<div className="flex w-full flex-col space-y-3">
			<Skeleton className="h-[125px] w-full rounded-xl" />
			<div className="space-y-2">
				<Skeleton className="h-4 w-4/5" />
				<Skeleton className="h-4 w-3/5" />
			</div>
		</div>
	)
}

export default function Loader() {
	return (
		<div className="min-h-screen bg-background text-foreground">
			<div className="container mx-auto flex min-h-screen items-center justify-center px-6 py-12">
				<div className="w-full max-w-5xl space-y-10">
					<div className="space-y-3">
						<Skeleton className="h-9 w-1/3" />
						<Skeleton className="h-5 w-2/3" />
					</div>

					<Skeleton className="h-[260px] w-full rounded-xl" />

					<div className="grid gap-6 md:grid-cols-3">
						<SkeletonCard />
						<SkeletonCard />
						<SkeletonCard />
					</div>
				</div>
			</div>
		</div>
	)
}


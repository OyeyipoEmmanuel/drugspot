import { AlertCircle, LoaderCircle, WifiOff } from "lucide-react";

import { Button } from "@/components/ui/button";

export function LoadingState({ label = "Loading…" }: { label?: string }) {
  return <div className="grid min-h-48 place-items-center"><div className="flex items-center gap-3 text-sm text-muted-foreground"><LoaderCircle className="animate-spin" />{label}</div></div>;
}

export function ErrorState({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-center"><AlertCircle className="mx-auto text-destructive" /><p className="mt-3 font-semibold">Something went wrong</p><p className="mt-1 text-sm text-muted-foreground">{message}</p>{onRetry && <Button className="mt-4" variant="outline" onClick={onRetry}>Try again</Button>}</div>;
}

export function OfflineBanner() {
  return <div className="flex items-center justify-center gap-2 bg-amber-100 px-4 py-2 text-xs font-semibold text-amber-900"><WifiOff className="size-4" />You are offline. Some actions may be unavailable.</div>;
}

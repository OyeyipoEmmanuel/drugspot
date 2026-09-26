import { BadgeCheck } from "lucide-react";

export function VerifiedBadge({ compact = false }: { compact?: boolean }) {
  return <span className="inline-flex items-center gap-1 rounded-full bg-blue-100 px-2 py-1 text-[0.7rem] font-bold text-blue-800"><BadgeCheck className="size-3.5" />{compact ? "Verified" : "Verified pharmacy"}</span>;
}

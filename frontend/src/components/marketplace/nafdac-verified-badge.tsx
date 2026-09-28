import { BadgeCheck } from "lucide-react";

export function NafdacVerifiedBadge({ compact = false }: { compact?: boolean }) {
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-1 text-[0.7rem] font-bold text-emerald-800">
      <BadgeCheck className="size-3.5" />
      {compact ? "NAFDAC" : "Verified with NAFDAC"}
    </span>
  );
}

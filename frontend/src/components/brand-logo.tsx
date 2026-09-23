import { Cross } from "lucide-react";
import { Link } from "react-router-dom";

import { cn } from "@/lib/utils";

export function BrandLogo({ compact = false, className }: { compact?: boolean; className?: string }) {
  return (
    <Link to="/" className={cn("inline-flex items-center gap-2.5 font-bold tracking-tight", className)}>
      <span className="grid size-9 place-items-center rounded-xl bg-primary text-primary-foreground shadow-sm">
        <Cross className="size-5" strokeWidth={2.5} />
      </span>
      {!compact && <span className="text-lg">DrugSpot</span>}
    </Link>
  );
}

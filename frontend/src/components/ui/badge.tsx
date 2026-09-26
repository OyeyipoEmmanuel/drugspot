import type * as React from "react";

import { cn } from "@/lib/utils";

interface BadgeProps extends React.ComponentProps<"span"> {
  variant?: "default" | "outline";
}

export function Badge({ className, variant = "default", ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold",
        variant === "outline" ? "border bg-background text-foreground" : "bg-secondary text-secondary-foreground",
        className,
      )}
      {...props}
    />
  );
}

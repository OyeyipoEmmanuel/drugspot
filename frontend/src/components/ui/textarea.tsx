import type * as React from "react";

import { cn } from "@/lib/utils";

export function Textarea({ className, ...props }: React.ComponentProps<"textarea">) {
  return <textarea className={cn("min-h-24 w-full resize-y rounded-xl border border-input bg-background px-3 py-2.5 text-sm outline-none transition placeholder:text-muted-foreground focus:border-primary focus:ring-2 focus:ring-ring/25", className)} {...props} />;
}

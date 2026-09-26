import { ShieldX } from "lucide-react";
import { Link } from "react-router-dom";

import { Button } from "@/components/ui/button";

export function UnauthorizedPage() {
  return <main className="grid min-h-screen place-items-center bg-background p-4 text-center"><section><div className="mx-auto grid size-16 place-items-center rounded-2xl bg-red-100 text-red-700"><ShieldX /></div><h1 className="mt-5 text-3xl font-bold">Access unavailable</h1><p className="mt-2 text-muted-foreground">Your account does not have permission to open this area.</p><Button asChild className="mt-6"><Link to="/">Return home</Link></Button></section></main>;
}

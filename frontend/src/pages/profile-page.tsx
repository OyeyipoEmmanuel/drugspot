import { LogOut, Mail, ShieldCheck, UserRound } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/providers/auth-provider";

export function ProfilePage() {
  const { session, logout } = useAuth();
  const user = session!.user;
  return <div className="mx-auto max-w-2xl space-y-6"><section><p className="text-sm font-semibold text-primary">Account</p><h1 className="mt-1 text-3xl font-bold">Profile</h1></section><section className="rounded-3xl border bg-card p-6 shadow-sm sm:p-8"><div className="flex flex-col items-start gap-5 sm:flex-row sm:items-center"><div className="grid size-20 place-items-center rounded-3xl bg-secondary text-primary"><UserRound className="size-9" /></div><div><h2 className="text-2xl font-bold">{user.firstName} {user.lastName}</h2><p className="mt-1 flex items-center gap-2 text-sm text-muted-foreground"><Mail className="size-4" />{user.email}</p><Badge className="mt-3"><ShieldCheck className="mr-1 size-3.5" />{user.role.replace("_", " ")}</Badge></div></div><Button className="mt-8" variant="outline" onClick={logout}><LogOut />Sign out</Button></section></div>;
}

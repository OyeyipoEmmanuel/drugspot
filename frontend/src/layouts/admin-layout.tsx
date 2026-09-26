import { Building2, LayoutDashboard, LogOut, Menu, ShieldCheck, UserRoundCheck, X } from "lucide-react";
import { useState } from "react";
import { NavLink, Outlet } from "react-router-dom";

import { BrandLogo } from "@/components/brand-logo";
import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useAuth } from "@/providers/auth-provider";

const links = [
  { label: "Overview", path: "/admin", icon: LayoutDashboard },
  { label: "Pharmacies", path: "/admin/pharmacies", icon: Building2 },
  { label: "Pharmacists", path: "/admin/pharmacists", icon: UserRoundCheck },
  { label: "Verification", path: "/admin/verifications", icon: ShieldCheck },
];

export function AdminLayout() {
  const [open, setOpen] = useState(false);
  const { session, logout } = useAuth();
  const sidebar = <><div className="flex h-16 items-center justify-between border-b px-5"><BrandLogo /><Button className="lg:hidden" variant="ghost" size="icon" onClick={() => setOpen(false)}><X /></Button></div><nav className="space-y-1 p-3">{links.map(({ label, path, icon: Icon }) => <NavLink key={path} end={path === "/admin"} to={path} onClick={() => setOpen(false)} className={({ isActive }) => cn("flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium text-muted-foreground hover:bg-accent", isActive && "bg-secondary text-primary")}><Icon className="size-5" />{label}</NavLink>)}</nav></>;
  return <div className="min-h-screen bg-muted/40"><aside className="fixed inset-y-0 left-0 z-50 hidden w-64 border-r bg-background lg:block">{sidebar}</aside>{open && <div className="fixed inset-0 z-50 lg:hidden"><button className="absolute inset-0 bg-slate-950/45" onClick={() => setOpen(false)} /><aside className="relative h-full w-72 bg-background">{sidebar}</aside></div>}<div className="lg:pl-64"><header className="sticky top-0 z-40 flex h-16 items-center border-b bg-background/90 px-4 backdrop-blur-xl sm:px-6"><Button className="lg:hidden" variant="ghost" size="icon" onClick={() => setOpen(true)}><Menu /></Button><div className="ml-auto flex items-center gap-2"><span className="hidden text-sm font-semibold sm:block">{session?.user.firstName} {session?.user.lastName}</span><ThemeToggle /><Button variant="ghost" size="icon" onClick={logout}><LogOut /></Button></div></header><main className="p-4 sm:p-6 lg:p-8"><Outlet /></main></div></div>;
}

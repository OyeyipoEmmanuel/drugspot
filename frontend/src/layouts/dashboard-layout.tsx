import { Boxes, ClipboardList, LayoutDashboard, Menu, RotateCcw, Users, X } from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Link, NavLink, Outlet } from "react-router-dom";

import { BrandLogo } from "@/components/brand-logo";
import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const dashboardLinks = [
  { key: "dashboard", icon: LayoutDashboard },
  { key: "orders", icon: ClipboardList },
  { key: "inventory", icon: Boxes },
  { key: "customers", icon: Users },
  { key: "refills", icon: RotateCcw },
] as const;

export function DashboardLayout() {
  const [menuOpen, setMenuOpen] = useState(false);
  const { t } = useTranslation();

  const sidebar = (
    <>
      <div className="flex h-16 items-center justify-between border-b px-5">
        <BrandLogo />
        <Button className="lg:hidden" variant="ghost" size="icon" onClick={() => setMenuOpen(false)} aria-label={t("common.closeMenu")}>
          <X />
        </Button>
      </div>
      <nav className="space-y-1 p-3">
        {dashboardLinks.map(({ key, icon: Icon }, index) => (
          <NavLink
            key={key}
            to={index === 0 ? "/pharmacy" : `/pharmacy/${key}`}
            end={index === 0}
            onClick={() => setMenuOpen(false)}
            className={({ isActive }) => cn("flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium text-muted-foreground hover:bg-accent hover:text-foreground", isActive && "bg-secondary text-primary")}
          >
            <Icon className="size-5" />
            {t(`navigation.${key}`)}
          </NavLink>
        ))}
      </nav>
    </>
  );

  return (
    <div className="min-h-screen bg-muted/40">
      <aside className="fixed inset-y-0 left-0 z-50 hidden w-64 border-r bg-background lg:block">{sidebar}</aside>
      {menuOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button className="absolute inset-0 bg-slate-950/45" onClick={() => setMenuOpen(false)} aria-label={t("common.closeMenu")} />
          <aside className="relative h-full w-72 bg-background shadow-2xl">{sidebar}</aside>
        </div>
      )}
      <div className="lg:pl-64">
        <header className="sticky top-0 z-40 flex h-16 items-center justify-between border-b bg-background/90 px-4 backdrop-blur-xl sm:px-6">
          <Button className="lg:hidden" variant="ghost" size="icon" onClick={() => setMenuOpen(true)} aria-label={t("common.openMenu")}>
            <Menu />
          </Button>
          <div className="ml-auto flex items-center gap-2">
            <Button asChild variant="ghost" size="sm"><Link to="/">Patient app</Link></Button>
            <ThemeToggle />
          </div>
        </header>
        <main className="p-4 sm:p-6 lg:p-8"><Outlet /></main>
      </div>
    </div>
  );
}

import { Home, MessageCircle, Package, Pill, UserRound } from "lucide-react";
import { useTranslation } from "react-i18next";
import { NavLink, Outlet } from "react-router-dom";

import { BrandLogo } from "@/components/brand-logo";
import { ThemeToggle } from "@/components/theme-toggle";
import { cn } from "@/lib/utils";

const navItems = [
  { key: "home", path: "/", icon: Home },
  { key: "medicines", path: "/medicines", icon: Pill },
  { key: "orders", path: "/orders", icon: Package },
  { key: "pharmacist", path: "/pharmacist", icon: MessageCircle },
  { key: "profile", path: "/profile", icon: UserRound },
] as const;

export function PatientLayout() {
  const { t } = useTranslation();

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-40 border-b bg-background/90 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <BrandLogo />
          <div className="flex items-center gap-2">
            <NavLink
              to="/pharmacy"
              className="hidden rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-accent hover:text-foreground sm:block"
            >
              {t("dashboard.title")}
            </NavLink>
            <ThemeToggle />
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 pb-28 pt-6 sm:px-6 md:pb-10 lg:px-8">
        <Outlet />
      </main>

      <nav className="fixed inset-x-0 bottom-0 z-40 border-t bg-background/95 px-2 pb-[max(0.5rem,env(safe-area-inset-bottom))] pt-2 backdrop-blur-xl md:hidden">
        <div className="mx-auto grid max-w-lg grid-cols-5">
          {navItems.map(({ key, path, icon: Icon }) => (
            <NavLink
              key={key}
              to={path}
              end={path === "/"}
              className={({ isActive }) =>
                cn(
                  "flex min-h-14 flex-col items-center justify-center gap-1 rounded-xl px-1 text-[0.68rem] font-medium text-muted-foreground",
                  isActive && "bg-secondary text-primary",
                )
              }
            >
              <Icon className="size-5" />
              <span>{t(`navigation.${key}`)}</span>
            </NavLink>
          ))}
        </div>
      </nav>
    </div>
  );
}

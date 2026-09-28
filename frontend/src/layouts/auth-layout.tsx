import { Outlet } from "react-router-dom";

import { BackButton } from "@/components/back-button";
import { BrandLogo } from "@/components/brand-logo";

export function AuthLayout() {
  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,var(--color-secondary),transparent_42%)]">
      <header className="mx-auto flex h-20 max-w-7xl items-center px-4 sm:px-6 lg:px-8">
        <BackButton className="mr-3">Back</BackButton>
        <BrandLogo to="/" />
      </header>
      <main className="mx-auto grid min-h-[calc(100vh-5rem)] max-w-7xl place-items-center px-4 py-8 sm:px-6 lg:px-8">
        <Outlet />
      </main>
    </div>
  );
}

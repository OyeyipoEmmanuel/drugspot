import { ArrowLeft, FileQuestion } from "lucide-react";
import { Link } from "react-router-dom";

import { BrandLogo } from "@/components/brand-logo";
import { Button } from "@/components/ui/button";

export function NotFoundPage() {
  return (
    <main className="grid min-h-screen place-items-center bg-[radial-gradient(circle_at_top,var(--color-secondary),transparent_55%)] px-4 py-12 text-center">
      <section className="w-full max-w-xl rounded-3xl border bg-white p-7 shadow-xl shadow-blue-950/5 sm:p-10">
        <BrandLogo to="/" className="justify-center" />
        <div className="mx-auto mt-10 grid size-20 place-items-center rounded-3xl bg-secondary text-primary">
          <FileQuestion className="size-9" />
        </div>
        <p className="mt-6 text-sm font-bold uppercase tracking-[0.2em] text-primary">404 · Page not found</p>
        <h1 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">This page does not exist.</h1>
        <p className="mx-auto mt-4 max-w-md leading-7 text-muted-foreground">The address may be incorrect or the page may have moved. Return to the DrugSpot landing page to continue.</p>
        <Button asChild size="lg" className="mt-8">
          <Link to="/"><ArrowLeft />Return to landing page</Link>
        </Button>
      </section>
    </main>
  );
}

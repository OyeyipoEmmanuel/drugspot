import { useLocation } from "react-router-dom";

export function PlaceholderPage() {
  const { pathname } = useLocation();
  const title = pathname.split("/").filter(Boolean).at(-1) ?? "Page";
  return (
    <section className="rounded-3xl border bg-card p-8 shadow-sm">
      <p className="text-sm font-semibold text-primary">Foundation route</p>
      <h1 className="mt-2 text-2xl font-bold capitalize">{title}</h1>
      <p className="mt-2 text-muted-foreground">This feature route is ready for its implementation phase.</p>
    </section>
  );
}

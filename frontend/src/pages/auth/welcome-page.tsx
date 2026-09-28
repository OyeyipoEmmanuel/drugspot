import {
  ArrowRight,
  BadgeCheck,
  Check,
  ChevronRight,
  Clock3,
  ScanLine,
  ShieldCheck,
  ShoppingBag,
} from "lucide-react";
import { Link } from "react-router-dom";

import { BrandLogo } from "@/components/brand-logo";
import { Button } from "@/components/ui/button";
import { usePharmacies, useProducts } from "@/hooks/use-marketplace";
import { formatNaira } from "@/lib/format";

const images = {
  hero: "https://plus.unsplash.com/premium_photo-1661776255948-7a76baa9d7b9?auto=format&fit=crop&w=1800&q=88",
  pharmacistPatient:
    "https://images.unsplash.com/photo-1576091358783-a212ec293ff3?auto=format&fit=crop&w=1200&q=85",
  pharmacyShelves:
    "https://images.unsplash.com/photo-1580281657527-47f249e8f4df?auto=format&fit=crop&w=1200&q=85",
  pharmacyTeam:
    "https://plus.unsplash.com/premium_photo-1661770294094-06167872e079?auto=format&fit=crop&w=1200&q=85",
  pharmacyCustomer:
    "https://plus.unsplash.com/premium_photo-1661777752178-fa6055526eb8?auto=format&fit=crop&w=1200&q=85",
  pharmacistPortrait:
    "https://plus.unsplash.com/premium_photo-1663047392930-7c1c31d7b785?auto=format&fit=crop&w=1200&q=85",
  medicineFlatlay:
    "https://images.unsplash.com/photo-1471864190281-a93a3070b6de?auto=format&fit=crop&w=1000&q=85",
} as const;

const steps = [
  {
    number: "01",
    title: "Find trusted care",
    body: "Explore medicines and verified pharmacies near you.",
    image: images.pharmacyShelves,
  },
  {
    number: "02",
    title: "Order with confidence",
    body: "Choose delivery or pickup and follow every order update.",
    image: images.pharmacyCustomer,
  },
  {
    number: "03",
    title: "Stay on track",
    body: "Save your medicines, scan prescriptions and manage your routine.",
    image: images.pharmacistPatient,
  },
] as const;

const carePrinciples = [
  {
    title: "Verified pharmacy access",
    body: "Only approved and active pharmacy records are exposed in the marketplace.",
    image: images.pharmacyTeam,
  },
  {
    title: "Clear medicine information",
    body: "Product details, availability and NAFDAC verification status come from pharmacy-managed records.",
    image: images.medicineFlatlay,
  },
] as const;

function SectionHeading({
  eyebrow,
  title,
  body,
}: {
  eyebrow: string;
  title: string;
  body: string;
}) {
  return (
    <div className="mx-auto max-w-2xl text-center">
      <p className="text-sm font-bold uppercase tracking-[0.2em] text-blue-700">
        {eyebrow}
      </p>
      <h2 className="mt-3 text-3xl font-bold tracking-[-0.035em] text-slate-950 sm:text-4xl lg:text-5xl">
        {title}
      </h2>
      <p className="mt-4 text-base leading-7 text-slate-600 sm:text-lg">
        {body}
      </p>
    </div>
  );
}

export function WelcomePage() {
  const pharmaciesQuery = usePharmacies();
  const productsQuery = useProducts({ availability: "available" });
  const pharmacies = pharmaciesQuery.data ?? [];
  const medicines = productsQuery.data ?? [];
  const featuredPharmacies = pharmacies.slice(0, 3);
  const featuredMedicines = medicines.slice(0, 4);
  const availableOffers = medicines.reduce(
    (total, medicine) =>
      total + medicine.offers.filter((offer) => offer.stockCount > 0).length,
    0,
  );
  const loadingMarketplace =
    pharmaciesQuery.isLoading || productsQuery.isLoading;

  return (
    <div className="overflow-hidden bg-white text-slate-950">
      <header className="relative z-50 border-b border-blue-100/80 bg-white/90 backdrop-blur-xl">
        <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <BrandLogo to="/" />
          <nav
            className="hidden items-center gap-8 text-sm font-semibold text-slate-600 md:flex"
            aria-label="Landing page navigation"
          >
            <a className="transition hover:text-blue-800" href="#pharmacies">
              Pharmacies
            </a>
            <a className="transition hover:text-blue-800" href="#medicines">
              Medicines
            </a>
            <a className="transition hover:text-blue-800" href="#how-it-works">
              How it works
            </a>
            <a className="transition hover:text-blue-800" href="#care">
              Why DrugSpot
            </a>
          </nav>
          <div className="flex items-center gap-2">
            <Button asChild variant="ghost" className="hidden sm:inline-flex">
              <Link to="/login">Sign in</Link>
            </Button>
            <Button asChild>
              <Link to="/register">
                Get started <ArrowRight />
              </Link>
            </Button>
          </div>
        </div>
      </header>

      <main>
        <section className="landing-grid relative border-b border-blue-100 px-4 pb-12 pt-16 sm:px-6 sm:pt-20 lg:px-8 lg:pb-20">
          <div className="pointer-events-none absolute left-[8%] top-24 size-56 rounded-full bg-blue-200/35 blur-3xl" />
          <div className="pointer-events-none absolute right-[5%] top-40 size-72 rounded-full bg-cyan-100/60 blur-3xl" />
          <div className="relative mx-auto max-w-7xl">
            <div className="landing-rise mx-auto max-w-4xl text-center">
              <span className="inline-flex items-center gap-2 rounded-full border border-blue-200 bg-white px-4 py-2 text-sm font-bold text-blue-800 shadow-sm">
                <BadgeCheck className="size-4" />
                Care from verified pharmacies
              </span>
              <h1 className="mt-7 text-4xl font-bold tracking-[-0.05em] text-slate-950 sm:text-6xl lg:text-7xl">
                Manage your medicines with{" "}
                <span className="text-blue-800">more confidence.</span>
              </h1>
              <p className="mx-auto mt-6 max-w-2xl text-lg leading-8 text-slate-600 sm:text-xl">
                Order from trusted local pharmacies, keep your medication
                routine organised, and reach a licensed pharmacist when you need
                guidance.
              </p>
              <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
                <Button asChild size="lg">
                  <Link to="/register">
                    Create free account <ArrowRight />
                  </Link>
                </Button>
                <Button asChild size="lg" variant="outline">
                  <Link to="/register/pharmacy">Register your pharmacy</Link>
                </Button>
              </div>
              <p className="mt-5 text-sm font-medium text-slate-500">
                Simple to start · Verified care network · Built for everyday
                health
              </p>
            </div>

            <div className="landing-rise-delay relative mt-12 sm:mt-16">
              <div className="overflow-hidden rounded-[2rem] border-[6px] border-white bg-blue-950 shadow-[0_35px_90px_-28px_rgba(15,49,98,0.55)] sm:rounded-[2.75rem] sm:border-[10px]">
                <img
                  src={images.hero}
                  alt="Pharmacists helping a customer inside a modern pharmacy"
                  className="h-[390px] w-full object-cover object-center sm:h-[540px] lg:h-[620px]"
                  fetchPriority="high"
                />
                <div className="absolute inset-x-[6px] bottom-[6px] h-48 rounded-b-[1.6rem] bg-gradient-to-t from-blue-950/80 to-transparent sm:inset-x-[10px] sm:bottom-[10px] sm:rounded-b-[2rem]" />
              </div>
              <div className="landing-float absolute -left-1 top-8 rounded-2xl border border-white/80 bg-white/95 p-3 shadow-xl backdrop-blur sm:left-6 sm:top-14 sm:p-4">
                <div className="flex items-center gap-3">
                  <span className="grid size-10 place-items-center rounded-xl bg-blue-100 text-blue-800">
                    <ShieldCheck />
                  </span>
                  <div>
                    <p className="text-xs text-slate-500">Pharmacy status</p>
                    <p className="text-sm font-bold">Verified & active</p>
                  </div>
                </div>
              </div>
              <div className="landing-float-delayed absolute -right-1 bottom-8 max-w-[220px] rounded-2xl border border-white/80 bg-white/95 p-3 shadow-xl backdrop-blur sm:right-6 sm:bottom-14 sm:p-4">
                <div className="flex items-center gap-3">
                  <span className="grid size-10 place-items-center rounded-xl bg-emerald-100 text-emerald-700">
                    <Clock3 />
                  </span>
                  <div>
                    <p className="text-xs text-slate-500">Marketplace</p>
                    <p className="text-sm font-bold">Live pharmacy inventory</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="border-b border-blue-100 bg-blue-950 text-white">
          <div className="mx-auto grid max-w-7xl grid-cols-2 divide-x divide-white/10 px-4 py-8 sm:px-6 md:grid-cols-4 lg:px-8">
            {[
              [
                loadingMarketplace ? "—" : String(pharmacies.length),
                "verified pharmacies",
              ],
              [
                loadingMarketplace ? "—" : String(medicines.length),
                "available medicines",
              ],
              [
                loadingMarketplace ? "—" : String(availableOffers),
                "in-stock offers",
              ],
              [
                loadingMarketplace
                  ? "—"
                  : String(
                      pharmacies.filter((item) => item.supportsDelivery).length,
                    ),
                "delivery-enabled pharmacies",
              ],
            ].map(([value, label]) => (
              <div key={label} className="px-3 py-3 text-center">
                <p className="text-2xl font-bold sm:text-3xl">{value}</p>
                <p className="mt-1 text-xs text-blue-200 sm:text-sm">{label}</p>
              </div>
            ))}
          </div>
        </section>

        <section
          id="pharmacies"
          className="px-4 py-20 sm:px-6 sm:py-24 lg:px-8"
        >
          <div className="mx-auto max-w-7xl">
            <SectionHeading
              eyebrow="Pharmacies near you"
              title="Real care, from trusted local teams"
              body="Discover verified pharmacies, compare delivery times and choose the team that works best for you."
            />
            <div className="mt-12 grid gap-6 md:grid-cols-3">
              {featuredPharmacies.map((pharmacy, index) => (
                <article
                  key={pharmacy.id}
                  className="group overflow-hidden rounded-3xl border border-blue-100 bg-white shadow-[0_16px_50px_-28px_rgba(15,49,98,0.4)] transition duration-300 hover:-translate-y-1 hover:shadow-xl"
                >
                  <div className="relative h-60 overflow-hidden">
                    <img
                      src={
                        [
                          images.pharmacyCustomer,
                          images.pharmacyShelves,
                          images.pharmacyTeam,
                        ][index]
                      }
                      alt="Modern pharmacy interior"
                      className="size-full object-cover transition duration-500 group-hover:scale-105"
                      loading="lazy"
                    />
                    <span className="absolute left-4 top-4 inline-flex items-center gap-1 rounded-full bg-white/95 px-3 py-1.5 text-xs font-bold text-blue-800 shadow">
                      <BadgeCheck className="size-3.5" />
                      Verified
                    </span>
                  </div>
                  <div className="p-5">
                    <h3 className="text-lg font-bold">{pharmacy.name}</h3>
                    <p className="mt-1 text-sm text-slate-500">
                      {pharmacy.address}
                    </p>
                    <div className="mt-5 flex items-center justify-between border-t border-slate-100 pt-4 text-sm">
                      <span className="font-medium text-slate-500">
                        {pharmacy.supportsDelivery
                          ? "Delivery & pickup"
                          : "Pickup available"}
                      </span>
                      <Link
                        to="/register"
                        className="inline-flex items-center font-bold text-blue-800"
                      >
                        View marketplace <ChevronRight className="size-4" />
                      </Link>
                    </div>
                  </div>
                </article>
              ))}
            </div>
            {!loadingMarketplace && featuredPharmacies.length === 0 && (
              <p className="mt-12 rounded-3xl border border-blue-100 bg-blue-50 p-8 text-center text-slate-600">
                No approved pharmacies are listed yet.
              </p>
            )}
          </div>
        </section>

        <section
          id="medicines"
          className="bg-blue-50/70 px-4 py-20 sm:px-6 sm:py-24 lg:px-8"
        >
          <div className="mx-auto max-w-7xl">
            <div className="flex flex-col justify-between gap-6 md:flex-row md:items-end">
              <div className="max-w-2xl">
                <p className="text-sm font-bold uppercase tracking-[0.2em] text-blue-700">
                  Available inventory
                </p>
                <h2 className="mt-3 text-3xl font-bold tracking-[-0.035em] sm:text-4xl lg:text-5xl">
                  Everyday medicines, easier to find
                </h2>
                <p className="mt-4 text-lg leading-8 text-slate-600">
                  Browse current listings from verified pharmacies. Availability
                  and pricing come directly from pharmacy inventory.
                </p>
              </div>
              <Button asChild variant="outline">
                <Link to="/register">
                  Explore marketplace <ArrowRight />
                </Link>
              </Button>
            </div>
            <div className="mt-12 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {featuredMedicines.map((medicine) => {
                const lowestPrice = Math.min(
                  ...medicine.offers
                    .filter((offer) => offer.stockCount > 0)
                    .map((offer) => offer.price),
                );
                return (
                  <article
                    key={medicine.id}
                    className="group overflow-hidden rounded-3xl border border-blue-100 bg-white p-3 shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-lg"
                  >
                    <div className="h-48 overflow-hidden rounded-2xl bg-slate-100">
                      {medicine.imageUrl ? (
                        <img
                          src={medicine.imageUrl}
                          alt={`${medicine.name} packaging`}
                          className="size-full object-cover transition duration-500 group-hover:scale-105"
                          loading="lazy"
                        />
                      ) : (
                        <div className="grid size-full place-items-center text-sm text-slate-500">
                          Image not provided
                        </div>
                      )}
                    </div>
                    <div className="px-2 pb-2 pt-5">
                      <p className="text-xs font-bold uppercase tracking-wider text-emerald-700">
                        In stock
                      </p>
                      <h3 className="mt-2 text-lg font-bold">
                        {medicine.name}
                      </h3>
                      <p className="mt-1 text-sm text-slate-500">
                        {[medicine.strength, medicine.packSize]
                          .filter(Boolean)
                          .join(" · ")}
                      </p>
                      <div className="mt-5 flex items-center justify-between">
                        <span className="text-lg font-bold text-blue-950">
                          {formatNaira(lowestPrice)}
                        </span>
                        <Link
                          to="/register"
                          aria-label={`View ${medicine.name}`}
                          className="grid size-10 place-items-center rounded-xl bg-blue-950 text-white transition hover:bg-blue-800"
                        >
                          <ShoppingBag className="size-4" />
                        </Link>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
            {!loadingMarketplace && featuredMedicines.length === 0 && (
              <p className="mt-12 rounded-3xl border border-blue-100 bg-white p-8 text-center text-slate-600">
                No in-stock medicines are listed yet.
              </p>
            )}
            <p className="mt-5 text-center text-xs text-slate-500">
              Prescription medicines require appropriate validation.
            </p>
          </div>
        </section>

        <section
          id="how-it-works"
          className="px-4 py-20 sm:px-6 sm:py-24 lg:px-8"
        >
          <div className="mx-auto max-w-7xl">
            <SectionHeading
              eyebrow="A simpler health routine"
              title="From search to support in three steps"
              body="DrugSpot connects the parts of everyday medicine care in one calm, easy-to-use experience."
            />
            <div className="mt-12 grid gap-6 lg:grid-cols-3">
              {steps.map((step) => (
                <article
                  key={step.number}
                  className="relative overflow-hidden rounded-3xl bg-blue-950 text-white"
                >
                  <img
                    src={step.image}
                    alt={step.title}
                    className="h-72 w-full object-cover opacity-75"
                    loading="lazy"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-blue-950 via-blue-950/35 to-transparent" />
                  <div className="absolute inset-x-0 bottom-0 p-6">
                    <span className="text-sm font-bold text-blue-200">
                      STEP {step.number}
                    </span>
                    <h3 className="mt-2 text-2xl font-bold">{step.title}</h3>
                    <p className="mt-2 leading-6 text-blue-100">{step.body}</p>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section
          id="care"
          className="bg-blue-950 px-4 py-20 text-white sm:px-6 sm:py-24 lg:px-8"
        >
          <div className="mx-auto grid max-w-7xl items-center gap-12 lg:grid-cols-[0.95fr_1.05fr] lg:gap-20">
            <div className="relative">
              <div className="overflow-hidden rounded-[2rem] border border-white/10">
                <img
                  src={images.pharmacistPatient}
                  alt="A pharmacist explaining medication to a patient"
                  className="h-[500px] w-full object-cover"
                  loading="lazy"
                />
              </div>
              <div className="absolute -bottom-6 -right-2 max-w-[240px] rounded-2xl bg-white p-4 text-slate-950 shadow-2xl sm:right-6">
                <p className="text-sm font-bold text-blue-800">
                  Professional guidance
                </p>
                <p className="mt-1 text-sm leading-6 text-slate-600">
                  Ask questions and understand your medicine with help from
                  licensed pharmacists.
                </p>
              </div>
            </div>
            <div>
              <p className="text-sm font-bold uppercase tracking-[0.2em] text-blue-300">
                Care beyond checkout
              </p>
              <h2 className="mt-4 text-3xl font-bold tracking-[-0.035em] sm:text-4xl lg:text-5xl">
                A pharmacy experience that stays with you
              </h2>
              <p className="mt-5 text-lg leading-8 text-blue-100">
                DrugSpot is designed around the full patient journey—not only
                buying medicine, but understanding it and staying consistent.
              </p>
              <div className="mt-8 space-y-4">
                {[
                  "Scan a prescription into an editable medication draft",
                  "Track medicine schedules and self-reported adherence",
                  "Message verified pharmacists in a secure care space",
                  "Request refills from pharmacies you already trust",
                ].map((item) => (
                  <div
                    key={item}
                    className="flex items-start gap-3 rounded-2xl border border-white/10 bg-white/5 p-4"
                  >
                    <span className="mt-0.5 grid size-7 shrink-0 place-items-center rounded-full bg-blue-400 text-blue-950">
                      <Check className="size-4" />
                    </span>
                    <p className="font-medium leading-7 text-blue-50">{item}</p>
                  </div>
                ))}
              </div>
              <Button
                asChild
                size="lg"
                className="mt-8 bg-white text-blue-950 hover:bg-blue-50"
              >
                <Link to="/register">
                  Start your care journey <ArrowRight />
                </Link>
              </Button>
            </div>
          </div>
        </section>

        <section className="px-4 py-20 sm:px-6 sm:py-24 lg:px-8">
          <div className="mx-auto max-w-7xl">
            <SectionHeading
              eyebrow="Built for both sides of care"
              title="One network for patients and pharmacies"
              body="A better experience for the people seeking care and the trusted teams delivering it."
            />
            <div className="mt-12 grid gap-6 lg:grid-cols-2">
              <article className="group relative min-h-[460px] overflow-hidden rounded-[2rem]">
                <img
                  src={images.pharmacyCustomer}
                  alt="Patient receiving medicine at a pharmacy counter"
                  className="absolute inset-0 size-full object-cover transition duration-700 group-hover:scale-105"
                  loading="lazy"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/25 to-transparent" />
                <div className="absolute inset-x-0 bottom-0 p-7 text-white sm:p-9">
                  <p className="text-sm font-bold uppercase tracking-wider text-blue-200">
                    For patients
                  </p>
                  <h3 className="mt-2 text-3xl font-bold">
                    Clarity at every step
                  </h3>
                  <p className="mt-3 max-w-md leading-7 text-slate-200">
                    Find medicine, understand the pharmacy fulfilling your
                    order, and manage your routine without juggling different
                    services.
                  </p>
                </div>
              </article>
              <article className="group relative min-h-[460px] overflow-hidden rounded-[2rem]">
                <img
                  src={images.pharmacyTeam}
                  alt="Pharmacists working together inside a pharmacy"
                  className="absolute inset-0 size-full object-cover transition duration-700 group-hover:scale-105"
                  loading="lazy"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-blue-950 via-blue-950/25 to-transparent" />
                <div className="absolute inset-x-0 bottom-0 p-7 text-white sm:p-9">
                  <p className="text-sm font-bold uppercase tracking-wider text-blue-200">
                    For pharmacies
                  </p>
                  <h3 className="mt-2 text-3xl font-bold">
                    A digital storefront with trust built in
                  </h3>
                  <p className="mt-3 max-w-md leading-7 text-blue-100">
                    Showcase inventory, receive orders, support customers and
                    grow through a marketplace designed for verified pharmacy
                    care.
                  </p>
                  <Button
                    asChild
                    variant="outline"
                    className="mt-5 border-white/30 bg-white/10 text-white hover:bg-white hover:text-blue-950"
                  >
                    <Link to="/register/pharmacy">Join as a pharmacy</Link>
                  </Button>
                </div>
              </article>
            </div>
          </div>
        </section>

        <section className="bg-slate-50 px-4 py-20 sm:px-6 sm:py-24 lg:px-8">
          <div className="mx-auto max-w-7xl">
            <SectionHeading
              eyebrow="Trust by design"
              title="A marketplace grounded in verified records"
              body="The public experience reflects approved pharmacies and the inventory they manage in DrugSpot."
            />
            <div className="mt-12 grid gap-6 lg:grid-cols-2">
              {carePrinciples.map((principle) => (
                <article
                  key={principle.title}
                  className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm"
                >
                  <img
                    src={principle.image}
                    alt="Healthcare professional environment"
                    className="h-64 w-full object-cover"
                    loading="lazy"
                  />
                  <div className="p-7">
                    <h3 className="text-xl font-bold text-slate-900">
                      {principle.title}
                    </h3>
                    <p className="mt-3 leading-7 text-slate-600">
                      {principle.body}
                    </p>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="px-4 py-16 sm:px-6 sm:py-20 lg:px-8">
          <div className="relative mx-auto max-w-7xl overflow-hidden rounded-[2rem] bg-blue-950 px-6 py-14 text-white shadow-2xl sm:px-12 sm:py-16 lg:px-20">
            <img
              src={images.pharmacistPortrait}
              alt="Pharmacist inside a modern pharmacy"
              className="absolute inset-0 size-full object-cover opacity-20"
              loading="lazy"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-blue-950 via-blue-950/95 to-blue-900/60" />
            <div className="relative max-w-2xl">
              <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-sm font-bold text-blue-100">
                <ScanLine className="size-4" />
                Your care, in one place
              </span>
              <h2 className="mt-5 text-3xl font-bold tracking-[-0.035em] sm:text-5xl">
                Ready for a simpler way to manage medicine?
              </h2>
              <p className="mt-5 text-lg leading-8 text-blue-100">
                Create your DrugSpot account and explore trusted pharmacies,
                everyday medicines and connected pharmacist support.
              </p>
              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <Button
                  asChild
                  size="lg"
                  className="bg-white text-blue-950 hover:bg-blue-50"
                >
                  <Link to="/register">
                    Create free account <ArrowRight />
                  </Link>
                </Button>
                <Button
                  asChild
                  size="lg"
                  variant="outline"
                  className="border-white/30 bg-white/5 text-white hover:bg-white hover:text-blue-950"
                >
                  <Link to="/login">Sign in</Link>
                </Button>
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-blue-100 bg-blue-50/60 px-4 py-10 sm:px-6 lg:px-8">
        <div className="mx-auto flex max-w-7xl flex-col gap-8 md:flex-row md:items-center md:justify-between">
          <div>
            <BrandLogo to="/" />
            <p className="mt-3 max-w-sm text-sm leading-6 text-slate-500">
              Trusted pharmacy access and everyday medication support, designed
              for Nigeria.
            </p>
          </div>
          <div className="flex flex-wrap gap-x-6 gap-y-3 text-sm font-semibold text-slate-600">
            <a href="#pharmacies">Pharmacies</a>
            <a href="#medicines">Medicines</a>
            <a href="#how-it-works">How it works</a>
            <Link to="/register/pharmacy">For pharmacies</Link>
            <a href="https://unsplash.com" target="_blank" rel="noreferrer">
              Photography: Unsplash
            </a>
          </div>
        </div>
        <div className="mx-auto mt-8 flex max-w-7xl flex-col gap-2 border-t border-blue-100 pt-6 text-xs text-slate-500 sm:flex-row sm:justify-between">
          <p>© {new Date().getFullYear()} DrugSpot. Healthcare marketplace.</p>
          <p>
            Always confirm medical information with a qualified professional.
          </p>
        </div>
      </footer>
    </div>
  );
}

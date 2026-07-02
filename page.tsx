import { AppHeader } from "@/components/AppHeader";
import { SizeCard } from "@/components/SizeCard";
import { CartPanel } from "@/components/CartPanel";
import { RatesHint } from "@/components/RatesHint";
import { SIZES } from "@/lib/constants";

export default function EstimatorPage() {
  return (
    <div className="min-h-screen bg-background">
      <AppHeader />

      <main className="container py-6">
        <div className="mb-4">
          <h1 className="text-xl font-bold text-navy-800">Estimator</h1>
          <p className="text-sm text-muted-foreground">
            Enter quantities in 90 m units (e.g. 10 = 900 m), add sizes to the
            cart, then compare every brand.
          </p>
        </div>

        <div className="mb-4">
          <RatesHint />
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_320px]">
          {/* Size cards */}
          <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {SIZES.map((size) => (
              <SizeCard key={size} size={size} />
            ))}
          </section>

          {/* Persistent cart */}
          <aside className="lg:sticky lg:top-[132px] lg:h-fit">
            <CartPanel />
          </aside>
        </div>
      </main>
    </div>
  );
}

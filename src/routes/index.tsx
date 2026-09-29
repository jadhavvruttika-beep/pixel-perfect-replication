import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, BadgePercent, Leaf, ShieldCheck, Truck } from "lucide-react";

import heroImage from "@/assets/hero-groceries.jpg";
import { ProductCard, ProductCardSkeleton } from "@/components/product-card";
import { ShopLayout } from "@/components/shop-layout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useCategories, useProducts } from "@/hooks/use-shop";
import { discountPercent } from "@/lib/format";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "FreshCart — Shop Fresh Groceries Online" },
      {
        name: "description",
        content:
          "Order fruits, vegetables, dairy, staples and household essentials from FreshCart. Free delivery above ₹500.",
      },
      { property: "og:title", content: "FreshCart — Shop Fresh Groceries Online" },
      {
        property: "og:description",
        content: "Daily grocery delivery across India with fresh produce, best prices and easy returns.",
      },
    ],
  }),
  component: Home,
});

function Home() {
  const { data: categories, isLoading: loadingCats } = useCategories();
  const { data: products, isLoading } = useProducts();

  const featured = (products ?? []).slice(0, 8);
  const deals = (products ?? []).filter((p) => discountPercent(p) >= 10).slice(0, 8);
  const bestSellers = [...(products ?? [])].sort((a, b) => Number(b.rating) - Number(a.rating)).slice(0, 8);

  return (
    <ShopLayout>
      {/* Hero */}
      <section className="border-b bg-card">
        <div className="mx-auto grid max-w-7xl items-center gap-8 px-4 py-10 lg:grid-cols-2 lg:py-16">
          <div>
            <Badge className="bg-accent text-accent-foreground">Free delivery above ₹500</Badge>
            <h1 className="mt-4 text-4xl font-extrabold tracking-tight sm:text-5xl">
              Shop Fresh <span className="text-primary">Groceries</span> Every Day
            </h1>
            <p className="mt-4 max-w-md text-muted-foreground">
              Farm-fresh fruits and vegetables, everyday staples and household essentials — delivered to your
              doorstep within hours.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Button asChild size="lg">
                <Link to="/shop">
                  Shop Fresh Groceries <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline">
                <Link to="/shop" search={{ q: undefined, category: "fruits" }}>
                  Today&apos;s Fruits
                </Link>
              </Button>
            </div>
          </div>
          <div className="overflow-hidden rounded-3xl shadow-[var(--shadow-lift)]">
            <img
              src={heroImage}
              alt="Fresh Indian groceries on a marble kitchen counter"
              width={1600}
              height={1008}
              className="h-full w-full object-cover"
            />
          </div>
        </div>
      </section>

      {/* Categories */}
      <section className="mx-auto max-w-7xl px-4 py-10">
        <SectionHeading title="Popular Categories" to="/shop" />
        <div className="mt-5 grid grid-cols-3 gap-3 sm:grid-cols-5 lg:grid-cols-8">
          {loadingCats
            ? Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="surface-card h-24 animate-pulse bg-muted" />
              ))
            : (categories ?? []).map((c) => (
                <Link
                  key={c.id}
                  to="/shop"
                  search={{ category: c.slug, q: undefined }}
                  className="surface-card flex flex-col items-center justify-center gap-2 p-3 text-center transition-all hover:-translate-y-1 hover:shadow-[var(--shadow-lift)]"
                >
                  <span className="text-2xl">{c.icon}</span>
                  <span className="text-xs font-medium">{c.name}</span>
                </Link>
              ))}
        </div>
      </section>

      <ProductRow title="Featured Products" products={featured} loading={isLoading} />
      <ProductRow title="Today's Deals" products={deals} loading={isLoading} />
      <ProductRow title="Best Sellers" products={bestSellers} loading={isLoading} />

      {/* Why choose us */}
      <section className="mx-auto max-w-7xl px-4 py-12">
        <h2 className="text-2xl font-bold">Why choose FreshCart?</h2>
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { icon: Leaf, title: "Farm Fresh", text: "Sourced daily from local farms and trusted brands." },
            { icon: Truck, title: "Fast Delivery", text: "Same-day delivery slots across 40+ cities." },
            { icon: BadgePercent, title: "Best Prices", text: "Everyday discounts and coupon savings." },
            { icon: ShieldCheck, title: "Quality Assured", text: "Easy returns if you are not satisfied." },
          ].map((f) => (
            <div key={f.title} className="surface-card p-5">
              <f.icon className="h-6 w-6 text-primary" />
              <h3 className="mt-3 font-semibold">{f.title}</h3>
              <p className="mt-1 text-sm text-muted-foreground">{f.text}</p>
            </div>
          ))}
        </div>
      </section>
    </ShopLayout>
  );
}

function SectionHeading({ title, to }: { title: string; to: "/shop" }) {
  return (
    <div className="flex items-center justify-between">
      <h2 className="text-2xl font-bold">{title}</h2>
      <Button asChild variant="ghost" size="sm">
        <Link to={to}>
          View all <ArrowRight className="h-4 w-4" />
        </Link>
      </Button>
    </div>
  );
}

function ProductRow({
  title,
  products,
  loading,
}: {
  title: string;
  products: ReturnType<typeof useProducts>["data"];
  loading: boolean;
}) {
  return (
    <section className="mx-auto max-w-7xl px-4 py-6">
      <SectionHeading title={title} to="/shop" />
      <div className="mt-5 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
        {loading
          ? Array.from({ length: 4 }).map((_, i) => <ProductCardSkeleton key={i} />)
          : (products ?? []).map((p) => <ProductCard key={p.id} product={p} />)}
      </div>
    </section>
  );
}

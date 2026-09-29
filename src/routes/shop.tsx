import { useMemo, useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { SlidersHorizontal, X } from "lucide-react";

import { ProductCard, ProductCardSkeleton } from "@/components/product-card";
import { ShopLayout } from "@/components/shop-layout";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { useCategories, useProducts } from "@/hooks/use-shop";
import { effectivePrice, inr } from "@/lib/format";

type ShopSearch = { q?: string | undefined; category?: string | undefined };

export const Route = createFileRoute("/shop")({
  validateSearch: (search: Record<string, unknown>): ShopSearch => ({
    q: typeof search["q"] === "string" && search["q"] ? search["q"] : undefined,
    category: typeof search["category"] === "string" && search["category"] ? search["category"] : undefined,
  }),
  head: () => ({
    meta: [
      { title: "Shop Groceries Online — FreshCart" },
      {
        name: "description",
        content: "Browse 40+ grocery products across 15 categories with filters, sorting and instant search.",
      },
      { property: "og:title", content: "Shop Groceries Online — FreshCart" },
      { property: "og:description", content: "Filter by category, price and availability. Free delivery above ₹500." },
    ],
  }),
  component: Shop,
});

const PAGE_SIZE = 12;

function Shop() {
  const { q, category } = Route.useSearch();
  const navigate = useNavigate({ from: "/shop" });
  const { data: products, isLoading } = useProducts();
  const { data: categories } = useCategories();

  const [sort, setSort] = useState("popular");
  const [inStockOnly, setInStockOnly] = useState(false);
  const [maxPrice, setMaxPrice] = useState(1500);
  const [visible, setVisible] = useState(PAGE_SIZE);
  const [showFilters, setShowFilters] = useState(false);

  const filtered = useMemo(() => {
    let list = [...(products ?? [])];
    if (q) {
      const t = q.toLowerCase();
      list = list.filter(
        (p) =>
          p.name.toLowerCase().includes(t) ||
          (p.brand ?? "").toLowerCase().includes(t) ||
          (p.categories?.name ?? "").toLowerCase().includes(t),
      );
    }
    if (category) list = list.filter((p) => p.categories?.slug === category);
    if (inStockOnly) list = list.filter((p) => p.stock_quantity > 0);
    list = list.filter((p) => effectivePrice(p) <= maxPrice);

    switch (sort) {
      case "price-asc":
        list.sort((a, b) => effectivePrice(a) - effectivePrice(b));
        break;
      case "price-desc":
        list.sort((a, b) => effectivePrice(b) - effectivePrice(a));
        break;
      case "name-asc":
        list.sort((a, b) => a.name.localeCompare(b.name));
        break;
      case "name-desc":
        list.sort((a, b) => b.name.localeCompare(a.name));
        break;
      default:
        list.sort((a, b) => Number(b.rating) - Number(a.rating));
    }
    return list;
  }, [products, q, category, inStockOnly, maxPrice, sort]);

  function setSearch(next: ShopSearch) {
    void navigate({ search: (prev) => ({ ...prev, ...next }) });
    setVisible(PAGE_SIZE);
  }

  const filters = (
    <div className="space-y-6">
      <div>
        <Label className="text-sm font-semibold">Search</Label>
        <Input
          value={q ?? ""}
          onChange={(e) => setSearch({ q: e.target.value || undefined })}
          placeholder="Search products"
          className="mt-2"
        />
      </div>

      <div>
        <Label className="text-sm font-semibold">Category</Label>
        <div className="mt-2 max-h-72 space-y-1 overflow-y-auto pr-1">
          <button
            type="button"
            onClick={() => setSearch({ category: undefined })}
            className={`w-full rounded-md px-3 py-2 text-left text-sm ${!category ? "bg-accent font-semibold text-accent-foreground" : "hover:bg-muted"}`}
          >
            All categories
          </button>
          {(categories ?? []).map((c) => (
            <button
              key={c.id}
              type="button"
              onClick={() => setSearch({ category: c.slug })}
              className={`w-full rounded-md px-3 py-2 text-left text-sm ${category === c.slug ? "bg-accent font-semibold text-accent-foreground" : "hover:bg-muted"}`}
            >
              {c.icon} {c.name}
            </button>
          ))}
        </div>
      </div>

      <div>
        <Label className="text-sm font-semibold">Max price: {inr(maxPrice)}</Label>
        <Slider
          className="mt-3"
          value={[maxPrice]}
          min={50}
          max={1500}
          step={50}
          onValueChange={(v) => setMaxPrice(v[0] ?? 1500)}
        />
      </div>

      <div className="flex items-center gap-2">
        <Checkbox
          id="in-stock"
          checked={inStockOnly}
          onCheckedChange={(v) => setInStockOnly(v === true)}
        />
        <Label htmlFor="in-stock" className="text-sm">
          In stock only
        </Label>
      </div>
    </div>
  );

  return (
    <ShopLayout>
      <div className="mx-auto max-w-7xl px-4 py-8">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-3xl font-extrabold">Shop</h1>
            <p className="text-sm text-muted-foreground">
              {isLoading ? "Loading products…" : `${filtered.length} products available`}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" className="lg:hidden" onClick={() => setShowFilters((s) => !s)}>
              {showFilters ? <X className="h-4 w-4" /> : <SlidersHorizontal className="h-4 w-4" />} Filters
            </Button>
            <Select value={sort} onValueChange={setSort}>
              <SelectTrigger className="w-44">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="popular">Popularity</SelectItem>
                <SelectItem value="price-asc">Price: Low to High</SelectItem>
                <SelectItem value="price-desc">Price: High to Low</SelectItem>
                <SelectItem value="name-asc">Name: A to Z</SelectItem>
                <SelectItem value="name-desc">Name: Z to A</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="mt-6 grid gap-6 lg:grid-cols-[260px_1fr]">
          <aside className={`surface-card h-fit p-5 ${showFilters ? "block" : "hidden"} lg:block`}>{filters}</aside>

          <div>
            {isLoading ? (
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 xl:grid-cols-4">
                {Array.from({ length: 8 }).map((_, i) => (
                  <ProductCardSkeleton key={i} />
                ))}
              </div>
            ) : filtered.length === 0 ? (
              <div className="surface-card p-12 text-center">
                <p className="text-lg font-semibold">No products found</p>
                <p className="mt-1 text-sm text-muted-foreground">Try a different search or clear your filters.</p>
                <Button
                  className="mt-4"
                  variant="outline"
                  onClick={() => {
                    setSearch({ q: undefined, category: undefined });
                    setInStockOnly(false);
                    setMaxPrice(1500);
                  }}
                >
                  Clear filters
                </Button>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 xl:grid-cols-4">
                  {filtered.slice(0, visible).map((p) => (
                    <ProductCard key={p.id} product={p} />
                  ))}
                </div>
                {visible < filtered.length && (
                  <div className="mt-8 text-center">
                    <Button variant="outline" onClick={() => setVisible((v) => v + PAGE_SIZE)}>
                      Load more products
                    </Button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </ShopLayout>
  );
}

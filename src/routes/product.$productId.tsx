import { useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Heart, Minus, Plus, ShieldCheck, ShoppingCart, Star, Truck } from "lucide-react";

import { ProductCard } from "@/components/product-card";
import { ProductImage } from "@/components/product-image";
import { ShopLayout } from "@/components/shop-layout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { useCartActions, useProduct, useProducts, useWishlist, useWishlistActions } from "@/hooks/use-shop";
import { discountPercent, effectivePrice, inr, stockLabel, stockStatus } from "@/lib/format";
import { useAuth } from "@/lib/auth";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/product/$productId")({
  head: () => ({
    meta: [
      { title: "Product Details — FreshCart" },
      { name: "description", content: "Product details, price, stock availability and related grocery items." },
      { property: "og:title", content: "Product Details — FreshCart" },
      { property: "og:description", content: "See price, unit, stock and add the product to your FreshCart basket." },
    ],
  }),
  component: ProductDetails,
});

function ProductDetails() {
  const { productId } = Route.useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { data: product, isLoading } = useProduct(productId);
  const { data: products } = useProducts();
  const { add } = useCartActions();
  const { toggle } = useWishlistActions();
  const { data: wishlist } = useWishlist();
  const [qty, setQty] = useState(1);

  if (isLoading) {
    return (
      <ShopLayout>
        <div className="mx-auto grid max-w-7xl gap-8 px-4 py-10 lg:grid-cols-2">
          <div className="aspect-square animate-pulse rounded-3xl bg-muted" />
          <div className="space-y-4">
            <div className="h-8 w-2/3 animate-pulse rounded bg-muted" />
            <div className="h-4 w-full animate-pulse rounded bg-muted" />
            <div className="h-10 w-1/3 animate-pulse rounded bg-muted" />
          </div>
        </div>
      </ShopLayout>
    );
  }

  if (!product) {
    return (
      <ShopLayout>
        <div className="mx-auto max-w-xl px-4 py-24 text-center">
          <h1 className="text-2xl font-bold">Product not found</h1>
          <Button asChild className="mt-6">
            <Link to="/shop">Back to shop</Link>
          </Button>
        </div>
      </ShopLayout>
    );
  }

  const status = stockStatus(product.stock_quantity, product.minimum_stock);
  const off = discountPercent(product);
  const saved = (wishlist ?? []).some((w) => w.product_id === product.id);
  const related = (products ?? [])
    .filter((p) => p.category_id === product.category_id && p.id !== product.id)
    .slice(0, 4);

  async function buyNow() {
    if (!user) {
      void navigate({ to: "/auth" });
      return;
    }
    await add.mutateAsync({ productId: product!.id, quantity: qty });
    void navigate({ to: "/checkout" });
  }

  return (
    <ShopLayout>
      <div className="mx-auto max-w-7xl px-4 py-8">
        <nav className="text-sm text-muted-foreground">
          <Link to="/" className="hover:text-primary">
            Home
          </Link>{" "}
          /{" "}
          <Link to="/shop" className="hover:text-primary">
            Shop
          </Link>{" "}
          / <span className="text-foreground">{product.name}</span>
        </nav>

        <div className="mt-6 grid gap-8 lg:grid-cols-2">
          <div className="surface-card relative aspect-square overflow-hidden">
            <ProductImage product={product} size="lg" />
            {off > 0 && <Badge className="absolute top-4 left-4 bg-warning text-warning-foreground">{off}% OFF</Badge>}
          </div>

          <div>
            <p className="text-sm text-muted-foreground">{product.categories?.name}</p>
            <h1 className="mt-1 text-3xl font-extrabold">{product.name}</h1>
            <div className="mt-2 flex items-center gap-3 text-sm">
              <span className="flex items-center gap-1">
                <Star className="h-4 w-4 fill-warning text-warning" />
                {Number(product.rating).toFixed(1)}
              </span>
              <span className="text-muted-foreground">{product.brand}</span>
              <span
                className={cn(
                  "font-semibold",
                  status === "in" && "text-success",
                  status === "low" && "text-warning",
                  status === "out" && "text-destructive",
                )}
              >
                {stockLabel[status]}
              </span>
            </div>

            <p className="mt-4 text-muted-foreground">{product.description}</p>

            <div className="mt-5 flex items-end gap-3">
              <span className="text-3xl font-extrabold">{inr(effectivePrice(product))}</span>
              {off > 0 && <span className="text-lg text-muted-foreground line-through">{inr(product.price)}</span>}
              <span className="text-sm text-muted-foreground">/ {product.unit}</span>
            </div>

            <div className="mt-6 flex flex-wrap items-center gap-3">
              <div className="flex items-center rounded-lg border">
                <Button variant="ghost" size="icon" onClick={() => setQty((v) => Math.max(1, v - 1))}>
                  <Minus className="h-4 w-4" />
                </Button>
                <span className="w-10 text-center font-semibold">{qty}</span>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setQty((v) => Math.min(product.stock_quantity || 1, v + 1))}
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>

              <Button
                disabled={status === "out" || add.isPending}
                onClick={() => add.mutate({ productId: product.id, quantity: qty })}
              >
                <ShoppingCart className="h-4 w-4" /> Add to cart
              </Button>
              <Button variant="secondary" disabled={status === "out"} onClick={() => void buyNow()}>
                Buy now
              </Button>
              <Button variant="outline" size="icon" aria-label="Wishlist" onClick={() => toggle.mutate(product.id)}>
                <Heart className={cn("h-4 w-4", saved && "fill-destructive text-destructive")} />
              </Button>
            </div>

            <Separator className="my-6" />

            <div className="grid gap-3 text-sm sm:grid-cols-2">
              <Info label="SKU" value={product.sku} />
              <Info label="Unit" value={product.unit} />
              <Info label="Brand" value={product.brand ?? "-"} />
              <Info label="Available stock" value={`${product.stock_quantity}`} />
            </div>

            <div className="mt-6 grid gap-3 sm:grid-cols-2">
              <div className="surface-card flex items-center gap-3 p-3 text-sm">
                <Truck className="h-5 w-5 text-primary" /> Free delivery above ₹500
              </div>
              <div className="surface-card flex items-center gap-3 p-3 text-sm">
                <ShieldCheck className="h-5 w-5 text-primary" /> Quality checked daily
              </div>
            </div>
          </div>
        </div>

        {related.length > 0 && (
          <section className="mt-14">
            <h2 className="text-2xl font-bold">Related products</h2>
            <div className="mt-5 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
              {related.map((p) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          </section>
        )}
      </div>
    </ShopLayout>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg bg-muted px-3 py-2">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="font-medium">{value}</p>
    </div>
  );
}

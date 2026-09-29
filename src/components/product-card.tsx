import { Link } from "@tanstack/react-router";
import { Heart, ShoppingCart, Star } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ProductImage } from "@/components/product-image";
import { useCartActions, useWishlist, useWishlistActions, type Product } from "@/hooks/use-shop";
import { discountPercent, effectivePrice, inr, stockLabel, stockStatus } from "@/lib/format";
import { cn } from "@/lib/utils";

export function ProductCard({ product }: { product: Product }) {
  const { add } = useCartActions();
  const { toggle } = useWishlistActions();
  const { data: wishlist } = useWishlist();
  const saved = (wishlist ?? []).some((w) => w.product_id === product.id);
  const status = stockStatus(product.stock_quantity, product.minimum_stock);
  const off = discountPercent(product);

  return (
    <div className="group surface-card flex flex-col overflow-hidden transition-all hover:-translate-y-1 hover:shadow-[var(--shadow-lift)]">
      <Link
        to="/product/$productId"
        params={{ productId: product.id }}
        className="relative block aspect-square overflow-hidden bg-muted"
      >
        <ProductImage product={product} />
        {off > 0 && <Badge className="absolute top-2 left-2 bg-warning text-warning-foreground">{off}% OFF</Badge>}
        {status === "out" && (
          <div className="absolute inset-0 flex items-center justify-center bg-background/70">
            <Badge variant="destructive">Out of Stock</Badge>
          </div>
        )}
      </Link>

      <div className="flex flex-1 flex-col gap-2 p-3">
        <div className="flex items-start justify-between gap-2">
          <p className="text-xs text-muted-foreground">{product.categories?.name ?? "Grocery"}</p>
          <button
            type="button"
            aria-label="Toggle wishlist"
            onClick={() => toggle.mutate(product.id)}
            className="text-muted-foreground transition-colors hover:text-destructive"
          >
            <Heart className={cn("h-4 w-4", saved && "fill-destructive text-destructive")} />
          </button>
        </div>

        <Link
          to="/product/$productId"
          params={{ productId: product.id }}
          className="line-clamp-2 text-sm font-semibold hover:text-primary"
        >
          {product.name}
        </Link>

        <p className="text-xs text-muted-foreground">{product.unit}</p>

        <div className="flex items-center gap-1 text-xs text-muted-foreground">
          <Star className="h-3.5 w-3.5 fill-warning text-warning" />
          {Number(product.rating).toFixed(1)}
          <span className={cn("ml-auto font-medium", status === "low" && "text-warning", status === "in" && "text-success", status === "out" && "text-destructive")}>
            {stockLabel[status]}
          </span>
        </div>

        <div className="mt-auto flex items-end justify-between gap-2 pt-1">
          <div>
            <p className="text-base font-bold">{inr(effectivePrice(product))}</p>
            {off > 0 && <p className="text-xs text-muted-foreground line-through">{inr(product.price)}</p>}
          </div>
          <Button
            size="sm"
            disabled={status === "out" || add.isPending}
            onClick={() => add.mutate({ productId: product.id })}
          >
            <ShoppingCart className="h-4 w-4" />
            Add
          </Button>
        </div>
      </div>
    </div>
  );
}

export function ProductCardSkeleton() {
  return (
    <div className="surface-card overflow-hidden">
      <div className="aspect-square animate-pulse bg-muted" />
      <div className="space-y-2 p-3">
        <div className="h-3 w-1/3 animate-pulse rounded bg-muted" />
        <div className="h-4 w-3/4 animate-pulse rounded bg-muted" />
        <div className="h-8 w-full animate-pulse rounded bg-muted" />
      </div>
    </div>
  );
}

import { cn } from "@/lib/utils";
import type { Product } from "@/hooks/use-shop";

export function ProductImage({
  product,
  className,
  size = "md",
}: {
  product: Pick<Product, "name" | "image_url"> & { categories?: { icon: string | null } | null };
  className?: string;
  size?: "sm" | "md" | "lg";
}) {
  const icon = product.categories?.icon ?? "🛒";
  const textSize = size === "lg" ? "text-8xl" : size === "sm" ? "text-2xl" : "text-5xl";

  if (product.image_url) {
    return (
      <img
        src={product.image_url}
        alt={product.name}
        loading="lazy"
        className={cn("h-full w-full object-cover", className)}
      />
    );
  }

  return (
    <div
      aria-label={product.name}
      role="img"
      className={cn(
        "flex h-full w-full items-center justify-center bg-accent/60 select-none",
        textSize,
        className,
      )}
    >
      <span aria-hidden>{icon}</span>
    </div>
  );
}

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { effectivePrice } from "@/lib/format";

export type Category = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  icon: string | null;
  status: string;
};

export type Product = {
  id: string;
  category_id: string | null;
  name: string;
  description: string | null;
  brand: string | null;
  sku: string;
  price: number;
  discount_price: number | null;
  stock_quantity: number;
  minimum_stock: number;
  unit: string;
  image_url: string | null;
  rating: number;
  status: string;
  created_at: string;
  updated_at: string;
  categories?: { name: string; slug: string; icon: string | null } | null;
};

export function useCategories() {
  return useQuery({
    queryKey: ["categories"],
    queryFn: async () => {
      const { data, error } = await supabase.from("categories").select("*").order("name");
      if (error) throw error;
      return data as unknown as Category[];
    },
  });
}

export function useProducts() {
  return useQuery({
    queryKey: ["products"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("products")
        .select("*, categories(name, slug, icon)")
        .order("created_at", { ascending: true });
      if (error) throw error;
      return data as unknown as Product[];
    },
  });
}

export function useProduct(id: string) {
  return useQuery({
    queryKey: ["product", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("products")
        .select("*, categories(name, slug, icon)")
        .eq("id", id)
        .maybeSingle();
      if (error) throw error;
      return data as unknown as Product | null;
    },
  });
}

export type CartRow = {
  id: string;
  quantity: number;
  product_id: string;
  products: Product;
};

export function useCart() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["cart", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("cart_items")
        .select("id, quantity, product_id, products(*, categories(name, slug, icon))")
        .order("created_at");
      if (error) throw error;
      return (data ?? []) as unknown as CartRow[];
    },
  });
}

export function cartTotals(rows: CartRow[]) {
  const subtotal = rows.reduce((sum, r) => sum + effectivePrice(r.products) * r.quantity, 0);
  const mrpTotal = rows.reduce((sum, r) => sum + Number(r.products.price) * r.quantity, 0);
  const savings = mrpTotal - subtotal;
  const delivery = subtotal > 0 && subtotal < 500 ? 40 : 0;
  return { subtotal, mrpTotal, savings, delivery, total: subtotal + delivery };
}

export function useCartActions() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const invalidate = () => qc.invalidateQueries({ queryKey: ["cart"] });

  const add = useMutation({
    mutationFn: async ({ productId, quantity = 1 }: { productId: string; quantity?: number }) => {
      if (!user) throw new Error("Please sign in to use your cart");
      const { data: existing } = await supabase
        .from("cart_items")
        .select("id, quantity")
        .eq("product_id", productId)
        .maybeSingle();
      if (existing) {
        const { error } = await supabase
          .from("cart_items")
          .update({ quantity: existing.quantity + quantity, updated_at: new Date().toISOString() })
          .eq("id", existing.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("cart_items")
          .insert({ user_id: user.id, product_id: productId, quantity });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      toast.success("Added to cart");
      void invalidate();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const setQuantity = useMutation({
    mutationFn: async ({ id, quantity }: { id: string; quantity: number }) => {
      if (quantity <= 0) {
        const { error } = await supabase.from("cart_items").delete().eq("id", id);
        if (error) throw error;
        return;
      }
      const { error } = await supabase
        .from("cart_items")
        .update({ quantity, updated_at: new Date().toISOString() })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => void invalidate(),
    onError: (e: Error) => toast.error(e.message),
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("cart_items").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Removed from cart");
      void invalidate();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return { add, setQuantity, remove };
}

export function useWishlist() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["wishlist", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("wishlist")
        .select("id, product_id, products(*, categories(name, slug, icon))")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as unknown as { id: string; product_id: string; products: Product }[];
    },
  });
}

export function useWishlistActions() {
  const { user } = useAuth();
  const qc = useQueryClient();

  const toggle = useMutation({
    mutationFn: async (productId: string) => {
      if (!user) throw new Error("Please sign in to use your wishlist");
      const { data: existing } = await supabase
        .from("wishlist")
        .select("id")
        .eq("product_id", productId)
        .maybeSingle();
      if (existing) {
        const { error } = await supabase.from("wishlist").delete().eq("id", existing.id);
        if (error) throw error;
        return "removed" as const;
      }
      const { error } = await supabase.from("wishlist").insert({ user_id: user.id, product_id: productId });
      if (error) throw error;
      return "added" as const;
    },
    onSuccess: (result) => {
      toast.success(result === "added" ? "Saved to wishlist" : "Removed from wishlist");
      void qc.invalidateQueries({ queryKey: ["wishlist"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return { toggle };
}

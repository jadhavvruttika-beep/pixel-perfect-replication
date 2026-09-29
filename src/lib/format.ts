export function inr(value: number | string | null | undefined): string {
  const n = Number(value ?? 0);
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: n % 1 === 0 ? 0 : 2,
  }).format(n);
}

export function formatDate(value: string | null | undefined): string {
  if (!value) return "-";
  return new Intl.DateTimeFormat("en-IN", {
    dateStyle: "medium",
    timeZone: "Asia/Kolkata",
  }).format(new Date(value));
}

export function formatDateTime(value: string | null | undefined): string {
  if (!value) return "-";
  return new Intl.DateTimeFormat("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Asia/Kolkata",
  }).format(new Date(value));
}

export function effectivePrice(p: { price: number | string; discount_price: number | string | null }) {
  return Number(p.discount_price ?? p.price);
}

export function discountPercent(p: { price: number | string; discount_price: number | string | null }) {
  const price = Number(p.price);
  const dp = p.discount_price == null ? null : Number(p.discount_price);
  if (!dp || dp >= price || price <= 0) return 0;
  return Math.round(((price - dp) / price) * 100);
}

export type StockStatus = "in" | "low" | "out";

export function stockStatus(stock: number, minimum: number): StockStatus {
  if (stock <= 0) return "out";
  if (stock <= minimum) return "low";
  return "in";
}

export const stockLabel: Record<StockStatus, string> = {
  in: "In Stock",
  low: "Low Stock",
  out: "Out of Stock",
};

export const ORDER_STATUSES = [
  "pending",
  "confirmed",
  "packed",
  "out_for_delivery",
  "delivered",
  "cancelled",
] as const;

export type OrderStatus = (typeof ORDER_STATUSES)[number];

export const orderStatusLabel: Record<string, string> = {
  pending: "Pending",
  confirmed: "Confirmed",
  packed: "Packed",
  out_for_delivery: "Out for Delivery",
  delivered: "Delivered",
  cancelled: "Cancelled",
};

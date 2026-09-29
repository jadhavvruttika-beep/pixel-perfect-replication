import { useState } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { Heart, LayoutDashboard, LogOut, Menu, Package, Search, ShoppingCart, User } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { useAuth } from "@/lib/auth";
import { useCart, useCategories, useWishlist } from "@/hooks/use-shop";

const navLinks = [
  { to: "/", label: "Home" },
  { to: "/shop", label: "Shop" },
  { to: "/orders", label: "My Orders" },
] as const;

export function SiteHeader() {
  const navigate = useNavigate();
  const { user, role, signOut } = useAuth();
  const { data: cart } = useCart();
  const { data: wishlist } = useWishlist();
  const { data: categories } = useCategories();
  const [term, setTerm] = useState("");
  const [open, setOpen] = useState(false);

  const cartCount = (cart ?? []).reduce((n, r) => n + r.quantity, 0);

  function submitSearch(e: React.FormEvent) {
    e.preventDefault();
    void navigate({ to: "/shop", search: { q: term || undefined, category: undefined } });
  }

  return (
    <header className="sticky top-0 z-50 border-b bg-card/95 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-7xl items-center gap-3 px-4">
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon" className="lg:hidden" aria-label="Open menu">
              <Menu className="h-5 w-5" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-72">
            <SheetHeader>
              <SheetTitle>FreshCart</SheetTitle>
            </SheetHeader>
            <nav className="mt-4 flex flex-col gap-1 px-4">
              {navLinks.map((l) => (
                <Link key={l.to} to={l.to} onClick={() => setOpen(false)} className="rounded-md px-3 py-2 text-sm hover:bg-accent">
                  {l.label}
                </Link>
              ))}
              <Link to="/wishlist" onClick={() => setOpen(false)} className="rounded-md px-3 py-2 text-sm hover:bg-accent">
                Wishlist
              </Link>
              <Link to="/profile" onClick={() => setOpen(false)} className="rounded-md px-3 py-2 text-sm hover:bg-accent">
                Profile
              </Link>
              <p className="mt-4 px-3 text-xs font-semibold text-muted-foreground uppercase">Categories</p>
              {(categories ?? []).slice(0, 8).map((c) => (
                <Link
                  key={c.id}
                  to="/shop"
                  search={{ category: c.slug, q: undefined }}
                  onClick={() => setOpen(false)}
                  className="rounded-md px-3 py-2 text-sm hover:bg-accent"
                >
                  {c.icon} {c.name}
                </Link>
              ))}
            </nav>
          </SheetContent>
        </Sheet>

        <Link to="/" className="flex shrink-0 items-center gap-2">
          <span className="brand-gradient flex h-9 w-9 items-center justify-center rounded-xl text-lg">🥬</span>
          <span className="text-lg font-extrabold tracking-tight">
            Fresh<span className="text-primary">Cart</span>
          </span>
        </Link>

        <nav className="ml-4 hidden items-center gap-1 lg:flex">
          {navLinks.map((l) => (
            <Link
              key={l.to}
              to={l.to}
              className="rounded-md px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-accent hover:text-foreground"
              activeProps={{ className: "rounded-md px-3 py-2 text-sm font-semibold text-primary bg-accent" }}
              activeOptions={{ exact: l.to === "/" }}
            >
              {l.label}
            </Link>
          ))}
        </nav>

        <form onSubmit={submitSearch} className="ml-auto hidden max-w-sm flex-1 md:block">
          <div className="relative">
            <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={term}
              onChange={(e) => setTerm(e.target.value)}
              placeholder="Search for rice, milk, atta…"
              className="pl-9"
            />
          </div>
        </form>

        <div className="ml-auto flex items-center gap-1 md:ml-2">
          <Button asChild variant="ghost" size="icon" aria-label="Wishlist">
            <Link to="/wishlist" className="relative">
              <Heart className="h-5 w-5" />
              {(wishlist?.length ?? 0) > 0 && (
                <Badge className="absolute -top-1 -right-1 h-4 min-w-4 justify-center px-1 text-[10px]">
                  {wishlist!.length}
                </Badge>
              )}
            </Link>
          </Button>
          <Button asChild variant="ghost" size="icon" aria-label="Cart">
            <Link to="/cart" className="relative">
              <ShoppingCart className="h-5 w-5" />
              {cartCount > 0 && (
                <Badge className="absolute -top-1 -right-1 h-4 min-w-4 justify-center px-1 text-[10px]">
                  {cartCount}
                </Badge>
              )}
            </Link>
          </Button>

          {user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" aria-label="Account">
                  <User className="h-5 w-5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel className="truncate">{user.email}</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link to="/profile">
                    <User className="h-4 w-4" /> Profile
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link to="/orders">
                    <Package className="h-4 w-4" /> My Orders
                  </Link>
                </DropdownMenuItem>
                {role === "admin" && (
                  <DropdownMenuItem asChild>
                    <Link to="/admin">
                      <LayoutDashboard className="h-4 w-4" /> Admin Dashboard
                    </Link>
                  </DropdownMenuItem>
                )}
                {role === "staff" && (
                  <DropdownMenuItem asChild>
                    <Link to="/staff">
                      <LayoutDashboard className="h-4 w-4" /> Staff Dashboard
                    </Link>
                  </DropdownMenuItem>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => void signOut()}>
                  <LogOut className="h-4 w-4" /> Log out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Button asChild size="sm">
              <Link to="/auth">Sign in</Link>
            </Button>
          )}
        </div>
      </div>
    </header>
  );
}

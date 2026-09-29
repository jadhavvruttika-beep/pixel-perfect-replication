import { Link } from "@tanstack/react-router";
import { Clock, MapPin, Phone, Truck } from "lucide-react";

export function SiteFooter() {
  return (
    <footer className="mt-16 border-t bg-card">
      <div className="mx-auto grid max-w-7xl gap-8 px-4 py-12 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="brand-gradient flex h-9 w-9 items-center justify-center rounded-xl text-lg">🥬</span>
            <span className="text-lg font-extrabold">
              Fresh<span className="text-primary">Cart</span>
            </span>
          </div>
          <p className="mt-3 text-sm text-muted-foreground">
            Daily groceries, fresh produce and household essentials delivered across India.
          </p>
        </div>

        <div>
          <h3 className="text-sm font-semibold">Shop</h3>
          <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
            <li>
              <Link to="/shop" className="hover:text-primary">
                All products
              </Link>
            </li>
            <li>
              <Link to="/wishlist" className="hover:text-primary">
                Wishlist
              </Link>
            </li>
            <li>
              <Link to="/cart" className="hover:text-primary">
                Cart
              </Link>
            </li>
            <li>
              <Link to="/orders" className="hover:text-primary">
                My orders
              </Link>
            </li>
          </ul>
        </div>

        <div>
          <h3 className="text-sm font-semibold">Delivery</h3>
          <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
            <li className="flex items-center gap-2">
              <Truck className="h-4 w-4 text-primary" /> Free delivery above ₹500
            </li>
            <li className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-primary" /> Same-day slots till 6 PM
            </li>
            <li className="flex items-center gap-2">
              <MapPin className="h-4 w-4 text-primary" /> Serving 40+ Indian cities
            </li>
          </ul>
        </div>

        <div>
          <h3 className="text-sm font-semibold">Support</h3>
          <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
            <li className="flex items-center gap-2">
              <Phone className="h-4 w-4 text-primary" /> 1800 123 4567
            </li>
            <li>care@freshcart.in</li>
            <li>Mon–Sun, 8 AM – 10 PM IST</li>
          </ul>
        </div>
      </div>
      <div className="border-t py-4 text-center text-xs text-muted-foreground">
        © {new Date().getFullYear()} FreshCart Grocery Management System. All prices in INR.
      </div>
    </footer>
  );
}

import { useState } from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import {
  Bell,
  Heart,
  LogOut,
  Menu,
  Package,
  Search,
  ShoppingBag,
  User as UserIcon,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import useAuthStore from "@/store/authStore";
import { useLogout, useMe } from "@/hooks/useAuth";
import { useCartCount } from "@/hooks/useCart";
import { useWishlistCount } from "@/hooks/useWishlist";
import useGuestCartStore from "@/store/guestCartStore";

const NAV = [
  { to: "/", label: "Trang chủ", end: true },
  { to: "/products", label: "Sản phẩm" },
  { to: "/tra-cuu-don-hang", label: "Tra cứu đơn" },
];

function IconBadge({ count }: { count?: number }) {
  if (!count) return null;
  return (
    <span className="absolute -right-1.5 -top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-semibold text-primary-foreground">
      {count > 99 ? "99+" : count}
    </span>
  );
}

export default function StoreHeader() {
  const navigate = useNavigate();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated());
  const user = useAuthStore((s) => s.user);
  const { mutate: logout } = useLogout();
  useMe();

  const { data: cartCount } = useCartCount();
  const guestCartCount = useGuestCartStore((state) =>
    state.items.reduce((sum, item) => sum + item.quantity, 0),
  );
  const { data: wishlistCount } = useWishlistCount();

  const [keyword, setKeyword] = useState("");
  const [mobileOpen, setMobileOpen] = useState(false);

  const onSearch = (e: React.FormEvent) => {
    e.preventDefault();
    navigate(`/products?keyword=${encodeURIComponent(keyword.trim())}`);
    setMobileOpen(false);
  };

  return (
    <header className="sticky top-0 z-40 border-b bg-background/95 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-7xl items-center gap-4 px-4">
        <button
          className="md:hidden"
          onClick={() => setMobileOpen((v) => !v)}
          aria-label="Menu"
        >
          {mobileOpen ? <X className="size-5" /> : <Menu className="size-5" />}
        </button>

        <Link to="/" className="flex items-center gap-2 font-bold text-lg">
          <span className="grid size-8 place-items-center rounded-md bg-primary text-primary-foreground">
            S
          </span>
          <span className="hidden sm:inline">Stravo</span>
        </Link>

        <nav className="ml-2 hidden items-center gap-1 md:flex">
          {NAV.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                cn(
                  "rounded-md px-3 py-2 text-sm font-medium transition-colors hover:bg-accent",
                  isActive ? "text-foreground" : "text-muted-foreground",
                )
              }
            >
              {item.label}
            </NavLink>
          ))}
        </nav>

        <form
          onSubmit={onSearch}
          className="ml-auto hidden flex-1 max-w-xs lg:block"
        >
          <div className="relative">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <input
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              placeholder="Tìm sản phẩm…"
              className="h-9 w-full rounded-full border bg-muted/40 pl-9 pr-4 text-sm outline-none focus:ring-2 focus:ring-ring"
            />
          </div>
        </form>

        <div className="ml-auto flex items-center gap-1 lg:ml-2">
          <Link
            to="/wishlist"
            className="relative rounded-md p-2 hover:bg-accent"
            aria-label="Yêu thích"
          >
            <Heart className="size-5" />
            <IconBadge count={wishlistCount} />
          </Link>
          <Link
            to="/cart"
            className="relative rounded-md p-2 hover:bg-accent"
            aria-label="Giỏ hàng"
          >
            <ShoppingBag className="size-5" />
            <IconBadge count={isAuthenticated ? cartCount : guestCartCount} />
          </Link>

          {isAuthenticated ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" aria-label="Tài khoản">
                  <UserIcon className="size-5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-52">
                <DropdownMenuLabel className="truncate">
                  {user?.username ?? "Tài khoản"}
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => navigate("/account")}>
                  <UserIcon className="mr-2 size-4" /> Hồ sơ của tôi
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate("/orders")}>
                  <Package className="mr-2 size-4" /> Đơn hàng
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate("/reviews")}>
                  <Heart className="mr-2 size-4" /> Đánh giá của tôi
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => logout()}>
                  <LogOut className="mr-2 size-4" /> Đăng xuất
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Button size="sm" onClick={() => navigate("/login")}>
              Đăng nhập
            </Button>
          )}
        </div>
      </div>

      {mobileOpen && (
        <div className="border-t bg-background px-4 py-3 md:hidden">
          <form onSubmit={onSearch} className="mb-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <input
                value={keyword}
                onChange={(e) => setKeyword(e.target.value)}
                placeholder="Tìm sản phẩm…"
                className="h-9 w-full rounded-full border bg-muted/40 pl-9 pr-4 text-sm outline-none"
              />
            </div>
          </form>
          <nav className="flex flex-col">
            {NAV.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                onClick={() => setMobileOpen(false)}
                className={({ isActive }) =>
                  cn(
                    "rounded-md px-3 py-2 text-sm font-medium",
                    isActive ? "bg-accent" : "text-muted-foreground",
                  )
                }
              >
                {item.label}
              </NavLink>
            ))}
          </nav>
        </div>
      )}
    </header>
  );
}

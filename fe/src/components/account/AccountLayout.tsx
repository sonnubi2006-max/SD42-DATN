import { Link, useLocation } from "react-router-dom";
import { User, ShoppingBag, MapPin, Star, RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";
import { useMe } from "@/hooks/useAuth";

interface AccountLayoutProps {
  children: React.ReactNode;
}

export default function AccountLayout({ children }: AccountLayoutProps) {
  const location = useLocation();
  const currentPath = location.pathname;
  const { data: me } = useMe();

  const menuItems = [
    {
      path: "/account",
      label: "Hồ sơ cá nhân",
      icon: User,
    },
    {
      path: "/orders",
      label: "Đơn mua hàng",
      icon: ShoppingBag,
    },
    {
      path: "/returns",
      label: "Đơn đổi hàng",
      icon: RefreshCw,
    },
    {
      path: "/addresses",
      label: "Sổ địa chỉ",
      icon: MapPin,
    },
    {
      path: "/reviews",
      label: "Đánh giá của tôi",
      icon: Star,
    },
  ];

  const displayName = (me as { fullName?: string })?.fullName || me?.username || "Thành viên Store";

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <div className="grid grid-cols-1 gap-8 md:grid-cols-12">
        { }
        <aside className="md:col-span-3 space-y-6">
          <div className="flex items-center gap-3 border-b pb-4 border-border">
            <div className="flex size-10 items-center justify-center rounded-full bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">
              <User className="size-5" />
            </div>
            <div className="overflow-hidden">
              <p className="text-[10px] uppercase tracking-wide text-muted-foreground font-semibold">Tài khoản của</p>
              <h2 className="text-sm font-bold text-foreground truncate" title={displayName}>
                {displayName}
              </h2>
            </div>
          </div>

          <nav className="flex flex-col gap-1">
            {menuItems.map((item) => {
              const isActive = currentPath === item.path;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={cn(
                    "flex items-center gap-3 rounded-lg px-3 py-2.5 text-xs font-semibold tracking-wide transition-all duration-200 cursor-pointer border border-transparent",
                    isActive
                      ? "bg-primary text-primary-foreground shadow-xs border-primary"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                  )}
                >
                  <item.icon className="size-4 shrink-0" />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>
        </aside>

        { }
        <main className="md:col-span-9">
          {children}
        </main>
      </div>
    </div>
  );
}

import { Link } from "react-router-dom";
import { useLogout, useMe } from "@/hooks/useAuth";
import { LogOut, Settings, User, ChevronDown } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { SidebarTrigger } from "./ui/sidebar";

export default function Navbar() {
  const { data: user } = useMe();
  const { mutate: logout } = useLogout();

  const getInitials = (name?: string) => {
    if (!name) return "U";
    return name
      .split(" ")
      .map((n) => n[0])
      .slice(0, 2)
      .join("")
      .toUpperCase();
  };

  const getRoleBadgeColor = (role?: string) => {
    switch (role) {
      case "ADMIN":
        return "bg-rose-50 text-rose-700 border-rose-200/50";
      case "STAFF":
        return "bg-emerald-50 text-emerald-700 border-emerald-200/50";
      default:
        return "bg-blue-50 text-blue-700 border-blue-200/50";
    }
  };

  const getRoleLabel = (role?: string) => {
    switch (role) {
      case "ADMIN":
        return "Quản trị viên";
      case "STAFF":
        return "Nhân viên";
      default:
        return role || "Người dùng";
    }
  };

  return (
    <nav className="px-6 py-3 flex items-center justify-between sticky top-0 bg-card/85 backdrop-blur-md border-b border-border/60 z-30 transition-all duration-200">
      <div className="flex items-center gap-4">
        <SidebarTrigger className="h-9 w-9 text-muted-foreground hover:text-foreground hover:bg-muted/80 rounded-lg cursor-pointer" />
      </div>

      <div className="flex items-center gap-4">
        {}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="flex items-center gap-2.5 hover:bg-muted/65 px-2.5 py-1.5 rounded-lg transition-all border border-transparent hover:border-border/50 cursor-pointer text-left focus:outline-none group">
              <Avatar className="h-8 w-8 ring-2 ring-border/50 group-hover:ring-emerald-500/30 transition-all">
                <AvatarImage src="https://github.com/shadcn.png" />
                <AvatarFallback className="bg-primary/10 text-primary text-xs font-bold">
                  {getInitials(user?.fullName || user?.username)}
                </AvatarFallback>
              </Avatar>
              <div className="hidden sm:flex flex-col min-w-0">
                <span className="text-xs font-bold text-foreground leading-tight truncate max-w-[120px]">
                  {user?.fullName || user?.username || "Tài khoản"}
                </span>
                <span className="text-[10px] text-muted-foreground font-semibold leading-none mt-0.5">
                  {getRoleLabel(user?.role)}
                </span>
              </div>
              <ChevronDown
                size={14}
                className="text-muted-foreground group-hover:text-foreground transition-colors shrink-0 ml-0.5"
              />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            align="end"
            className="w-56 mt-1.5 p-1 rounded-xl shadow-lg border-border/80"
          >
            <DropdownMenuLabel className="px-2.5 py-2">
              <div className="flex flex-col space-y-1">
                <p className="text-xs font-bold text-foreground">
                  {user?.fullName || "Chưa cập nhật tên"}
                </p>
                <p className="text-[10px] font-semibold text-muted-foreground truncate">
                  @{user?.username || "username"}
                </p>
                <div className="pt-1.5 flex">
                  <span
                    className={`inline-flex items-center text-[9px] font-extrabold px-1.5 py-0.5 rounded border uppercase tracking-wider ${getRoleBadgeColor(
                      user?.role,
                    )}`}
                  >
                    {getRoleLabel(user?.role)}
                  </span>
                </div>
              </div>
            </DropdownMenuLabel>

            <DropdownMenuSeparator className="my-1" />

            <DropdownMenuGroup>
              <Link to="/profile">
                <DropdownMenuItem className="cursor-pointer gap-2 py-2 px-2.5 rounded-lg text-xs font-semibold text-foreground hover:bg-muted focus:bg-muted">
                  <User className="h-4 w-4 text-muted-foreground" />
                  Thông tin cá nhân
                </DropdownMenuItem>
              </Link>
              <DropdownMenuItem className="cursor-pointer gap-2 py-2 px-2.5 rounded-lg text-xs font-semibold text-foreground hover:bg-muted focus:bg-muted">
                <Settings className="h-4 w-4 text-muted-foreground" />
                Cài đặt hệ thống
              </DropdownMenuItem>
            </DropdownMenuGroup>

            <DropdownMenuSeparator className="my-1" />

            <DropdownMenuItem
              variant="destructive"
              onClick={() => logout()}
              className="cursor-pointer gap-2 py-2 px-2.5 rounded-lg text-xs font-bold focus:bg-destructive/10 focus:text-destructive"
            >
              <LogOut className="h-4 w-4" />
              Đăng xuất
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </nav>
  );
}

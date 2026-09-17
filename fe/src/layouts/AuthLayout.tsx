import { cookieUtil } from "@/utils/cookie";
import { Link, Navigate, Outlet, useLocation } from "react-router-dom";

export default function AuthLayout() {
  const location = useLocation();
  const token = cookieUtil.getRefreshToken();

  if (token) {
    return <Navigate to="/" replace state={{ from: location.pathname }} />;
  }

  return (
    <div className="grid container mx-auto min-h-screen lg:grid-cols-2">
      {}
      <div className="relative hidden flex-col justify-between p-24 lg:flex">
        <Link to="/" className="flex items-center gap-2 text-xl font-bold">
          <span className="grid size-9 place-items-center rounded-md bg-accent-foreground text-accent">
            S
          </span>
          Stravo
        </Link>
        <div>
          <h2 className="text-3xl font-bold leading-tight">
            Phong cách tối giản,
            <br /> chất lượng bền vững.
          </h2>
          <p className="mt-4 max-w-sm text-accent-foreground/80">
            Đăng nhập để mua sắm, theo dõi đơn hàng và nhận ưu đãi dành riêng
            cho bạn.
          </p>
        </div>
        <p className="text-sm text-accent-foreground/70">
          © {new Date().getFullYear()} Stravo
        </p>
      </div>

      {}
      <div className="flex items-center justify-center p-6">
        <div className="w-full max-w-md">
          <Outlet />
        </div>
      </div>
    </div>
  );
}

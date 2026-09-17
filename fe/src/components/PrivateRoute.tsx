import { Navigate, Outlet, useLocation } from "react-router-dom";
import { cookieUtil } from "@/utils/cookie";

export default function PrivateRoute() {
  const location = useLocation();
  const token = cookieUtil.getRefreshToken();
  return token ? (
    <Outlet />
  ) : (
    <Navigate to="/login" replace state={{ from: location.pathname }} />
  );
}

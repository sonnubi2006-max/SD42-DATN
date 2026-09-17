import { Navigate, Outlet } from "react-router-dom";
import { useMe } from "@/hooks/useAuth";

export default function AuthLayout() {
  const { data: user } = useMe();
  if (user) return <Navigate to="/" replace />;

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <Outlet />
      </div>
    </div>
  );
}

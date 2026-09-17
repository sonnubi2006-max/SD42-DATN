import { Navigate, Outlet } from "react-router-dom";
import { useMe } from "@/hooks/useAuth";
import { Spinner } from "./ui/spinner";

export default function PrivateRoute() {
  const { data: user, isLoading } = useMe();

  if (isLoading) {
    return (
      <div className="container m-auto">
        <Spinner />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
}

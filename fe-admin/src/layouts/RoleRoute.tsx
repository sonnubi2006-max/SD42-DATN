import { Navigate, Outlet } from "react-router-dom";
import { useMe } from "@/hooks/useAuth";

interface Props {
  roles: string[];
}

export default function RoleRoute({ roles }: Props) {
  const { data: user } = useMe();
  console.log(user)
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (!roles.includes(user.role)) {
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
}

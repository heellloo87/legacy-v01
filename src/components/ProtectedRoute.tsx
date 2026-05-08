import { Navigate } from "react-router-dom";
import { useAuth } from "@/lib/auth";

type Props = {
  children: React.ReactNode;
  roles: string[];
};

export default function ProtectedRoute({
  children,
  roles,
}: Props) {
  const { role, loading } = useAuth();

  if (loading) {
    return <div>Loading...</div>;
  }

  if (!role || !roles.includes(role)) {
    return <Navigate to="/" />;
  }

  return <>{children}</>;
}

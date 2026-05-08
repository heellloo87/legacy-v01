import { Navigate } from "@tanstack/react-router";

import { useAuth } from "@/lib/auth";

type Props = {
  children: React.ReactNode;
  roles: string[];
};

export default function ProtectedRoute({
  children,
  roles,
}: Props) {
  const {
    role,
    loading,
  } = useAuth();

  if (loading) {
    return (
      <div className="p-6">
        Loading...
      </div>
    );
  }

  if (
    !role ||
    !roles.includes(role)
  ) {
    return (
      <Navigate to="/" />
    );
  }

  return <>{children}</>;
}

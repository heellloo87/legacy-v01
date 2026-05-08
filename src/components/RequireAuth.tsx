import {
  type ReactNode,
} from "react";

import {
  Navigate,
} from "@tanstack/react-router";

import {
  Loader2,
} from "lucide-react";

import {
  useAuth,
} from "@/lib/auth";

type Props = {
  children: ReactNode;

  roles?: Array<
    | "admin"
    | "designer"
    | "collaborator"
    | "manufacturing_expert"
  >;
};

export function RequireAuth({
  children,
  roles,
}: Props) {
  const {
    session,
    loading,
    role,
  } = useAuth();

  // Loading
  if (loading) {
    return (
      <div className="min-h-screen grid place-items-center">
        <Loader2 className="h-6 w-6 animate-spin text-accent" />
      </div>
    );
  }

  // Not logged in
  if (!session) {
    return (
      <Navigate to="/login" />
    );
  }

  // Role restricted
  if (
    roles &&
    (
      !role ||
      !roles.includes(role)
    )
  ) {
    return (
      <Navigate to="/dashboard" />
    );
  }

  return <>{children}</>;
}

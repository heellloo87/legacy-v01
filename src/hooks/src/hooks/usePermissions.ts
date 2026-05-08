import { useAuth } from "@/lib/auth";
import { rolePermissions } from "@/lib/permissions";

export function usePermissions() {
  const { role } = useAuth();

  return (
    rolePermissions[
      role ?? "designer"
    ]
  );
}

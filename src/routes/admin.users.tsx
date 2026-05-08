import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";

import ProtectedRoute from "@/components/ProtectedRoute";

import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/admin/users")({
  head: () => ({
    meta: [{ title: "User Management — Legacy AR" }],
  }),
  component: AdminUsers,
});

function AdminUsers() {
  const [users, setUsers] =
    useState<any[]>([]);

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    const { data } = await supabase
      .from("profiles")
      .select("*");

    setUsers(data || []);
  };

  const changeRole = async (
    userId: string,
    role: string
  ) => {
    await supabase
      .from("profiles")
      .update({ role })
      .eq("id", userId);

    loadUsers();
  };

  return (
    <ProtectedRoute roles={["admin"]}>
      <div className="p-6">
        <h1 className="text-2xl font-bold mb-6">
          User Management
        </h1>

        <div className="space-y-4">
          {users.map((user) => (
            <div
              key={user.id}
              className="border p-4 rounded"
            >
              <div>{user.full_name}</div>

              <div>{user.role}</div>

              <select
                value={user.role}
                onChange={(e) =>
                  changeRole(
                    user.id,
                    e.target.value
                  )
                }
              >
                <option value="designer">
                  Designer
                </option>

                <option value="collaborator">
                  Collaborator
                </option>

                <option value="manufacturing_expert">
                  Manufacturing Expert
                </option>

                <option value="admin">
                  Admin
                </option>
              </select>
            </div>
          ))}
        </div>
      </div>
    </ProtectedRoute>
  );
}

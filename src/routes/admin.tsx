import { createFileRoute } from "@tanstack/react-router";
import ProtectedRoute from "@/components/ProtectedRoute";

export const Route = createFileRoute("/admin")({
  head: () => ({
    meta: [
      {
        title: "Admin Dashboard — Legacy AR",
      },
    ],
  }),

  component: AdminPage,
});

function AdminPage() {
  return (
    <ProtectedRoute roles={["admin"]}>
      <div className="p-6 space-y-6">

        {/* Header */}
        <div className="glass-strong rounded-3xl p-6">
          <h1 className="text-3xl font-display font-bold">
            Admin Dashboard
          </h1>

          <p className="text-muted-foreground mt-2">
            Manage users, projects, permissions, and platform activity.
          </p>
        </div>

        {/* Stats */}
        <div className="grid md:grid-cols-3 gap-4">

          <div className="glass rounded-2xl p-5">
            <div className="text-sm text-muted-foreground">
              Total Users
            </div>

            <div className="text-3xl font-bold mt-2">
              124
            </div>
          </div>

          <div className="glass rounded-2xl p-5">
            <div className="text-sm text-muted-foreground">
              Active Projects
            </div>

            <div className="text-3xl font-bold mt-2">
              48
            </div>
          </div>

          <div className="glass rounded-2xl p-5">
            <div className="text-sm text-muted-foreground">
              AI Generations
            </div>

            <div className="text-3xl font-bold mt-2">
              932
            </div>
          </div>

        </div>

        {/* Admin actions */}
        <div className="glass rounded-2xl p-5">
          <h2 className="text-lg font-semibold mb-4">
            Admin Actions
          </h2>

          <div className="flex flex-wrap gap-3">

            <button className="px-4 py-2 rounded-xl bg-gradient-primary text-white">
              Manage Users
            </button>

            <button className="px-4 py-2 rounded-xl glass hover:bg-white/10 transition">
              Review Projects
            </button>

            <button className="px-4 py-2 rounded-xl glass hover:bg-white/10 transition">
              System Logs
            </button>

          </div>
        </div>

      </div>
    </ProtectedRoute>
  );
}
